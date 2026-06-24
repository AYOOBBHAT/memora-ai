import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SafeCollection } from '../../../api/types';
import { formatRelativeTime } from '../../documents/utils/formatDocument';
import { CollectionIconDisplay } from './CollectionIconDisplay';
import { useTheme } from '../../../theme/ThemeProvider';

interface CollectionCardProps {
  collection: SafeCollection;
  documentCount?: number;
  onPress: () => void;
}

export const CollectionCard = memo(function CollectionCard({
  collection,
  documentCount = 0,
  onPress,
}: CollectionCardProps) {
  const { theme } = useTheme();
  const countLabel = documentCount === 1 ? '1 document' : `${documentCount} documents`;

  return (
    <Pressable
      accessibilityLabel={`Open collection ${collection.name}`}
      accessibilityRole="button"
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.lg,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.md,
          },
        ]}
      >
        <CollectionIconDisplay color={theme.colors.icon} icon={collection.icon} size={20} />
      </View>
      <View style={styles.textBlock}>
        <Text
          numberOfLines={1}
          style={[
            styles.name,
            {
              color: theme.colors.text,
              fontSize: theme.typography.bodyLarge.fontSize,
              fontWeight: theme.typography.fontWeights.semibold,
              lineHeight: theme.typography.bodyLarge.lineHeight,
            },
          ]}
        >
          {collection.name}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            styles.subtitle,
            {
              color: theme.colors.textMuted,
              fontSize: theme.typography.caption.fontSize,
              lineHeight: theme.typography.caption.lineHeight,
            },
          ]}
        >
          {collection.description?.trim() || countLabel}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            styles.meta,
            {
              color: theme.colors.textMuted,
              fontSize: theme.typography.caption.fontSize,
            },
          ]}
        >
          {countLabel} · Updated {formatRelativeTime(collection.updatedAt).toLowerCase()}
        </Text>
      </View>
      <Ionicons color={theme.colors.textMuted} name="chevron-forward" size={18} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  iconWrap: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  name: {},
  subtitle: {},
  meta: {},
});
