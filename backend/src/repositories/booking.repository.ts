import prisma from "../config/prisma.js";

export class BookingRepository {
  async findByMentorAndStart(
    mentorId: string,
    startTimeUtc: Date,
  ) {
    return prisma.booking.findUnique({
      where: {
        mentorId_startTimeUtc: {
          mentorId,
          startTimeUtc,
        },
      },
    });
  }

  async findByMentorAndPeriod(
    mentorId: string,
    startTimeUtc: Date,
    endTimeUtc: Date,
  ) {
    return prisma.booking.findMany({
      where: {
        mentorId,
        status: "CONFIRMED",
        startTimeUtc: {
          lt: endTimeUtc,
        },
        endTimeUtc: {
          gt: startTimeUtc,
        },
      },
      orderBy: {
        startTimeUtc: "asc",
      },
    });
  }
}