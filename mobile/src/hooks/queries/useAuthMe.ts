import { useQuery } from '@tanstack/react-query';

import * as authService from '../../api/services/auth.service';
import { queryKeys } from '../../lib/queryClient';
import { useAuthStore } from '../../stores/auth.store';

export function useAuthMe(enabled = true) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: authService.getMe,
    enabled: enabled && isAuthenticated,
    retry: false,
  });
}
