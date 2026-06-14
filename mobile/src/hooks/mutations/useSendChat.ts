import { useMutation } from '@tanstack/react-query';

import * as chatService from '../../api/services/chat.service';

export function useSendChat() {
  return useMutation({
    mutationFn: ({
      message,
      collectionIds,
    }: {
      message: string;
      collectionIds?: string[];
    }) => chatService.sendChatMessage(message, collectionIds),
  });
}
