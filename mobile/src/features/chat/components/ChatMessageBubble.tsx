import { StyleSheet, Text, View } from 'react-native';

import type { ChatCitationSource } from '../../../api/types';
import type { ChatMessage } from '../../../stores/chat.store';
import { useTheme } from '../../../theme/ThemeProvider';

import { SourceCitationList } from './SourceCitationList';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onSourcePress: (source: ChatCitationSource) => void;
}

export function ChatMessageBubble({ message, onSourcePress }: ChatMessageBubbleProps) {
  const { theme } = useTheme();
  const isUser = message.role === 'user';
  const isError = Boolean(message.error);

  const bubbleBackground = isUser
    ? theme.colors.primary
    : isError
      ? theme.colors.surfaceSecondary
      : theme.colors.surface;

  const textColor = isUser ? theme.colors.primaryText : theme.colors.text;
  const borderColor = isError ? theme.colors.error : theme.colors.border;

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: bubbleBackground,
            borderColor,
            borderWidth: isUser ? 0 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.content,
            {
              color: isError ? theme.colors.error : textColor,
              fontSize: theme.typography.fontSizes.md,
            },
          ]}
        >
          {message.content}
        </Text>
        {!isUser && message.sources && message.sources.length > 0 ? (
          <SourceCitationList onSourcePress={onSourcePress} sources={message.sources} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  rowUser: {
    alignItems: 'flex-end',
  },
  rowAssistant: {
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  content: {
    lineHeight: 22,
  },
});
