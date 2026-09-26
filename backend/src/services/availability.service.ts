import { DateTime } from "luxon";

import { MentorRepository } from "../repositories/mentor.repository.js";
import { BookingRepository } from "../repositories/booking.repository.js";
import { ApiError } from "../utils/api-error.js";
import {
  parseDateInTimezone,
  isValidTimezone,
} from "../utils/timezone.js";

const mentorRepository = new MentorRepository();
const bookingRepository = new BookingRepository();

const SLOT_DURATION_MINUTES = 60;
const MAX_BOOKINGS_PER_MENTOR_PER_DAY = 2;

interface AvailabilitySlot {
  start: string;
  end: string;
}

export class AvailabilityService {
  async getAvailability(
    date: string,
    parentTimezone: string,
  ): Promise<AvailabilitySlot[]> {
    if (!isValidTimezone(parentTimezone)) {
      throw new ApiError(
        400,
        "INVALID_TIMEZONE",
        `Invalid timezone: ${parentTimezone}`,
      );
    }

    const parentDay = parseDateInTimezone(
      date,
      parentTimezone,
    );

    const today = DateTime.now().setZone(parentTimezone);

    if (
      parentDay.startOf("day") <
      today.startOf("day")
    ) {
      throw new ApiError(
        400,
        "PAST_DATE",
        "Cannot request availability for a past date.",
      );
    }

    /*
     * The parent requested an entire local calendar day.
     *
     * Example:
     *
     * 2026-09-28 00:00
     * →
     * 2026-09-29 00:00
     *
     * in the parent's timezone.
     */
    const parentDayStart =
      parentDay.startOf("day");

    const parentDayEnd =
      parentDayStart.plus({ days: 1 });

    const parentDayStartUtc =
      parentDayStart.toUTC();

    const parentDayEndUtc =
      parentDayEnd.toUTC();

    const mentors =
      await mentorRepository.findActiveMentors();

    const availableSlots = new Map<
      string,
      AvailabilitySlot
    >();

    for (const mentor of mentors) {
      /*
       * We need to inspect the mentor's local
       * calendar dates that overlap the parent's
       * requested UTC day.
       *
       * Usually this is one or two dates.
       */
      const mentorStartDate =
        parentDayStartUtc
          .setZone(mentor.timezone)
          .startOf("day");

      const mentorEndDate =
        parentDayEndUtc
          .setZone(mentor.timezone)
          .startOf("day");

      let mentorDate = mentorStartDate;

      while (mentorDate <= mentorEndDate) {
        const dayOfWeek = mentorDate.weekday;

        const mentorAvailability =
          mentor.availability.find(
            (availability) =>
              availability.dayOfWeek === dayOfWeek,
          );

        if (!mentorAvailability) {
          mentorDate = mentorDate.plus({
            days: 1,
          });

          continue;
        }

        const availabilityStart =
          DateTime.fromFormat(
            `${mentorDate.toFormat(
              "yyyy-MM-dd",
            )} ${mentorAvailability.startTime}`,
            "yyyy-MM-dd HH:mm",
            {
              zone: mentor.timezone,
            },
          );

        const availabilityEnd =
          DateTime.fromFormat(
            `${mentorDate.toFormat(
              "yyyy-MM-dd",
            )} ${mentorAvailability.endTime}`,
            "yyyy-MM-dd HH:mm",
            {
              zone: mentor.timezone,
            },
          );

        /*
         * Ignore mentor availability that doesn't
         * overlap the parent's requested day.
         */
        if (
          availabilityEnd.toUTC() <=
            parentDayStartUtc ||
          availabilityStart.toUTC() >=
            parentDayEndUtc
        ) {
          mentorDate = mentorDate.plus({
            days: 1,
          });

          continue;
        }

        /*
         * Get bookings for this mentor's local day.
         * This is important because the 2-class limit
         * is based on the mentor's local calendar day.
         */
        const mentorDayStartUtc =
          availabilityStart
            .startOf("day")
            .toUTC()
            .toJSDate();

        const mentorDayEndUtc =
          availabilityStart
            .startOf("day")
            .plus({ days: 1 })
            .toUTC()
            .toJSDate();

        const dayBookings =
          await bookingRepository.findConfirmedBookingsForMentorPeriod(
            mentor.id,
            mentorDayStartUtc,
            mentorDayEndUtc,
          );

        if (
          dayBookings.length >=
          MAX_BOOKINGS_PER_MENTOR_PER_DAY
        ) {
          mentorDate = mentorDate.plus({
            days: 1,
          });

          continue;
        }

        let slotStart = availabilityStart;

        while (
          slotStart.plus({
            minutes: SLOT_DURATION_MINUTES,
          }) <= availabilityEnd
        ) {
          const slotEnd = slotStart.plus({
            minutes: SLOT_DURATION_MINUTES,
          });

          const slotStartUtc =
            slotStart.toUTC();

          const slotEndUtc =
            slotEnd.toUTC();

          /*
           * Only return slots that actually fall
           * inside the parent's requested local day.
           */
          if (
            slotStartUtc >= parentDayStartUtc &&
            slotEndUtc <= parentDayEndUtc
          ) {
            const conflictingBooking =
              dayBookings.some((booking) => {
                return (
                  booking.startTimeUtc <
                    slotEndUtc.toJSDate() &&
                  booking.endTimeUtc >
                    slotStartUtc.toJSDate()
                );
              });

            if (!conflictingBooking) {
              const parentStart =
                slotStart.setZone(parentTimezone);

              const parentEnd =
                slotEnd.setZone(parentTimezone);

              const key =
                slotStartUtc.toISO();

              if (key) {
                availableSlots.set(key, {
                  start: parentStart.toISO()!,
                  end: parentEnd.toISO()!,
                });
              }
            }
          }

          slotStart = slotEnd;
        }

        mentorDate = mentorDate.plus({
          days: 1,
        });
      }
    }

    return Array.from(
      availableSlots.values(),
    ).sort(
      (a, b) =>
        DateTime.fromISO(a.start).toMillis() -
        DateTime.fromISO(b.start).toMillis(),
    );
  }
}