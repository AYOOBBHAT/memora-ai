import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/utils/ApiError';
import { HTTP_STATUS } from '@/constants/httpStatus';

export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  next(new ApiError(HTTP_STATUS.NOT_FOUND, `Route ${req.method} ${req.originalUrl} not found`));
};
