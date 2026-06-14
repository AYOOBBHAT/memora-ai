import { useMutation, useQueryClient } from '@tanstack/react-query';

import * as collectionsService from '../../api/services/collections.service';
import { queryKeys } from '../../lib/queryClient';

export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: collectionsService.createCollection,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
    },
  });
}
