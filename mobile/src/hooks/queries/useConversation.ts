import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import * as chatService from '../../api/services/chat.service';
import { getCachedConversations, getCachedConversationDetail, setCachedConversationDetail } from '../../lib/chatCache';
import { isNetworkError } from '../../lib/network';
import { queryKeys } from '../../lib/queryClient';
import { useAuthStore } from '../../stores/auth.store';

export function useConversation(conversationId: string | null) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.chat.conversation(conversationId ?? ''),
    queryFn: async () => {
      if (!conversationId) {
        throw new Error('Conversation ID is required');
      }

      try {
        const detail = await chatService.getConversation(conversationId);
        await setCachedConversationDetail(detail);
        return detail;
      } catch (error) {
        if (isNetworkError(error)) {
          const cached = await getCachedConversationDetail(conversationId);
          if (cached) {
            return cached;
          }
        }
        throw error;
      }
    },
    enabled: isAuthenticated && Boolean(conversationId),
  });
}

const DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;

function useDebouncedValue(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function useSearchConversations(query: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const debouncedQuery = useDebouncedValue(query.trim(), DEBOUNCE_MS);
  const isEnabled = isAuthenticated && debouncedQuery.length >= MIN_QUERY_LENGTH;

  return useQuery({
    queryKey: queryKeys.chat.search(debouncedQuery),
    queryFn: async () => {
      try {
        return await chatService.searchConversations(debouncedQuery);
      } catch (error) {
        if (isNetworkError(error)) {
          const cached = await getCachedConversations();
          if (cached) {
            const lowerQuery = debouncedQuery.toLowerCase();
            return cached.filter(
              (conversation) =>
                conversation.title?.toLowerCase().includes(lowerQuery) ||
                (conversation.preview ?? '').toLowerCase().includes(lowerQuery),
            );
          }
        }
        throw error;
      }
    },
    enabled: isEnabled,
  });
}

export { MIN_QUERY_LENGTH, DEBOUNCE_MS };
