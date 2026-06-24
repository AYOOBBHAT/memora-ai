import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ChatCitationSource } from '../../../api/types';
import { SourceBadge } from '../../../components/ui/SourceBadge';
import { getDocumentVisual } from '../../../lib/documentVisuals';
import { useTheme } from '../../../theme/ThemeProvider';

interface SourceCardProps {
  source: ChatCitationSource;
  collectionName?: string;
  onPress: () => void;
}

function formatScore(score: number): string {
  return `${Math.round(score * 100)}% match`;
}

export const SourceCard = memo(function SourceCard({
  source,
  collectionName,
  onPress,
}: SourceCardProps) {
  const { theme } = useTheme();
  const visual = getDocumentVisual(source.sourceType);

  return (
    <Pressable
      accessibilityLabel={`Open source ${source.title}`}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.md,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: visual.background,
            borderRadius: theme.radii.md,
          },
        ]}
      >
        <Ionicons color={visual.accent} name={visual.icon} size={18} />
      </View>
      <View style={styles.content}>
        <Text
          numberOfLines={2}
          style={[
            styles.title,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSizes.sm,
              fontWeight: theme.typography.fontWeights.semibold,
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
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSizes.xs,
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
});

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  iconWrap: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  content: {
    flex: 1,
    gap: 6,
  },
  title: {
    lineHeight: 18,
  },
  meta: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  collection: {
    flexShrink: 1,
    maxWidth: '46%',
  },
  score: {},
});
