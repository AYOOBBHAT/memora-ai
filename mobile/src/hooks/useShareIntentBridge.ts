import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useShareIntentContext } from 'expo-share-intent';

import { navigateToShareHandler } from '../navigation/navigationRef';
import { useAuthStore } from '../stores/auth.store';
import { useShareStore } from '../stores/share.store';

export function useShareIntentBridge(isAppReady: boolean): void {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const setPendingShare = useShareStore((state) => state.setPendingShare);
  const pendingShare = useShareStore((state) => state.pendingShare);
  const handledIntentRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pendingShare) {
      handledIntentRef.current = null;
    }
  }, [pendingShare]);

  useEffect(() => {
    if (Platform.OS !== 'android' || !isAppReady || !isHydrated) {
      return;
    }

    if (!hasShareIntent || !shareIntent) {
      return;
    }

    const intentKey = `${shareIntent.text ?? ''}|${shareIntent.webUrl ?? ''}|${shareIntent.meta?.title ?? ''}`;
    if (handledIntentRef.current === intentKey) {
      return;
    }
    handledIntentRef.current = intentKey;

    setPendingShare({
      text: shareIntent.text ?? '',
      webUrl: shareIntent.webUrl ?? null,
      metaTitle: shareIntent.meta?.title ?? null,
      receivedAt: new Date().toISOString(),
    });
  }, [
    hasShareIntent,
    isAppReady,
    isHydrated,
    setPendingShare,
    shareIntent,
  ]);

  useEffect(() => {
    if (Platform.OS !== 'android' || !isAppReady || !isHydrated || !pendingShare) {
      return;
    }

    if (isAuthenticated) {
      navigateToShareHandler();
      return;
    }

    resetShareIntent();
  }, [
    isAppReady,
    isAuthenticated,
    isHydrated,
    pendingShare,
    resetShareIntent,
  ]);
}
