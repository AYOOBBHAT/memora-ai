import { Ionicons } from '@expo/vector-icons';
import { forwardRef } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInput as TextInputType } from 'react-native';

import { useTheme } from '../../../theme/ThemeProvider';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const ChatInput = forwardRef<TextInputType, ChatInputProps>(function ChatInput(
  {
    value,
    onChangeText,
    onSend,
    disabled = false,
    placeholder = 'Ask Memora anything...',
    onFocus,
    onBlur,
  },
  ref,
) {
  const { theme } = useTheme();
  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && !disabled;

  return (
    <View
      style={[
        styles.container,
        theme.elevation.soft,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      ]}
    >
      <TextInput
        ref={ref}
        accessibilityLabel="Chat message input"
        editable={!disabled}
        multiline
        onBlur={onBlur}
        onChangeText={onChangeText}
        onFocus={onFocus}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.border,
            color: theme.colors.text,
            fontSize: theme.typography.fontSizes.md,
          },
        ]}
        value={value}
      />
      <Pressable
        accessibilityLabel="Send message"
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSend }}
        disabled={!canSend}
        onPress={onSend}
        style={({ pressed }) => [
          styles.sendButton,
          theme.elevation.soft,
          {
            backgroundColor: canSend ? theme.colors.primary : theme.colors.surfaceSecondary,
            opacity: pressed && canSend ? 0.88 : 1,
            transform: [{ scale: pressed && canSend ? 0.94 : 1 }],
          },
        ]}
      >
        <Ionicons
          color={canSend ? theme.colors.primaryText : theme.colors.textSecondary}
          name="arrow-up"
          size={20}
        />
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  input: {
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    maxHeight: 120,
    minHeight: 48,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
  },
  sendButton: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
});
