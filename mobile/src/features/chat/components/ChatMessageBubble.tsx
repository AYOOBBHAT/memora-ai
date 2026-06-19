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
  const slideAnim = useRef(new Animated.Value(8)).current;
  const isUser = message.role === 'user';
  const isError = Boolean(message.error);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const textColor = isUser ? theme.colors.primaryText : isError ? theme.colors.error : theme.colors.text;
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
              theme.elevation.soft,
              {
                backgroundColor: theme.colors.primary,
                borderBottomRightRadius: 6,
                borderRadius: 20,
              },
            ]}
          >
            <Text
              style={[
                styles.userText,
                {
                  color: theme.colors.primaryText,
                  fontSize: theme.typography.fontSizes.md,
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
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: `${theme.colors.primary}18`,
            borderRadius: theme.radii.full,
          },
        ]}
      >
        <Ionicons color={theme.colors.primary} name="sparkles" size={16} />
      </View>
      <View style={styles.assistantColumn}>
        <View
          style={[
            styles.assistantBubble,
            theme.elevation.soft,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: isError ? `${theme.colors.error}55` : `${theme.colors.border}AA`,
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
                },
              ]}
            >
              {message.content}
            </Text>
          ) : (
            <ChatMarkdown content={message.content} isError={isError} textColor={textColor} />
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
    marginBottom: 14,
    paddingHorizontal: 16,
  },
  rowAssistant: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
    paddingHorizontal: 16,
  },
  userColumn: {
    alignItems: 'flex-end',
    gap: 4,
    maxWidth: '78%',
  },
  userBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userText: {
    lineHeight: 22,
  },
  assistantColumn: {
    flex: 1,
    gap: 4,
    maxWidth: '92%',
  },
  avatar: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    marginTop: 4,
    width: 32,
  },
  assistantBubble: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: {
    lineHeight: 22,
  },
  timestamp: {
    paddingHorizontal: 4,
  },
});
