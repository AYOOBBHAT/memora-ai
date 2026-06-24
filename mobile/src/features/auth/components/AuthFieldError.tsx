import { StyleSheet, Text } from 'react-native';

import { useTheme } from '../../../theme/ThemeProvider';

interface AuthFieldErrorProps {
  message?: string | null;
}

export function AuthFieldError({ message }: AuthFieldErrorProps) {
  const { theme } = useTheme();

  if (!message) {
    return null;
  }

  return (
    <Text
      accessibilityLiveRegion="polite"
      style={[
        styles.error,
        {
          color: theme.colors.error,
          fontSize: theme.typography.fontSizes.sm,
        },
      ]}
    >
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  error: {
    lineHeight: 18,
    marginTop: 6,
  },
});
