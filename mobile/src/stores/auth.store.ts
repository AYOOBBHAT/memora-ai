import { create } from 'zustand';

import * as secureStorage from '../lib/secureStorage';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (accessToken: string, refreshToken: string) => Promise<void>;
  clearSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isHydrated: false,

  hydrate: async () => {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        secureStorage.getAccessToken(),
        secureStorage.getRefreshToken(),
      ]);

      set({
        accessToken,
        refreshToken,
        isAuthenticated: Boolean(accessToken && refreshToken),
        isHydrated: true,
      });
    } catch {
      set({
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isHydrated: true,
      });
    }
  },

  setSession: async (accessToken, refreshToken) => {
    await secureStorage.saveTokens(accessToken, refreshToken);
    set({
      accessToken,
      refreshToken,
      isAuthenticated: true,
    });
  },

  clearSession: async () => {
    await secureStorage.clearTokens();
    set({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },
}));
