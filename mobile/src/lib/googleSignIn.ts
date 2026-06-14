import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import type { AuthSessionResult } from 'expo-auth-session';

import { env } from '../config/env';

WebBrowser.maybeCompleteAuthSession();

export function isGoogleSignInConfigured(): boolean {
  return Boolean(env.googleWebClientId);
}

export function useGoogleIdTokenRequest() {
  return Google.useIdTokenAuthRequest({
    clientId: env.googleWebClientId || undefined,
  });
}

export function extractGoogleIdToken(response: AuthSessionResult | null): string | null {
  if (response?.type !== 'success') {
    return null;
  }

  return response.params.id_token ?? null;
}
