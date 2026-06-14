import { Request, Response, NextFunction } from 'express';
import { env } from '@/config/env';
import { verifyAccessToken } from '@/services/token.service';
import { ApiError } from '@/utils/ApiError';
import { HTTP_STATUS } from '@/constants/httpStatus';

const healthNotFound = (): ApiError =>
  new ApiError(HTTP_STATUS.NOT_FOUND, 'Not found');

export const secureHealthAccess = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (!env.HEALTH_ENDPOINTS_ENABLED) {
    next(healthNotFound());
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next(healthNotFound());
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);

    if (payload.role !== 'admin') {
      next(healthNotFound());
      return;
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    next(healthNotFound());
  }
};
