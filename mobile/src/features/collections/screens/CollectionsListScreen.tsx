import { Ionicons } from '@expo/vector-icons';
import { useCallback, useLayoutEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { CollectionCard } from '../components/CollectionCard';
import { ErrorBanner } from '../components/ErrorBanner';
import { useCollections } from '../../../hooks/queries/useCollections';
import { getApiErrorMessage } from '../../../lib/apiError';
import type { CollectionsStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';

type Props = NativeStackScreenProps<CollectionsStackParamList, 'CollectionsList'>;

export function CollectionsListScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { data: collections = [], isLoading, isError, error, refetch, isRefetching } = useCollections();

  const handleCreatePress = useCallback(() => {
    navigation.navigate('CreateCollection');
  }, [navigation]);

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
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
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
        <Text style={[styles.emptyIcon, { color: theme.colors.textSecondary }]}>📁</Text>
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
          No collections yet
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
          Organize your documents into collections.
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
            Create collection
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={collections}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            tintColor={theme.colors.primary}
            onRefresh={() => void refetch()}
          />
        }
        renderItem={({ item }) => (
          <CollectionCard
            collection={item}
            onPress={() => navigation.navigate('CollectionDetail', { collectionId: item.id })}
          />
        )}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create collection"
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  padded: {
    padding: 24,
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 96,
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
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
