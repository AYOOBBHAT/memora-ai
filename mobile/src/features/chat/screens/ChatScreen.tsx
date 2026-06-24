import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { SafeDocument } from '../../../api/types';
import { useHeaderHeight } from '@react-navigation/elements';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ChatCitationSource, ChatCollectionScope } from '../../../api/types';
import { ChatInput } from '../components/ChatInput';
import { ChatMessageBubble } from '../components/ChatMessageBubble';
import { CollectionScopeBadge } from '../components/CollectionScopeBadge';
import { TypingIndicator } from '../components/TypingIndicator';
import { CollectionIconDisplay } from '../../collections/components/CollectionIconDisplay';
import { ErrorBanner } from '../../collections/components/ErrorBanner';
import { LoadErrorState } from '../../../components/ui/LoadErrorState';
import { useSendChat } from '../../../hooks/mutations/useSendChat';
import { useConversation } from '../../../hooks/queries/useConversation';
import { useCollections } from '../../../hooks/queries/useCollections';
import { useDocuments } from '../../../hooks/queries/useDocuments';
import { findQuickNotesCollectionId } from '../../onboarding/utils/quickNotes';
import { getApiErrorMessage, getChatErrorMessage } from '../../../lib/apiError';
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

const EMPTY_TRANSITION_MS = 200;

const DEFAULT_CHAT_SUGGESTIONS = [
  'Summarize my notes',
  'What PDFs have I uploaded?',
  "Explain today's research",
  'Search my knowledge',
];

function getChatSuggestions(
  documents: SafeDocument[],
  collections: { name: string }[],
): string[] {
  const suggestions: string[] = [];
  const hasNotes = documents.some((doc) => doc.sourceType === 'text');
  const hasPdfs = documents.some(
    (doc) => doc.sourceType === 'pdf' || doc.sourceType === 'upload',
  );

  if (hasNotes) {
    suggestions.push('Summarize my notes');
  }

  if (hasPdfs) {
    suggestions.push('What PDFs have I uploaded?');
  }

  const today = new Date();
  const hasTodayDocs = documents.some((doc) => {
    const updated = new Date(doc.updatedAt);
    return (
      updated.getFullYear() === today.getFullYear() &&
      updated.getMonth() === today.getMonth() &&
      updated.getDate() === today.getDate()
    );
  });

  if (hasTodayDocs) {
    suggestions.push("Explain today's research");
  }

  const linkedInCollection = collections.find((collection) =>
    /linkedin/i.test(collection.name),
  );
  if (linkedInCollection) {
    suggestions.push('Search my LinkedIn collection');
  }

  for (const fallback of DEFAULT_CHAT_SUGGESTIONS) {
    if (suggestions.length >= 4) {
      break;
    }
    if (!suggestions.includes(fallback)) {
      suggestions.push(fallback);
    }
  }

  return suggestions.slice(0, 4);
}

