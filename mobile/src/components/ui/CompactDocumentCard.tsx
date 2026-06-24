import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { RecentDocumentItem } from '../../api/types';
import { formatRelativeTime } from '../../features/documents/utils/formatDocument';
import { useTheme } from '../../theme/ThemeProvider';
import { DocumentThumbnail } from './DocumentThumbnail';
import { SourceBadge } from './SourceBadge';

interface CompactDocumentCardProps {
  document: RecentDocumentItem;
  onPress?: () => void;
}

export function CompactDocumentCard({ document, onPress }: CompactDocumentCardProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.lg,
          opacity: onPress && pressed ? 0.9 : 1,
        },
      ]}
    >
      <DocumentThumbnail size="md" sourceType={document.sourceType} />
      <View style={styles.content}>
        <Text
          numberOfLines={1}
          style={[
            styles.title,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSizes.sm,
              fontWeight: theme.typography.fontWeights.semibold,
            },
          ]}
        >
          {document.title}
        </Text>
        <View style={styles.metaRow}>
          <SourceBadge sourceType={document.sourceType} />
          {document.collectionName ? (
            <Text
              numberOfLines={1}
              style={[
                styles.collection,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSizes.xs,
                },
              ]}
            >
              {document.collectionName}
            </Text>
          ) : null}
        </View>
      </View>
      <Text
        style={[
          styles.time,
          {
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSizes.xs,
          },
        ]}
      >
        {formatRelativeTime(document.updatedAt)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    gap: 6,
  },
  title: {
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  collection: {
    flexShrink: 1,
  },
  time: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
});
