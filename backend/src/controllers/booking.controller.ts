import {
  Request,
  Response,
  NextFunction,
} from "express";

import { BookingService } from "../services/booking.service.js";

const bookingService = new BookingService();

export class BookingController {
  async createBooking(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const booking =
        await bookingService.createBooking(req.body);

      res.status(201).json({
        booking,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBooking(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const booking =
        await bookingService.getBooking(
          req.params.id as string,
        );

      res.status(200).json({
        booking,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelBooking(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const booking =
        await bookingService.cancelBooking(
          req.params.id as string,
        );

      res.status(200).json({
        booking,
      });
    } catch (error) {
      next(error);
    }
  }
}