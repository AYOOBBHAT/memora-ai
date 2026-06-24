import { AxiosError } from 'axios';

import type { ApiResponse } from '../api/types';

const TECHNICAL_MESSAGE_PATTERN =
  /axios|network error|request failed|internal server|econnrefused|enotfound|certificate|ssl|undefined|null|syntaxerror|typeerror|unhandled/i;

const SAFE_AUTH_MESSAGES = new Set([
  'Invalid email or password',
  'Email already registered',
  'User registered successfully',
  'Login successful',
  'Invalid or expired Google ID token',
  'Google account email is required',
]);

export function isAuthHttpError(error: unknown): boolean {
  if (!(error instanceof AxiosError) || !error.response) {
    return false;
  }

  const status = error.response.status;
  return status === 401 || status === 403;
}

export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof AxiosError)) {
    return false;
  }

  return !error.response;
}

export function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof AxiosError)) {
    return false;
  }

  return error.code === 'ECONNABORTED' || /timeout/i.test(error.message);
}

function isSafeUserMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed || trimmed.length > 200) {
    return false;
  }

  if (TECHNICAL_MESSAGE_PATTERN.test(trimmed)) {
    return false;
  }

  if (SAFE_AUTH_MESSAGES.has(trimmed)) {
    return true;
  }

  return /^[A-Za-z0-9 ,.'!?\-–—]+$/.test(trimmed);
}

function mapHttpStatusMessage(status: number, fallback: string): string {
  switch (status) {
    case 400:
      return fallback;
    case 401:
      return 'Session expired. Please sign in again.';
    case 403:
      return "You don't have permission to do that.";
    case 404:
      return 'The requested item could not be found.';
    case 408:
      return 'Request timed out. Please try again.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'Server is temporarily unavailable. Please try again later.';
    default:
      if (status >= 500) {
        return 'Server is temporarily unavailable. Please try again later.';
      }
      return fallback;
  }
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (isNetworkError(error)) {
    if (isTimeoutError(error)) {
      return 'Request timed out. Please try again.';
    }

    return 'No internet connection.';
  }

  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data as ApiResponse | undefined;
    const backendMessage = typeof data?.message === 'string' ? data.message.trim() : '';

    if (status === 401) {
      return backendMessage && isSafeUserMessage(backendMessage) && !backendMessage.toLowerCase().includes('session')
        ? backendMessage
        : 'Session expired. Please sign in again.';
    }

    if (status === 400 && backendMessage && isSafeUserMessage(backendMessage)) {
      return backendMessage;
    }

    if (status) {
      return mapHttpStatusMessage(status, fallback);
    }

    return fallback;
  }

  if (error instanceof Error) {
    const message = error.message.trim();
    if (message && isSafeUserMessage(message)) {
      return message;
    }
  }

  return fallback;
}

export function sanitizeBackendMessage(
  message: string | null | undefined,
  fallback: string,
): string {
  if (!message?.trim()) {
    return fallback;
  }

  const trimmed = message.trim();
  return isSafeUserMessage(trimmed) ? trimmed : fallback;
}

export function getChatErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return isTimeoutError(error)
      ? 'The AI request timed out. Your message was saved — tap send to try again.'
      : "You're offline. Your message was saved — try again when you're back online.";
  }

  if (error instanceof AxiosError) {
    const status = error.response?.status;
    if (status === 429) {
      return 'AI usage limit reached. Please wait a moment and try again.';
    }
    if (status === 503 || status === 502 || status === 504) {
      return 'Memora AI is temporarily unavailable. Please try again shortly.';
    }
  }

  return getApiErrorMessage(
    error,
    'Memora could not generate a response. Please try again.',
  );
}
