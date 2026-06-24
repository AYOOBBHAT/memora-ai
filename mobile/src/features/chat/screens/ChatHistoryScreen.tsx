import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ConversationListItem } from '../../../api/types';
import { EmptyState } from '../../../components/ui/EmptyState';
import { RecentChatCard } from '../../../components/ui/RecentChatCard';
import { Skeleton } from '../../../components/ui/Skeleton';
import { ErrorBanner } from '../../collections/components/ErrorBanner';
import { useDeleteConversation } from '../../../hooks/mutations/useDeleteConversation';
import {
  MIN_QUERY_LENGTH,
  useSearchConversations,
} from '../../../hooks/queries/useConversation';
import { useConversations } from '../../../hooks/queries/useConversations';
import { getApiErrorMessage } from '../../../lib/apiError';
import { isNetworkError } from '../../../lib/network';
import type { ChatStackParamList } from '../../../navigation/types';
import {
  useChatStore,
} from '../../../stores/chat.store';
import { useTheme } from '../../../theme/ThemeProvider';

type Props = NativeStackScreenProps<ChatStackParamList, 'ChatHistory'>;

export function ChatHistoryScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length >= MIN_QUERY_LENGTH;

  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const deleteConversation = useDeleteConversation();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const conversationsQuery = useConversations();
  const searchQuery = useSearchConversations(query);

  const activeQuery = isSearching ? searchQuery : conversationsQuery;
  const conversations = activeQuery.data ?? [];
  const isOffline = Boolean(activeQuery.error && isNetworkError(activeQuery.error));

  const emptyTitle = useMemo(() => {
    if (isSearching) {
      return 'No matching conversations';
    }
    return 'No conversations yet';
  }, [isSearching]);

  const emptySubtitle = useMemo(() => {
    if (isSearching) {
      return 'Try a different keyword from your chat history.';
    }
    return 'Start a chat and your questions will appear here.';
  }, [isSearching]);

  const handleOpenConversation = useCallback(
    (conversation: ConversationListItem) => {
      navigation.navigate('ChatMain', { conversationId: conversation.id });
    },
    [navigation],
  );

  const confirmDelete = useCallback(
    (conversation: ConversationListItem) => {
      Alert.alert(
        'Delete conversation',
        `Delete "${conversation.title || 'Untitled chat'}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              setDeleteError(null);
              deleteConversation.mutate(conversation.id, {
                onSuccess: () => {
                  const activeConversationId = useChatStore.getState().conversationId;
                  if (activeConversationId === conversation.id) {
                    useChatStore.getState().startNewChat();
                  }
                },
                onError: (error) => {
                  setDeleteError(
                    getApiErrorMessage(error, 'Could not delete this conversation. Please try again.'),
                  );
                },
              });
            },
          },
        ],
      );
    },
    [deleteConversation],
  );

  const conversationKeyExtractor = useCallback((item: ConversationListItem) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: ConversationListItem }) => (
      <View style={styles.rowWrap}>
        <RecentChatCard
          conversation={item}
          style={styles.rowCard}
          onPress={() => handleOpenConversation(item)}
        />
        <Pressable
          accessibilityLabel="Delete conversation"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => confirmDelete(item)}
          style={({ pressed }) => [styles.deleteButton, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons color={theme.colors.textSecondary} name="trash-outline" size={18} />
        </Pressable>
      </View>
    ),
    [confirmDelete, handleOpenConversation, theme.colors.textSecondary],
  );

  const showInitialLoading = activeQuery.isLoading && conversations.length === 0;
  const showError = activeQuery.isError && conversations.length === 0;
  const showHint = trimmedQuery.length > 0 && trimmedQuery.length < MIN_QUERY_LENGTH;
  const showEmpty =
    !showInitialLoading &&
    !showError &&
    !activeQuery.isFetching &&
    conversations.length === 0;

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.searchBar,
          {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: `${theme.colors.border}99`,
            borderRadius: theme.radii.xl,
          },
        ]}
      >
        <Ionicons color={theme.colors.textSecondary} name="search" size={18} />
        <TextInput
          accessibilityLabel="Search conversations"
          onChangeText={setQuery}
          placeholder="Search conversations"
          placeholderTextColor={theme.colors.textSecondary}
          style={[
            styles.searchInput,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSizes.md,
            },
          ]}
          value={query}
        />
        {query.length > 0 ? (
          <Pressable accessibilityLabel="Clear search" onPress={() => setQuery('')}>
            <Ionicons color={theme.colors.textSecondary} name="close-circle" size={18} />
          </Pressable>
        ) : null}
      </View>

      {deleteError ? (
        <ErrorBanner message={deleteError} onRetry={() => setDeleteError(null)} />
      ) : null}

      {isOffline ? (
        <View style={styles.bannerWrap}>
          <ErrorBanner message="Offline — showing cached conversations" />
        </View>
      ) : null}

      {showHint ? (
        <Text
          style={[
            styles.hint,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSizes.sm,
            },
          ]}
        >
          Type at least {MIN_QUERY_LENGTH} characters to search
        </Text>
      ) : null}

      {showInitialLoading ? (
        <View style={styles.skeletonWrap}>
          <Skeleton borderRadius={theme.radii.md} height={72} style={{ marginBottom: 10 }} />
          <Skeleton borderRadius={theme.radii.md} height={72} style={{ marginBottom: 10 }} />
          <Skeleton borderRadius={theme.radii.md} height={72} />
        </View>
      ) : null}

      {showError ? (
        <View style={[styles.centered, styles.padded]}>
          <ErrorBanner
            message={getApiErrorMessage(activeQuery.error, 'Failed to load conversations')}
            onRetry={() => void activeQuery.refetch()}
          />
        </View>
      ) : null}

      {showEmpty ? (
        <EmptyState
          icon="💬"
          subtitle={emptySubtitle}
          title={emptyTitle}
        />
      ) : null}

      {!showInitialLoading && !showError && conversations.length > 0 ? (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={conversations}
          initialNumToRender={12}
          keyExtractor={conversationKeyExtractor}
          maxToRenderPerBatch={10}
          refreshControl={
            <RefreshControl
              colors={[theme.colors.primary]}
              onRefresh={() => void activeQuery.refetch()}
              refreshing={activeQuery.isRefetching}
              tintColor={theme.colors.primary}
            />
          }
          renderItem={renderItem}
          windowSize={11}
        />
      ) : null}

      {isSearching && activeQuery.isFetching && conversations.length === 0 && !showError ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
  },
  bannerWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  hint: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  skeletonWrap: {
    padding: 16,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  padded: {
    paddingHorizontal: 32,
  },
  listContent: {
    gap: 8,
    padding: 16,
    paddingBottom: 24,
  },
  rowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowCard: {
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    marginRight: -4,
  },
});
