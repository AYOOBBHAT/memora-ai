import * as SecureStore from 'expo-secure-store';

import { SECURE_STORAGE_KEYS } from './constants';

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SECURE_STORAGE_KEYS.accessToken);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SECURE_STORAGE_KEYS.refreshToken);
}

export async function saveTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(SECURE_STORAGE_KEYS.accessToken, accessToken),
    SecureStore.setItemAsync(SECURE_STORAGE_KEYS.refreshToken, refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(SECURE_STORAGE_KEYS.accessToken),
    SecureStore.deleteItemAsync(SECURE_STORAGE_KEYS.refreshToken),
  ]);
}
