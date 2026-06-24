import { Ionicons } from '@expo/vector-icons';
import { useCallback, useLayoutEffect, useMemo } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { CollectionCard } from '../components/CollectionCard';
import { ErrorBanner } from '../components/ErrorBanner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useCollections } from '../../../hooks/queries/useCollections';
import { useDocuments } from '../../../hooks/queries/useDocuments';
import { getApiErrorMessage } from '../../../lib/apiError';
import type { CollectionsStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';

type Props = NativeStackScreenProps<CollectionsStackParamList, 'CollectionsList'>;

export function CollectionsListScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { data: collections = [], isLoading, isError, error, refetch, isRefetching } = useCollections();
  const { data: documents = [] } = useDocuments();

  const documentCountByCollection = useMemo(() => {
    const counts = new Map<string, number>();
    for (const document of documents) {
      if (!document.collectionId) {
        continue;
      }
      counts.set(document.collectionId, (counts.get(document.collectionId) ?? 0) + 1);
    }
    return counts;
  }, [documents]);

  const handleCreatePress = useCallback(() => {
    navigation.navigate('CreateCollection');
  }, [navigation]);

  const handleCollectionPress = useCallback(
    (collectionId: string) => {
      navigation.navigate('CollectionDetail', { collectionId });
    },
    [navigation],
  );

  const renderCollection = useCallback(
    ({ item }: { item: (typeof collections)[number] }) => (
      <CollectionCard
        collection={item}
        documentCount={documentCountByCollection.get(item.id) ?? 0}
        onPress={() => handleCollectionPress(item.id)}
      />
    ),
    [documentCountByCollection, handleCollectionPress],
  );

  const collectionKeyExtractor = useCallback((item: (typeof collections)[number]) => item.id, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Collections',
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create collection"
          onPress={handleCreatePress}
          style={({ pressed }) => [styles.headerButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="add" size={26} color={theme.colors.primary} />
        </Pressable>
      ),
    });
  }, [navigation, handleCreatePress, theme.colors.primary]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.padded, { backgroundColor: theme.colors.background }]}>
        <Skeleton borderRadius={theme.radii.lg} height={88} style={{ marginBottom: 12 }} />
        <Skeleton borderRadius={theme.radii.lg} height={88} style={{ marginBottom: 12 }} />
        <Skeleton borderRadius={theme.radii.lg} height={88} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.centered, styles.padded, { backgroundColor: theme.colors.background }]}>
        <ErrorBanner
          message={getApiErrorMessage(error, 'Failed to load collections')}
          onRetry={() => void refetch()}
        />
      </View>
    );
  }

  if (collections.length === 0) {
    return (
      <View style={[styles.centered, styles.padded, { backgroundColor: theme.colors.background }]}>
        <EmptyState
          actionLabel="Create collection"
          icon="📁"
          subtitle="Group notes, PDFs, and imports into focused spaces."
          title="Organize your knowledge"
          onActionPress={handleCreatePress}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={collections}
        keyExtractor={collectionKeyExtractor}
        maxToRenderPerBatch={8}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            tintColor={theme.colors.primary}
            onRefresh={() => void refetch()}
          />
        }
        renderItem={renderCollection}
        windowSize={9}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create collection"
        onPress={handleCreatePress}
        style={({ pressed }) => [
          styles.fab,
          theme.elevation.fab,
          {
            backgroundColor: theme.colors.primary,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <Ionicons name="add" size={26} color={theme.colors.primaryText} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  padded: {
    padding: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 96,
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
