import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CollectionIconDisplay } from '../../collections/components/CollectionIconDisplay';
import { useCollections } from '../../../hooks/queries/useCollections';
import { useTheme } from '../../../theme/ThemeProvider';

interface CollectionPickerProps {
  selectedCollectionId: string | null;
  onSelect: (collectionId: string | null) => void;
}

export function CollectionPicker({ selectedCollectionId, onSelect }: CollectionPickerProps) {
  const { theme } = useTheme();
  const { data: collections = [] } = useCollections();

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.label,
          {
            color: theme.colors.text,
            fontSize: theme.typography.fontSizes.sm,
            fontWeight: theme.typography.fontWeights.medium,
          },
        ]}
      >
        Collection (optional)
      </Text>
      <View style={styles.collectionList}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: selectedCollectionId === null }}
          onPress={() => onSelect(null)}
          style={({ pressed }) => [
            styles.collectionOption,
            {
              backgroundColor:
                selectedCollectionId === null ? theme.colors.surfaceSecondary : theme.colors.surface,
              borderColor:
                selectedCollectionId === null ? theme.colors.primary : theme.colors.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.collectionOptionText,
              {
                color: theme.colors.text,
                fontSize: theme.typography.fontSizes.sm,
              },
            ]}
          >
            No collection
          </Text>
        </Pressable>
        {collections.map((collection) => {
          const selected = selectedCollectionId === collection.id;

          return (
            <Pressable
              key={collection.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelect(collection.id)}
              style={({ pressed }) => [
                styles.collectionOption,
                {
                  backgroundColor: selected
                    ? theme.colors.surfaceSecondary
                    : theme.colors.surface,
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <CollectionIconDisplay icon={collection.icon} size={18} style={styles.collectionIcon} />
              <Text
                style={[
                  styles.collectionOptionText,
                  {
                    color: theme.colors.text,
                    fontSize: theme.typography.fontSizes.sm,
                  },
                ]}
              >
                {collection.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {},
  collectionList: {
    gap: 8,
  },
  collectionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  collectionIcon: {
    width: 22,
    alignItems: 'center',
  },
  collectionOptionText: {
    flex: 1,
  },
});
