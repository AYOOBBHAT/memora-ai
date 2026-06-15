import { useMutation, useQueryClient } from '@tanstack/react-query';

import * as documentsService from '../../api/services/documents.service';
import { queryKeys } from '../../lib/queryClient';

export function useUploadPdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: documentsService.uploadPdf,
    onSuccess: async (result, variables) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      if (variables.collectionId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.collections.documents(variables.collectionId),
        });
      }
      if (result.document.collectionId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.collections.documents(result.document.collectionId),
        });
      }
    },
  });
}
