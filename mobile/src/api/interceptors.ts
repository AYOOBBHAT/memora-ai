import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { env } from '../config/env';
import { apiClient } from './client';
import { ApiResponse, MobileAuthData } from './types';
import {
  API_VERSION_PATH,
  CLIENT_PLATFORM_HEADER,
  CLIENT_PLATFORM_VALUE,
} from '../lib/constants';
import { useAuthStore } from '../stores/auth.store';
import * as secureStorage from '../lib/secureStorage';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const refreshClient = axios.create({
  baseURL: `${env.apiUrl}${API_VERSION_PATH}`,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    [CLIENT_PLATFORM_HEADER]: CLIENT_PLATFORM_VALUE,
  },
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken =
        useAuthStore.getState().refreshToken ??
        (await secureStorage.getRefreshToken());

      if (!refreshToken) {
        await useAuthStore.getState().clearSession();
        return null;
      }

      try {
        const { data } = await refreshClient.post<ApiResponse<MobileAuthData>>(
          '/auth/refresh',
          { refreshToken },
        );

        if (!data.success || !data.data) {
          await useAuthStore.getState().clearSession();
          return null;
        }

        const { accessToken, refreshToken: newRefreshToken } = data.data;
        await useAuthStore.getState().setSession(accessToken, newRefreshToken);
        return accessToken;
      } catch {
        await useAuthStore.getState().clearSession();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

// TEMP DEBUG — remove after signup network issue is resolved
function logAxiosError(error: AxiosError): void {
  console.log('[API_DEBUG] axios error:', {
    message: error.message,
    code: error.code,
    status: error.response?.status,
    data: error.response?.data,
    url: error.config?.url,
    baseURL: error.config?.baseURL,
  });
}

export function setupInterceptors(): void {
  apiClient.interceptors.request.use((config) => {
    // TEMP DEBUG — remove after signup network issue is resolved
    console.log(
      '[API_DEBUG] request:',
      (config.method ?? 'GET').toUpperCase(),
      '| baseURL:',
      config.baseURL,
      '| url:',
      config.url,
      '| full:',
      axios.getUri(config),
    );

    config.headers[CLIENT_PLATFORM_HEADER] = CLIENT_PLATFORM_VALUE;

    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  });

  apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      // TEMP DEBUG — remove after signup network issue is resolved
      logAxiosError(error);

      const originalRequest = error.config as RetryableRequestConfig | undefined;

      if (
        error.response?.status !== 401 ||
        !originalRequest ||
        originalRequest._retry ||
        originalRequest.url?.includes('/auth/refresh')
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      const newAccessToken = await refreshAccessToken();
      if (!newAccessToken) {
        return Promise.reject(error);
      }

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    },
  );
}
