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

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return 'Just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString();
}

export function ChatHistoryScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length >= MIN_QUERY_LENGTH;

  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const deleteConversation = useDeleteConversation();

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
              deleteConversation.mutate(conversation.id, {
                onSuccess: () => {
                  const activeConversationId = useChatStore.getState().conversationId;
                  if (activeConversationId === conversation.id) {
                    useChatStore.getState().startNewChat();
                  }
                },
              });
            },
          },
        ],
      );
    },
    [deleteConversation],
  );

  const renderItem = useCallback(
    ({ item }: { item: ConversationListItem }) => (
      <Pressable
        accessibilityRole="button"
        onLongPress={() => confirmDelete(item)}
        onPress={() => handleOpenConversation(item)}
        style={({ pressed }) => [
          styles.row,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <View style={styles.rowContent}>
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              {
                color: theme.colors.text,
                fontSize: theme.typography.fontSizes.md,
                fontWeight: theme.typography.fontWeights.semibold,
              },
            ]}
          >
            {item.title || 'Untitled chat'}
          </Text>
          <Text
            numberOfLines={2}
            style={[
              styles.preview,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSizes.sm,
              },
            ]}
          >
            {item.preview || 'No messages yet'}
          </Text>
          <Text
            style={[
              styles.meta,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSizes.xs,
              },
            ]}
          >
            {formatRelativeTime(item.updatedAt)} · {item.messageCount}{' '}
            {item.messageCount === 1 ? 'message' : 'messages'}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Delete conversation"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => confirmDelete(item)}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 4 }]}
        >
          <Ionicons color={theme.colors.textSecondary} name="trash-outline" size={20} />
        </Pressable>
      </Pressable>
    ),
    [
      confirmDelete,
      handleOpenConversation,
      theme.colors.border,
      theme.colors.surface,
      theme.colors.text,
      theme.colors.textSecondary,
      theme.typography.fontSizes.md,
      theme.typography.fontSizes.sm,
      theme.typography.fontSizes.xs,
      theme.typography.fontWeights.semibold,
    ],
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
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
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
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
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
        <View style={[styles.centered, styles.padded]}>
          <Text style={[styles.emptyIcon, { color: theme.colors.textSecondary }]}>🕘</Text>
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
            {emptyTitle}
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
            {emptySubtitle}
          </Text>
        </View>
      ) : null}

      {!showInitialLoading && !showError && conversations.length > 0 ? (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={conversations}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              colors={[theme.colors.primary]}
              onRefresh={() => void activeQuery.refetch()}
              refreshing={activeQuery.isRefetching}
              tintColor={theme.colors.primary}
            />
          }
          renderItem={renderItem}
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
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
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
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  padded: {
    paddingHorizontal: 32,
  },
  listContent: {
    gap: 10,
    padding: 16,
    paddingBottom: 24,
  },
  row: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowContent: {
    flex: 1,
    gap: 4,
  },
  title: {},
  preview: {
    lineHeight: 20,
  },
  meta: {},
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    lineHeight: 22,
    textAlign: 'center',
  },
});
