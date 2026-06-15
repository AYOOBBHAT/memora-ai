import { Ionicons } from '@expo/vector-icons';
import { useCallback, useLayoutEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ErrorBanner } from '../../collections/components/ErrorBanner';
import { PdfUploadButton } from '../components/PdfUploadButton';
import { RecentDocumentListItem } from '../components/RecentDocumentListItem';
import { UrlImportButton } from '../components/UrlImportButton';
import { YoutubeImportButton } from '../components/YoutubeImportButton';
import { useRecentDocuments } from '../../../hooks/queries/useDocuments';
import { getApiErrorMessage } from '../../../lib/apiError';
import type { DocumentsStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';

type Props = NativeStackScreenProps<DocumentsStackParamList, 'DocumentsList'>;

function SectionHeader({ title }: { title: string }) {
  const { theme } = useTheme();

  return (
    <Text
      style={[
        styles.sectionTitle,
        {
          color: theme.colors.text,
          fontSize: theme.typography.fontSizes.lg,
          fontWeight: theme.typography.fontWeights.semibold,
        },
      ]}
    >
      {title}
    </Text>
  );
}

function SectionEmpty({ message }: { message: string }) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.sectionEmpty,
        {
          backgroundColor: theme.colors.surfaceSecondary,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.sectionEmptyText,
          {
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSizes.sm,
          },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

export function DocumentsListScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const {
    data: recent,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useRecentDocuments();

  const recentlyViewed = recent?.recentlyViewed ?? [];
  const recentlyAdded = recent?.recentlyAdded ?? [];
  const hasAnyDocuments = recentlyViewed.length > 0 || recentlyAdded.length > 0;

  const handleCreatePress = useCallback(() => {
    navigation.navigate('CreateDocument');
  }, [navigation]);

  const handleSearchPress = useCallback(() => {
    navigation.navigate('Search');
  }, [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search documents and collections"
          onPress={handleSearchPress}
          style={({ pressed }) => [styles.headerButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="search" size={24} color={theme.colors.primary} />
        </Pressable>
      ),
    });
  }, [navigation, handleSearchPress, theme.colors.primary]);

  const handleDocumentPress = useCallback(
    (documentId: string) => {
      navigation.navigate('DocumentDetail', { documentId });
    },
    [navigation],
  );

  const handlePdfUploadSuccess = useCallback(
    (documentId: string) => {
      navigation.navigate('DocumentDetail', { documentId });
    },
    [navigation],
  );

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.centered, styles.padded, { backgroundColor: theme.colors.background }]}>
        <ErrorBanner
          message={getApiErrorMessage(error, 'Failed to load documents')}
          onRetry={() => void refetch()}
        />
      </View>
    );
  }

  if (!hasAnyDocuments) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.centered, styles.padded]}>
          <Text style={[styles.emptyIcon, { color: theme.colors.textSecondary }]}>📄</Text>
          <Text
            style={[
              styles.emptyTitle,
              {
                color: theme.colors.text,
                fontSize: theme.typography.fontSizes.lg,
                fontWeight: theme.typography.fontWeights.semibold,
              },
            ]}
          >
            No documents yet
          </Text>
          <Text
            style={[
              styles.emptySubtitle,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSizes.md,
              },
            ]}
          >
            Add text documents, import URLs, or upload PDFs to build your knowledge base.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={handleCreatePress}
            style={({ pressed }) => [
              styles.ctaButton,
              {
                backgroundColor: theme.colors.primary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.ctaText,
                {
                  color: theme.colors.primaryText,
                  fontSize: theme.typography.fontSizes.md,
                  fontWeight: theme.typography.fontWeights.semibold,
                },
              ]}
            >
              Create document
            </Text>
          </Pressable>
          <PdfUploadButton
            label="Upload PDF"
            variant="secondary"
            onSuccess={(document) => handlePdfUploadSuccess(document.id)}
          />
          <UrlImportButton
            label="Import URL"
            variant="secondary"
            onSuccess={(document) => handlePdfUploadSuccess(document.id)}
          />
          <YoutubeImportButton
            label="Import YouTube"
            variant="secondary"
            onSuccess={(document) => handlePdfUploadSuccess(document.id)}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create document"
          onPress={handleCreatePress}
          style={({ pressed }) => [
            styles.fab,
            {
              backgroundColor: theme.colors.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Ionicons name="add" size={28} color={theme.colors.primaryText} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            tintColor={theme.colors.primary}
            onRefresh={() => void refetch()}
          />
        }
      >
        <View style={styles.uploadBar}>
          <PdfUploadButton
            label="Upload PDF"
            variant="secondary"
            onSuccess={(document) => handlePdfUploadSuccess(document.id)}
          />
          <UrlImportButton
            label="Import URL"
            variant="secondary"
            onSuccess={(document) => handlePdfUploadSuccess(document.id)}
          />
          <YoutubeImportButton
            label="Import YouTube"
            variant="secondary"
            onSuccess={(document) => handlePdfUploadSuccess(document.id)}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Recently Viewed" />
          {recentlyViewed.length === 0 ? (
            <SectionEmpty message="Open a document to see it here." />
          ) : (
            recentlyViewed.map((document) => (
              <RecentDocumentListItem
                key={document.id}
                document={document}
                onPress={() => handleDocumentPress(document.id)}
              />
            ))
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Recently Added" />
          {recentlyAdded.length === 0 ? (
            <SectionEmpty message="New documents will appear here." />
          ) : (
            recentlyAdded.map((document) => (
              <RecentDocumentListItem
                key={document.id}
                document={document}
                onPress={() => handleDocumentPress(document.id)}
              />
            ))
          )}
        </View>
      </ScrollView>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create document"
        onPress={handleCreatePress}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: theme.colors.primary,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <Ionicons name="add" size={28} color={theme.colors.primaryText} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    padding: 4,
    marginRight: 4,
  },
  uploadBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  scrollContent: {
    paddingBottom: 96,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },
  sectionTitle: {},
  sectionEmpty: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  sectionEmptyText: {
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  padded: {
    padding: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  ctaButton: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {},
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
