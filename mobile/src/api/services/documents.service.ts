import { apiClient } from '../client';
import type { ApiResponse, DocumentSourceType, ImportUrlResult, SafeDocument, UploadPdfResult } from '../types';
import { assignDocumentToCollection } from './collections.service';

export interface CreateDocumentInput {
  title: string;
  content: string;
  sourceType: DocumentSourceType;
  metadata?: Record<string, unknown>;
  collectionId?: string;
}

export interface UpdateDocumentInput {
  title?: string;
  content?: string;
  sourceType?: DocumentSourceType;
  metadata?: Record<string, unknown>;
  retryEmbedding?: boolean;
}

function unwrapData<T>(response: ApiResponse<T>, fallback: string): T {
  if (!response.success || response.data === undefined) {
    throw new Error(response.message || fallback);
  }
  return response.data;
}

export async function getDocuments(): Promise<SafeDocument[]> {
  const { data } = await apiClient.get<ApiResponse<{ documents: SafeDocument[] }>>('/documents');
  const payload = unwrapData(data, 'Failed to load documents');
  return payload.documents;
}

export async function getDocument(id: string): Promise<SafeDocument> {
  const { data } = await apiClient.get<ApiResponse<{ document: SafeDocument }>>(`/documents/${id}`);
  const payload = unwrapData(data, 'Failed to load document');
  return payload.document;
}

export async function createDocument(input: CreateDocumentInput): Promise<SafeDocument> {
  const { collectionId, ...body } = input;
  const { data } = await apiClient.post<ApiResponse<{ document: SafeDocument }>>('/documents', body);
  const payload = unwrapData(data, 'Failed to create document');
  const document = payload.document;

  if (collectionId) {
    await assignDocumentToCollection(collectionId, document.id);
  }

  return document;
}

export async function updateDocument(id: string, input: UpdateDocumentInput): Promise<SafeDocument> {
  const { data } = await apiClient.put<ApiResponse<{ document: SafeDocument }>>(`/documents/${id}`, input);
  const payload = unwrapData(data, 'Failed to update document');
  return payload.document;
}

export async function deleteDocument(id: string): Promise<void> {
  const { data } = await apiClient.delete<ApiResponse>(`/documents/${id}`);
  if (!data.success) {
    throw new Error(data.message || 'Failed to delete document');
  }
}

export async function retryDocumentEmbedding(id: string): Promise<SafeDocument> {
  const { data } = await apiClient.post<ApiResponse<{ document: SafeDocument }>>(
    `/documents/${id}/retry-embedding`,
  );
  const payload = unwrapData(data, 'Failed to retry embedding');
  return payload.document;
}

export interface UploadPdfInput {
  file: {
    uri: string;
    name: string;
    type: string;
  };
  title?: string;
  collectionId?: string;
  onUploadProgress?: (progress: number) => void;
}

export async function uploadPdf(input: UploadPdfInput): Promise<UploadPdfResult> {
  const formData = new FormData();

  formData.append('file', {
    uri: input.file.uri,
    name: input.file.name,
    type: input.file.type || 'application/pdf',
  } as unknown as Blob);

  if (input.title?.trim()) {
    formData.append('title', input.title.trim());
  }

  if (input.collectionId) {
    formData.append('collectionId', input.collectionId);
  }

  const { data } = await apiClient.post<ApiResponse<UploadPdfResult>>(
    '/documents/upload-pdf',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (event) => {
        if (event.total && input.onUploadProgress) {
          input.onUploadProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    },
  );

  return unwrapData(data, 'Failed to upload PDF');
}

export interface ImportUrlInput {
  url: string;
  title?: string;
  collectionId?: string;
}

const HTTP_HTTPS_URL_PATTERN = /^https?:\/\/.+/i;

export function isValidHttpUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!HTTP_HTTPS_URL_PATTERN.test(trimmed)) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function importUrl(input: ImportUrlInput): Promise<ImportUrlResult> {
  const { data } = await apiClient.post<ApiResponse<ImportUrlResult>>('/documents/import-url', {
    url: input.url.trim(),
    ...(input.title?.trim() ? { title: input.title.trim() } : {}),
    ...(input.collectionId ? { collectionId: input.collectionId } : {}),
  });

  return unwrapData(data, 'Failed to import URL');
}
