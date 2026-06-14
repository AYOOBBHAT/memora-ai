import { Request } from 'express';

export type AuthProvider = 'local' | 'google' | 'github';
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
export type UserRole = 'user' | 'admin';
export type DocumentSourceType = 'text' | 'url' | 'pdf' | 'youtube' | 'upload';
/**
 * Async embedding pipeline state for a document.
 *
 * Lifecycle: `pending` → `processing` → `completed` | `failed`
 * - `pending` — queued or awaiting (re-)generation after content change
 * - `processing` — Gemini API call in progress
 * - `completed` — 768-d vector stored on the document
 * - `failed` — error persisted in `embeddingError`
 */
export type DocumentEmbeddingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface IDocumentMetadata {
  url?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  youtubeVideoId?: string;
  originalUrl?: string;
  storageKey?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Auth payload returned to mobile clients (tokens in body, no cookies). */
export interface MobileAuthData {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: AuthProvider;
  subscription: SubscriptionTier;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

export type { IUser, IUserDocument, IUserModel } from '@/models/User.model';

export interface SafeDocument {
  id: string;
  userId: string;
  title: string;
  content: string | Record<string, unknown>;
  sourceType: DocumentSourceType;
  metadata?: IDocumentMetadata;
  collectionId?: string;
  embeddingStatus: DocumentEmbeddingStatus;
  embeddingError?: string;
  embeddingUpdatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Semantic search hit with Atlas vector similarity score. */
export interface ScoredSearchResult {
  document: SafeDocument;
  score: number;
}

/** Source citation returned with RAG chat answers (no embeddings). */
export interface ChatCitationSource {
  documentId: string;
  title: string;
  sourceType: DocumentSourceType;
  score: number;
}

export interface ChatResponse {
  answer: string;
  sources: ChatCitationSource[];
}

export interface ChatHealthResult {
  model: string;
  status: 'ok' | 'failed';
  response?: string;
  error?: string;
}

export type {
  CreateDocumentInput,
  UpdateDocumentInput,
  DocumentIdParams,
  SearchDocumentsInput,
} from '@/validators/document.validator';

export type {
  CreateCollectionInput,
  UpdateCollectionInput,
  CollectionIdParams,
  CollectionDocumentParams,
  AddDocumentsToCollectionInput,
} from '@/validators/collection.validator';

export type { ChatMessageInput } from '@/validators/chat.validator';