export function ChatScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const inputRef = useRef<TextInput>(null);
  const [input, setInput] = useState('');
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [offlineBanner, setOfflineBanner] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const heroOpacity = useRef(new Animated.Value(1)).current;
  const heroTranslateY = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(1)).current;
  const suggestionsOpacity = useRef(new Animated.Value(0)).current;

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
  const { data: conversationDetail, isLoading: isLoadingConversation, isError: isConversationError, error: conversationError, refetch: refetchConversation, isFetching: isRefetchingConversation } =
    useConversation(resumeConversationId ?? null);

  const { data: collections = [] } = useCollections();
  const { data: documents = [] } = useDocuments();
  const sendChat = useSendChat();

  const suggestedQuestions = useMemo(
    () => getChatSuggestions(documents, collections),
    [collections, documents],
  );

  const isConversationActive = messages.length > 0 || sendChat.isPending;
  const showEmptyOverlay = messages.length === 0;

  const showHero =
    showEmptyOverlay &&
    !isKeyboardVisible &&
    !isInputFocused &&
    input.length === 0;
  const showSuggestions = showEmptyOverlay && !showHero;

  const [emptyOverlayMounted, setEmptyOverlayMounted] = useState(showEmptyOverlay);
  const emptyOverlayOpacity = useRef(new Animated.Value(showEmptyOverlay ? 1 : 0)).current;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (showEmptyOverlay) {
      setEmptyOverlayMounted(true);
      Animated.timing(emptyOverlayOpacity, {
        toValue: 1,
        duration: EMPTY_TRANSITION_MS,
        useNativeDriver: true,
      }).start();
      return;
    }

    if (!emptyOverlayMounted) {
      return;
    }

    Animated.timing(emptyOverlayOpacity, {
      toValue: 0,
      duration: EMPTY_TRANSITION_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setEmptyOverlayMounted(false);
      }
    });
  }, [emptyOverlayMounted, emptyOverlayOpacity, showEmptyOverlay]);

  useEffect(() => {
    if (!showEmptyOverlay) {
      return;
    }

    Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: showHero ? 1 : 0,
        duration: EMPTY_TRANSITION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(heroTranslateY, {
        toValue: showHero ? 0 : -28,
        duration: EMPTY_TRANSITION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(heroScale, {
        toValue: showHero ? 1 : 0.92,
        duration: EMPTY_TRANSITION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(suggestionsOpacity, {
        toValue: showSuggestions ? 1 : 0,
        duration: EMPTY_TRANSITION_MS,
        useNativeDriver: true,
      }),
    ]).start();
  }, [heroOpacity, heroScale, heroTranslateY, showEmptyOverlay, showHero, showSuggestions, suggestionsOpacity]);

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
      messages: (conversationDetail.messages ?? []).map(historyMessageToChatMessage),
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

  const scrollToBottom = useCallback(
    (animated = true) => {
      if (messages.length === 0 && !sendChat.isPending) {
        return;
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          flatListRef.current?.scrollToEnd({ animated });
        });
      });
    },
    [messages.length, sendChat.isPending],
  );

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, sendChat.isPending, scrollToBottom]);

  useEffect(() => {
    if (!isKeyboardVisible || messages.length === 0) {
      return;
    }

    const timer = setTimeout(() => scrollToBottom(), Platform.OS === 'ios' ? 100 : 150);
    return () => clearTimeout(timer);
  }, [isKeyboardVisible, messages.length, scrollToBottom]);

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
    const headerTitle = conversationTitle?.trim() || 'Chat with Memora AI';

    navigation.setOptions({
      title: headerTitle,
      headerTitleStyle: {
        fontSize: theme.typography.fontSizes.md,
        fontWeight: theme.typography.fontWeights.semibold,
      },
      headerStyle: {
        backgroundColor: theme.colors.surface,
      },
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
    theme.typography.fontSizes.md,
    theme.typography.fontWeights.semibold,
  ]);

  useEffect(() => {
    if (!route.params?.focusInput) {
      return;
    }

    navigation.setParams({ focusInput: undefined });
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 350);

    return () => clearTimeout(timer);
  }, [navigation, route.params?.focusInput]);

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
              content: response.answer.trim(),
              sources: response.sources ?? [],
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
              content: getChatErrorMessage(error),
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
        try {
          const quickNotesId = await findQuickNotesCollectionId();
          if (quickNotesId) {
            setSelectedCollectionIds([quickNotesId]);
            sendMessage(trimmed, [quickNotesId]);
            return;
          }
          sendMessage(trimmed);
        } catch {
          sendMessage(trimmed);
        }
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

  const handleContentSizeChange = useCallback(() => {
    scrollToBottom(false);
  }, [scrollToBottom]);

  const listFooterComponent = useMemo(
    () =>
      sendChat.isPending ? (
        <View style={styles.loadingRow}>
          <View
            style={[
              styles.loadingBubble,
              {
                backgroundColor: theme.colors.aiSurface,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.lg,
              },
            ]}
          >
            <Text
              style={[
                styles.typingLabel,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSizes.xs,
                  fontWeight: theme.typography.fontWeights.medium,
                },
              ]}
            >
              Memora is thinking
            </Text>
            <TypingIndicator />
          </View>
        </View>
      ) : null,
    [sendChat.isPending, theme],
  );

  const handleSuggestionPress = useCallback((suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  }, []);

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
                <View style={styles.filterChipContent}>
                  {collection.icon ? (
                    <CollectionIconDisplay
                      color={selected ? theme.colors.primaryText : theme.colors.text}
                      icon={collection.icon}
                      size={14}
                    />
                  ) : null}
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
                    {collection.name}
                  </Text>
                </View>
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
        <Text
          style={[
            styles.loadingHint,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSizes.sm,
            },
          ]}
        >
          Loading conversation…
        </Text>
      </View>
    );
  }

  if (resumeConversationId && isConversationError && messages.length === 0) {
    return (
      <LoadErrorState
        isRetrying={isRefetchingConversation}
        message={getApiErrorMessage(conversationError, 'Could not load this conversation.')}
        onBack={() => navigation.setParams({ conversationId: undefined })}
        onRetry={() => void refetchConversation()}
      />
    );
  }

  const safeAreaEdges = isKeyboardVisible ? [] : (['bottom'] as const);
  const inputBottomPadding = isKeyboardVisible ? 8 : 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <SafeAreaView edges={safeAreaEdges} style={styles.flex}>
        {offlineBanner ? (
          <View style={styles.offlineBanner}>
            <ErrorBanner message="You're offline. Messages can't be sent until you're back online." />
          </View>
        ) : null}
        {scopedCollection ? (
          <CollectionScopeBadge
            collection={scopedCollection}
            onClear={handleClearCollectionScope}
          />
        ) : null}
        {collectionFilter}
        <View style={styles.messageArea}>
          <FlatList
            ref={flatListRef}
            contentContainerStyle={[
              styles.listContent,
              isConversationActive ? styles.listContentActive : styles.listContentIdle,
            ]}
            data={messages}
            initialNumToRender={15}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            keyExtractor={keyExtractor}
            ListFooterComponent={listFooterComponent}
            maxToRenderPerBatch={10}
            onContentSizeChange={handleContentSizeChange}
            removeClippedSubviews={Platform.OS === 'android'}
            renderItem={renderMessage}
            style={styles.flex}
            windowSize={11}
          />

          {emptyOverlayMounted ? (
            <Animated.View
              pointerEvents={showEmptyOverlay ? 'box-none' : 'none'}
              style={[styles.emptyOverlay, { opacity: emptyOverlayOpacity }]}
            >
              <Animated.View
                pointerEvents={showHero ? 'auto' : 'none'}
                style={[
                  styles.emptyHeroContainer,
                  {
                    opacity: heroOpacity,
                    transform: [{ translateY: heroTranslateY }, { scale: heroScale }],
                  },
                ]}
              >
                <View style={styles.emptyState}>
                  <Text
                    style={[
                      styles.emptyTitle,
                      {
                        color: theme.colors.text,
                        fontSize: theme.typography.fontSizes.xl,
                        fontWeight: theme.typography.fontWeights.bold,
                        letterSpacing: -0.5,
                      },
                    ]}
                  >
                    Your second brain
                  </Text>
                  <Text
                    style={[
                      styles.emptySubtitle,
                      {
                        color: theme.colors.textSecondary,
                        fontSize: theme.typography.fontSizes.md,
                        lineHeight: 24,
                      },
                    ]}
                  >
                    Ask questions about your notes, PDFs, websites and YouTube. Memora answers with
                    citations from your library.
                  </Text>
                </View>
              </Animated.View>

              <Animated.View
                pointerEvents={showSuggestions ? 'auto' : 'none'}
                style={[styles.suggestionsContainer, { opacity: suggestionsOpacity }]}
              >
                <Text
                  style={[
                    styles.suggestionsLabel,
                    {
                      color: theme.colors.textSecondary,
                      fontSize: theme.typography.fontSizes.sm,
                      fontWeight: theme.typography.fontWeights.medium,
                    },
                  ]}
                >
                  Suggested Questions
                </Text>
                <View style={styles.suggestionChips}>
                  {suggestedQuestions.map((suggestion) => (
                    <Pressable
                      key={suggestion}
                      accessibilityRole="button"
                      onPress={() => handleSuggestionPress(suggestion)}
                      style={({ pressed }) => [
                        styles.suggestionChip,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border,
                          borderRadius: theme.radii.lg,
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.suggestionChipText,
                          {
                            color: theme.colors.text,
                            fontSize: theme.typography.fontSizes.sm,
                          },
                        ]}
                      >
                        {suggestion}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Animated.View>
            </Animated.View>
          ) : null}
        </View>
        <ChatInput
          ref={inputRef}
          bottomInset={inputBottomPadding}
          disabled={sendChat.isPending || offlineBanner}
          onBlur={() => setIsInputFocused(false)}
          onChangeText={setInput}
          onFocus={() => setIsInputFocused(true)}
          onSend={handleSend}
          placeholder="Ask about your notes…"
          value={input}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    gap: 14,
    justifyContent: 'center',
  },
  loadingHint: {},
  flex: {
    flex: 1,
  },
  messageArea: {
    flex: 1,
    position: 'relative',
  },
  offlineBanner: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  listContentIdle: {
    flexGrow: 1,
  },
  listContentActive: {
    flexGrow: 1,
    paddingTop: 12,
  },
  emptyOverlay: {
    ...StyleSheet.absoluteFill,
  },
  emptyHeroContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 36,
  },
  suggestionsContainer: {
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 4,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  suggestionsLabel: {
    marginBottom: 10,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: '100%',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  suggestionChipText: {
    lineHeight: 18,
  },
  emptyIconWrap: {
    alignItems: 'center',
    height: 64,
    justifyContent: 'center',
    marginBottom: 4,
    width: 64,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptySubtitle: {
    lineHeight: 21,
    textAlign: 'center',
  },
  loadingRow: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
  assistantTypingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  typingAvatar: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  loadingBubble: {
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
    maxWidth: '88%',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  typingLabel: {
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  filterBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  filterContent: {
    gap: 8,
    paddingHorizontal: 16,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 180,
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  filterChipText: {},
});
