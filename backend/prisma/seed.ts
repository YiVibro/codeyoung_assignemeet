import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const mentors = [
  {
    name: "Mentor 1",
    email: "mentor1@codeyoung.local",
  },
  {
    name: "Mentor 2",
    email: "mentor2@codeyoung.local",
  },
  {
    name: "Mentor 3",
    email: "mentor3@codeyoung.local",
  },
  {
    name: "Mentor 4",
    email: "mentor4@codeyoung.local",
  },
  {
    name: "Mentor 5",
    email: "mentor5@codeyoung.local",
  },
  {
    name: "Mentor 6",
    email: "mentor6@codeyoung.local",
  },
  {
    name: "Mentor 7",
    email: "mentor7@codeyoung.local",
  },
  {
    name: "Mentor 8",
    email: "mentor8@codeyoung.local",
  },
  {
    name: "Mentor 9",
    email: "mentor9@codeyoung.local",
  },
  {
    name: "Mentor 10",
    email: "mentor10@codeyoung.local",
  },
];

async function main() {
  console.log("Seeding database...");

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
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });