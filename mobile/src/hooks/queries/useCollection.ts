import { useQuery } from '@tanstack/react-query';

import * as collectionsService from '../../api/services/collections.service';
import { queryKeys } from '../../lib/queryClient';
import { useAuthStore } from '../../stores/auth.store';

export function useCollection(id: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.collections.detail(id),
    queryFn: () => collectionsService.getCollection(id),
    enabled: isAuthenticated && Boolean(id),
  });
}
