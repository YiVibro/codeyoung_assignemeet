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
      const from = String(req.query.from);
      const to = String(req.query.to);

      const slots =
        await availabilityService.getAvailability(
          date,
          timezone,
          from,
          to
        );

      res.status(200).json({
        date,
        timezone,
        from,
        to,
        slots,
      });
    } catch (error) {
      next(error);
    }
  }
}