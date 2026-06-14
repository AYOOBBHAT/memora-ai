import { useMutation, useQueryClient } from '@tanstack/react-query';

import * as authService from '../../api/services/auth.service';
import { queryKeys } from '../../lib/queryClient';
import { useAuthStore } from '../../stores/auth.store';

export function useRegister() {
  const setSession = useAuthStore((state) => state.setSession);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.register,
    onSuccess: async (data) => {
      await setSession(data.accessToken, data.refreshToken);
      queryClient.setQueryData(queryKeys.auth.me(), data.user);
    },
  });
}
