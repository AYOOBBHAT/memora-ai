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

import type { ChatCitationSource } from '../../../api/types';
import { ChatInput } from '../components/ChatInput';
import { ChatMessageBubble } from '../components/ChatMessageBubble';
import { useSendChat } from '../../../hooks/mutations/useSendChat';
import { useCollections } from '../../../hooks/queries/useCollections';
import { getApiErrorMessage } from '../../../lib/apiError';
import type { ChatStackParamList } from '../../../navigation/types';
import {
  createChatMessageId,
  useChatStore,
  type ChatMessage,
} from '../../../stores/chat.store';
import { useTheme } from '../../../theme/ThemeProvider';

type Props = NativeStackScreenProps<ChatStackParamList, 'ChatMain'>;

export function ChatScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const [input, setInput] = useState('');
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);

  const messages = useChatStore((state) => state.messages);
  const addMessage = useChatStore((state) => state.addMessage);
  const clearMessages = useChatStore((state) => state.clearMessages);

  const { data: collections = [] } = useCollections();
  const sendChat = useSendChat();

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

  const handleClearConversation = useCallback(() => {
    Alert.alert('Clear conversation', 'Remove all messages from this chat?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => clearMessages(),
      },
    ]);
  }, [clearMessages]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        messages.length > 0 ? (
          <Pressable
            accessibilityLabel="Clear conversation"
            accessibilityRole="button"
            hitSlop={8}
            onPress={handleClearConversation}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, paddingHorizontal: 4 }]}
          >
            <Ionicons color={theme.colors.textSecondary} name="trash-outline" size={22} />
          </Pressable>
        ) : null,
    });
  }, [handleClearConversation, messages.length, navigation, theme.colors.textSecondary]);

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

  const toggleCollection = useCallback((collectionId: string) => {
    setSelectedCollectionIds((current) =>
      current.includes(collectionId)
        ? current.filter((id) => id !== collectionId)
        : [...current, collectionId],
    );
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
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

    const collectionIds = selectedCollectionIds.length > 0 ? selectedCollectionIds : undefined;

    sendChat.mutate(
      { message: trimmed, collectionIds },
      {
        onSuccess: (response) => {
          addMessage({
            id: createChatMessageId(),
            role: 'assistant',
            content: response.answer,
            sources: response.sources,
            createdAt: new Date().toISOString(),
          });
        },
        onError: (error) => {
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
      },
    );
  }, [addMessage, input, selectedCollectionIds, sendChat]);

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
    collections.length > 0 ? (
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

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
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
          disabled={sendChat.isPending}
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
  flex: {
    flex: 1,
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
