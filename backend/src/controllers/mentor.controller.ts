import {
  Request,
  Response,
  NextFunction,
} from "express";

import { BookingRepository } from "../repositories/booking.repository.js";
import { MentorRepository } from "../repositories/mentor.repository.js";
import { ApiError } from "../utils/api-error.js";
import { DateTime } from "luxon";

const bookingRepository =
  new BookingRepository();

const mentorRepository =
  new MentorRepository();

export class MentorController {
  async getBookings(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const mentorId = req.params.id;

      const mentor =
        await mentorRepository.findById(
          mentorId as string,
        );

      if (!mentor) {
        throw new ApiError(
          404,
          "MENTOR_NOT_FOUND",
          "Mentor not found.",
        );
      }

      const bookings =
        await bookingRepository.findBookingsForMentor(
          mentorId as string,
        );

      const formattedBookings =
        bookings.map((booking) => {
          const start =
            DateTime.fromJSDate(
              booking.startTimeUtc,
              {
                zone: mentor.timezone,
              },
            );

          const end =
            DateTime.fromJSDate(
              booking.endTimeUtc,
              {
                zone: mentor.timezone,
              },
            );

          return {
            id: booking.id,

            status: booking.status,

            parent: {
              name: booking.parent.name,
              email: booking.parent.email,
            },

            mentor: {
              name: mentor.name,
              timezone: mentor.timezone,
              start: start.toISO(),
              end: end.toISO(),
            },

            meetingLink:
              booking.meetingLink,
          };
        });

      res.status(200).json({
        mentor: {
          id: mentor.id,
          name: mentor.name,
          timezone: mentor.timezone,
        },
        bookings: formattedBookings,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMentors(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const mentors = await mentorRepository.findAllActive();

    res.status(200).json({
      mentors: mentors.map((mentor) => ({
        id: mentor.id,
        name: mentor.name,
        timezone: mentor.timezone,
      })),
    });
  } catch (error) {
    next(error);
  }
}

}