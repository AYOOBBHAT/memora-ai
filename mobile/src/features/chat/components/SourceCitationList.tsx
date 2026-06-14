import { StyleSheet, Text, View } from 'react-native';

import type { ChatCitationSource } from '../../../api/types';
import { useTheme } from '../../../theme/ThemeProvider';

import { SourceCard } from './SourceCard';

interface SourceCitationListProps {
  sources: ChatCitationSource[];
  onSourcePress: (source: ChatCitationSource) => void;
}

export function SourceCitationList({ sources, onSourcePress }: SourceCitationListProps) {
  const { theme } = useTheme();

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
            fontWeight: theme.typography.fontWeights.medium,
          },
        ]}
      >
        Sources
      </Text>
      {sources.map((source) => (
        <SourceCard
          key={`${source.documentId}-${source.score}`}
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
    marginTop: 10,
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
