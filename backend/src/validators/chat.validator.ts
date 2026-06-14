import { z } from 'zod';

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid collection ID');

export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Message is required')
    .max(2000, 'Message cannot exceed 2000 characters')
    .trim(),
  collectionIds: z
    .array(objectIdSchema)
    .max(20, 'Cannot filter by more than 20 collections')
    .optional(),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
