import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useLayoutEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';

import { ErrorBanner } from '../../collections/components/ErrorBanner';
import { EmbeddingStatusBadge } from '../components/EmbeddingStatusBadge';
import { formatDocumentContent, formatDocumentDate } from '../utils/formatDocument';
import { useDeleteDocument } from '../../../hooks/mutations/useDeleteDocument';
import { useRetryEmbedding } from '../../../hooks/mutations/useRetryEmbedding';
import { useDocument } from '../../../hooks/queries/useDocuments';
import { getApiErrorMessage } from '../../../lib/apiError';
import { queryKeys } from '../../../lib/queryClient';
import type { DocumentsStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';

type Props = NativeStackScreenProps<DocumentsStackParamList, 'DocumentDetail'>;

export function DocumentDetailScreen({ navigation, route }: Props) {
  const { documentId } = route.params;
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const { data: document, isLoading, isError, error, refetch } = useDocument(documentId);
  const deleteDocument = useDeleteDocument();
  const retryEmbedding = useRetryEmbedding(documentId);

  useEffect(() => {
    if (document) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.documents.recent() });
    }
  }, [document?.id, queryClient]);

  const handleEdit = useCallback(() => {
    navigation.navigate('EditDocument', { documentId });
  }, [navigation, documentId]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete document', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteDocument.mutate(documentId, {
            onSuccess: () => {
              navigation.goBack();
            },
          });
        },
      },
    ]);
  }, [deleteDocument, documentId, navigation]);

  const handleRetryEmbedding = useCallback(() => {
    retryEmbedding.mutate();
  }, [retryEmbedding]);

  const originalUrl =
    typeof document?.metadata?.originalUrl === 'string' ? document.metadata.originalUrl : null;

  const thumbnailUrl =
    typeof document?.metadata?.thumbnail === 'string' ? document.metadata.thumbnail : null;

  const channelName =
    document?.sourceType === 'youtube' && typeof document.metadata?.channel === 'string'
      ? document.metadata.channel
      : null;

  const handleOpenOriginalUrl = useCallback(() => {
    if (!originalUrl) {
      return;
    }

    void Linking.openURL(originalUrl);
  }, [originalUrl]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: document?.title ?? 'Document',
      headerRight: () => (
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit document"
            onPress={handleEdit}
            style={({ pressed }) => [styles.headerButton, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="create-outline" size={22} color={theme.colors.primary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete document"
            disabled={deleteDocument.isPending}
            onPress={handleDelete}
            style={({ pressed }) => [styles.headerButton, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="trash-outline" size={22} color={theme.colors.error} />
          </Pressable>
        </View>
      ),
    });
  }, [
    navigation,
    document?.title,
    handleEdit,
    handleDelete,
    deleteDocument.isPending,
    theme.colors.primary,
    theme.colors.error,
  ]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (isError || !document) {
    return (
      <View style={[styles.centered, styles.padded, { backgroundColor: theme.colors.background }]}>
        <ErrorBanner
          message={getApiErrorMessage(error, 'Failed to load document')}
          onRetry={() => void refetch()}
        />
      </View>
    );
  }

  const contentText = formatDocumentContent(document.content);

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.metaRow}>
        <EmbeddingStatusBadge status={document.embeddingStatus} />
        <Text
          style={[
            styles.dateText,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSizes.sm,
            },
          ]}
        >
          Created {formatDocumentDate(document.createdAt)}
        </Text>
      </View>

      {document.embeddingStatus === 'failed' ? (
        <View style={styles.bannerWrap}>
          {document.embeddingError ? (
            <ErrorBanner message={document.embeddingError} />
          ) : (
            <ErrorBanner message="Embedding failed. You can retry below." />
          )}
          <Pressable
            accessibilityRole="button"
            disabled={retryEmbedding.isPending}
            onPress={handleRetryEmbedding}
            style={({ pressed }) => [
              styles.retryButton,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: theme.colors.border,
                opacity: pressed || retryEmbedding.isPending ? 0.85 : 1,
              },
            ]}
          >
            {retryEmbedding.isPending ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <Text
                style={[
                  styles.retryText,
                  {
                    color: theme.colors.primary,
                    fontSize: theme.typography.fontSizes.sm,
                    fontWeight: theme.typography.fontWeights.semibold,
                  },
                ]}
              >
                Retry embedding
              </Text>
            )}
          </Pressable>
          {retryEmbedding.error ? (
            <ErrorBanner
              message={getApiErrorMessage(retryEmbedding.error, 'Retry failed')}
              onRetry={handleRetryEmbedding}
            />
          ) : null}
        </View>
      ) : null}

      {deleteDocument.error ? (
        <View style={styles.bannerWrap}>
          <ErrorBanner message={getApiErrorMessage(deleteDocument.error, 'Delete failed')} />
        </View>
      ) : null}

      <Text
        style={[
          styles.title,
          {
            color: theme.colors.text,
            fontSize: theme.typography.fontSizes.xl,
            fontWeight: theme.typography.fontWeights.semibold,
          },
        ]}
      >
        {document.title}
      </Text>

      {thumbnailUrl ? (
        <Image
          accessibilityLabel="Video thumbnail"
          source={{ uri: thumbnailUrl }}
          style={styles.thumbnail}
        />
      ) : null}

      {channelName ? (
        <Text
          style={[
            styles.channelName,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSizes.sm,
            },
          ]}
        >
          {channelName}
        </Text>
      ) : null}

      {originalUrl ? (
        <Pressable
          accessibilityRole="link"
          onPress={handleOpenOriginalUrl}
          style={({ pressed }) => [styles.sourceLink, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons
            color={theme.colors.primary}
            name={document.sourceType === 'youtube' ? 'logo-youtube' : 'open-outline'}
            size={16}
          />
          <Text
            numberOfLines={2}
            style={[
              styles.sourceLinkText,
              {
                color: theme.colors.primary,
                fontSize: theme.typography.fontSizes.sm,
              },
            ]}
          >
            {document.sourceType === 'youtube' ? 'Watch on YouTube' : originalUrl}
          </Text>
        </Pressable>
      ) : null}

      <View
        style={[
          styles.contentCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.content,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSizes.md,
              lineHeight: theme.typography.fontSizes.md * theme.typography.lineHeights.relaxed,
            },
          ]}
        >
          {contentText}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  padded: {
    padding: 24,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  dateText: {},
  bannerWrap: {
    gap: 10,
  },
  retryButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  retryText: {},
  title: {},
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: '#111827',
  },
  channelName: {},
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourceLinkText: {
    flex: 1,
    textDecorationLine: 'underline',
  },
  contentCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  content: {},
});
