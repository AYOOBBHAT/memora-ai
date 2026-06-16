import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import type { AuthSessionResult } from 'expo-auth-session';
import { Platform } from 'react-native';

import { env } from '../config/env';
import { googleClientIdToNativeRedirectUri } from './googleOAuthRedirect';

WebBrowser.maybeCompleteAuthSession();

export function isGoogleSignInConfigured(): boolean {
  return Boolean(env.googleWebClientId);
}

/**
 * Android OAuth clients reject package-name redirects unless "Custom URI scheme" is enabled.
 * Use Google's reversed client ID redirect for standalone/EAS builds instead of
 * Application.applicationId:/oauthredirect (expo-auth-session default).
 */
export function resolveGoogleOAuthRedirectUri(): string | undefined {
  if (Platform.OS === 'android' && env.googleAndroidClientId) {
    return (
      googleClientIdToNativeRedirectUri(env.googleAndroidClientId) ?? undefined
    );
  }

  // iOS standalone falls back to Web client ID when iosClientId is unset.
  if (Platform.OS === 'ios' && env.googleWebClientId) {
    return googleClientIdToNativeRedirectUri(env.googleWebClientId) ?? undefined;
  }

  return undefined;
}

export function logGoogleSignInConfig(
  request: { clientId: string; redirectUri: string; url: string | null } | null,
): void {
  if (!__DEV__ || !request) {
    return;
  }

  console.log('[GoogleSignIn] OAuth configuration', {
    clientId: request.clientId,
    androidClientId: env.googleAndroidClientId || null,
    webClientId: env.googleWebClientId || null,
    redirectUri: request.redirectUri,
    authorizationUrl: request.url,
  });
}

export function useGoogleIdTokenRequest() {
  const redirectUri = resolveGoogleOAuthRedirectUri();

  return Google.useIdTokenAuthRequest({
    clientId: env.googleWebClientId || undefined,
    androidClientId: env.googleAndroidClientId || undefined,
    ...(redirectUri ? { redirectUri } : {}),
  });
}

export function extractGoogleIdToken(response: AuthSessionResult | null): string | null {
  if (response?.type !== 'success') {
    return null;
  }

  return response.params.id_token ?? null;
}
