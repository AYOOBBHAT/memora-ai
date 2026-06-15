import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import {
  getStateFromPath as defaultGetStateFromPath,
  type LinkingOptions,
} from '@react-navigation/native';
import { ShareIntentModule, getScheme, getShareExtensionKey } from 'expo-share-intent';

import type { RootStackParamList } from './types';

const PREFIX = Linking.createURL('/');
const PACKAGE_NAME =
  Constants.expoConfig?.android?.package ?? Constants.expoConfig?.ios?.bundleIdentifier;

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [`${Constants.expoConfig?.scheme}://`, `${PACKAGE_NAME}://`, PREFIX],
  config: {
    initialRouteName: 'App',
    screens: {
      App: {
        screens: {
          Home: {
            screens: {
              DocumentsList: 'documents',
              DocumentDetail: 'documents/:documentId',
              CreateDocument: 'documents/new',
              EditDocument: 'documents/:documentId/edit',
              Search: 'search',
            },
          },
          Collections: {
            screens: {
              CollectionsList: 'collections',
              CollectionDetail: 'collections/:collectionId',
              CreateCollection: 'collections/new',
              EditCollection: 'collections/:collectionId/edit',
            },
          },
          Chat: {
            screens: {
              ChatMain: 'chat',
              ChatHistory: 'chat/history',
            },
          },
          Profile: 'profile',
        },
      },
      ShareHandler: 'share',
    },
  },
  getStateFromPath(path, config) {
    if (path.includes(`dataUrl=${getShareExtensionKey()}`)) {
      return {
        routes: [{ name: 'ShareHandler' }],
      };
    }
    return defaultGetStateFromPath(path, config);
  },
  subscribe(listener) {
    const onReceiveURL = ({ url }: { url: string }) => {
      if (url.includes(getShareExtensionKey())) {
        listener(`${getScheme()}://share`);
      } else {
        listener(url);
      }
    };

    const shareIntentStateSubscription = ShareIntentModule?.addListener(
      'onStateChange',
      (event) => {
        if (event.value === 'pending') {
          listener(`${getScheme()}://share`);
        }
      },
    );

    const shareIntentValueSubscription = ShareIntentModule?.addListener('onChange', async () => {
      const url = await Linking.getLinkingURL();
      if (url) {
        onReceiveURL({ url });
      }
    });

    const urlEventSubscription = Linking.addEventListener('url', onReceiveURL);

    return () => {
      shareIntentStateSubscription?.remove();
      shareIntentValueSubscription?.remove();
      urlEventSubscription.remove();
    };
  },
  async getInitialURL() {
    const needRedirect = ShareIntentModule?.hasShareIntent(getShareExtensionKey());
    if (needRedirect) {
      return `${Constants.expoConfig?.scheme}://share`;
    }
    return Linking.getLinkingURL();
  },
};
