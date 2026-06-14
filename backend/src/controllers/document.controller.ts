import { Request, Response } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import type { DocumentIdParams, SearchDocumentsInput } from '@/types';
import {
  listUserDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  retryDocumentEmbedding,
  deleteDocument,
} from '@/services/document.service';
import { searchDocumentsBySemanticQuery } from '@/services/vectorSearch.service';

export const getDocuments = asyncHandler(async (req: Request, res: Response) => {
  const documents = await listUserDocuments(req.user!.id);

  ApiResponse.success(res, 'Documents retrieved successfully', { documents });
});

export const getDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as DocumentIdParams;
  const document = await getDocumentById(req.user!.id, id);

  ApiResponse.success(res, 'Document retrieved successfully', { document });
});

export const createDocumentHandler = asyncHandler(async (req: Request, res: Response) => {
  const document = await createDocument(req.user!.id, req.body);

  ApiResponse.created(res, 'Document created successfully', { document });
});

export const updateDocumentHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as DocumentIdParams;
  const document = await updateDocument(req.user!.id, id, req.body);

  ApiResponse.success(res, 'Document updated successfully', { document });
});

export const retryDocumentEmbeddingHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as DocumentIdParams;
  const document = await retryDocumentEmbedding(req.user!.id, id);

  ApiResponse.success(res, 'Document embedding retry scheduled', { document });
});

export const deleteDocumentHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as DocumentIdParams;
  await deleteDocument(req.user!.id, id);

  ApiResponse.success(res, 'Document deleted successfully');
});

export const searchDocumentsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { query, limit, collectionIds } = req.body as SearchDocumentsInput;
  const searchResults = await searchDocumentsBySemanticQuery(
    req.user!.id,
    query,
    limit,
    collectionIds,
  );
  const documents = searchResults.map((result) => result.document);

  ApiResponse.success(res, 'Documents retrieved successfully', { documents });
});
