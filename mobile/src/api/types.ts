export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface MobileAuthData extends AuthTokens {
  user: SafeUser;
}

export type DocumentSourceType = 'text' | 'url' | 'pdf' | 'youtube' | 'upload';

export type DocumentEmbeddingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type PdfExtractionStatus = 'success' | 'failed';

export interface PdfExtractionInfo {
  status: PdfExtractionStatus;
  pageCount?: number;
  fileName: string;
  error?: string;
}

export interface UploadPdfResult {
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

export interface ImportUrlResult {
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

export interface ImportYoutubeResult {
  document: SafeDocument;
  extraction: YouTubeExtractionInfo;
}

export interface SafeDocument {
  id: string;
  userId: string;
  title: string;
  content: string | Record<string, unknown>;
  sourceType: DocumentSourceType;
  metadata?: Record<string, unknown>;
  collectionId?: string;
  embeddingStatus: DocumentEmbeddingStatus;
  embeddingError?: string;
  embeddingUpdatedAt?: string;
  lastViewedAt?: string;
  lastOpenedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecentDocumentItem {
  id: string;
  title: string;
  sourceType: DocumentSourceType;
  collectionId?: string;
  collectionName?: string;
  updatedAt: string;
  createdAt: string;
  lastViewedAt?: string;
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
  createdAt: string;
  updatedAt: string;
}

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
  scopedCollections?: ChatCollectionScope[];
}

export interface ConversationListItem {
  id: string;
  title?: string;
  preview: string;
  messageCount: number;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title?: string;
  collectionIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatHistoryMessage {
  id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: ChatCitationSource[];
  timestamp: string;
}

export interface ConversationDetail {
  conversation: Conversation;
  messages: ChatHistoryMessage[];
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
