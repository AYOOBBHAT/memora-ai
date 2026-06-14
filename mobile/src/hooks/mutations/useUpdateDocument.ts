import { useMutation, useQueryClient } from '@tanstack/react-query';

import * as documentsService from '../../api/services/documents.service';
import { queryKeys } from '../../lib/queryClient';

export function useUpdateDocument(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: documentsService.UpdateDocumentInput) =>
      documentsService.updateDocument(documentId, input),
    onSuccess: async (document) => {
      queryClient.setQueryData(queryKeys.documents.detail(documentId), document);
      await queryClient.invalidateQueries({ queryKey: queryKeys.documents.list() });
      if (document.collectionId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.collections.documents(document.collectionId),
        });
      }
    },
  });
}
