import { Ionicons } from '@expo/vector-icons';
import { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import type { ChatCitationSource } from '../../../api/types';
import type { ChatMessage } from '../../../stores/chat.store';
import { formatRelativeTime } from '../../documents/utils/formatDocument';
import { useTheme } from '../../../theme/ThemeProvider';

import { ChatMarkdown } from './ChatMarkdown';
import { SourceCitationList } from './SourceCitationList';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onSourcePress: (source: ChatCitationSource) => void;
}

function formatMessageTime(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function ChatMessageBubbleComponent({ message, onSourcePress }: ChatMessageBubbleProps) {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(6)).current;
  const isUser = message.role === 'user';
  const isError = Boolean(message.error);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const timeLabel = formatMessageTime(message.createdAt);

  if (isUser) {
    return (
      <Animated.View
        style={[
          styles.rowUser,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.userColumn}>
          <View
            style={[
              styles.userBubble,
              {
                backgroundColor: theme.colors.userBubble,
                borderRadius: theme.radii.lg,
              },
            ]}
          >
            <Text
              style={[
                styles.userText,
                {
                  color: theme.colors.userBubbleText,
                  fontSize: theme.typography.fontSizes.md,
                  lineHeight: 24,
                },
              ]}
            >
              {message.content}
            </Text>
          </View>
          {timeLabel ? (
            <Text
              style={[
                styles.timestamp,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSizes.xs,
                },
              ]}
            >
              {timeLabel}
            </Text>
          ) : null}
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.rowAssistant,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.assistantColumn}>
        <Text
          style={[
            styles.assistantLabel,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSizes.xs,
              fontWeight: theme.typography.fontWeights.medium,
            },
          ]}
        >
          Memora
        </Text>
        <View
          style={[
            styles.assistantBubble,
            {
              backgroundColor: theme.colors.aiSurface,
              borderColor: isError ? theme.colors.error : theme.colors.border,
              borderRadius: theme.radii.lg,
            },
          ]}
        >
          {isError ? (
            <Text
              style={[
                styles.errorText,
                {
                  color: theme.colors.error,
                  fontSize: theme.typography.fontSizes.md,
                  lineHeight: 24,
                },
              ]}
            >
              {message.content}
            </Text>
          ) : (
            <ChatMarkdown
              content={message.content}
              isError={isError}
              textColor={theme.colors.text}
            />
          )}
          {message.sources && message.sources.length > 0 ? (
            <SourceCitationList onSourcePress={onSourcePress} sources={message.sources} />
          ) : null}
        </View>
        {timeLabel ? (
          <Text
            style={[
              styles.timestamp,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSizes.xs,
              },
            ]}
          >
            {timeLabel} · {formatRelativeTime(message.createdAt)}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

export const ChatMessageBubble = memo(
  ChatMessageBubbleComponent,
  (prev, next) =>
    prev.message.id === next.message.id &&
    prev.message.content === next.message.content &&
    prev.message.error === next.message.error &&
    prev.message.sources === next.message.sources,
);

const styles = StyleSheet.create({
  rowUser: {
    alignItems: 'flex-end',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  rowAssistant: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  userColumn: {
    alignItems: 'flex-end',
    gap: 6,
    maxWidth: '82%',
  },
  userBubble: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  userText: {},
  assistantColumn: {
    gap: 8,
    maxWidth: '100%',
  },
  assistantLabel: {
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  assistantBubble: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  errorText: {},
  timestamp: {
    paddingHorizontal: 2,
  },
});
