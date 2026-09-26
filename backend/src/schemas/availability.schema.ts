import { z } from "zod";

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
});

export type AvailabilityQuery = z.infer<
  typeof availabilityQuerySchema
>;