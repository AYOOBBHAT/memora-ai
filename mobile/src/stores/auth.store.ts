import { create } from 'zustand';

import * as secureStorage from '../lib/secureStorage';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isSessionOffline: boolean;
  hydrate: () => Promise<void>;
  setSession: (accessToken: string, refreshToken: string) => Promise<void>;
  setSessionOffline: (offline: boolean) => void;
  clearSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isHydrated: false,
  isSessionOffline: false,

  hydrate: async () => {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        secureStorage.getAccessToken(),
        secureStorage.getRefreshToken(),
      ]);

      set({
        accessToken,
        refreshToken,
        isAuthenticated: Boolean(refreshToken),
        isHydrated: true,
        isSessionOffline: false,
      });
    } catch {
      set({
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isHydrated: true,
        isSessionOffline: false,
      });
    }
  },

  setSession: async (accessToken, refreshToken) => {
    try {
      await secureStorage.saveTokens(accessToken, refreshToken);
    } catch {
      throw new Error('Could not save your sign-in session. Please try again.');
    }

    set({
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isSessionOffline: false,
    });
  },

  setSessionOffline: (offline) => {
    set({ isSessionOffline: offline });
  },

  clearSession: async () => {
    try {
      await secureStorage.clearTokens();
    } catch {
      // Still clear in-memory session if secure storage fails.
    }

    set({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isSessionOffline: false,
    });
  },
}));
