import { ExpoConfig, ConfigContext } from 'expo/config';

const APP_LOGO = './assets/new_memora_app_logo.png';
const SPLASH_BACKGROUND = '#0F172A';

const GOOGLE_CLIENT_ID_SUFFIX = '.apps.googleusercontent.com';

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? '';

if (!googleWebClientId) {
  throw new Error(
    'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is required for production builds.',
  );
}

/** Reversed Web client ID scheme required by @react-native-google-signin/google-signin on iOS. */
function googleWebClientIdToIosUrlScheme(clientId: string): string | null {
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

const googleIosUrlScheme = googleWebClientIdToIosUrlScheme(googleWebClientId);

if (!googleIosUrlScheme) {
  throw new Error(
    'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID must be a valid Google OAuth Web client ID (*.apps.googleusercontent.com).',
  );
}

const plugins: ExpoConfig['plugins'] = [
  [
    '@react-native-google-signin/google-signin',
    { iosUrlScheme: googleIosUrlScheme },
  ],
  ['expo-build-properties', { android: { usesCleartextTraffic: true } }],
  [
    'expo-share-intent',
    {
      disableIOS: true,
      androidIntentFilters: ['text/plain', 'text/*'],
      androidMainActivityAttributes: {
        'android:launchMode': 'singleTask',
      },
    },
  ],
];

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,

  name: 'Memora',

  slug: 'memora-mobile',

  version: '1.0.0',

  orientation: 'portrait',

  icon: APP_LOGO,

  userInterfaceStyle: 'automatic',

  scheme: 'memora',

  ios: {
    supportsTablet: true,

    bundleIdentifier: 'com.memora.mobile',

    buildNumber: '1',
  },

  android: {
    package: 'com.memora.mobile',

    versionCode: 1,

    softwareKeyboardLayoutMode: 'resize',

    adaptiveIcon: {
      backgroundColor: SPLASH_BACKGROUND,

      foregroundImage: APP_LOGO,
    },

    predictiveBackGestureEnabled: false,
  },

  web: {
    favicon: APP_LOGO,
  },

  plugins,

  extra: {
    eas: {
      projectId: '1c42952f-f697-437d-9970-bfbae43c5462',
    },

    apiUrl: process.env.EXPO_PUBLIC_API_URL,

    googleWebClientId,
  },
});
