import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const mentors = Array.from({ length: 10 }, (_, index) => ({
  name: `Mentor ${index + 1}`,
  email: `mentor${index + 1}@codeyoung.local`,
}));

async function main() {
  console.log("Starting database seed...");

  // Clear development data.
  await prisma.booking.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.mentorAvailability.deleteMany();
  await prisma.mentor.deleteMany();

  for (const mentorData of mentors) {
    const mentor = await prisma.mentor.create({
      data: {
        name: mentorData.name,
        email: mentorData.email,
        timezone: "Asia/Kolkata",
        active: true,
      },
    });

    await prisma.mentorAvailability.createMany({
      data: [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
        mentorId: mentor.id,
        dayOfWeek,
        startTime: "09:00",
        endTime: "21:00",
      })),
    });
  }

  console.log("Created 10 mentors.");
  console.log("Created Monday-Saturday availability.");
  console.log("Database seed completed.");
}

main()
  .catch((error) => {
    console.error("Database seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });