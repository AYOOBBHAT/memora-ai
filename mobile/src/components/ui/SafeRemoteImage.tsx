import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  View,
  type ImageProps,
  type ImageStyle,
  type StyleProp,
} from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';

interface SafeRemoteImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  containerStyle?: StyleProp<ImageStyle>;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
}

export function SafeRemoteImage({
  uri,
  style,
  containerStyle,
  accessibilityLabel,
  fallbackIcon = 'image-outline',
  ...props
}: SafeRemoteImageProps) {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!uri?.trim() || hasError) {
    return (
      <View
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.fallback,
          containerStyle,
          style,
          {
            backgroundColor: theme.colors.surfaceSecondary,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Ionicons color={theme.colors.textSecondary} name={fallbackIcon} size={28} />
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <Image
        {...props}
        accessibilityLabel={accessibilityLabel}
        resizeMode="cover"
        source={{ uri }}
        style={[style, isLoading ? styles.hidden : null]}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        onLoadEnd={() => setIsLoading(false)}
      />
      {isLoading ? (
        <View style={[styles.loaderOverlay, style]}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  hidden: {
    opacity: 0,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
