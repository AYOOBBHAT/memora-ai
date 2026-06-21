import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

import { env } from '../config/env';

let isConfigured = false;

export function isGoogleSignInConfigured(): boolean {
  return Boolean(env.googleWebClientId);
}

export function configureGoogleSignIn(): void {
  if (isConfigured || !env.googleWebClientId) {
    return;
  }

  GoogleSignin.configure({
    webClientId: env.googleWebClientId,
    offlineAccess: false,
  });

  isConfigured = true;

  if (__DEV__) {
    console.log('[GoogleSignIn] Native SDK configured', {
      webClientId: env.googleWebClientId,
    });
  }
}

export class GoogleSignInCancelledError extends Error {
  constructor() {
    super('Google sign-in was cancelled');
    this.name = 'GoogleSignInCancelledError';
  }
}

export async function requestGoogleIdToken(): Promise<string> {
  configureGoogleSignIn();

  if (!isGoogleSignInConfigured()) {
    throw new Error('Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.');
  }

  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  const response = await GoogleSignin.signIn();

  if (isCancelledResponse(response)) {
    throw new GoogleSignInCancelledError();
  }

  const idToken = response.data.idToken;
  if (!idToken) {
    throw new Error('Google did not return a sign-in token. Please try again.');
  }

  return idToken;
}

export function getGoogleSignInErrorMessage(error: unknown): string | null {
  if (error instanceof GoogleSignInCancelledError) {
    return null;
  }

  if (isErrorWithCode(error)) {
    switch (error.code) {
      case statusCodes.IN_PROGRESS:
        return 'Google sign-in is already in progress. Please wait.';
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        return 'Google Play Services is unavailable. Update Play Services and try again.';
      case statusCodes.NULL_PRESENTER:
        return 'Could not open Google sign-in. Please try again.';
      default:
        return 'Google sign-in failed. Please try again.';
    }
  }

  if (error instanceof Error) {
    const message = error.message.trim();
    if (!message) {
      return 'Google sign-in failed. Please try again.';
    }

    if (/network/i.test(message)) {
      return 'Network error. Check your connection and try again.';
    }

    return message;
  }

  return 'Google sign-in failed. Please try again.';
}
