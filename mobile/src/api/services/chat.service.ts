import { apiClient } from '../client';
import type {
  ApiResponse,
  ChatResponse,
  ConversationDetail,
  ConversationListItem,
} from '../types';

export interface SendChatMessageInput {
  message: string;
  collectionIds?: string[];
  conversationId?: string;
}

export async function sendChatMessage(input: SendChatMessageInput): Promise<ChatResponse> {
  const body: SendChatMessageInput = { message: input.message };
  if (input.collectionIds?.length) {
    body.collectionIds = input.collectionIds;
  }
  if (input.conversationId) {
    body.conversationId = input.conversationId;
  }

  const { data } = await apiClient.post<ApiResponse<ChatResponse>>('/chat', body);
  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to get answer');
  }
  return data.data;
}

export async function getConversations(): Promise<ConversationListItem[]> {
  const { data } = await apiClient.get<ApiResponse<{ conversations: ConversationListItem[] }>>(
    '/chat/conversations',
  );
  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to load conversations');
  }
  return data.data.conversations;
}

export async function getConversation(conversationId: string): Promise<ConversationDetail> {
  const { data } = await apiClient.get<ApiResponse<ConversationDetail>>(
    `/chat/conversations/${conversationId}`,
  );
  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to load conversation');
  }
  return data.data;
}

export async function searchConversations(query: string): Promise<ConversationListItem[]> {
  const { data } = await apiClient.get<
    ApiResponse<{ conversations: ConversationListItem[]; query: string }>
  >('/chat/conversations/search', { params: { q: query } });
  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to search conversations');
  }
  return data.data.conversations;
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const { data } = await apiClient.delete<ApiResponse>(`/chat/conversations/${conversationId}`);
  if (!data.success) {
    throw new Error(data.message || 'Failed to delete conversation');
  }
}
