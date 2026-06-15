import { useMutation, useQueryClient } from '@tanstack/react-query';

import * as authService from '../../api/services/auth.service';
import { clearChatCache } from '../../lib/chatCache';
import { queryKeys } from '../../lib/queryClient';
import { useAuthStore } from '../../stores/auth.store';
import { useChatStore } from '../../stores/chat.store';

export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await authService.logout(refreshToken);
      } finally {
        await clearSession();
        useChatStore.getState().startNewChat();
        await clearChatCache();
        queryClient.removeQueries({ queryKey: queryKeys.auth.all });
        queryClient.removeQueries({ queryKey: queryKeys.chat.all });
      }
    },
  });
}
