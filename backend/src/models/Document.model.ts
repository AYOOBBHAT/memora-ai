import mongoose, { Document as MongooseDocument, Model, Schema, Types } from 'mongoose';
import type { DocumentEmbeddingStatus, DocumentSourceType, IDocumentMetadata } from '@/types';

export interface IDocument {
  userId: Types.ObjectId;
  title: string;
  content: string | Record<string, unknown>;
  sourceType: DocumentSourceType;
  metadata?: IDocumentMetadata;
  collectionId?: Types.ObjectId;
  /** 768-dimensional vector from gemini-embedding-001; excluded from SafeDocument API responses. */
  embedding?: number[];
  embeddingStatus: DocumentEmbeddingStatus;
  embeddingError?: string;
  embeddingUpdatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDocumentDocument extends IDocument, MongooseDocument {}

export interface IDocumentModel extends Model<IDocumentDocument> {}

const documentSchema = new Schema<IDocumentDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [500, 'Title cannot exceed 500 characters'],
    },
    content: {
      type: Schema.Types.Mixed,
      required: [true, 'Content is required'],
    },
    sourceType: {
      type: String,
      enum: ['text', 'url', 'pdf', 'youtube', 'upload'] satisfies DocumentSourceType[],
      required: [true, 'Source type is required'],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    collectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Collection',
    },
    embedding: {
      type: [Number],
      default: undefined,
    },
    embeddingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'] satisfies DocumentEmbeddingStatus[],
      default: 'pending',
    },
    embeddingError: {
      type: String,
      default: undefined,
    },
    embeddingUpdatedAt: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
  },
);

// List a user's documents newest-first.
documentSchema.index({ userId: 1, createdAt: -1 });

// Filter documents by embedding readiness within a user scope (e.g. completed + sorted).
// When Atlas Vector Search is added, every $vectorSearch query MUST include a userId
// pre-filter so tenants cannot read each other's embeddings.
documentSchema.index({ userId: 1, embeddingStatus: 1, createdAt: -1 });

export const DocumentModel = mongoose.model<IDocumentDocument, IDocumentModel>(
  'Document',
  documentSchema,
);
