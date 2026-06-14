import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '../../../theme/ThemeProvider';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChangeText,
  onSend,
  disabled = false,
  placeholder = 'Ask a question…',
}: ChatInputProps) {
  const { theme } = useTheme();
  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && !disabled;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      ]}
    >
      <TextInput
        editable={!disabled}
        multiline
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surfaceSecondary,
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
        disabled={!canSend}
        onPress={onSend}
        style={({ pressed }) => [
          styles.sendButton,
          {
            backgroundColor: canSend ? theme.colors.primary : theme.colors.surfaceSecondary,
            opacity: pressed && canSend ? 0.85 : 1,
          },
        ]}
      >
        <Ionicons
          color={canSend ? theme.colors.primaryText : theme.colors.textSecondary}
          name="send"
          size={20}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  sendButton: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
});
