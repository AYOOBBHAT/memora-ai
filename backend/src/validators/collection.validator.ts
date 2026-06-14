import { z } from 'zod';

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID');

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g. #FF5733)');

export const createCollectionSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name cannot exceed 200 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .trim()
    .optional(),
  color: hexColorSchema.optional(),
  icon: z
    .string()
    .max(50, 'Icon cannot exceed 50 characters')
    .trim()
    .optional(),
});

export const updateCollectionSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(200, 'Name cannot exceed 200 characters')
      .trim(),
    description: z
      .string()
      .max(1000, 'Description cannot exceed 1000 characters')
      .trim(),
    color: hexColorSchema,
    icon: z
      .string()
      .max(50, 'Icon cannot exceed 50 characters')
      .trim(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const collectionIdParamSchema = z.object({
  id: objectIdSchema,
});

export const collectionDocumentParamsSchema = z.object({
  id: objectIdSchema,
  documentId: objectIdSchema,
});

export const addDocumentsToCollectionSchema = z
  .object({
    documentId: objectIdSchema.optional(),
    documentIds: z.array(objectIdSchema).optional(),
  })
  .refine(
    (data) =>
      data.documentId !== undefined ||
      (data.documentIds !== undefined && data.documentIds.length > 0),
    {
      message: 'Either documentId or documentIds must be provided',
    },
  );

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
export type CollectionIdParams = z.infer<typeof collectionIdParamSchema>;
export type CollectionDocumentParams = z.infer<typeof collectionDocumentParamsSchema>;
export type AddDocumentsToCollectionInput = z.infer<typeof addDocumentsToCollectionSchema>;
