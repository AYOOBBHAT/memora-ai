import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ConversationDetail, ConversationListItem } from '../api/types';

const CONVERSATIONS_LIST_KEY = 'memora-chat-conversations';
const conversationDetailKey = (conversationId: string) =>
  `memora-chat-conversation:${conversationId}`;

export async function getCachedConversations(): Promise<ConversationListItem[] | null> {
  const raw = await AsyncStorage.getItem(CONVERSATIONS_LIST_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ConversationListItem[];
  } catch {
    return null;
  }
}

export async function setCachedConversations(conversations: ConversationListItem[]): Promise<void> {
  await AsyncStorage.setItem(CONVERSATIONS_LIST_KEY, JSON.stringify(conversations));
}

export async function getCachedConversationDetail(
  conversationId: string,
): Promise<ConversationDetail | null> {
  const raw = await AsyncStorage.getItem(conversationDetailKey(conversationId));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ConversationDetail;
  } catch {
    return null;
  }
}

export async function setCachedConversationDetail(detail: ConversationDetail): Promise<void> {
  await AsyncStorage.setItem(
    conversationDetailKey(detail.conversation.id),
    JSON.stringify(detail),
  );
}

export async function removeCachedConversationDetail(conversationId: string): Promise<void> {
  await AsyncStorage.removeItem(conversationDetailKey(conversationId));
}

export async function clearChatCache(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const chatKeys = keys.filter(
    (key) => key === CONVERSATIONS_LIST_KEY || key.startsWith('memora-chat-conversation:'),
  );
  if (chatKeys.length > 0) {
    await AsyncStorage.multiRemove(chatKeys);
  }
}
