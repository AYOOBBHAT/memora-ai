import { DocumentModel, IDocumentDocument } from '@/models/Document.model';
import { CollectionModel } from '@/models/Collection.model';
import { HTTP_STATUS } from '@/constants/httpStatus';
import { PdfExtractionInfo, PdfUploadResponse, RecentDocumentItem, RecentDocumentsResponse, SafeDocument, UrlExtractionInfo, UrlImportResponse, YouTubeExtractionInfo, YouTubeImportResponse } from '@/types';
import { ApiError } from '@/utils/ApiError';
import { scheduleDocumentEmbedding } from '@/services/embedding.service';
import { verifyUserCollections } from '@/services/collection.service';
import { extractTextFromPdf, stripPdfExtension } from '@/services/pdf.service';
import {
  extractTextFromUrl,
  hostnameFromUrl,
} from '@/services/url.service';
import {
  CreateDocumentInput,
  ImportUrlInput,
  ImportYoutubeInput,
  UpdateDocumentInput,
  UploadPdfInput,
} from '@/validators/document.validator';
import { extractYouTubeTranscript } from '@/services/youtube.service';

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
    lastViewedAt: doc.lastViewedAt,
    lastOpenedAt: doc.lastOpenedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toRecentDocumentItem(
  doc: IDocumentDocument,
  collectionName?: string,
): RecentDocumentItem {
  return {
    id: doc._id.toString(),
    title: doc.title,
    sourceType: doc.sourceType,
    collectionId: doc.collectionId?.toString(),
    collectionName,
    updatedAt: doc.updatedAt,
    createdAt: doc.createdAt,
    ...(doc.lastViewedAt ? { lastViewedAt: doc.lastViewedAt } : {}),
  };
}

