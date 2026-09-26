import {
  Request,
  Response,
  NextFunction,
} from "express";

import { ZodType } from "zod";
import { ApiError } from "../utils/api-error.js";

export function validateQuery(
  schema: ZodType,
) {
  return (
    req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      next(
        new ApiError(
          400,
          "VALIDATION_ERROR",
          result.error.issues
            .map((issue) => issue.message)
            .join(", "),
        ),
      );

      return;
    }

    Object.keys(req.query).forEach((key)=>{
        delete (req.query as Record<string,unknown>)[key];
    });

    Object.assign(req.query, result.data);

    //req.query = result.data as typeof req.query;

    next();
  };
}

export function validateBody(
  schema: ZodType,
) {
  return (
    req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(
        new ApiError(
          400,
          "VALIDATION_ERROR",
          result.error.issues
            .map((issue) => issue.message)
            .join(", "),
        ),
      );

      return;
    }

    req.body = result.data;

    next();
  };
}