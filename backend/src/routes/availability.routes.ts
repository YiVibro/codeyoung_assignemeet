import { Router } from "express";

import { AvailabilityController } from "../controllers/availability.controller.js";
import { validateQuery } from "../middleware/validate.middleware.js";
import { availabilityQuerySchema } from "../schemas/availability.schema.js";

const router = Router();

const controller =
  new AvailabilityController();

router.get(
  "/",
  validateQuery(availabilityQuerySchema),
  controller.getAvailability.bind(controller),
);

export default router;