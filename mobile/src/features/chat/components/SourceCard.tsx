import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ChatCitationSource, DocumentSourceType } from '../../../api/types';
import { useTheme } from '../../../theme/ThemeProvider';

interface SourceCardProps {
  source: ChatCitationSource;
  onPress: () => void;
}

const SOURCE_LABELS: Record<DocumentSourceType, string> = {
  text: 'Text',
  url: 'URL',
  pdf: 'PDF',
  youtube: 'YouTube',
  upload: 'Upload',
};

function formatScore(score: number): string {
  return `${Math.round(score * 100)}% match`;
}

export function SourceCard({ source, onPress }: SourceCardProps) {
  const { theme } = useTheme();

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
      <View style={styles.content}>
        <Text
          numberOfLines={2}
          style={[
            styles.title,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSizes.sm,
              fontWeight: theme.typography.fontWeights.medium,
            },
          ]}
        >
          {source.title}
        </Text>
        <View style={styles.meta}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSizes.xs,
                },
              ]}
            >
              {SOURCE_LABELS[source.sourceType]}
            </Text>
          </View>
          <Text
            style={[
              styles.score,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSizes.xs,
              },
            ]}
          >
            {formatScore(source.score)}
          </Text>
        </View>
      </View>
      <Ionicons color={theme.colors.textSecondary} name="chevron-forward" size={16} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  content: {
    flex: 1,
    gap: 6,
  },
  title: {},
  meta: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  score: {},
});
