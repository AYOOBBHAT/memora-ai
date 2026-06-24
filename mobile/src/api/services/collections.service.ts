import { apiClient } from '../client';
import type { ApiResponse, SafeCollection, SafeDocument } from '../types';

export interface CreateCollectionInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export type UpdateCollectionInput = Partial<CreateCollectionInput>;

function unwrapData<T>(response: ApiResponse<T>, fallback: string): T {
  if (!response.success || response.data === undefined) {
    throw new Error(response.message || fallback);
  }
  return response.data;
}

export async function getCollections(): Promise<SafeCollection[]> {
  const { data } = await apiClient.get<ApiResponse<{ collections: SafeCollection[] }>>('/collections');
  const payload = unwrapData(data, 'Failed to load collections');
  return payload.collections ?? [];
}

export async function getCollection(id: string): Promise<SafeCollection> {
  const { data } = await apiClient.get<ApiResponse<{ collection: SafeCollection }>>(`/collections/${id}`);
  const payload = unwrapData(data, 'Failed to load collection');
  return payload.collection;
}

export async function createCollection(input: CreateCollectionInput): Promise<SafeCollection> {
  const { data } = await apiClient.post<ApiResponse<{ collection: SafeCollection }>>('/collections', input);
  const payload = unwrapData(data, 'Failed to create collection');
  return payload.collection;
}

export async function updateCollection(id: string, input: UpdateCollectionInput): Promise<SafeCollection> {
  const { data } = await apiClient.put<ApiResponse<{ collection: SafeCollection }>>(`/collections/${id}`, input);
  const payload = unwrapData(data, 'Failed to update collection');
  return payload.collection;
}

export async function deleteCollection(id: string): Promise<void> {
  const { data } = await apiClient.delete<ApiResponse>(`/collections/${id}`);
  if (!data.success) {
    throw new Error(data.message || 'Failed to delete collection');
  }
}

export async function getCollectionDocuments(id: string): Promise<SafeDocument[]> {
  const { data } = await apiClient.get<ApiResponse<{ documents: SafeDocument[] }>>(
    `/collections/${id}/documents`,
  );
  const payload = unwrapData(data, 'Failed to load collection documents');
  return payload.documents ?? [];
}

export async function assignDocumentToCollection(
  collectionId: string,
  documentId: string,
): Promise<void> {
  const { data } = await apiClient.post<ApiResponse>(
    `/collections/${collectionId}/documents`,
    { documentId },
  );
  if (!data.success) {
    throw new Error(data.message || 'Failed to assign document to collection');
  }
}
