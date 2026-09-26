import prisma, {
  PrismaClientLike,
} from "../config/prisma.js";

export class MentorRepository {
  constructor(
    private readonly db: PrismaClientLike = prisma,
  ) {}

  async findActiveMentors() {
    return this.db.mentor.findMany({
      where: {
        active: true,
      },
      include: {
        availability: true,
      },
      orderBy: {
        id: "asc",
      },
    });
  }

  async findById(id: string) {
    return this.db.mentor.findUnique({
      where: {
        id,
      },
      include: {
        availability: true,
      },
    });
  }

  async lockMentor(id: string) {
  const mentors = await this.db.$queryRaw<
    Array<{
      id: string;
      name: string;
      email: string;
      timezone: string;
      active: boolean;
    }>
  >`
    SELECT
      "id",
      "name",
      "email",
      "timezone",
      "active"
    FROM "Mentor"
    WHERE "id" = ${id}
    FOR UPDATE
  `;

  return mentors[0] ?? null;
}

}

