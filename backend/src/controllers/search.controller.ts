import { Request, Response } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import { globalSearch } from '@/services/search.service';
import type { GlobalSearchQuery } from '@/validators/search.validator';

export const searchHandler = asyncHandler(async (req: Request, res: Response) => {
  const { q, limit } = req.query as unknown as GlobalSearchQuery;
  const payload = await globalSearch(req.user!.id, q, limit);

  ApiResponse.success(res, 'Search completed successfully', payload);
});
