import { ExpoConfig, ConfigContext } from 'expo/config';



export default ({ config }: ConfigContext): ExpoConfig => ({

  ...config,

  name: 'Memora',

  slug: 'memora-mobile',

  version: '1.0.0',

  orientation: 'portrait',

  icon: './assets/icon.png',

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

  plugins: ['expo-web-browser'],

  extra: {
    eas: {
      projectId: "1c42952f-f697-437d-9970-bfbae43c5462",
    },

    apiUrl: process.env.EXPO_PUBLIC_API_URL,

    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,

  },

});

