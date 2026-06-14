import { CollectionModel, ICollectionDocument } from '@/models/Collection.model';
import { DocumentModel } from '@/models/Document.model';
import { HTTP_STATUS } from '@/constants/httpStatus';
import { SafeCollection, SafeDocument } from '@/types';
import { ApiError } from '@/utils/ApiError';
import { toSafeDocument } from '@/services/document.service';
import {
  AddDocumentsToCollectionInput,
  CreateCollectionInput,
  UpdateCollectionInput,
} from '@/validators/collection.validator';

export function toSafeCollection(collection: ICollectionDocument): SafeCollection {
  return {
    id: collection._id.toString(),
    userId: collection.userId.toString(),
    name: collection.name,
    description: collection.description,
    color: collection.color,
    icon: collection.icon,
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
  };
}

async function getOwnedCollection(
  userId: string,
  collectionId: string,
): Promise<ICollectionDocument> {
  const collection = await CollectionModel.findOne({ _id: collectionId, userId });

  if (!collection) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Collection not found');
  }

  return collection;
}

/**
 * Verifies that every collection ID exists and belongs to the authenticated user.
 * Call before scoped vector search or RAG when `collectionIds` is provided.
 */
export async function verifyUserCollections(
  userId: string,
  collectionIds: string[],
): Promise<void> {
  const uniqueIds = [...new Set(collectionIds)];

  const ownedCount = await CollectionModel.countDocuments({
    _id: { $in: uniqueIds },
    userId,
  });

  if (ownedCount !== uniqueIds.length) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Collection not found');
  }
}

export async function listUserCollections(userId: string): Promise<SafeCollection[]> {
  const collections = await CollectionModel.find({ userId }).sort({ createdAt: -1 });
  return collections.map(toSafeCollection);
}

export async function getCollectionById(
  userId: string,
  collectionId: string,
): Promise<SafeCollection> {
  const collection = await getOwnedCollection(userId, collectionId);
  return toSafeCollection(collection);
}

export async function createCollection(
  userId: string,
  input: CreateCollectionInput,
): Promise<SafeCollection> {
  const collection = await CollectionModel.create({
    userId,
    ...input,
  });

  return toSafeCollection(collection);
}

export async function updateCollection(
  userId: string,
  collectionId: string,
  input: UpdateCollectionInput,
): Promise<SafeCollection> {
  const collection = await CollectionModel.findOneAndUpdate(
    { _id: collectionId, userId },
    input,
    { new: true, runValidators: true },
  );

  if (!collection) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Collection not found');
  }

  return toSafeCollection(collection);
}

export async function deleteCollection(userId: string, collectionId: string): Promise<void> {
  const result = await CollectionModel.deleteOne({ _id: collectionId, userId });

  if (result.deletedCount === 0) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Collection not found');
  }

  await DocumentModel.updateMany({ userId, collectionId }, { $unset: { collectionId: 1 } });
}

function resolveDocumentIds(input: AddDocumentsToCollectionInput): string[] {
  if (input.documentIds) {
    return [...new Set(input.documentIds)];
  }

  return input.documentId ? [input.documentId] : [];
}

export async function addDocumentsToCollection(
  userId: string,
  collectionId: string,
  input: AddDocumentsToCollectionInput,
): Promise<SafeDocument[]> {
  await getOwnedCollection(userId, collectionId);

  const documentIds = resolveDocumentIds(input);
  const documents = await DocumentModel.find({ _id: { $in: documentIds }, userId });

  if (documents.length !== documentIds.length) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'One or more documents not found');
  }

  await DocumentModel.updateMany(
    { _id: { $in: documentIds }, userId },
    { collectionId },
  );

  const updatedDocuments = await DocumentModel.find({ _id: { $in: documentIds }, userId });
  return updatedDocuments.map(toSafeDocument);
}

export async function removeDocumentFromCollection(
  userId: string,
  collectionId: string,
  documentId: string,
): Promise<void> {
  await getOwnedCollection(userId, collectionId);

  const result = await DocumentModel.updateOne(
    { _id: documentId, userId, collectionId },
    { $unset: { collectionId: 1 } },
  );

  if (result.matchedCount === 0) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Document not found in collection');
  }
}

export async function listCollectionDocuments(
  userId: string,
  collectionId: string,
): Promise<SafeDocument[]> {
  await getOwnedCollection(userId, collectionId);

  const documents = await DocumentModel.find({ userId, collectionId }).sort({ createdAt: -1 });
  return documents.map(toSafeDocument);
}
