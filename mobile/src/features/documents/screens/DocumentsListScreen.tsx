import { Ionicons } from '@expo/vector-icons';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useMemo } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';

import { AskMemoraSection, type AskMemoraOpenParams } from '../../../components/ui/AskMemoraSection';
import { CollectionPreviewCard } from '../../../components/ui/CollectionPreviewCard';
import { CompactDocumentCard } from '../../../components/ui/CompactDocumentCard';
import { ContinueReadingCard } from '../../../components/ui/ContinueReadingCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { HomeScreenSkeleton } from '../../../components/ui/HomeScreenSkeleton';
import { QuickActionsSection } from '../../../components/ui/QuickActionsSection';
import { SearchBarButton } from '../../../components/ui/SearchBarButton';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { ErrorBanner } from '../../collections/components/ErrorBanner';
import { useAuthMe } from '../../../hooks/queries/useAuthMe';
import { useCollections } from '../../../hooks/queries/useCollections';
import { useConversations } from '../../../hooks/queries/useConversations';
import { useDocuments, useRecentDocuments } from '../../../hooks/queries/useDocuments';
import { getApiErrorMessage } from '../../../lib/apiError';
import type { DocumentsStackParamList, MainTabParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';

type Props = NativeStackScreenProps<DocumentsStackParamList, 'DocumentsList'>;

type TabNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<DocumentsStackParamList, 'DocumentsList'>,
  BottomTabNavigationProp<MainTabParamList>
>;

function getGreetingName(name?: string): string {
  if (!name?.trim()) {
    return 'there';
  }

  return name.trim().split(/\s+/)[0] ?? 'there';
}

function SectionPlaceholder({ message }: { message: string }) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.placeholder,
        {
          backgroundColor: theme.colors.surfaceSecondary,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.md,
        },
      ]}
    >
      <Text
        style={[
          styles.placeholderText,
          {
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSizes.sm,
            lineHeight: 20,
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
  const insets = useSafeAreaInsets();
  const tabNavigation = navigation.getParent<TabNavigationProp>();

  const { data: user } = useAuthMe();
  const {
    data: recent,
    isLoading: isRecentLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useRecentDocuments();
  const { data: collections = [], isLoading: isCollectionsLoading, isError: isCollectionsError, error: collectionsError, refetch: refetchCollections } = useCollections();
  const { data: conversations = [], isLoading: isChatsLoading, isError: isChatsError, error: chatsError, refetch: refetchConversations } = useConversations();
  const { data: allDocuments = [] } = useDocuments();

  const recentlyViewed = recent?.recentlyViewed ?? [];
  const recentlyAdded = recent?.recentlyAdded ?? [];
  const latestConversation = conversations[0] ?? null;
  const previewCollections = collections.slice(0, 8);
  const hasAnyContent =
    recentlyViewed.length > 0 ||
    recentlyAdded.length > 0 ||
    collections.length > 0 ||
    conversations.length > 0;

  const documentCountByCollection = useMemo(() => {
    const counts = new Map<string, number>();

    for (const document of allDocuments) {
      if (!document.collectionId) {
        continue;
      }

      counts.set(document.collectionId, (counts.get(document.collectionId) ?? 0) + 1);
    }

    return counts;
  }, [allDocuments]);

  const isLoading = isRecentLoading || isCollectionsLoading || isChatsLoading;

  const handleCreatePress = useCallback(() => {
    navigation.navigate('CreateDocument');
  }, [navigation]);

  const handleSearchPress = useCallback(() => {
    navigation.navigate('Search');
  }, [navigation]);

  const handleDocumentPress = useCallback(
    (documentId: string) => {
      navigation.navigate('DocumentDetail', { documentId });
    },
    [navigation],
  );

  const handleImportSuccess = useCallback(
    (document: { id: string }) => {
      navigation.navigate('DocumentDetail', { documentId: document.id });
    },
    [navigation],
  );

  const handleCollectionPress = useCallback(
    (collectionId: string) => {
      tabNavigation?.navigate('Collections', {
        screen: 'CollectionDetail',
        params: { collectionId },
      });
    },
    [tabNavigation],
  );

  const handleOpenChat = useCallback(
    (params?: AskMemoraOpenParams) => {
      tabNavigation?.navigate('Chat', {
        screen: 'ChatMain',
        params,
      });
    },
    [tabNavigation],
  );

  const handleSeeAllCollections = useCallback(() => {
    tabNavigation?.navigate('Collections', { screen: 'CollectionsList' });
  }, [tabNavigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  if (isLoading) {
    return <HomeScreenSkeleton />;
  }

  if (isError) {
    return (
      <View style={[styles.centered, styles.screenPadding, { backgroundColor: theme.colors.background }]}>
        <ErrorBanner
          message={getApiErrorMessage(error, 'Failed to load documents')}
          onRetry={() => void refetch()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + theme.spacing.md,
            paddingBottom: insets.bottom + 96,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            tintColor={theme.colors.primary}
            onRefresh={() => {
              void refetch();
              void refetchCollections();
              void refetchConversations();
            }}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.screenPadding}>
          <View style={styles.greetingBlock}>
            <Text
              style={[
                styles.greeting,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSizes.sm,
                  fontWeight: theme.typography.fontWeights.medium,
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                },
              ]}
            >
              Welcome back, {getGreetingName(user?.name)}
            </Text>
            <Text
              style={[
                styles.brandTitle,
                {
                  color: theme.colors.text,
                  fontSize: theme.typography.fontSizes.xxl,
                  fontWeight: theme.typography.fontWeights.bold,
                  letterSpacing: -0.8,
                },
              ]}
            >
              Memora
            </Text>
            <Text
              style={[
                styles.greetingSubtitle,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSizes.md,
                  lineHeight: 24,
                },
              ]}
            >
              Your curated knowledge workspace.
            </Text>
          </View>

          <SearchBarButton onPress={handleSearchPress} />
        </View>

        <View style={[styles.section, styles.screenPadding]}>
          <SectionHeader title="Quick Actions" />
          <QuickActionsSection onImportSuccess={handleImportSuccess} onNotePress={handleCreatePress} />
        </View>

        {!hasAnyContent ? (
          <View style={styles.screenPadding}>
            <EmptyState
              actionLabel="Upload your first PDF"
              icon="📄"
              subtitle="Start building your Memora knowledge library."
              title="Your workspace is ready"
              onActionPress={handleCreatePress}
            />
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.screenPadding}>
            <SectionHeader title="Continue Reading" />
          </View>
          {recentlyViewed.length === 0 ? (
            <View style={styles.screenPadding}>
              <SectionPlaceholder message="Open a document to pick up where you left off." />
            </View>
          ) : (
            <FlatList
              horizontal
              data={recentlyViewed}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <ContinueReadingCard
                  document={item}
                  onPress={() => handleDocumentPress(item.id)}
                />
              )}
              showsHorizontalScrollIndicator={false}
            />
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.screenPadding}>
            <SectionHeader
              actionLabel={collections.length > 0 ? 'See all' : undefined}
              title="Collections"
              onActionPress={collections.length > 0 ? handleSeeAllCollections : undefined}
            />
          </View>
          {isCollectionsError ? (
            <View style={styles.screenPadding}>
              <ErrorBanner
                message={getApiErrorMessage(collectionsError, 'Failed to load collections')}
                onRetry={() => void refetchCollections()}
              />
            </View>
          ) : previewCollections.length === 0 ? (
            <View style={styles.screenPadding}>
              <SectionPlaceholder message="Create a collection to organize your documents." />
            </View>
          ) : (
            <FlatList
              horizontal
              data={previewCollections}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <CollectionPreviewCard
                  collection={item}
                  documentCount={documentCountByCollection.get(item.id) ?? 0}
                  onPress={() => handleCollectionPress(item.id)}
                />
              )}
              showsHorizontalScrollIndicator={false}
            />
          )}
        </View>

        <View style={[styles.section, styles.screenPadding]}>
          {isChatsError ? (
            <ErrorBanner
              message={getApiErrorMessage(chatsError, 'Failed to load recent chats')}
              onRetry={() => void refetchConversations()}
            />
          ) : null}
          <AskMemoraSection
            documents={allDocuments}
            latestConversation={latestConversation}
            onOpenChat={handleOpenChat}
          />
        </View>

        <View style={[styles.section, styles.screenPadding]}>
          <SectionHeader title="Recent Documents" />
          {recentlyAdded.length === 0 ? (
            <SectionPlaceholder message="New documents will appear here as you add content." />
          ) : (
            <View style={styles.listGap}>
              {recentlyAdded.map((document) => (
                <CompactDocumentCard
                  key={document.id}
                  document={document}
                  onPress={() => handleDocumentPress(document.id)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create document"
        onPress={handleCreatePress}
        style={({ pressed }) => [
          styles.fab,
          theme.elevation.fab,
          {
            backgroundColor: theme.colors.primary,
            opacity: pressed ? 0.92 : 1,
            transform: [{ scale: pressed ? 0.96 : 1 }],
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
  screenPadding: {
    paddingHorizontal: 16,
  },
  scrollContent: {
    gap: 32,
  },
  greetingBlock: {
    gap: 6,
    marginBottom: 20,
  },
  greeting: {
    letterSpacing: 0.2,
  },
  brandTitle: {
    letterSpacing: -0.8,
  },
  greetingSubtitle: {
    lineHeight: 21,
    maxWidth: 320,
  },
  section: {
    gap: 0,
  },
  horizontalList: {
    paddingHorizontal: 16,
  },
  placeholder: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  placeholderText: {
    textAlign: 'center',
  },
  listGap: {
    gap: 10,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
