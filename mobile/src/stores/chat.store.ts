import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ChatCitationSource } from '../api/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatCitationSource[];
  createdAt: string;
  error?: boolean;
}

interface ChatState {
  conversationId: string | null;
  conversationTitle: string | null;
  collectionIds: string[];
  messages: ChatMessage[];
  setActiveConversation: (params: {
    conversationId: string | null;
    title?: string | null;
    collectionIds?: string[];
    messages: ChatMessage[];
  }) => void;
  setConversationMeta: (params: {
    conversationId: string;
    title?: string | null;
  }) => void;
  addMessage: (message: ChatMessage) => void;
  startNewChat: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      conversationId: null,
      conversationTitle: null,
      collectionIds: [],
      messages: [],
      setActiveConversation: ({ conversationId, title, collectionIds, messages }) =>
        set({
          conversationId,
          conversationTitle: title ?? null,
          collectionIds: collectionIds ?? [],
          messages,
        }),
      setConversationMeta: ({ conversationId, title }) =>
        set((state) => ({
          conversationId,
          conversationTitle: title ?? state.conversationTitle,
        })),
      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),
      startNewChat: () =>
        set({
          conversationId: null,
          conversationTitle: null,
          collectionIds: [],
          messages: [],
        }),
    }),
    {
      name: 'memora-chat-active',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function createChatMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function historyMessageToChatMessage(message: {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: ChatCitationSource[];
  timestamp: string;
}): ChatMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    sources: message.citations,
    createdAt: message.timestamp,
  };
}
