import { Router } from "express";

import availabilityRoutes from "./availability.routes.js";
import bookingRoutes from "./booking.routes.js";
import mentorRoutes from "./mentor.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "codeyoung-booking-api",
  });
});

router.use("/availability", availabilityRoutes);
router.use("/bookings", bookingRoutes);
router.use("/mentors", mentorRoutes);

export default router;