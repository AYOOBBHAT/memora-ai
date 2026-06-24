import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onActionPress?: () => void;
  children?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onActionPress,
  children,
}: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.lg,
        },
      ]}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.text,
            fontSize: theme.typography.h3.fontSize,
            fontWeight: theme.typography.h3.fontWeight,
            lineHeight: theme.typography.h3.lineHeight,
          },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.subtitle,
          {
            color: theme.colors.textMuted,
            fontSize: theme.typography.body.fontSize,
            lineHeight: theme.typography.body.lineHeight,
          },
        ]}
      >
        {subtitle}
      </Text>
      {actionLabel && onActionPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onActionPress}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: theme.radii.lg,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              {
                color: theme.colors.primaryText,
                fontSize: theme.typography.bodyLarge.fontSize,
                fontWeight: theme.typography.fontWeights.semibold,
              },
            ]}
          >
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  icon: {
    fontSize: 32,
    marginBottom: 4,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 4,
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 48,
    paddingHorizontal: 24,
  },
  buttonText: {},
});
