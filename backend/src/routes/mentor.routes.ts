import { Router } from "express";

import { MentorController } from "../controllers/mentor.controller.js";

const controller =
  new MentorController();

const router = Router();

router.get("/:id/bookings", 
    controller.getBookings.bind(controller)
);

export default router;