import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SafeCollection } from '../../api/types';
import { CollectionIconDisplay } from '../../features/collections/components/CollectionIconDisplay';
import { formatRelativeTime } from '../../features/documents/utils/formatDocument';
import { useTheme } from '../../theme/ThemeProvider';

interface CollectionPreviewCardProps {
  collection: SafeCollection;
  documentCount?: number;
  onPress: () => void;
}

export function CollectionPreviewCard({
  collection,
  documentCount = 0,
  onPress,
}: CollectionPreviewCardProps) {
  const { theme } = useTheme();
  const countLabel = documentCount === 1 ? '1 document' : `${documentCount} documents`;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.lg,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: theme.colors.surfaceSecondary,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.md,
          },
        ]}
      >
        <CollectionIconDisplay color={theme.colors.icon} icon={collection.icon} size={20} />
      </View>
      <Text
        numberOfLines={2}
        style={[
          styles.name,
          {
            color: theme.colors.text,
            fontSize: theme.typography.fontSizes.sm,
            fontWeight: theme.typography.fontWeights.semibold,
          },
        ]}
      >
        {collection.name}
      </Text>
      <Text
        style={[
          styles.meta,
          {
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSizes.xs,
          },
        ]}
      >
        {countLabel}
      </Text>
      <Text
        style={[
          styles.meta,
          {
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSizes.xs,
          },
        ]}
      >
        Updated {formatRelativeTime(collection.updatedAt).toLowerCase()}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 6,
    marginRight: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  name: {
    lineHeight: 20,
    minHeight: 40,
  },
  meta: {
    lineHeight: 16,
  },
});
