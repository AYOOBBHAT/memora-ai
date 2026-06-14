import { useMutation, useQueryClient } from '@tanstack/react-query';

import * as documentsService from '../../api/services/documents.service';
import { queryKeys } from '../../lib/queryClient';

export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: documentsService.createDocument,
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      if (variables.collectionId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.collections.documents(variables.collectionId),
        });
      }
    },
  });
}
