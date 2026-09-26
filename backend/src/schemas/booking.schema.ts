import { z } from "zod";

export const createBookingSchema = z.object({
  parent: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Name must contain at least 2 characters.")
      .max(100),

    email: z
      .string()
      .trim()
      .email("Invalid email address.")
      .max(255),

    timezone: z
      .string()
      .min(1, "Timezone is required."),
  }),

  start: z
    .string()
    .min(1, "Start time is required."),
});

export type CreateBookingInput =
  z.infer<typeof createBookingSchema>;