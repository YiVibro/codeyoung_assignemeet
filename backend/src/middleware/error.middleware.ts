import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/api-error.js";

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(error);

  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });

    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    res.status(500).json({
      error: {
        code: "DATABASE_ERROR",
        message: "A database error occurred.",
      },
    });

    return;
  }

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
    },
  });
}