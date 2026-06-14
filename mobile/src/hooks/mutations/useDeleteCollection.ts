import { useMutation, useQueryClient } from '@tanstack/react-query';

import * as collectionsService from '../../api/services/collections.service';
import { queryKeys } from '../../lib/queryClient';

export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: collectionsService.deleteCollection,
    onSuccess: async (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.collections.detail(id) });
      queryClient.removeQueries({ queryKey: queryKeys.collections.documents(id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
    },
  });
}
