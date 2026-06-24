import { Image, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../theme/ThemeProvider';

const appLogo = require('../../../../assets/new_memora_app_logo.png');

/** Matches launcher icon proportions at auth-screen scale (40–48dp). */
const ICON_SIZE = 44;
const ICON_RADIUS = 10;

const DEFAULT_TAGLINE = 'Your knowledge workspace';

interface AuthBrandHeaderProps {
  tagline?: string;
}

export function AuthBrandHeader({ tagline = DEFAULT_TAGLINE }: AuthBrandHeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View
          style={[
            styles.iconFrame,
            {
              borderRadius: ICON_RADIUS,
              height: ICON_SIZE,
              width: ICON_SIZE,
            },
          ]}
        >
          <Image
            accessibilityLabel="Memora"
            resizeMode="cover"
            source={appLogo}
            style={styles.icon}
          />
        </View>
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.primary,
              fontSize: theme.typography.fontSizes.xl,
              fontWeight: theme.typography.fontWeights.bold,
            },
          ]}
        >
          Memora
        </Text>
      </View>
      <Text
        style={[
          styles.tagline,
          {
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSizes.sm,
            lineHeight: 20,
          },
        ]}
      >
        {tagline}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginBottom: 24,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  iconFrame: {
    overflow: 'hidden',
  },
  icon: {
    height: '100%',
    width: '100%',
  },
  title: {
    letterSpacing: -0.3,
  },
  tagline: {
    maxWidth: 300,
  },
});
