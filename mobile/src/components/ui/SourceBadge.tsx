import { StyleSheet, Text, View } from 'react-native';

import type { DocumentSourceType } from '../../api/types';
import { getDocumentVisual } from '../../lib/documentVisuals';
import { useTheme } from '../../theme/ThemeProvider';

interface SourceBadgeProps {
  sourceType: DocumentSourceType;
}

/** Outline citation pill per design spec */
export function SourceBadge({ sourceType }: SourceBadgeProps) {
  const { theme } = useTheme();
  const visual = getDocumentVisual(sourceType);

  return (
    <View
      style={[
        styles.badge,
        {
          borderColor: theme.colors.border,
          borderRadius: theme.radii.full,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: theme.colors.textSecondary,
            fontSize: theme.typography.caption.fontSize,
            lineHeight: theme.typography.caption.lineHeight,
          },
        ]}
      >
        {visual.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {},
});
