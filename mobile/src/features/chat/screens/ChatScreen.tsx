import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { SafeDocument } from '../../../api/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { ChatCitationSource, ChatCollectionScope } from '../../../api/types';
import { KeyboardAwareScreen } from '../../../components/layout/KeyboardAwareScreen';
import { useKeyboardInset } from '../../../hooks/useKeyboardInset';
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
const FILTER_BAR_HEIGHT = 52;

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
  const { isKeyboardVisible } = useKeyboardInset();
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const inputRef = useRef<TextInput>(null);
  const [input, setInput] = useState('');
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [offlineBanner, setOfflineBanner] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showSuggestionsManually, setShowSuggestionsManually] = useState(false);

  const heroOpacity = useRef(new Animated.Value(1)).current;
  const heroTranslateY = useRef(new Animated.Value(0)).current;
  const suggestionsOpacity = useRef(new Animated.Value(0)).current;
  const filterExpandAnim = useRef(new Animated.Value(1)).current;
  const compactFilterOpacity = useRef(new Animated.Value(0)).current;

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

  const showOnboardingCopy =
    showEmptyOverlay && !isKeyboardVisible && !isInputFocused && input.length === 0;
  const showIdleSuggestions = showEmptyOverlay && !showOnboardingCopy;
  const showSuggestionsPanel =
    showIdleSuggestions || (isConversationActive && showSuggestionsManually);

  const [emptyOverlayMounted, setEmptyOverlayMounted] = useState(showEmptyOverlay);
  const emptyOverlayOpacity = useRef(new Animated.Value(showEmptyOverlay ? 1 : 0)).current;

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
        toValue: showOnboardingCopy ? 1 : 0,
        duration: EMPTY_TRANSITION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(heroTranslateY, {
        toValue: showOnboardingCopy ? 0 : -12,
        duration: EMPTY_TRANSITION_MS,
        useNativeDriver: true,
      }),
    ]).start();
  }, [heroOpacity, heroTranslateY, showEmptyOverlay, showOnboardingCopy]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(filterExpandAnim, {
        toValue: isConversationActive ? 0 : 1,
        duration: EMPTY_TRANSITION_MS,
        useNativeDriver: false,
      }),
      Animated.timing(compactFilterOpacity, {
        toValue: isConversationActive ? 1 : 0,
        duration: EMPTY_TRANSITION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(suggestionsOpacity, {
        toValue: showSuggestionsPanel ? 1 : 0,
        duration: EMPTY_TRANSITION_MS,
        useNativeDriver: true,
      }),
    ]).start();
  }, [
    compactFilterOpacity,
    filterExpandAnim,
    isConversationActive,
    showSuggestionsPanel,
    suggestionsOpacity,
  ]);

  const wasConversationActive = useRef(false);
  useEffect(() => {
    if (isConversationActive && !wasConversationActive.current) {
      setShowSuggestionsManually(false);
    }
    wasConversationActive.current = isConversationActive;
  }, [isConversationActive]);

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

  useEffect(() => {
    if (!isInputFocused) {
      return;
    }

    scrollToBottom();
  }, [input, isInputFocused, scrollToBottom]);

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
          setShowSuggestionsManually(false);
        },
      },
    ]);
  }, [startNewChat]);

  const handleOpenHistory = useCallback(() => {
    navigation.navigate('ChatHistory');
  }, [navigation]);

  useLayoutEffect(() => {
    const compactHeader = isConversationActive;
    const headerTitle = compactHeader
      ? conversationTitle?.trim() || 'Chat'
      : 'Chat with Memora AI';

    navigation.setOptions({
      title: headerTitle,
      headerTitleStyle: {
        fontSize: compactHeader
          ? theme.typography.fontSizes.sm
          : theme.typography.fontSizes.md,
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
    isConversationActive,
    messages.length,
    navigation,
    theme.colors.text,
    theme.colors.textSecondary,
    theme.typography.fontSizes.md,
    theme.typography.fontSizes.sm,
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

  const handleSuggestionSend = useCallback(
    (suggestion: string) => {
      sendMessage(suggestion);
      setShowSuggestionsManually(false);
    },
    [sendMessage],
  );

  const selectedCollections = useMemo(
    () => collections.filter((collection) => selectedCollectionIds.includes(collection.id)),
    [collections, selectedCollectionIds],
  );

  const filterBarMaxHeight = filterExpandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FILTER_BAR_HEIGHT],
  });

  const suggestionChips = (
    <ScrollView
      contentContainerStyle={styles.suggestionScrollContent}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {suggestedQuestions.map((suggestion) => (
        <Pressable
          key={suggestion}
          accessibilityRole="button"
          onPress={() =>
            isConversationActive
              ? handleSuggestionSend(suggestion)
              : handleSuggestionPress(suggestion)
          }
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
    </ScrollView>
  );

  const collectionFilter =
    !scopedCollection && collections.length > 0 ? (
      <Animated.View
        pointerEvents={isConversationActive ? 'none' : 'auto'}
        style={[
          styles.filterBar,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
            maxHeight: filterBarMaxHeight,
            opacity: filterExpandAnim,
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
      </Animated.View>
    ) : null;

  const compactCollectionRow =
    isConversationActive && selectedCollections.length > 0 && !scopedCollection ? (
      <Animated.View
        pointerEvents={isConversationActive ? 'auto' : 'none'}
        style={[
          styles.compactFilterRow,
          {
            backgroundColor: theme.colors.background,
            opacity: compactFilterOpacity,
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.compactFilterContent}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {selectedCollections.map((collection) => (
            <Pressable
              key={collection.id}
              onPress={() => toggleCollection(collection.id)}
              style={[
                styles.compactFilterChip,
                {
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.primary,
                  borderRadius: theme.radii.full,
                },
              ]}
            >
              {collection.icon ? (
                <CollectionIconDisplay
                  color={theme.colors.primaryText}
                  icon={collection.icon}
                  size={12}
                />
              ) : null}
              <Text
                numberOfLines={1}
                style={[
                  styles.compactFilterChipText,
                  {
                    color: theme.colors.primaryText,
                    fontSize: theme.typography.fontSizes.xs,
                  },
                ]}
              >
                {collection.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>
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

  return (
    <KeyboardAwareScreen
      backgroundColor={theme.colors.background}
      footer={
        <ChatInput
          ref={inputRef}
          disabled={sendChat.isPending || offlineBanner}
          onBlur={() => setIsInputFocused(false)}
          onChangeText={setInput}
          onFocus={() => setIsInputFocused(true)}
          onSend={handleSend}
          placeholder="Ask about your notes…"
          value={input}
        />
      }
      style={styles.container}
      variant="composer"
    >
      {offlineBanner ? (
        <View style={styles.offlineBanner}>
          <ErrorBanner message="You're offline. Messages can't be sent until you're back online." />
        </View>
      ) : null}
      {scopedCollection ? (
        <CollectionScopeBadge
          collection={scopedCollection}
          compact={isConversationActive}
          onClear={handleClearCollectionScope}
        />
      ) : null}
      {collectionFilter}
      {compactCollectionRow}
      {isConversationActive && !showSuggestionsManually ? (
        <Pressable
          accessibilityLabel="Show suggested questions"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => setShowSuggestionsManually(true)}
          style={({ pressed }) => [
            styles.showSuggestionsButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Ionicons color={theme.colors.textSecondary} name="bulb-outline" size={14} />
          <Text
            style={[
              styles.showSuggestionsText,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSizes.xs,
              },
            ]}
          >
            Show suggestions
          </Text>
        </Pressable>
      ) : null}
      {showSuggestionsPanel && isConversationActive ? (
        <Animated.View
          style={[
            styles.activeSuggestionsBar,
            {
              backgroundColor: theme.colors.background,
              opacity: suggestionsOpacity,
            },
          ]}
        >
          {suggestionChips}
        </Animated.View>
      ) : null}
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
                pointerEvents={showOnboardingCopy ? 'auto' : 'none'}
                style={[
                  styles.emptyHeroContainer,
                  {
                    opacity: heroOpacity,
                    transform: [{ translateY: heroTranslateY }],
                  },
                ]}
              >
                <View style={styles.emptyState}>
                  <View
                    style={[
                      styles.emptyIconWrap,
                      { backgroundColor: theme.colors.surfaceSecondary },
                    ]}
                  >
                    <Ionicons color={theme.colors.primary} name="sparkles" size={22} />
                  </View>
                  <Text
                    style={[
                      styles.emptyTitle,
                      {
                        color: theme.colors.text,
                        fontSize: theme.typography.fontSizes.md,
                        fontWeight: theme.typography.fontWeights.semibold,
                      },
                    ]}
                  >
                    Ask anything about your library
                  </Text>
                  <Text
                    numberOfLines={2}
                    style={[
                      styles.emptySubtitle,
                      {
                        color: theme.colors.textSecondary,
                        fontSize: theme.typography.fontSizes.sm,
                        lineHeight: 20,
                      },
                    ]}
                  >
                    Memora answers with citations from your notes, PDFs, and links.
                  </Text>
                </View>
              </Animated.View>

              <Animated.View
                pointerEvents={showIdleSuggestions ? 'auto' : 'none'}
                style={[styles.suggestionsContainer, { opacity: suggestionsOpacity }]}
              >
                <Text
                  style={[
                    styles.suggestionsLabel,
                    {
                      color: theme.colors.textSecondary,
                      fontSize: theme.typography.fontSizes.xs,
                      fontWeight: theme.typography.fontWeights.medium,
                    },
                  ]}
                >
                  Suggested
                </Text>
                {suggestionChips}
              </Animated.View>
            </Animated.View>
          ) : null}
        </View>
    </KeyboardAwareScreen>
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
    paddingTop: 12,
    paddingBottom: 8,
  },
  listContentIdle: {
    flexGrow: 1,
    paddingTop: 16,
  },
  listContentActive: {
    flexGrow: 1,
    paddingTop: 4,
  },
  emptyOverlay: {
    ...StyleSheet.absoluteFill,
  },
  emptyHeroContainer: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
  },
  suggestionsContainer: {
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 20,
    position: 'absolute',
    right: 0,
    top: 120,
  },
  suggestionsLabel: {
    marginBottom: 8,
  },
  suggestionScrollContent: {
    gap: 8,
    paddingRight: 16,
  },
  suggestionChip: {
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 260,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suggestionChipText: {
    lineHeight: 18,
  },
  emptyIconWrap: {
    alignItems: 'center',
    borderRadius: 14,
    height: 40,
    justifyContent: 'center',
    marginBottom: 4,
    width: 40,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
  },
  showSuggestionsButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 4,
    marginLeft: 16,
    marginTop: 2,
    paddingVertical: 4,
  },
  showSuggestionsText: {},
  activeSuggestionsBar: {
    overflow: 'hidden',
    paddingBottom: 4,
    paddingHorizontal: 16,
    paddingTop: 2,
  },
  compactFilterRow: {
    paddingBottom: 2,
    paddingTop: 2,
  },
  compactFilterContent: {
    gap: 6,
    paddingHorizontal: 16,
  },
  compactFilterChip: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 4,
    maxWidth: 160,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  compactFilterChipText: {
    flexShrink: 1,
    lineHeight: 16,
  },
  loadingRow: {
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 2,
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
    gap: 6,
    maxWidth: '88%',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typingLabel: {
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  filterBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingVertical: 6,
  },
  filterContent: {
    gap: 8,
    paddingHorizontal: 16,
  },
  filterChip: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 180,
    minHeight: 32,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterChipContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  filterChipText: {},
});
