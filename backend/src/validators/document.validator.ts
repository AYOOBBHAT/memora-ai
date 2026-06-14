import { z } from 'zod';

const documentSourceTypeSchema = z.enum(['text', 'url', 'pdf', 'youtube', 'upload']);

const documentMetadataSchema = z
  .object({
    url: z.string().url().optional(),
    fileName: z.string().optional(),
    mimeType: z.string().optional(),
    fileSize: z.number().positive().optional(),
    youtubeVideoId: z.string().optional(),
    originalUrl: z.string().url().optional(),
    storageKey: z.string().optional(),
  })
  .passthrough()
  .optional();

export const createDocumentSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title cannot exceed 500 characters')
    .trim(),
  content: z.union([
    z.string().max(1_000_000, 'Content cannot exceed 1MB'),
    z.record(z.unknown()),
  ]),
  sourceType: documentSourceTypeSchema,
  metadata: documentMetadataSchema,
});

export const updateDocumentSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(500, 'Title cannot exceed 500 characters')
      .trim(),
    content: z.union([
      z.string().max(1_000_000, 'Content cannot exceed 1MB'),
      z.record(z.unknown()),
    ]),
    sourceType: documentSourceTypeSchema,
    metadata: documentMetadataSchema,
    retryEmbedding: z.boolean().optional(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const documentIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid document ID'),
});

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid collection ID');

export const searchDocumentsSchema = z.object({
  query: z.string().min(1, 'Query is required').trim(),
  limit: z.coerce.number().int().min(1).max(5).optional(),
  collectionIds: z
    .array(objectIdSchema)
    .max(20, 'Cannot filter by more than 20 collections')
    .optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type DocumentIdParams = z.infer<typeof documentIdParamSchema>;
export type SearchDocumentsInput = z.infer<typeof searchDocumentsSchema>;
