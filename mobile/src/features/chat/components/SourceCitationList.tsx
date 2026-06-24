import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ChatCitationSource } from '../../../api/types';
import { useCollections } from '../../../hooks/queries/useCollections';
import { useDocuments } from '../../../hooks/queries/useDocuments';
import { useTheme } from '../../../theme/ThemeProvider';

import { SourceCard } from './SourceCard';

interface SourceCitationListProps {
  sources: ChatCitationSource[];
  onSourcePress: (source: ChatCitationSource) => void;
}

export function SourceCitationList({ sources, onSourcePress }: SourceCitationListProps) {
  const { theme } = useTheme();
  const { data: collections = [] } = useCollections();
  const { data: documents = [] } = useDocuments();

  const collectionNameByDocumentId = useMemo(() => {
    const collectionById = new Map(collections.map((collection) => [collection.id, collection.name]));
    const names = new Map<string, string>();

    for (const document of documents) {
      if (!document.collectionId) {
        continue;
      }

      const name = collectionById.get(document.collectionId);
      if (name) {
        names.set(document.id, name);
      }
    }

    return names;
  }, [collections, documents]);

  if (sources.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.label,
          {
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSizes.xs,
            fontWeight: theme.typography.fontWeights.semibold,
          },
        ]}
      >
        Sources
      </Text>
      {sources.map((source) => (
        <SourceCard
          key={`${source.documentId}-${source.score}`}
          collectionName={collectionNameByDocumentId.get(source.documentId)}
          onPress={() => onSourcePress(source)}
          source={source}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginTop: 12,
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
