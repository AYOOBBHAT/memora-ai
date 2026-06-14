import { DocumentModel, IDocumentDocument } from '@/models/Document.model';
import { HTTP_STATUS } from '@/constants/httpStatus';
import { SafeDocument } from '@/types';
import { ApiError } from '@/utils/ApiError';
import { scheduleDocumentEmbedding } from '@/services/embedding.service';
import {
  CreateDocumentInput,
  UpdateDocumentInput,
} from '@/validators/document.validator';

export function toSafeDocument(doc: IDocumentDocument): SafeDocument {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    title: doc.title,
    content: doc.content,
    sourceType: doc.sourceType,
    metadata: doc.metadata,
    collectionId: doc.collectionId?.toString(),
    embeddingStatus: doc.embeddingStatus ?? 'pending',
    embeddingError: doc.embeddingError,
    embeddingUpdatedAt: doc.embeddingUpdatedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function listUserDocuments(userId: string): Promise<SafeDocument[]> {
  const documents = await DocumentModel.find({ userId }).sort({ createdAt: -1 });
  return documents.map(toSafeDocument);
}

export async function getDocumentById(
  userId: string,
  documentId: string,
): Promise<SafeDocument> {
  const document = await DocumentModel.findOne({ _id: documentId, userId });

  if (!document) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Document not found');
  }

  return toSafeDocument(document);
}

export async function createDocument(
  userId: string,
  input: CreateDocumentInput,
): Promise<SafeDocument> {
  const document = await DocumentModel.create({
    userId,
    ...input,
  });

  scheduleDocumentEmbedding(document._id.toString(), userId);

  return toSafeDocument(document);
}

export async function updateDocument(
  userId: string,
  documentId: string,
  input: UpdateDocumentInput,
): Promise<SafeDocument> {
  const { retryEmbedding, ...fields } = input;
  const contentChanged = fields.content !== undefined;

  const existing = await DocumentModel.findOne({ _id: documentId, userId });

  if (!existing) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Document not found');
  }

  const shouldReembed =
    contentChanged || retryEmbedding === true || existing.embeddingStatus === 'failed';

  const document = await DocumentModel.findOneAndUpdate(
    { _id: documentId, userId },
    {
      $set: {
        ...fields,
        ...(shouldReembed ? { embeddingStatus: 'pending' as const } : {}),
      },
      ...(shouldReembed ? { $unset: { embedding: 1, embeddingError: 1 } } : {}),
    },
    { new: true, runValidators: true },
  );

  if (!document) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Document not found');
  }

  if (shouldReembed) {
    scheduleDocumentEmbedding(document._id.toString(), userId);
  }

  return toSafeDocument(document);
}

export async function retryDocumentEmbedding(
  userId: string,
  documentId: string,
): Promise<SafeDocument> {
  const existing = await DocumentModel.findOne({ _id: documentId, userId });

  if (!existing) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Document not found');
  }

  if (existing.embeddingStatus === 'completed') {
    throw new ApiError(HTTP_STATUS.CONFLICT, 'Document embedding already completed');
  }

  if (existing.embeddingStatus === 'processing') {
    throw new ApiError(HTTP_STATUS.CONFLICT, 'Document embedding already in progress');
  }

  const document = await DocumentModel.findOneAndUpdate(
    { _id: documentId, userId },
    {
      $set: { embeddingStatus: 'pending' as const },
      $unset: { embedding: 1, embeddingError: 1 },
    },
    { new: true, runValidators: true },
  );

  if (!document) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Document not found');
  }

  scheduleDocumentEmbedding(document._id.toString(), userId);

  return toSafeDocument(document);
}

export async function deleteDocument(
  userId: string,
  documentId: string,
): Promise<void> {
  const result = await DocumentModel.deleteOne({ _id: documentId, userId });

  if (result.deletedCount === 0) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Document not found');
  }
}
