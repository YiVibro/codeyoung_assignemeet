import { DateTime } from "luxon";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";

import prisma from "../config/prisma.js";
import { MentorRepository } from "../repositories/mentor.repository.js";
import { BookingRepository } from "../repositories/booking.repository.js";
import { ParentRepository } from "../repositories/parent.repository.js";

import { ApiError } from "../utils/api-error.js";
import {
  isValidTimezone,
  localToUtc,
} from "../utils/timezone.js";

import { generateMeetingLink } from "../utils/meeting-link.js";

import type { CreateBookingInput } from "../schemas/booking.schema.js";

const CLASS_DURATION_MINUTES = 60;
const MAX_BOOKINGS_PER_MENTOR_PER_DAY = 2;

export class BookingService {
  async createBooking(input: CreateBookingInput) {
    const parentTimezone = input.parent.timezone;

    if (!isValidTimezone(parentTimezone)) {
      throw new ApiError(
        400,
        "INVALID_TIMEZONE",
        `Invalid timezone: ${parentTimezone}`,
      );
    }

const startUtc = localToUtc(
  input.start,
  parentTimezone,
);

const localStart =
  startUtc.setZone(parentTimezone);


/*
 * MVP uses fixed one-hour slots.
 * The start may be :00 or :30 depending on timezone conversion.
 */

    if (localStart.second !== 0 || localStart.millisecond !== 0) {
      throw new ApiError(
        400,
        "INVALID_SLOT",
        "Bookings must start at the beginning of an hour.",
      );
    }

    const now = DateTime.now();

    if (localStart <= now) {
      throw new ApiError(
        400,
        "PAST_DATETIME",
        "Cannot book a class in the past.",
      );
    }

    const localEnd = localStart.plus({
      minutes: CLASS_DURATION_MINUTES,
    });

    const endUtc = localEnd.toUTC();

    const result = await prisma.$transaction(
      async (tx) => {
        const mentorRepository = new MentorRepository(tx);
        const bookingRepository = new BookingRepository(tx);
        const parentRepository = new ParentRepository(tx);

        /*
         * Get all active mentors and their working schedules.
         *
         * There are only 10 mentors in this assignment, so loading
         * them here is perfectly reasonable and keeps the logic clear.
         */
        const mentors =
          await mentorRepository.findActiveMentors();

        /*
         * First determine which mentors could theoretically
         * handle this requested UTC interval.
         */
        const candidates = mentors
          .filter((mentor) => {
            const mentorStart =
              startUtc.setZone(mentor.timezone);

            const mentorEnd =
              endUtc.setZone(mentor.timezone);

            const dayOfWeek = mentorStart.weekday;

            /*
             * A class must begin and end on the same mentor
             * local calendar day.
             */
            if (
              mentorStart.toFormat("yyyy-MM-dd") !==
              mentorEnd.toFormat("yyyy-MM-dd")
            ) {
              return false;
            }

            return mentor.availability.some((availability) => {
              if (
                availability.dayOfWeek !== dayOfWeek
              ) {
                return false;
              }

              const availabilityStart =
                DateTime.fromFormat(
                  `${mentorStart.toFormat("yyyy-MM-dd")} ${availability.startTime}`,
                  "yyyy-MM-dd HH:mm",
                  {
                    zone: mentor.timezone,
                  },
                );

              const availabilityEnd =
                DateTime.fromFormat(
                  `${mentorStart.toFormat("yyyy-MM-dd")} ${availability.endTime}`,
                  "yyyy-MM-dd HH:mm",
                  {
                    zone: mentor.timezone,
                  },
                );

              return (
                mentorStart >= availabilityStart &&
                mentorEnd <= availabilityEnd
              );
            });
          })
          .sort((a, b) =>
            a.id.localeCompare(b.id),
          );

        /*
         * Lock mentors one at a time.
         *
         * This is the important concurrency protection.
         *
         * If two parents try to book the same mentor simultaneously,
         * PostgreSQL makes one transaction wait for the other.
         */
        for (const candidate of candidates) {
          const lockedMentor =
            await mentorRepository.lockMentor(
              candidate.id,
            );

          if (!lockedMentor || !lockedMentor.active) {
            continue;
          }

          const mentorStart =
            startUtc.setZone(lockedMentor.timezone);

          const mentorDayStartUtc =
            mentorStart
              .startOf("day")
              .toUTC()
              .toJSDate();

          const mentorDayEndUtc =
            mentorStart
              .startOf("day")
              .plus({ days: 1 })
              .toUTC()
              .toJSDate();

          /*
           * Re-check daily capacity AFTER acquiring
           * the row lock.
           */
          const dailyBookingCount =
            await bookingRepository
              .countConfirmedBookingsForMentorPeriod(
                lockedMentor.id,
                mentorDayStartUtc,
                mentorDayEndUtc,
              );

          if (
            dailyBookingCount >=
            MAX_BOOKINGS_PER_MENTOR_PER_DAY
          ) {
            continue;
          }

          /*
           * Re-check the requested slot after acquiring
           * the lock.
           */
          const conflictingBooking =
            await bookingRepository.findConflictingBooking(
              lockedMentor.id,
              startUtc.toJSDate(),
              endUtc.toJSDate(),
            );

          if (conflictingBooking) {
            continue;
          }

          /*
           * Find or create the parent inside the same
           * transaction as the booking.
           */
          let parent =
            await parentRepository.findByEmail(
              input.parent.email,
            );

          if (!parent) {
            parent = await parentRepository.create({
              name: input.parent.name,
              email: input.parent.email,
              timezone: input.parent.timezone,
            });
          }

          /*
           * Generate the ID ourselves so the dummy meeting
           * link can contain the booking ID.
           */
          const bookingId = randomUUID();

          const meetingLink =
            generateMeetingLink(bookingId);

          const booking =
            await bookingRepository.create({
              id: bookingId,
              parentId: parent.id,
              mentorId: lockedMentor.id,
              startTimeUtc: startUtc.toJSDate(),
              endTimeUtc: endUtc.toJSDate(),
              parentTimezone: parentTimezone,
              meetingLink,
            });

          return booking;
        }

        throw new ApiError(
          409,
          "NO_MENTOR_AVAILABLE",
          "No mentor is available for the selected time slot.",
        );
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );

    /*
     * Transaction has successfully committed.
     *
     * A real application would send notifications here.
     * We deliberately keep this as a simulation for the assignment.
     */
    console.log(
      `[NOTIFICATION] Trial class booked: ${result.id}`,
    );

    const parentStart = DateTime.fromJSDate(
      result.startTimeUtc,
      {
        zone: result.parentTimezone,
      },
    );

    const parentEnd = DateTime.fromJSDate(
      result.endTimeUtc,
      {
        zone: result.parentTimezone,
      },
    );

    const mentorStart = DateTime.fromJSDate(
      result.startTimeUtc,
      {
        zone: result.mentor.timezone,
      },
    );

    const mentorEnd = DateTime.fromJSDate(
      result.endTimeUtc,
      {
        zone: result.mentor.timezone,
      },
    );

    return {
      id: result.id,
      status: result.status,

      parent: {
        name: result.parent.name,
        email: result.parent.email,
        timezone: result.parentTimezone,
        start: parentStart.toISO(),
        end: parentEnd.toISO(),
      },

      mentor: {
        name: result.mentor.name,
        timezone: result.mentor.timezone,
        start: mentorStart.toISO(),
        end: mentorEnd.toISO(),
      },

      meetingLink: result.meetingLink,
    };
  }

  async getBooking(id: string) {
    const repository = new BookingRepository();

    const booking =
      await repository.findById(id);

    if (!booking) {
      throw new ApiError(
        404,
        "BOOKING_NOT_FOUND",
        "Booking not found.",
      );
    }

    const parentStart = DateTime.fromJSDate(
      booking.startTimeUtc,
      {
        zone: booking.parentTimezone,
      },
    );

    const parentEnd = DateTime.fromJSDate(
      booking.endTimeUtc,
      {
        zone: booking.parentTimezone,
      },
    );

    const mentorStart = DateTime.fromJSDate(
      booking.startTimeUtc,
      {
        zone: booking.mentor.timezone,
      },
    );

    const mentorEnd = DateTime.fromJSDate(
      booking.endTimeUtc,
      {
        zone: booking.mentor.timezone,
      },
    );

    return {
      id: booking.id,
      status: booking.status,

      parent: {
        name: booking.parent.name,
        email: booking.parent.email,
        timezone: booking.parentTimezone,
        start: parentStart.toISO(),
        end: parentEnd.toISO(),
      },

      mentor: {
        name: booking.mentor.name,
        timezone: booking.mentor.timezone,
        start: mentorStart.toISO(),
        end: mentorEnd.toISO(),
      },

      meetingLink: booking.meetingLink,
    };
  }

  async cancelBooking(id: string) {
  const result = await prisma.$transaction(
    async (tx) => {
      const bookingRepository =
        new BookingRepository(tx);

      const mentorRepository =
        new MentorRepository(tx);

      const booking =
        await bookingRepository.findById(id);

      if (!booking) {
        throw new ApiError(
          404,
          "BOOKING_NOT_FOUND",
          "Booking not found.",
        );
      }

      if (booking.status === "CANCELLED") {
        throw new ApiError(
          409,
          "BOOKING_ALREADY_CANCELLED",
          "Booking has already been cancelled.",
        );
      }

      /*
       * Lock the mentor before changing the booking.
       *
       * This prevents a booking transaction and cancellation
       * transaction from making conflicting capacity decisions
       * at the same time.
       */
      const lockedMentor =
        await mentorRepository.lockMentor(
          booking.mentorId,
        );

      if (!lockedMentor) {
        throw new ApiError(
          404,
          "MENTOR_NOT_FOUND",
          "Assigned mentor no longer exists.",
        );
      }

      return bookingRepository.cancel(id);
    },
  );

  console.log(
    `[NOTIFICATION] Booking cancelled: ${result.id}`,
  );

  return {
    id: result.id,
    status: result.status,

    parent: {
      name: result.parent.name,
      email: result.parent.email,
      timezone: result.parentTimezone,
    },

    mentor: {
      name: result.mentor.name,
      timezone: result.mentor.timezone,
    },

    meetingLink: result.meetingLink,
  };
}

}