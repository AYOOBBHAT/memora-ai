import { z } from 'zod';

export const globalSearchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(2, 'Search query must be at least 2 characters')
    .max(200, 'Search query cannot exceed 200 characters'),
  limit: z.coerce.number().int().min(1).max(20).optional().default(20),
});

export type GlobalSearchQuery = z.infer<typeof globalSearchQuerySchema>;
