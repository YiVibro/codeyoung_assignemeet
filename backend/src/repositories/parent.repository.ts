import prisma, {
  PrismaClientLike,
} from "../config/prisma.js";

export class ParentRepository {
  constructor(
    private readonly db: PrismaClientLike = prisma,
  ) {}

  async findByEmail(email: string) {
    return this.db.parent.findFirst({
      where: {
        email,
      },
    });
  }

  async create(data: {
    name: string;
    email: string;
    timezone: string;
  }) {
    return this.db.parent.create({
      data,
    });
  }

  async findById(id: string) {
    return this.db.parent.findUnique({
      where: {
        id,
      },
    });
  }
}