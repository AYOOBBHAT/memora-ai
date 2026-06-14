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
  createdAt: string;
  updatedAt: string;
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

export interface ChatResponse {
  answer: string;
  sources: ChatCitationSource[];
}
