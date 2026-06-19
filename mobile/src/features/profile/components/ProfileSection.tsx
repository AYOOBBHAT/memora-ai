import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../theme/ThemeProvider';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface ProfileMenuRowProps {
  icon: IoniconName;
  label: string;
  accessibilityLabel?: string;
  destructive?: boolean;
  showChevron?: boolean;
  onPress?: () => void;
}

export function ProfileMenuRow({
  icon,
  label,
  accessibilityLabel,
  destructive = false,
  showChevron = true,
  onPress,
}: ProfileMenuRowProps) {
  const { theme } = useTheme();
  const labelColor = destructive ? theme.colors.error : theme.colors.text;
  const iconColor = destructive ? theme.colors.error : theme.colors.primary;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: `${theme.colors.border}AA`,
          borderRadius: theme.radii.lg,
          opacity: onPress && pressed ? 0.9 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: destructive ? `${theme.colors.error}14` : `${theme.colors.primary}14`,
            borderRadius: theme.radii.md,
          },
        ]}
      >
        <Ionicons color={iconColor} name={icon} size={20} />
      </View>
      <Text
        style={[
          styles.label,
          {
            color: labelColor,
            fontSize: theme.typography.fontSizes.md,
            fontWeight: theme.typography.fontWeights.medium,
          },
        ]}
      >
        {label}
      </Text>
      {showChevron && onPress ? (
        <Ionicons color={theme.colors.textSecondary} name="chevron-forward" size={18} />
      ) : null}
    </Pressable>
  );
}

interface ProfileSectionProps {
  title: string;
  children: ReactNode;
}

export function ProfileSection({ title, children }: ProfileSectionProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.section}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSizes.xs,
            fontWeight: theme.typography.fontWeights.semibold,
          },
        ]}
      >
        {title.toUpperCase()}
      </Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  sectionTitle: {
    letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  sectionContent: {
    gap: 8,
  },
  row: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconWrap: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  label: {
    flex: 1,
  },
});
