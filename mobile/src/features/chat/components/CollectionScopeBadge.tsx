import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ChatCollectionScope } from '../../../api/types';
import { DEFAULT_COLLECTION_COLOR } from '../../collections/constants';
import { CollectionIconDisplay } from '../../collections/components/CollectionIconDisplay';
import { useTheme } from '../../../theme/ThemeProvider';

interface CollectionScopeBadgeProps {
  collection: ChatCollectionScope;
  onClear: () => void;
}

export function CollectionScopeBadge({ collection, onClear }: CollectionScopeBadgeProps) {
  const { theme } = useTheme();
  const accentColor = collection.color ?? DEFAULT_COLLECTION_COLOR;

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.chip,
          {
            backgroundColor: `${accentColor}14`,
            borderColor: `${accentColor}44`,
            borderRadius: theme.radii.full,
          },
        ]}
      >
        {collection.icon ? (
          <CollectionIconDisplay color={accentColor} icon={collection.icon} size={16} />
        ) : (
          <Ionicons color={accentColor} name="folder-outline" size={16} />
        )}
        <View style={styles.textWrap}>
          <Text
            style={[
              styles.label,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSizes.xs,
              },
            ]}
          >
            Chatting with
          </Text>
          <Text
            numberOfLines={1}
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
        </View>
        <Pressable
          accessibilityLabel="Clear collection scope"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onClear}
          style={({ pressed }) => [styles.clearButton, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons color={theme.colors.textSecondary} name="close" size={18} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  chip: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  textWrap: {
    flex: 1,
    gap: 1,
  },
  label: {
    letterSpacing: 0.2,
  },
  name: {
    lineHeight: 18,
  },
  clearButton: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
});
