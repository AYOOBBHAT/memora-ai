import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SafeCollection } from '../../../api/types';
import { DEFAULT_COLLECTION_COLOR, DEFAULT_COLLECTION_ICON } from '../constants';
import { useTheme } from '../../../theme/ThemeProvider';

interface CollectionCardProps {
  collection: SafeCollection;
  onPress: () => void;
}

export function CollectionCard({ collection, onPress }: CollectionCardProps) {
  const { theme } = useTheme();
  const accentColor = collection.color ?? DEFAULT_COLLECTION_COLOR;
  const icon = collection.icon ?? DEFAULT_COLLECTION_ICON;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.colorStrip, { backgroundColor: accentColor }]} />
      <View style={styles.content}>
        <Text style={styles.icon}>{icon}</Text>
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
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  colorStrip: {
    width: 6,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  icon: {
    fontSize: 28,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  name: {},
  description: {},
});
