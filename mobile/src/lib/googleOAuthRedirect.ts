/** Path segment used by expo-auth-session Google provider for native redirects. */
export const GOOGLE_OAUTH_REDIRECT_PATH = 'oauthredirect';

const GOOGLE_CLIENT_ID_SUFFIX = '.apps.googleusercontent.com';

/** Extract `123456789-abc` from `123456789-abc.apps.googleusercontent.com`. */
export function googleClientIdToNativeRedirectScheme(clientId: string): string | null {
  const normalized = clientId.trim();
  if (!normalized.endsWith(GOOGLE_CLIENT_ID_SUFFIX)) {
    return null;
  }

  const clientIdPart = normalized.slice(0, -GOOGLE_CLIENT_ID_SUFFIX.length);
  if (!clientIdPart) {
    return null;
  }

  return `com.googleusercontent.apps.${clientIdPart}`;
}

/**
 * Google Android OAuth expects the reversed client ID scheme, not the app package name.
 * @see https://developers.google.com/identity/protocols/oauth2/native-app
 */
export function googleClientIdToNativeRedirectUri(clientId: string): string | null {
  const scheme = googleClientIdToNativeRedirectScheme(clientId);
  if (!scheme) {
    return null;
  }

  return `${scheme}:/${GOOGLE_OAUTH_REDIRECT_PATH}`;
}
