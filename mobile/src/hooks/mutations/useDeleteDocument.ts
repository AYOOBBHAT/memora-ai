import { useMutation, useQueryClient } from '@tanstack/react-query';

import * as documentsService from '../../api/services/documents.service';
import { queryKeys } from '../../lib/queryClient';

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: documentsService.deleteDocument,
    onSuccess: async (_data, documentId) => {
      queryClient.removeQueries({ queryKey: queryKeys.documents.detail(documentId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
    },
  });
}
