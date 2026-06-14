import { useMutation, useQueryClient } from '@tanstack/react-query';

import * as authService from '../../api/services/auth.service';
import { queryKeys } from '../../lib/queryClient';
import { useAuthStore } from '../../stores/auth.store';

export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await authService.logout(refreshToken);
      } finally {
        await clearSession();
        queryClient.removeQueries({ queryKey: queryKeys.auth.all });
      }
    },
  });
}
