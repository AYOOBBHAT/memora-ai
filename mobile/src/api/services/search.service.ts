import { apiClient } from '../client';
import type { ApiResponse, GlobalSearchResponse } from '../types';

function unwrapData<T>(response: ApiResponse<T>, fallback: string): T {
  if (!response.success || response.data === undefined) {
    throw new Error(response.message || fallback);
  }
  return response.data;
}

export async function globalSearch(query: string, limit = 20): Promise<GlobalSearchResponse> {
  const { data } = await apiClient.get<ApiResponse<GlobalSearchResponse>>('/search', {
    params: { q: query, limit },
  });
  return unwrapData(data, 'Search failed');
}
