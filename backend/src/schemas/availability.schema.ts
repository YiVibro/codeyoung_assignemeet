import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const availabilityQuerySchema = z.object({
  date: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Date must use YYYY-MM-DD format.",
    ),

  timezone: z
    .string()
    .min(1, "Timezone is required."),

  from: z
    .string()
    .regex(
      timeRegex,
      "Start time must use HH:mm format.",
    ),

  to: z
    .string()
    .regex(
      timeRegex,
      "End time must use HH:mm format.",
    ),
});

export type AvailabilityQuery =
  z.infer<typeof availabilityQuerySchema>;