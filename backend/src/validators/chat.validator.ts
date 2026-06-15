import { z } from 'zod';

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID');

export const chatMessageSchema = z
  .object({
    message: z
      .string()
      .min(1, 'Message is required')
      .max(2000, 'Message cannot exceed 2000 characters')
      .trim(),
    collectionId: objectIdSchema.optional(),
    collectionIds: z
      .array(objectIdSchema)
      .max(20, 'Cannot filter by more than 20 collections')
      .optional(),
    conversationId: objectIdSchema.optional(),
  })
  .refine((data) => !(data.collectionId && data.collectionIds?.length), {
    message: 'Provide either collectionId or collectionIds, not both',
    path: ['collectionId'],
  });

export const conversationIdParamSchema = z.object({
  id: objectIdSchema,
});

export const conversationSearchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(2, 'Search query must be at least 2 characters')
    .max(200, 'Search query cannot exceed 200 characters'),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type ConversationIdParams = z.infer<typeof conversationIdParamSchema>;
export type ConversationSearchQuery = z.infer<typeof conversationSearchQuerySchema>;
