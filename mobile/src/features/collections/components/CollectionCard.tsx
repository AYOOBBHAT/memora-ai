import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SafeCollection } from '../../../api/types';
import { CollectionIconDisplay } from './CollectionIconDisplay';
import { useTheme } from '../../../theme/ThemeProvider';

interface CollectionCardProps {
  collection: SafeCollection;
  onPress: () => void;
}

export const CollectionCard = memo(function CollectionCard({ collection, onPress }: CollectionCardProps) {
  const { theme } = useTheme();

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
        <CollectionIconDisplay color={theme.colors.icon} icon={collection.icon} size={22} />
      </View>
      <View style={styles.textBlock}>
        <Text
          numberOfLines={1}
          style={[
            styles.name,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSizes.md,
              fontWeight: theme.typography.fontWeights.semibold,
            },
          ]}
        >
          {collection.name}
        </Text>
        {collection.description ? (
          <Text
            numberOfLines={2}
            style={[
              styles.description,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSizes.sm,
              },
            ]}
          >
            {collection.description}
          </Text>
        ) : null}
      </View>
      <View style={[styles.accentDot, { backgroundColor: theme.colors.primary }]} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  iconWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  name: {},
  description: {
    lineHeight: 20,
  },
  accentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
