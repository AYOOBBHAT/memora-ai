import { apiClient } from '../client';
import type { ApiResponse, ChatResponse } from '../types';

export interface SendChatMessageInput {
  message: string;
  collectionIds?: string[];
}

export async function sendChatMessage(
  message: string,
  collectionIds?: string[],
): Promise<ChatResponse> {
  const body: SendChatMessageInput = { message };
  if (collectionIds?.length) {
    body.collectionIds = collectionIds;
  }

  const { data } = await apiClient.post<ApiResponse<ChatResponse>>('/chat', body);
  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to get answer');
  }
  return data.data;
}
