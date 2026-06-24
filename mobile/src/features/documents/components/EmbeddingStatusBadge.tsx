import type { DocumentEmbeddingStatus } from '../../../api/types';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../theme/ThemeProvider';

interface EmbeddingStatusBadgeProps {
  status: DocumentEmbeddingStatus;
}

const STATUS_LABELS: Record<DocumentEmbeddingStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Embedded',
  failed: 'Failed',
};

export function EmbeddingStatusBadge({ status }: EmbeddingStatusBadgeProps) {
  const { theme } = useTheme();
  const isFailed = status === 'failed';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: isFailed ? 'transparent' : theme.colors.surfaceSecondary,
          borderColor: isFailed ? theme.colors.error : theme.colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          {
            color: isFailed ? theme.colors.error : theme.colors.textSecondary,
            fontSize: theme.typography.fontSizes.xs,
            fontWeight: theme.typography.fontWeights.medium,
          },
        ]}
      >
        {STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
