import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ApiError } from '@/utils/ApiError';
import { HTTP_STATUS } from '@/constants/httpStatus';

export const validate =
  (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      next(new ApiError(HTTP_STATUS.BAD_REQUEST, 'Validation failed', errors));
      return;
    }

    req.body = result.data;
    next();
  };

export const validateParams =
  (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      next(new ApiError(HTTP_STATUS.BAD_REQUEST, 'Validation failed', errors));
      return;
    }

    req.params = result.data as Request['params'];
    next();
  };
