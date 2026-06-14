import { Request, Response } from 'express';
import { HTTP_STATUS } from '@/constants/httpStatus';
import { checkChatHealth } from '@/services/system.service';
import { ApiResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export const chatHealthHandler = asyncHandler(async (_req: Request, res: Response) => {
  const result = await checkChatHealth();

  if (result.status === 'ok') {
    ApiResponse.success(res, 'Groq chat is healthy', result);
    return;
  }

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(false, 'Groq chat health check failed', result));
});
