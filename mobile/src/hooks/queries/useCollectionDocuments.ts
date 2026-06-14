import { useQuery } from '@tanstack/react-query';

import * as collectionsService from '../../api/services/collections.service';
import { queryKeys } from '../../lib/queryClient';
import { useAuthStore } from '../../stores/auth.store';

export function useCollectionDocuments(collectionId: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.collections.documents(collectionId),
    queryFn: () => collectionsService.getCollectionDocuments(collectionId),
    enabled: isAuthenticated && Boolean(collectionId),
  });
}
