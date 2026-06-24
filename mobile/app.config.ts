import { ExpoConfig, ConfigContext } from 'expo/config';

const APP_LOGO = './assets/new_memora_app_logo.png';
const SPLASH_BACKGROUND = '#013E37';

const GOOGLE_CLIENT_ID_SUFFIX = '.apps.googleusercontent.com';

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

function resolveGoogleSignInConfig(): {
  googleWebClientId: string;
  googleIosUrlScheme: string | null;
} {
  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? '';
  const googleIosUrlScheme = googleWebClientId
    ? googleWebClientIdToIosUrlScheme(googleWebClientId)
    : null;

  if (!googleWebClientId) {
    console.warn(
      '[app.config] EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not set. ' +
        'The Google Sign-In config plugin will be omitted until it is provided via .env, eas.json, or EAS env.',
    );
  } else if (!googleIosUrlScheme) {
    console.warn(
      '[app.config] EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID must be a valid Google OAuth Web client ID ' +
        '(*.apps.googleusercontent.com). The Google Sign-In config plugin will be omitted.',
    );
  }

  return { googleWebClientId, googleIosUrlScheme };
}

function buildPlugins(googleIosUrlScheme: string | null): ExpoConfig['plugins'] {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() ?? '';
  const allowCleartextTraffic = apiUrl.startsWith('http://');

  const plugins: ExpoConfig['plugins'] = [
    ['expo-build-properties', { android: { usesCleartextTraffic: allowCleartextTraffic } }],
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

  if (googleIosUrlScheme) {
    plugins.unshift([
      '@react-native-google-signin/google-signin',
      { iosUrlScheme: googleIosUrlScheme },
    ]);
  }

  return plugins;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const { googleWebClientId, googleIosUrlScheme } = resolveGoogleSignInConfig();

  return {
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

    plugins: buildPlugins(googleIosUrlScheme),

    extra: {
      eas: {
        projectId: '1c42952f-f697-437d-9970-bfbae43c5462',
      },

      apiUrl: process.env.EXPO_PUBLIC_API_URL,

      googleWebClientId,
    },
  };
};
