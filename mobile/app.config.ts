import { ExpoConfig, ConfigContext } from 'expo/config';

import { googleClientIdToNativeRedirectScheme } from './src/lib/googleOAuthRedirect';

const googleAndroidAuthScheme = googleClientIdToNativeRedirectScheme(
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',
);
const googleIosAuthScheme = googleClientIdToNativeRedirectScheme(
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
);

const appSchemes = [
  'memora',
  googleAndroidAuthScheme,
  googleIosAuthScheme,
].filter((scheme): scheme is string => Boolean(scheme));

export default ({ config }: ConfigContext): ExpoConfig => ({

  ...config,

  name: 'Memora',

  slug: 'memora-mobile',

  version: '1.0.0',

  orientation: 'portrait',

  icon: './assets/icon.png',

  userInterfaceStyle: 'automatic',

  scheme: appSchemes.length === 1 ? appSchemes[0] : appSchemes,

  ios: {

    supportsTablet: true,

    bundleIdentifier: 'com.memora.mobile',

    buildNumber: '1',

  },

  android: {

    package: 'com.memora.mobile',

    versionCode: 1,

    adaptiveIcon: {

      backgroundColor: '#E6F4FE',

      foregroundImage: './assets/android-icon-foreground.png',

      backgroundImage: './assets/android-icon-background.png',

      monochromeImage: './assets/android-icon-monochrome.png',

    },

    predictiveBackGestureEnabled: false,

  },

  web: {

    favicon: './assets/favicon.png',

  },

  plugins: [
    'expo-web-browser',
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
  ],

  extra: {
    eas: {
      projectId: "1c42952f-f697-437d-9970-bfbae43c5462",
    },

    apiUrl: process.env.EXPO_PUBLIC_API_URL,

    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,

    googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,

  },

});

