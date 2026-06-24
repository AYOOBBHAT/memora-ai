import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '../../../theme/ThemeProvider';

interface AuthPrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
}

export function AuthPrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  loadingLabel,
}: AuthPrimaryButtonProps) {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.colors.primary,
          borderRadius: theme.radii.lg,
          opacity: isDisabled ? 0.65 : pressed ? 0.9 : 1,
        },
      ]}
    >
      {loading ? (
        <>
          <ActivityIndicator color={theme.colors.primaryText} />
          {loadingLabel ? (
            <Text
              style={[
                styles.loadingLabel,
                {
                  color: theme.colors.primaryText,
                  fontSize: theme.typography.fontSizes.md,
                  fontWeight: theme.typography.fontWeights.semibold,
                },
              ]}
            >
              {loadingLabel}
            </Text>
          ) : null}
        </>
      ) : (
        <Text
          style={[
            styles.label,
            {
              color: theme.colors.primaryText,
              fontSize: theme.typography.fontSizes.md,
              fontWeight: theme.typography.fontWeights.semibold,
            },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: 56,
  },
  label: {},
  loadingLabel: {},
});
