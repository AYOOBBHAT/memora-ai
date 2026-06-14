import type { DocumentEmbeddingStatus } from '../../../api/types';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../theme/ThemeProvider';

interface EmbeddingStatusBadgeProps {
  status: DocumentEmbeddingStatus;
}

const STATUS_CONFIG: Record<
  DocumentEmbeddingStatus,
  { label: string; backgroundColor: string; textColor: string }
> = {
  pending: {
    label: 'Pending',
    backgroundColor: '#F1F5F9',
    textColor: '#64748B',
  },
  processing: {
    label: 'Processing',
    backgroundColor: '#EEF2FF',
    textColor: '#4F46E5',
  },
  completed: {
    label: 'Embedded',
    backgroundColor: '#DCFCE7',
    textColor: '#15803D',
  },
  failed: {
    label: 'Failed',
    backgroundColor: '#FEE2E2',
    textColor: '#DC2626',
  },
};

export function EmbeddingStatusBadge({ status }: EmbeddingStatusBadgeProps) {
  const { theme } = useTheme();
  const config = STATUS_CONFIG[status];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.backgroundColor,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          {
            color: config.textColor,
            fontSize: theme.typography.fontSizes.xs,
            fontWeight: theme.typography.fontWeights.medium,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