async function enrichWithCollectionNames(
  userId: string,
  documents: IDocumentDocument[],
): Promise<RecentDocumentItem[]> {
  const collectionIds = [
    ...new Set(
      documents
        .map((doc) => doc.collectionId?.toString())
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const collections =
    collectionIds.length > 0
      ? await CollectionModel.find({ _id: { $in: collectionIds }, userId }).select('name')
      : [];

  const nameById = new Map(collections.map((c) => [c._id.toString(), c.name]));

  return documents.map((doc) =>
    toRecentDocumentItem(
      doc,
      doc.collectionId ? nameById.get(doc.collectionId.toString()) : undefined,
    ),
  );
}

const RECENT_DOCUMENTS_LIMIT = 10;

export async function listUserDocuments(userId: string): Promise<SafeDocument[]> {
  const documents = await DocumentModel.find({ userId }).sort({ createdAt: -1 });
  return documents.map(toSafeDocument);
}

export async function getDocumentById(
  userId: string,
  documentId: string,
): Promise<SafeDocument> {
  const now = new Date();
  const document = await DocumentModel.findOneAndUpdate(
    { _id: documentId, userId },
    { $set: { lastViewedAt: now, lastOpenedAt: now } },
    { new: true },
  );

  if (!document) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Document not found');
  }

  return toSafeDocument(document);
}

export async function getRecentDocuments(userId: string): Promise<RecentDocumentsResponse> {
  const [recentlyViewedDocs, recentlyAddedDocs] = await Promise.all([
    DocumentModel.find({ userId, lastViewedAt: { $exists: true, $ne: null } })
      .sort({ lastViewedAt: -1 })
      .limit(RECENT_DOCUMENTS_LIMIT),
    DocumentModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(RECENT_DOCUMENTS_LIMIT),
  ]);

  const [recentlyViewed, recentlyAdded] = await Promise.all([
    enrichWithCollectionNames(userId, recentlyViewedDocs),
    enrichWithCollectionNames(userId, recentlyAddedDocs),
  ]);

  return { recentlyViewed, recentlyAdded };
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

export async function createDocumentFromPdf(
  userId: string,
  file: Express.Multer.File,
  fields: UploadPdfInput,
): Promise<PdfUploadResponse> {
  const fileName = file.originalname || 'document.pdf';
  const title = fields.title?.trim() || stripPdfExtension(fileName);

  const extractionResult = await extractTextFromPdf(file.buffer);

  const extraction: PdfExtractionInfo = {
    status: extractionResult.status,
    pageCount: extractionResult.pageCount,
    fileName,
    ...(extractionResult.error ? { error: extractionResult.error } : {}),
  };

  if (extractionResult.status === 'failed' || !extractionResult.text) {
    throw new ApiError(
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      extractionResult.error ?? 'PDF text extraction failed',
      { extraction },
    );
  }

  if (fields.collectionId) {
    await verifyUserCollections(userId, [fields.collectionId]);
  }

  const document = await DocumentModel.create({
    userId,
    title,
    content: extractionResult.text,
    sourceType: 'pdf',
    metadata: {
      fileName,
      mimeType: file.mimetype,
      fileSize: file.size,
      pageCount: extractionResult.pageCount,
      uploadedAt: new Date().toISOString(),
    },
    ...(fields.collectionId ? { collectionId: fields.collectionId } : {}),
  });

  scheduleDocumentEmbedding(document._id.toString(), userId);

  return {
    document: toSafeDocument(document),
    extraction,
  };
}

export async function createDocumentFromUrl(
  userId: string,
  input: ImportUrlInput,
): Promise<UrlImportResponse> {
  const originalUrl = input.url.trim();
  const extractionResult = await extractTextFromUrl(originalUrl);

  const extraction: UrlExtractionInfo = {
    status: extractionResult.status,
    originalUrl: extractionResult.originalUrl,
    ...(extractionResult.title ? { title: extractionResult.title } : {}),
    ...(extractionResult.error ? { error: extractionResult.error } : {}),
  };

  if (extractionResult.status === 'failed' || !extractionResult.text) {
    throw new ApiError(
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      extractionResult.error ?? 'URL text extraction failed',
      { extraction },
    );
  }

  if (input.collectionId) {
    await verifyUserCollections(userId, [input.collectionId]);
  }

  const title =
    input.title?.trim() ||
    extractionResult.title?.trim() ||
    hostnameFromUrl(originalUrl);

  const document = await DocumentModel.create({
    userId,
    title,
    content: extractionResult.text,
    sourceType: 'url',
    metadata: {
      originalUrl: extractionResult.originalUrl,
      fetchedAt: new Date().toISOString(),
      ...(extractionResult.title ? { extractedTitle: extractionResult.title } : {}),
    },
    ...(input.collectionId ? { collectionId: input.collectionId } : {}),
  });

  scheduleDocumentEmbedding(document._id.toString(), userId);

  return {
    document: toSafeDocument(document),
    extraction,
  };
}

export async function createDocumentFromYoutube(
  userId: string,
  input: ImportYoutubeInput,
): Promise<YouTubeImportResponse> {
  const originalUrl = input.url.trim();
  const extractionResult = await extractYouTubeTranscript(originalUrl);

  const extraction: YouTubeExtractionInfo = {
    status: extractionResult.status,
    originalUrl: extractionResult.metadata?.originalUrl ?? originalUrl,
    ...(extractionResult.metadata?.videoId ? { videoId: extractionResult.metadata.videoId } : {}),
    ...(extractionResult.metadata?.title ? { title: extractionResult.metadata.title } : {}),
    ...(extractionResult.metadata?.channel ? { channel: extractionResult.metadata.channel } : {}),
    ...(extractionResult.metadata?.thumbnail ? { thumbnail: extractionResult.metadata.thumbnail } : {}),
    ...(extractionResult.error ? { error: extractionResult.error } : {}),
  };

  if (extractionResult.status === 'failed' || !extractionResult.text || !extractionResult.metadata) {
    throw new ApiError(
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      extractionResult.error ?? 'YouTube transcript extraction failed',
      { extraction },
    );
  }

  if (input.collectionId) {
    await verifyUserCollections(userId, [input.collectionId]);
  }

  const metadata = extractionResult.metadata;
  const title = input.title?.trim() || metadata.title;

  const document = await DocumentModel.create({
    userId,
    title,
    content: extractionResult.text,
    sourceType: 'youtube',
    metadata: {
      videoId: metadata.videoId,
      youtubeVideoId: metadata.videoId,
      title: metadata.title,
      channel: metadata.channel,
      thumbnail: metadata.thumbnail,
      originalUrl: metadata.originalUrl,
      importedAt: new Date().toISOString(),
    },
    ...(input.collectionId ? { collectionId: input.collectionId } : {}),
  });

  scheduleDocumentEmbedding(document._id.toString(), userId);

  return {
    document: toSafeDocument(document),
    extraction,
  };
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
