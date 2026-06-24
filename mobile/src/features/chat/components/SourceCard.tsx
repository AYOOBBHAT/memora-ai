import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ChatCitationSource } from '../../../api/types';
import { SourceBadge } from '../../../components/ui/SourceBadge';
import { useTheme } from '../../../theme/ThemeProvider';

interface SourceCardProps {
  source: ChatCitationSource;
  collectionName?: string;
  onPress: () => void;
}

function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

/** Outline citation chip per design spec */
export const SourceCard = memo(function SourceCard({
  source,
  collectionName,
  onPress,
}: SourceCardProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityLabel={`Open source ${source.title}`}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: theme.colors.border,
          borderRadius: theme.radii.md,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <View style={styles.content}>
        <Text
          numberOfLines={1}
          style={[
            styles.title,
            {
              color: theme.colors.text,
              fontSize: theme.typography.body.fontSize,
              fontWeight: theme.typography.fontWeights.medium,
              lineHeight: theme.typography.body.lineHeight,
            },
          ]}
        >
          {source.title}
        </Text>
        <View style={styles.meta}>
          <SourceBadge sourceType={source.sourceType} />
          {collectionName ? (
            <Text
              numberOfLines={1}
              style={[
                styles.collection,
                {
                  color: theme.colors.textMuted,
                  fontSize: theme.typography.caption.fontSize,
                },
              ]}
            >
              {collectionName}
            </Text>
          ) : null}
          <Text
            style={[
              styles.score,
              {
                color: theme.colors.textMuted,
                fontSize: theme.typography.caption.fontSize,
              },
            ]}
          >
            {formatScore(source.score)} match
          </Text>
        </View>
      </View>
      <Ionicons color={theme.colors.textMuted} name="open-outline" size={16} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
  collection: {
    flexShrink: 1,
    maxWidth: '40%',
  },
  score: {},
});
