import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../theme/ThemeProvider';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.error,
        },
      ]}
    >
      <Text
        style={[
          styles.message,
          {
            color: theme.colors.error,
            fontSize: theme.typography.fontSizes.sm,
          },
        ]}
      >
        {message}
      </Text>
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={({ pressed }) => [styles.retryButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text
            style={[
              styles.retryText,
              {
                color: theme.colors.primary,
                fontSize: theme.typography.fontSizes.sm,
                fontWeight: theme.typography.fontWeights.semibold,
              },
            ]}
          >
            Retry
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  message: {
    textAlign: 'center',
  },
  retryButton: {
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  retryText: {
    textAlign: 'center',
  },
});
