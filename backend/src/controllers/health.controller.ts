import { Request, Response } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { getDatabaseStatus } from '@/config/database';
import { asyncHandler } from '@/utils/asyncHandler';
import { HTTP_STATUS } from '@/constants/httpStatus';

/** Public liveness probe for load balancers and container orchestrators (no auth). */
export const getLiveness = asyncHandler(async (_req: Request, res: Response) => {
  res.status(HTTP_STATUS.OK).json({ status: 'ok' });
});

export const getHealth = asyncHandler(async (_req: Request, res: Response) => {
  const health = {
    status: 'ok' as const,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: getDatabaseStatus(),
  };

  ApiResponse.success(res, 'Service is healthy', health);
});
