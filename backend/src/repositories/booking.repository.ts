import prisma, {
  PrismaClientLike,
} from "../config/prisma.js";

export class BookingRepository {
  constructor(
    private readonly db: PrismaClientLike = prisma,
  ) {}

  async findConfirmedBookingsForMentorPeriod(
    mentorId: string,
    periodStartUtc: Date,
    periodEndUtc: Date,
  ) {
    return this.db.booking.findMany({
      where: {
        mentorId,
        status: "CONFIRMED",
        startTimeUtc: {
          lt: periodEndUtc,
        },
        endTimeUtc: {
          gt: periodStartUtc,
        },
      },
      orderBy: {
        startTimeUtc: "asc",
      },
    });
  }

  async countConfirmedBookingsForMentorPeriod(
    mentorId: string,
    periodStartUtc: Date,
    periodEndUtc: Date,
  ) {
    return this.db.booking.count({
      where: {
        mentorId,
        status: "CONFIRMED",
        startTimeUtc: {
          lt: periodEndUtc,
        },
        endTimeUtc: {
          gt: periodStartUtc,
        },
      },
    });
  }

  async findById(id: string) {
    return this.db.booking.findUnique({
      where: {
        id,
      },
      include: {
        parent: true,
        mentor: true,
      },
    });
  }

  async create(data: {
  id: string;
  parentId: string;
  mentorId: string;
  startTimeUtc: Date;
  endTimeUtc: Date;
  parentTimezone: string;
  meetingLink: string;
}) {
  return this.db.booking.create({
    data,
    include: {
      parent: true,
      mentor: true,
    },
  });
}

async findConflictingBooking(
  mentorId: string,
  startTimeUtc: Date,
  endTimeUtc: Date,
) {
  return this.db.booking.findFirst({
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
  });
}

async cancel(id: string) {
  return this.db.booking.update({
    where: { id },
    data: {
      status: "CANCELLED",
    },
    include: {
      parent: true,
      mentor: true,
    },
  });
}

async findBookingsForMentor(mentorId: string) {
  return this.db.booking.findMany({
    where: {
      mentorId,
    },
    include: {
      parent: true,
      mentor: true,
    },
    orderBy: {
      startTimeUtc: "asc",
    },
  });
}

}