import { Router } from "express";

import {
  BookingController,
} from "../controllers/booking.controller.js";

import {
  validateBody,
} from "../middleware/validate.middleware.js";

import {
  createBookingSchema,
} from "../schemas/booking.schema.js";

const router = Router();

const controller =
  new BookingController();

router.post(
  "/:id/cancel",
  controller.cancelBooking.bind(controller),
);

router.post(
  "/",
  validateBody(createBookingSchema),
  controller.createBooking.bind(controller),
);

router.get(
  "/:id",
  controller.getBooking.bind(controller),
);

export default router;