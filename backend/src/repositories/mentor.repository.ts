import prisma from "../config/prisma.js";

export class MentorRepository {
  async findActiveMentors() {
    return prisma.mentor.findMany({
      where: {
        active: true,
      },
      orderBy: {
        id: "asc",
      },
    });
  }

  async findById(id: string) {
    return prisma.mentor.findUnique({
      where: {
        id,
      },
      include: {
        availability: true,
      },
    });
  }
}