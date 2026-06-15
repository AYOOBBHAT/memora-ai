import { createRef } from 'react';
import type { NavigationContainerRef } from '@react-navigation/native';

import type { RootStackParamList } from './types';

export const navigationRef = createRef<NavigationContainerRef<RootStackParamList>>();

export function navigateToShareHandler(): void {
  if (navigationRef.current?.isReady()) {
    navigationRef.current.navigate('ShareHandler');
  }
}

export function navigateToDocumentDetail(documentId: string): void {
  if (!navigationRef.current?.isReady()) {
    return;
  }

  navigationRef.current.navigate('App', {
    screen: 'Home',
    params: {
      screen: 'DocumentDetail',
      params: { documentId },
    },
  });
}
