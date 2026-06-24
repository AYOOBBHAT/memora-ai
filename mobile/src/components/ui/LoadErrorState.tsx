import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';

interface LoadErrorStateProps {
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
  backLabel?: string;
  retryLabel?: string;
  isRetrying?: boolean;
  compact?: boolean;
}

export function LoadErrorState({
  message,
  onRetry,
  onBack,
  backLabel = 'Go back',
  retryLabel = 'Try again',
  isRetrying = false,
  compact = false,
}: LoadErrorStateProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        compact ? styles.compact : null,
        { backgroundColor: theme.colors.background },
      ]}
    >
      {!compact ? (
        <Ionicons color={theme.colors.error} name="alert-circle-outline" size={40} />
      ) : null}
      <Text
        style={[
          styles.message,
          {
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSizes.sm,
          },
        ]}
      >
        {message}
      </Text>
      <View style={styles.actions}>
        {onRetry ? (
          <Pressable
            accessibilityRole="button"
            disabled={isRetrying}
            onPress={onRetry}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: theme.colors.primary,
                opacity: pressed || isRetrying ? 0.85 : 1,
              },
            ]}
          >
            {isRetrying ? (
              <ActivityIndicator color={theme.colors.primaryText} />
            ) : (
              <Text
                style={[
                  styles.buttonText,
                  {
                    color: theme.colors.primaryText,
                    fontWeight: theme.typography.fontWeights.semibold,
                  },
                ]}
              >
                {retryLabel}
              </Text>
            )}
          </Pressable>
        ) : null}
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            style={({ pressed }) => [
              styles.textButton,
              { opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Text style={{ color: theme.colors.primary, fontSize: theme.typography.fontSizes.sm }}>
              {backLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 24,
  },
  compact: {
    flex: 0,
    paddingVertical: 16,
  },
  message: {
    lineHeight: 22,
    textAlign: 'center',
  },
  actions: {
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  button: {
    alignItems: 'center',
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 140,
    paddingHorizontal: 20,
  },
  buttonText: {
    fontSize: 15,
  },
  textButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
});
