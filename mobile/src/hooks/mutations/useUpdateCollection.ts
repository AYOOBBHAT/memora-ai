import { useMutation, useQueryClient } from '@tanstack/react-query';

import * as collectionsService from '../../api/services/collections.service';
import { queryKeys } from '../../lib/queryClient';

export function useUpdateCollection(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: collectionsService.UpdateCollectionInput) =>
      collectionsService.updateCollection(id, input),
    onSuccess: async (collection) => {
      queryClient.setQueryData(queryKeys.collections.detail(id), collection);
      await queryClient.invalidateQueries({ queryKey: queryKeys.collections.list() });
    },
  });
}
