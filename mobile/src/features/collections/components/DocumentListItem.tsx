import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DocumentSourceType, SafeDocument } from '../../../api/types';
import { EmbeddingStatusBadge } from '../../documents/components/EmbeddingStatusBadge';
import { useTheme } from '../../../theme/ThemeProvider';

interface DocumentListItemProps {
  document: SafeDocument;
  onPress?: () => void;
}

const SOURCE_LABELS: Record<DocumentSourceType, string> = {
  text: 'Text',
  url: 'URL',
  pdf: 'PDF',
  youtube: 'YouTube',
  upload: 'Upload',
};

export function DocumentListItem({ document, onPress }: DocumentListItemProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: onPress && pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text
        numberOfLines={2}
        style={[
          styles.title,
          {
            color: theme.colors.text,
            fontSize: theme.typography.fontSizes.md,
            fontWeight: theme.typography.fontWeights.medium,
          },
        ]}
      >
        {document.title}
      </Text>
      <View style={styles.badges}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: theme.colors.surfaceSecondary,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSizes.xs,
                fontWeight: theme.typography.fontWeights.medium,
              },
            ]}
          >
            {SOURCE_LABELS[document.sourceType]}
          </Text>
        </View>
        <EmbeddingStatusBadge status={document.embeddingStatus} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  title: {},
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
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
