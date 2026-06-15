import { useMutation, useQueryClient } from '@tanstack/react-query';

import * as chatService from '../../api/services/chat.service';
import type { SendChatMessageInput } from '../../api/services/chat.service';
import { setCachedConversationDetail, setCachedConversations } from '../../lib/chatCache';
import { queryKeys } from '../../lib/queryClient';

export function useSendChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendChatMessageInput) => chatService.sendChatMessage(input),
    onSuccess: async (response, variables) => {
      if (response.conversationId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations() });
        if (variables.conversationId) {
          await queryClient.invalidateQueries({
            queryKey: queryKeys.chat.conversation(variables.conversationId),
          });
        } else {
          queryClient.removeQueries({
            queryKey: queryKeys.chat.conversation(response.conversationId),
          });
        }

        try {
          const conversations = await chatService.getConversations();
          await setCachedConversations(conversations);
        } catch {
          // Cache refresh is best-effort after send.
        }

        if (response.conversationId) {
          try {
            const detail = await chatService.getConversation(response.conversationId);
            await setCachedConversationDetail(detail);
            queryClient.setQueryData(
              queryKeys.chat.conversation(response.conversationId),
              detail,
            );
          } catch {
            // Detail refresh is best-effort after send.
          }
        }
      }
    },
  });
}
