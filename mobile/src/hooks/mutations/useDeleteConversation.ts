import { useMutation, useQueryClient } from '@tanstack/react-query';

import * as chatService from '../../api/services/chat.service';
import { removeCachedConversationDetail } from '../../lib/chatCache';
import { queryKeys } from '../../lib/queryClient';

export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => chatService.deleteConversation(conversationId),
    onSuccess: async (_data, conversationId) => {
      await removeCachedConversationDetail(conversationId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations() });
      queryClient.removeQueries({ queryKey: queryKeys.chat.conversation(conversationId) });
    },
  });
}
