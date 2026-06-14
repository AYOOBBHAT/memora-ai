import { Ionicons } from '@expo/vector-icons';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { DocumentListItem } from '../components/DocumentListItem';
import { ErrorBanner } from '../components/ErrorBanner';
import { DEFAULT_COLLECTION_COLOR, DEFAULT_COLLECTION_ICON } from '../constants';
import { useDeleteCollection } from '../../../hooks/mutations/useDeleteCollection';
import { useCollection } from '../../../hooks/queries/useCollection';
import { useCollectionDocuments } from '../../../hooks/queries/useCollectionDocuments';
import { getApiErrorMessage } from '../../../lib/apiError';
import type { CollectionsStackParamList, MainTabParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';

type Props = CompositeScreenProps<
  NativeStackScreenProps<CollectionsStackParamList, 'CollectionDetail'>,
  BottomTabScreenProps<MainTabParamList>
>;

export function CollectionDetailScreen({ navigation, route }: Props) {
  const { collectionId } = route.params;
  const { theme } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const deleteCollection = useDeleteCollection();
  const {
    data: collection,
    isLoading: isCollectionLoading,
    isError: isCollectionError,
    error: collectionError,
    refetch: refetchCollection,
  } = useCollection(collectionId);
  const {
    data: documents = [],
    isLoading: isDocumentsLoading,
    isError: isDocumentsError,
    error: documentsError,
    refetch: refetchDocuments,
  } = useCollectionDocuments(collectionId);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchCollection(), refetchDocuments()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchCollection, refetchDocuments]);

  const handleDocumentPress = useCallback(
    (documentId: string) => {
      navigation.navigate('Home', {
        screen: 'DocumentDetail',
        params: { documentId },
      });
    },
    [navigation],
  );

  const handleCreateDocument = useCallback(() => {
    navigation.navigate('Home', {
      screen: 'CreateDocument',
      params: { collectionId },
    });
  }, [collectionId, navigation]);

  const handleEdit = useCallback(() => {
    navigation.navigate('EditCollection', { collectionId });
  }, [navigation, collectionId]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete collection',
      'This will remove the collection. Documents will not be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCollection.mutate(collectionId, {
              onSuccess: () => {
                navigation.popToTop();
              },
            });
          },
        },
      ],
    );
  }, [collectionId, deleteCollection, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: collection?.name ?? 'Collection',
      headerRight: () => (
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit collection"
            onPress={handleEdit}
            style={({ pressed }) => [styles.headerButton, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="create-outline" size={22} color={theme.colors.primary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete collection"
            disabled={deleteCollection.isPending}
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
    collection?.name,
    handleEdit,
    handleDelete,
    deleteCollection.isPending,
    theme.colors.primary,
    theme.colors.error,
  ]);

  if (isCollectionLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (isCollectionError || !collection) {
    return (
      <View style={[styles.centered, styles.padded, { backgroundColor: theme.colors.background }]}>
        <ErrorBanner
          message={getApiErrorMessage(collectionError, 'Failed to load collection')}
          onRetry={() => void refetchCollection()}
        />
      </View>
    );
  }

  const accentColor = collection.color ?? DEFAULT_COLLECTION_COLOR;
  const icon = collection.icon ?? DEFAULT_COLLECTION_ICON;

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            tintColor={theme.colors.primary}
            onRefresh={() => void handleRefresh()}
          />
        }
      >
        <View
          style={[
            styles.headerCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={[styles.colorStrip, { backgroundColor: accentColor }]} />
          <View style={styles.headerContent}>
            <Text style={styles.headerIcon}>{icon}</Text>
            <View style={styles.headerText}>
              <Text
                style={[
                  styles.headerName,
                  {
                    color: theme.colors.text,
                    fontSize: theme.typography.fontSizes.xl,
                    fontWeight: theme.typography.fontWeights.semibold,
                  },
                ]}
              >
                {collection.name}
              </Text>
              {collection.description ? (
                <Text
                  style={[
                    styles.headerDescription,
                    {
                      color: theme.colors.textSecondary,
                      fontSize: theme.typography.fontSizes.md,
                    },
                  ]}
                >
                  {collection.description}
                </Text>
              ) : null}
              <Text
                style={[
                  styles.documentCount,
                  {
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.fontSizes.sm,
                  },
                ]}
              >
                {documents.length} {documents.length === 1 ? 'document' : 'documents'}
              </Text>
            </View>
          </View>
        </View>

        {deleteCollection.error ? (
          <View style={styles.bannerWrap}>
            <ErrorBanner message={getApiErrorMessage(deleteCollection.error, 'Delete failed')} />
          </View>
        ) : null}

        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSizes.md,
              fontWeight: theme.typography.fontWeights.semibold,
            },
          ]}
        >
          Documents
        </Text>

        {isDocumentsLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={styles.documentsLoader} />
        ) : isDocumentsError ? (
          <ErrorBanner
            message={getApiErrorMessage(documentsError, 'Failed to load documents')}
            onRetry={() => void refetchDocuments()}
          />
        ) : documents.length === 0 ? (
          <View style={styles.emptyDocuments}>
            <Text
              style={[
                styles.emptyText,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSizes.md,
                },
              ]}
            >
              No documents in this collection yet.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={handleCreateDocument}
              style={({ pressed }) => [
                styles.emptyCta,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.emptyCtaText,
                  {
                    color: theme.colors.primaryText,
                    fontSize: theme.typography.fontSizes.sm,
                    fontWeight: theme.typography.fontWeights.semibold,
                  },
                ]}
              >
                Add document
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.documentsList}>
            {documents.map((document) => (
              <DocumentListItem
                key={document.id}
                document={document}
                onPress={() => handleDocumentPress(document.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create document in collection"
        onPress={handleCreateDocument}
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
  screen: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 16,
    paddingBottom: 96,
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
  headerCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  colorStrip: {
    width: 6,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  headerIcon: {
    fontSize: 36,
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  headerName: {},
  headerDescription: {},
  documentCount: {
    marginTop: 4,
  },
  bannerWrap: {
    marginBottom: 4,
  },
  sectionTitle: {
    marginTop: 4,
  },
  documentsLoader: {
    marginTop: 16,
  },
  emptyDocuments: {
    marginTop: 8,
    gap: 12,
    alignItems: 'flex-start',
  },
  emptyText: {},
  emptyCta: {
    minHeight: 40,
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCtaText: {},
  documentsList: {
    gap: 10,
  },
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
