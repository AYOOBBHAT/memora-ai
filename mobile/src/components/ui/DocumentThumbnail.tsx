import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import type { DocumentSourceType } from '../../api/types';
import { getDocumentVisual } from '../../lib/documentVisuals';
import { useTheme } from '../../theme/ThemeProvider';

interface DocumentThumbnailProps {
  sourceType: DocumentSourceType;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { box: 36, icon: 18 },
  md: { box: 44, icon: 20 },
  lg: { box: 52, icon: 22 },
} as const;

export function DocumentThumbnail({ sourceType, size = 'md' }: DocumentThumbnailProps) {
  const { theme } = useTheme();
  const visual = getDocumentVisual(sourceType);
  const dimensions = SIZES[size];

  return (
    <View
      style={[
        styles.container,
        {
          width: dimensions.box,
          height: dimensions.box,
          borderRadius: theme.radii.md,
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Ionicons color={theme.colors.icon} name={visual.icon} size={dimensions.icon} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
});
