import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ChatCollectionScope } from '../../../api/types';
import { DEFAULT_COLLECTION_COLOR } from '../../collections/constants';
import { useTheme } from '../../../theme/ThemeProvider';

interface CollectionScopeBadgeProps {
  collection: ChatCollectionScope;
  onClear: () => void;
}

export function CollectionScopeBadge({ collection, onClear }: CollectionScopeBadgeProps) {
  const { theme } = useTheme();
  const accentColor = collection.color ?? DEFAULT_COLLECTION_COLOR;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <View style={styles.content}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Chatting with</Text>
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
          {collection.icon ? `${collection.icon} ` : ''}
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
        <Ionicons color={theme.colors.textSecondary} name="close-circle" size={22} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  accent: {
    borderRadius: 999,
    height: 28,
    marginRight: 10,
    width: 4,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  name: {},
  clearButton: {
    paddingLeft: 8,
  },
});
