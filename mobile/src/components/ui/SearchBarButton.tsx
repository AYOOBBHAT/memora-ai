import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';

interface SearchBarButtonProps {
  placeholder?: string;
  onPress: () => void;
}

export function SearchBarButton({
  placeholder = 'Search notes, PDFs, websites and YouTube…',
  onPress,
}: SearchBarButtonProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={placeholder}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.lg,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <Ionicons color={theme.colors.textMuted} name="search-outline" size={20} />
      <Text
        numberOfLines={1}
        style={[
          styles.placeholder,
          {
            color: theme.colors.textMuted,
            fontSize: theme.typography.body.fontSize,
            lineHeight: theme.typography.body.lineHeight,
          },
        ]}
      >
        {placeholder}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14,
    width: '100%',
  },
  placeholder: {
    flex: 1,
  },
});
