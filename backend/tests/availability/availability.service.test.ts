import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findActiveMentors: vi.fn(),
  findConfirmedBookingsForMentorPeriod: vi.fn(),
}));

vi.mock("../../src/repositories/mentor.repository.js", () => ({
  MentorRepository: class {
    findActiveMentors = mocks.findActiveMentors;
  },
}));

vi.mock("../../src/repositories/booking.repository.js", () => ({
  BookingRepository: class {
    findConfirmedBookingsForMentorPeriod =
      mocks.findConfirmedBookingsForMentorPeriod;
  },
}));

import { AvailabilityService } from "../../src/services/availability.service.js";

describe("AvailabilityService", () => {
  const service = new AvailabilityService();

  beforeEach(() => {
    vi.clearAllMocks();

    mocks.findConfirmedBookingsForMentorPeriod.mockResolvedValue([]);
  });

  it("returns available hourly slots for an active mentor", async () => {
    mocks.findActiveMentors.mockResolvedValue([
      {
        id: "mentor-1",
        name: "Mentor 1",
        email: "mentor1@test.com",
        timezone: "Asia/Kolkata",
        active: true,
        availability: [
          {
            id: "availability-1",
            mentorId: "mentor-1",
            dayOfWeek: 1,
            startTime: "09:00",
            endTime: "12:00",
          },
        ],
      },
    ]);

    const slots = await service.getAvailability(
      "2026-09-28",
      "Asia/Kolkata",
    );

    expect(slots.length).toBe(3);

    expect(slots[0]).toMatchObject({
      start: "2026-09-28T09:00:00.000+05:30",
      end: "2026-09-28T10:00:00.000+05:30",
    });
  });

  it("does not return a slot that is already booked", async () => {
    mocks.findActiveMentors.mockResolvedValue([
      {
        id: "mentor-1",
        name: "Mentor 1",
        email: "mentor1@test.com",
        timezone: "Asia/Kolkata",
        active: true,
        availability: [
          {
            id: "availability-1",
            mentorId: "mentor-1",
            dayOfWeek: 1,
            startTime: "09:00",
            endTime: "12:00",
          },
        ],
      },
    ]);

    mocks.findConfirmedBookingsForMentorPeriod.mockResolvedValue([
      {
        id: "booking-1",
        mentorId: "mentor-1",
        startTimeUtc: new Date("2026-09-28T03:30:00.000Z"),
        endTimeUtc: new Date("2026-09-28T04:30:00.000Z"),
        status: "CONFIRMED",
      },
    ]);

    const slots = await service.getAvailability(
      "2026-09-28",
      "Asia/Kolkata",
    );

    expect(
      slots.some(
        (slot) =>
          slot.start === "2026-09-28T09:00:00.000+05:30",
      ),
    ).toBe(false);

    expect(slots.length).toBe(2);
  });

  it("returns no slots when mentor has reached the daily booking limit", async () => {
    mocks.findActiveMentors.mockResolvedValue([
      {
        id: "mentor-1",
        name: "Mentor 1",
        email: "mentor1@test.com",
        timezone: "Asia/Kolkata",
        active: true,
        availability: [
          {
            id: "availability-1",
            mentorId: "mentor-1",
            dayOfWeek: 1,
            startTime: "09:00",
            endTime: "12:00",
          },
        ],
      },
    ]);

    mocks.findConfirmedBookingsForMentorPeriod.mockResolvedValue([
      {
        id: "booking-1",
        mentorId: "mentor-1",
        startTimeUtc: new Date("2026-09-28T03:30:00.000Z"),
        endTimeUtc: new Date("2026-09-28T04:30:00.000Z"),
        status: "CONFIRMED",
      },
      {
        id: "booking-2",
        mentorId: "mentor-1",
        startTimeUtc: new Date("2026-09-28T05:30:00.000Z"),
        endTimeUtc: new Date("2026-09-28T06:30:00.000Z"),
        status: "CONFIRMED",
      },
    ]);

    const slots = await service.getAvailability(
      "2026-09-28",
      "Asia/Kolkata",
    );

    expect(slots).toEqual([]);
  });

  it("rejects availability requests for a past date", async () => {
    await expect(
      service.getAvailability("2020-01-01", "Asia/Kolkata"),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "PAST_DATE",
    });
  });

  it("rejects an invalid timezone", async () => {
    await expect(
      service.getAvailability(
        "2026-09-28",
        "Invalid/Timezone",
      ),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "INVALID_TIMEZONE",
    });
  });
});