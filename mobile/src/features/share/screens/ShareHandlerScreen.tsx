import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useShareIntentContext } from 'expo-share-intent';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { createDocument, importUrl } from '../../../api/services/documents.service';
import { ErrorBanner } from '../../collections/components/ErrorBanner';
import { CollectionPicker } from '../../documents/components/CollectionPicker';
import { getApiErrorMessage } from '../../../lib/apiError';
import { queryClient, queryKeys } from '../../../lib/queryClient';
import {
  navigateToDocumentDetail,
} from '../../../navigation/navigationRef';
import type { RootStackParamList } from '../../../navigation/types';
import { useAuthStore } from '../../../stores/auth.store';
import { useShareStore } from '../../../stores/share.store';
import { useTheme } from '../../../theme/ThemeProvider';
import { parseShareContent, type ParsedShareContent } from '../utils/parseShareContent';

type Props = NativeStackScreenProps<RootStackParamList, 'ShareHandler'>;

type ScreenPhase = 'loading' | 'ready' | 'saving' | 'success' | 'error';

export function ShareHandlerScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { resetShareIntent } = useShareIntentContext();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const pendingShare = useShareStore((state) => state.pendingShare);
  const clearPendingShare = useShareStore((state) => state.clearPendingShare);

  const [phase, setPhase] = useState<ScreenPhase>('loading');
  const [parsedContent, setParsedContent] = useState<ParsedShareContent | null>(null);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [savedDocumentId, setSavedDocumentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!isAuthenticated) {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        setErrorMessage('Sign in to save shared content to Memora.');
        setPhase('error');
      }
      return;
    }

    if (!pendingShare) {
      setErrorMessage('No shared content was found.');
      setPhase('error');
      return;
    }

    try {
      const parsed = parseShareContent({
        text: pendingShare.text,
        webUrl: pendingShare.webUrl,
        metaTitle: pendingShare.metaTitle,
        receivedAt: pendingShare.receivedAt,
      });

      setParsedContent(parsed);
      setPhase('ready');
    } catch {
      setErrorMessage('Could not read the shared content.');
      setPhase('error');
    }
  }, [isAuthenticated, isHydrated, navigation, pendingShare]);

  const previewText = useMemo(() => {
    if (!parsedContent) {
      return '';
    }
    if (parsedContent.mode === 'url' && parsedContent.url) {
      return parsedContent.url;
    }
    return parsedContent.text;
  }, [parsedContent]);

  const handleDismiss = useCallback(() => {
    resetShareIntent();
    clearPendingShare();
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [clearPendingShare, navigation, resetShareIntent]);

  const handleSave = useCallback(async () => {
    if (!parsedContent || phase === 'saving') {
      return;
    }

    if (parsedContent.mode !== 'url' && !parsedContent.text.trim()) {
      setErrorMessage('Shared content is empty.');
      setPhase('error');
      return;
    }

    setPhase('saving');
    setErrorMessage(null);

    try {
      let documentId: string;

      if (parsedContent.mode === 'url' && parsedContent.url) {
        const result = await importUrl({
          url: parsedContent.url,
          title: parsedContent.title,
          collectionId: collectionId ?? undefined,
        });
        documentId = result.document.id;
      } else {
        const document = await createDocument({
          title: parsedContent.title,
          content: parsedContent.text,
          sourceType: 'text',
          metadata: parsedContent.metadata as unknown as Record<string, unknown>,
          collectionId: collectionId ?? undefined,
        });
        documentId = document.id;
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      if (collectionId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.collections.documents(collectionId),
        });
      }

      resetShareIntent();
      clearPendingShare();
      setSavedDocumentId(documentId);
      setPhase('success');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Failed to save shared content'));
      setPhase('error');
    }
  }, [clearPendingShare, collectionId, parsedContent, phase, resetShareIntent]);

  const handleViewDocument = useCallback(() => {
    if (!savedDocumentId) {
      return;
    }
    navigateToDocumentDetail(savedDocumentId);
    navigation.goBack();
  }, [navigation, savedDocumentId]);

  const handleRetrySave = useCallback(() => {
    if (!parsedContent) {
      return;
    }

    setErrorMessage(null);
    setPhase('ready');
  }, [parsedContent]);

  if (phase === 'loading' || (phase !== 'error' && phase !== 'success' && !parsedContent)) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
          Detecting shared content…
        </Text>
      </View>
    );
  }

  if (phase === 'error') {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text
          style={[
            styles.successTitle,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSizes.lg,
              fontWeight: theme.typography.fontWeights.semibold,
            },
          ]}
        >
          Could not import share
        </Text>
        {errorMessage ? (
          <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
            {errorMessage}
          </Text>
        ) : null}
        {parsedContent ? (
          <Pressable
            accessibilityRole="button"
            onPress={handleRetrySave}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: theme.colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text
              style={[
                styles.primaryButtonText,
                {
                  color: theme.colors.primaryText,
                  fontSize: theme.typography.fontSizes.md,
                  fontWeight: theme.typography.fontWeights.semibold,
                },
              ]}
            >
              Try again
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={handleDismiss}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: theme.colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text
            style={[
              styles.primaryButtonText,
              {
                color: theme.colors.primaryText,
                fontSize: theme.typography.fontSizes.md,
                fontWeight: theme.typography.fontWeights.semibold,
              },
            ]}
          >
            Close
          </Text>
        </Pressable>
      </View>
    );
  }

  if (phase === 'success') {
    return (
      <View style={[styles.centered, styles.successContainer, { backgroundColor: theme.colors.background }]}>
        <Text
          style={[
            styles.successTitle,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSizes.lg,
              fontWeight: theme.typography.fontWeights.semibold,
            },
          ]}
        >
          Saved to Memora
        </Text>
        <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
          Your shared content was saved as a document.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={handleViewDocument}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: theme.colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text
            style={[
              styles.primaryButtonText,
              {
                color: theme.colors.primaryText,
                fontSize: theme.typography.fontSizes.md,
                fontWeight: theme.typography.fontWeights.semibold,
              },
            ]}
          >
            View document
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={handleDismiss}
          style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={{ color: theme.colors.primary, fontSize: theme.typography.fontSizes.sm }}>
            Done
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!parsedContent) {
    return null;
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { backgroundColor: theme.colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.previewSection}>
        <Text
          style={[
            styles.sectionLabel,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSizes.sm,
              fontWeight: theme.typography.fontWeights.medium,
            },
          ]}
        >
          Title preview
        </Text>
        <Text
          style={[
            styles.titlePreview,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSizes.md,
              fontWeight: theme.typography.fontWeights.semibold,
            },
          ]}
        >
          {parsedContent.title}
        </Text>
        <Text
          style={[
            styles.sectionLabel,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSizes.sm,
            },
          ]}
        >
          {parsedContent.mode === 'url' ? 'URL' : 'Text preview'}
        </Text>
        <Text
          numberOfLines={6}
          style={[
            styles.contentPreview,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSizes.sm,
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {previewText}
        </Text>
      </View>

      <CollectionPicker selectedCollectionId={collectionId} onSelect={setCollectionId} />

      <Pressable
        accessibilityRole="button"
        disabled={phase === 'saving'}
        onPress={() => void handleSave()}
        style={({ pressed }) => [
          styles.primaryButton,
          {
            backgroundColor: theme.colors.primary,
            opacity: pressed || phase === 'saving' ? 0.85 : 1,
          },
        ]}
      >
        {phase === 'saving' ? (
          <ActivityIndicator color={theme.colors.primaryText} />
        ) : (
          <Text
            style={[
              styles.primaryButtonText,
              {
                color: theme.colors.primaryText,
                fontSize: theme.typography.fontSizes.md,
                fontWeight: theme.typography.fontWeights.semibold,
              },
            ]}
          >
            Save to Memora
          </Text>
        )}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        disabled={phase === 'saving'}
        onPress={handleDismiss}
        style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.7 : 1 }]}
      >
        <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSizes.sm }}>
          Cancel
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  successContainer: {
    gap: 12,
  },
  statusText: {
    textAlign: 'center',
  },
  successTitle: {
    textAlign: 'center',
  },
  content: {
    padding: 16,
    gap: 24,
    paddingBottom: 32,
  },
  previewSection: {
    gap: 8,
  },
  sectionLabel: {},
  titlePreview: {},
  contentPreview: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {},
  secondaryButton: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
});
