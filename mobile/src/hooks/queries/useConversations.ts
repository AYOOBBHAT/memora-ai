import { useQuery } from '@tanstack/react-query';

import * as chatService from '../../api/services/chat.service';
import { getCachedConversations, setCachedConversations } from '../../lib/chatCache';
import { isNetworkError } from '../../lib/network';
import { queryKeys } from '../../lib/queryClient';
import { useAuthStore } from '../../stores/auth.store';

export function useConversations() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.chat.conversations(),
    queryFn: async () => {
      try {
        const conversations = await chatService.getConversations();
        await setCachedConversations(conversations);
        return conversations;
      } catch (error) {
        if (isNetworkError(error)) {
          const cached = await getCachedConversations();
          if (cached) {
            return cached;
          }
        }
        throw error;
      }
    },
    enabled: isAuthenticated,
  });
}
