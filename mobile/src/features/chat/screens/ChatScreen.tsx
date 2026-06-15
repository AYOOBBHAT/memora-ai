import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ChatCitationSource, ChatCollectionScope } from '../../../api/types';
import { ChatInput } from '../components/ChatInput';
import { ChatMessageBubble } from '../components/ChatMessageBubble';
import { CollectionScopeBadge } from '../components/CollectionScopeBadge';
import { ErrorBanner } from '../../collections/components/ErrorBanner';
import { useSendChat } from '../../../hooks/mutations/useSendChat';
import { useConversation } from '../../../hooks/queries/useConversation';
import { useCollections } from '../../../hooks/queries/useCollections';
import { findQuickNotesCollectionId } from '../../onboarding/utils/quickNotes';
import { getApiErrorMessage } from '../../../lib/apiError';
import { isNetworkError } from '../../../lib/network';
import type { ChatStackParamList } from '../../../navigation/types';
import {
  createChatMessageId,
  historyMessageToChatMessage,
  useChatStore,
  type ChatMessage,
} from '../../../stores/chat.store';
import { useTheme } from '../../../theme/ThemeProvider';

type Props = NativeStackScreenProps<ChatStackParamList, 'ChatMain'>;

export function ChatScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const [input, setInput] = useState('');
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [offlineBanner, setOfflineBanner] = useState(false);

  const conversationId = useChatStore((state) => state.conversationId);
  const conversationTitle = useChatStore((state) => state.conversationTitle);
  const storedCollectionIds = useChatStore((state) => state.collectionIds);
  const scopedCollection = useChatStore((state) => state.scopedCollection);
  const messages = useChatStore((state) => state.messages);
  const addMessage = useChatStore((state) => state.addMessage);
  const startNewChat = useChatStore((state) => state.startNewChat);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const setConversationMeta = useChatStore((state) => state.setConversationMeta);
  const setCollectionScope = useChatStore((state) => state.setCollectionScope);
  const setCollectionIds = useChatStore((state) => state.setCollectionIds);
  const clearCollectionScope = useChatStore((state) => state.clearCollectionScope);

  const resumeConversationId = route.params?.conversationId;
  const launchCollectionId = route.params?.collectionId;
  const { data: conversationDetail, isLoading: isLoadingConversation } =
    useConversation(resumeConversationId ?? null);

  const { data: collections = [] } = useCollections();
  const sendChat = useSendChat();

  useEffect(() => {
    if (!resumeConversationId || !conversationDetail) {
      return;
    }

    const collectionIds = conversationDetail.conversation.collectionIds ?? [];
    const singleCollection =
      collectionIds.length === 1
        ? collections.find((collection) => collection.id === collectionIds[0])
        : undefined;

    setActiveConversation({
      conversationId: conversationDetail.conversation.id,
      title: conversationDetail.conversation.title,
      collectionIds,
      scopedCollection: singleCollection
        ? {
            id: singleCollection.id,
            name: singleCollection.name,
            icon: singleCollection.icon,
            color: singleCollection.color,
          }
        : null,
      messages: conversationDetail.messages.map(historyMessageToChatMessage),
    });
    setSelectedCollectionIds(collectionIds);
    navigation.setParams({ conversationId: undefined });
  }, [collections, conversationDetail, navigation, resumeConversationId, setActiveConversation]);

  useEffect(() => {
    if (resumeConversationId || launchCollectionId) {
      return;
    }

    if (storedCollectionIds.length > 0) {
      setSelectedCollectionIds(storedCollectionIds);
    }
  }, [launchCollectionId, resumeConversationId, storedCollectionIds]);

  useEffect(() => {
    if (!launchCollectionId || collections.length === 0) {
      return;
    }

    const collection = collections.find((item) => item.id === launchCollectionId);
    if (!collection) {
      return;
    }

    startNewChat();
    const scope: ChatCollectionScope = {
      id: collection.id,
      name: collection.name,
      icon: collection.icon,
      color: collection.color,
    };
    setCollectionScope(scope);
    setSelectedCollectionIds([collection.id]);
    navigation.setParams({ collectionId: undefined });
  }, [
    collections,
    launchCollectionId,
    navigation,
    setCollectionScope,
    startNewChat,
  ]);

  const scrollToBottom = useCallback(() => {
    if (messages.length === 0) {
      return;
    }
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sendChat.isPending, scrollToBottom]);

  const handleStartNewChat = useCallback(() => {
    Alert.alert('Start new chat', 'Clear the current conversation and begin a new one?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'New chat',
        style: 'destructive',
        onPress: () => {
          startNewChat();
          setSelectedCollectionIds([]);
          setOfflineBanner(false);
        },
      },
    ]);
  }, [startNewChat]);

  const handleOpenHistory = useCallback(() => {
    navigation.navigate('ChatHistory');
  }, [navigation]);

  useLayoutEffect(() => {
    const headerTitle = conversationTitle?.trim() || 'New chat';

    navigation.setOptions({
      title: headerTitle,
      headerLeft: () => (
        <Pressable
          accessibilityLabel="Open chat history"
          accessibilityRole="button"
          hitSlop={8}
          onPress={handleOpenHistory}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, paddingHorizontal: 4 }]}
        >
          <Ionicons color={theme.colors.text} name="time-outline" size={22} />
        </Pressable>
      ),
      headerRight: () =>
        messages.length > 0 || conversationId ? (
          <Pressable
            accessibilityLabel="Start new chat"
            accessibilityRole="button"
            hitSlop={8}
            onPress={handleStartNewChat}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, paddingHorizontal: 4 }]}
          >
            <Ionicons color={theme.colors.textSecondary} name="create-outline" size={22} />
          </Pressable>
        ) : null,
    });
  }, [
    conversationId,
    conversationTitle,
    handleOpenHistory,
    handleStartNewChat,
    messages.length,
    navigation,
    theme.colors.text,
    theme.colors.textSecondary,
  ]);

  const handleSourcePress = useCallback(
    (source: ChatCitationSource) => {
      const tabNavigation = navigation.getParent();
      tabNavigation?.navigate('Home', {
        screen: 'DocumentDetail',
        params: { documentId: source.documentId },
      });
    },
    [navigation],
  );

  const toggleCollection = useCallback(
    (collectionId: string) => {
      if (scopedCollection) {
        return;
      }

      setSelectedCollectionIds((current) => {
        const next = current.includes(collectionId)
          ? current.filter((id) => id !== collectionId)
          : [...current, collectionId];
        setCollectionIds(next);
        return next;
      });
    },
    [scopedCollection, setCollectionIds],
  );

  const handleClearCollectionScope = useCallback(() => {
    clearCollectionScope();
    setSelectedCollectionIds([]);
  }, [clearCollectionScope]);

  const sendMessage = useCallback(
    (message: string, collectionIdsOverride?: string[]) => {
      const trimmed = message.trim();
      if (!trimmed || sendChat.isPending) {
        return;
      }

      const userMessage: ChatMessage = {
        id: createChatMessageId(),
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      addMessage(userMessage);
      setInput('');
      setOfflineBanner(false);

      const collectionIds =
        collectionIdsOverride ??
        (selectedCollectionIds.length > 0 ? selectedCollectionIds : undefined);

      if (collectionIds?.length) {
        setCollectionIds(collectionIds);
      }

      const chatPayload =
        collectionIds?.length === 1
          ? {
              message: trimmed,
              collectionId: collectionIds[0],
              conversationId: conversationId ?? undefined,
            }
          : {
              message: trimmed,
              collectionIds,
              conversationId: conversationId ?? undefined,
            };

      sendChat.mutate(chatPayload, {
        onSuccess: (response) => {
          if (!conversationId && response.conversationId) {
            setConversationMeta({
              conversationId: response.conversationId,
              title: trimmed,
            });
          }

          if (response.scopedCollections?.length === 1) {
            setCollectionScope(response.scopedCollections[0]);
            setSelectedCollectionIds([response.scopedCollections[0].id]);
          }

          addMessage({
              id: response.messageId ?? createChatMessageId(),
              role: 'assistant',
              content: response.answer,
              sources: response.sources,
              createdAt: new Date().toISOString(),
            });
          },
          onError: (error) => {
            if (isNetworkError(error)) {
              setOfflineBanner(true);
            }

            addMessage({
              id: createChatMessageId(),
              role: 'assistant',
              content: getApiErrorMessage(
                error,
                'Something went wrong while generating an answer. Please try again.',
              ),
              createdAt: new Date().toISOString(),
              error: true,
          });
        },
      });
    },
    [
      addMessage,
      conversationId,
      selectedCollectionIds,
      sendChat,
      setCollectionIds,
      setCollectionScope,
      setConversationMeta,
    ],
  );

  const handleSend = useCallback(() => {
    sendMessage(input);
  }, [input, sendMessage]);

  const autoSendHandled = useRef(false);

  useEffect(() => {
    const trimmed = route.params?.initialMessage?.trim();
    const shouldAutoSend = route.params?.autoSend;

    if (!trimmed) {
      return;
    }

    if (shouldAutoSend && !autoSendHandled.current) {
      autoSendHandled.current = true;
      navigation.setParams({ initialMessage: undefined, autoSend: undefined });

      void (async () => {
        const quickNotesId = await findQuickNotesCollectionId();
        if (quickNotesId) {
          setSelectedCollectionIds([quickNotesId]);
          sendMessage(trimmed, [quickNotesId]);
          return;
        }
        sendMessage(trimmed);
      })();
      return;
    }

    if (!shouldAutoSend) {
      setInput(trimmed);
      navigation.setParams({ initialMessage: undefined });
    }
  }, [navigation, route.params?.autoSend, route.params?.initialMessage, sendMessage]);

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <ChatMessageBubble message={item} onSourcePress={handleSourcePress} />
    ),
    [handleSourcePress],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  const listEmptyComponent = (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyIcon, { color: theme.colors.textSecondary }]}>💬</Text>
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
        Ask questions about your saved knowledge
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
        Memora searches your embedded documents and cites the sources it uses.
      </Text>
    </View>
  );

  const collectionFilter =
    !scopedCollection && collections.length > 0 ? (
      <View
        style={[
          styles.filterBar,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.filterContent}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {collections.map((collection) => {
            const selected = selectedCollectionIds.includes(collection.id);
            return (
              <Pressable
                key={collection.id}
                onPress={() => toggleCollection(collection.id)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: selected
                      ? theme.colors.primary
                      : theme.colors.surfaceSecondary,
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.filterChipText,
                    {
                      color: selected ? theme.colors.primaryText : theme.colors.text,
                      fontSize: theme.typography.fontSizes.sm,
                    },
                  ]}
                >
                  {collection.icon ? `${collection.icon} ` : ''}
                  {collection.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    ) : null;

  if (resumeConversationId && isLoadingConversation && messages.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {offlineBanner ? (
        <View style={styles.offlineBanner}>
          <ErrorBanner message="You're offline. Messages can't be sent until you're back online." />
        </View>
      ) : null}
      {scopedCollection ? (
        <CollectionScopeBadge collection={scopedCollection} onClear={handleClearCollectionScope} />
      ) : null}
      {collectionFilter}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.flex}
      >
        <FlatList
          ref={flatListRef}
          contentContainerStyle={[
            styles.listContent,
            messages.length === 0 ? styles.listContentEmpty : undefined,
          ]}
          data={messages}
          keyExtractor={keyExtractor}
          ListEmptyComponent={listEmptyComponent}
          ListFooterComponent={
            sendChat.isPending ? (
              <View style={styles.loadingRow}>
                <View
                  style={[
                    styles.loadingBubble,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <ActivityIndicator color={theme.colors.primary} size="small" />
                  <Text
                    style={[
                      styles.loadingText,
                      {
                        color: theme.colors.textSecondary,
                        fontSize: theme.typography.fontSizes.sm,
                      },
                    ]}
                  >
                    Thinking…
                  </Text>
                </View>
              </View>
            ) : null
          }
          onContentSizeChange={scrollToBottom}
          renderItem={renderMessage}
        />
        <ChatInput
          disabled={sendChat.isPending || offlineBanner}
          onChangeText={setInput}
          onSend={handleSend}
          value={input}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  offlineBanner: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  listContent: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 8,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptySubtitle: {
    lineHeight: 22,
    textAlign: 'center',
  },
  loadingRow: {
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  loadingBubble: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  loadingText: {},
  filterBar: {
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  filterContent: {
    gap: 8,
    paddingHorizontal: 16,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 180,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipText: {},
});
