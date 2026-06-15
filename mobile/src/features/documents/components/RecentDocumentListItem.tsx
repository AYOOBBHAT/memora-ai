import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DocumentSourceType, RecentDocumentItem } from '../../../api/types';
import { formatRelativeTime } from '../utils/formatDocument';
import { useTheme } from '../../../theme/ThemeProvider';

interface RecentDocumentListItemProps {
  document: RecentDocumentItem;
  onPress?: () => void;
}

const SOURCE_LABELS: Record<DocumentSourceType, string> = {
  text: 'Text',
  url: 'URL',
  pdf: 'PDF',
  youtube: 'YouTube',
  upload: 'Upload',
};

export function RecentDocumentListItem({ document, onPress }: RecentDocumentListItemProps) {
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
      <View style={styles.meta}>
        {document.collectionName ? (
          <Text
            numberOfLines={1}
            style={[
              styles.metaText,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSizes.sm,
              },
            ]}
          >
            {document.collectionName}
          </Text>
        ) : null}
        {document.collectionName ? (
          <Text style={[styles.separator, { color: theme.colors.textSecondary }]}>·</Text>
        ) : null}
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
        <Text style={[styles.separator, { color: theme.colors.textSecondary }]}>·</Text>
        <Text
          style={[
            styles.metaText,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSizes.sm,
            },
          ]}
        >
          {formatRelativeTime(document.updatedAt)}
        </Text>
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
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    flexShrink: 1,
  },
  separator: {
    fontSize: 12,
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
