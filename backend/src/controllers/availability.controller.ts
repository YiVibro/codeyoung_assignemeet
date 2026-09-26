import { Request, Response, NextFunction } from "express";

import { AvailabilityService } from "../services/availability.service.js";

const availabilityService =
  new AvailabilityService();

export class AvailabilityController {
  async getAvailability(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const date = String(req.query.date);
      const timezone = String(req.query.timezone);

      const slots =
        await availabilityService.getAvailability(
          date,
          timezone,
        );

      res.status(200).json({
        date,
        timezone,
        slots,
      });
    } catch (error) {
      next(error);
    }
  }
}