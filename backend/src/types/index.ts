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
  pageCount?: number;
  uploadedAt?: string;
  fetchedAt?: string;
  extractedTitle?: string;
  youtubeVideoId?: string;
  channel?: string;
  thumbnail?: string;
  originalUrl?: string;
  storageKey?: string;
}

export type PdfExtractionStatus = 'success' | 'failed';

export interface PdfExtractionInfo {
  status: PdfExtractionStatus;
  pageCount?: number;
  fileName: string;
  error?: string;
}

export interface PdfUploadResponse {
  document: SafeDocument;
  extraction: PdfExtractionInfo;
}

export type UrlExtractionStatus = 'success' | 'failed';

export interface UrlExtractionInfo {
  status: UrlExtractionStatus;
  originalUrl: string;
  title?: string;
  error?: string;
}

export interface UrlImportResponse {
  document: SafeDocument;
  extraction: UrlExtractionInfo;
}

export type YouTubeExtractionStatus = 'success' | 'failed';

export interface YouTubeExtractionInfo {
  status: YouTubeExtractionStatus;
  originalUrl: string;
  videoId?: string;
  title?: string;
  channel?: string;
  thumbnail?: string;
  error?: string;
}

export interface YouTubeImportResponse {
  document: SafeDocument;
  extraction: YouTubeExtractionInfo;
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
  lastViewedAt?: Date;
  lastOpenedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecentDocumentItem {
  id: string;
  title: string;
  sourceType: DocumentSourceType;
  collectionId?: string;
  collectionName?: string;
  updatedAt: Date;
  createdAt: Date;
  lastViewedAt?: Date;
}

export interface RecentDocumentsResponse {
  recentlyViewed: RecentDocumentItem[];
  recentlyAdded: RecentDocumentItem[];
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

export interface ChatCollectionScope {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface ChatResponse {
  answer: string;
  sources: ChatCitationSource[];
  conversationId?: string;
  messageId?: string;
  /** Populated when retrieval was scoped to one or more collections. */
  scopedCollections?: ChatCollectionScope[];
}

export interface SafeConversation {
  id: string;
  userId: string;
  title?: string;
  collectionIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeChatMessage {
  id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: ChatCitationSource[];
  timestamp: Date;
}

export interface ConversationListItem {
  id: string;
  title?: string;
  preview: string;
  messageCount: number;
  updatedAt: Date;
}

export interface ConversationDetail {
  conversation: SafeConversation;
  messages: SafeChatMessage[];
}

export type DocumentSearchMatchField = 'title' | 'content';
export type CollectionSearchMatchField = 'name' | 'description';

export interface DocumentSearchResult {
  type: 'document';
  id: string;
  title: string;
  snippet: string;
  sourceType: DocumentSourceType;
  collectionId?: string;
  matchField: DocumentSearchMatchField;
}

export interface CollectionSearchResult {
  type: 'collection';
  id: string;
  name: string;
  snippet: string;
  matchField: CollectionSearchMatchField;
}

export type GlobalSearchResult = DocumentSearchResult | CollectionSearchResult;

export interface GlobalSearchResponse {
  results: GlobalSearchResult[];
  query: string;
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
  UploadPdfInput,
  ImportUrlInput,
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

export type { ChatMessageInput, ConversationIdParams, ConversationSearchQuery } from '@/validators/chat.validator';
export type { GlobalSearchQuery } from '@/validators/search.validator';
