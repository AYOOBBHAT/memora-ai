import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ONBOARDING_STEPS } from '../constants';
import { useTheme } from '../../../theme/ThemeProvider';

interface OnboardingLayoutProps {
  step: number;
  children: ReactNode;
  footer?: ReactNode;
  onSkip?: () => void;
  showSkip?: boolean;
}

export function OnboardingLayout({
  step,
  children,
  footer,
  onSkip,
  showSkip = true,
}: OnboardingLayoutProps) {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.topRow}>
        <View style={styles.progressRow}>
          {Array.from({ length: ONBOARDING_STEPS }, (_, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber <= step;
            return (
              <View
                key={stepNumber}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: isActive ? theme.colors.primary : theme.colors.border,
                    width: stepNumber === step ? 24 : 8,
                  },
                ]}
              />
            );
          })}
        </View>

        {showSkip && onSkip ? (
          <Pressable
            accessibilityLabel="Skip onboarding"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onSkip}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>Skip</Text>
          </Pressable>
        ) : (
          <View style={styles.skipPlaceholder} />
        )}
      </View>

      <View style={styles.content}>{children}</View>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

interface OnboardingPrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function OnboardingPrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
}: OnboardingPrimaryButtonProps) {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        {
          backgroundColor: theme.colors.primary,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.primaryButtonText,
          {
            color: theme.colors.primaryText,
            fontSize: theme.typography.fontSizes.md,
            fontWeight: theme.typography.fontWeights.semibold,
          },
        ]}
      >
        {loading ? 'Please wait…' : label}
      </Text>
    </Pressable>
  );
}

interface OnboardingSecondaryButtonProps {
  label: string;
  onPress: () => void;
}

export function OnboardingSecondaryButton({ label, onPress }: OnboardingSecondaryButtonProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Text
        style={{
          color: theme.colors.primary,
          fontSize: theme.typography.fontSizes.md,
          fontWeight: theme.typography.fontWeights.medium,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressDot: {
    height: 8,
    borderRadius: 999,
  },
  skipText: {
    fontSize: 15,
  },
  skipPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    textAlign: 'center',
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
});
