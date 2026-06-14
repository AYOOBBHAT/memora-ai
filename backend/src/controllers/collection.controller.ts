import { Request, Response } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import type { CollectionDocumentParams, CollectionIdParams } from '@/types';
import {
  listUserCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
  addDocumentsToCollection,
  removeDocumentFromCollection,
  listCollectionDocuments,
} from '@/services/collection.service';

export const getCollections = asyncHandler(async (req: Request, res: Response) => {
  const collections = await listUserCollections(req.user!.id);

  ApiResponse.success(res, 'Collections retrieved successfully', { collections });
});

export const getCollection = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as CollectionIdParams;
  const collection = await getCollectionById(req.user!.id, id);

  ApiResponse.success(res, 'Collection retrieved successfully', { collection });
});

export const createCollectionHandler = asyncHandler(async (req: Request, res: Response) => {
  const collection = await createCollection(req.user!.id, req.body);

  ApiResponse.created(res, 'Collection created successfully', { collection });
});

export const updateCollectionHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as CollectionIdParams;
  const collection = await updateCollection(req.user!.id, id, req.body);

  ApiResponse.success(res, 'Collection updated successfully', { collection });
});

export const deleteCollectionHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as CollectionIdParams;
  await deleteCollection(req.user!.id, id);

  ApiResponse.success(res, 'Collection deleted successfully');
});

export const addDocumentsToCollectionHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as CollectionIdParams;
    const documents = await addDocumentsToCollection(req.user!.id, id, req.body);

    ApiResponse.success(res, 'Documents added to collection successfully', { documents });
  },
);

export const removeDocumentFromCollectionHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id, documentId } = req.params as CollectionDocumentParams;
    await removeDocumentFromCollection(req.user!.id, id, documentId);

    ApiResponse.success(res, 'Document removed from collection successfully');
  },
);

export const getCollectionDocuments = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as CollectionIdParams;
  const documents = await listCollectionDocuments(req.user!.id, id);

  ApiResponse.success(res, 'Collection documents retrieved successfully', { documents });
});
