import { Router } from "express";

import { MentorController } from "../controllers/mentor.controller.js";

const router = Router();

const controller = new MentorController();

router.get("/", controller.getMentors.bind(controller));

router.get(
  "/:id/bookings",
  controller.getBookings.bind(controller),
);

export default router;