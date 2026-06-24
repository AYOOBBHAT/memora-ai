import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KeyboardAwareScreen } from '../../../components/layout/KeyboardAwareScreen';
import { useTheme } from '../../../theme/ThemeProvider';
import { AuthBrandHeader } from './AuthBrandHeader';

interface AuthFormLayoutProps {
  title: string;
  subtitle?: string;
  /** Product tagline under the Memora wordmark. */
  brandTagline?: string;
  children: ReactNode;
  footer?: ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  /** Include stack header height in keyboard offset (e.g. Forgot Password screen). */
  keyboardVerticalOffset?: number;
}

export function AuthFormLayout({
  title,
  subtitle,
  brandTagline,
  children,
  footer,
  showBack = false,
  onBack,
  keyboardVerticalOffset = 0,
}: AuthFormLayoutProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <KeyboardAwareScreen
      backgroundColor={theme.colors.background}
      contentContainerStyle={{
        paddingTop: insets.top + theme.spacing.lg,
        paddingBottom: insets.bottom + theme.spacing.xl,
        paddingHorizontal: theme.spacing.lg,
      }}
      keyboardVerticalOffset={keyboardVerticalOffset}
      variant="scroll"
    >
      {showBack && onBack ? (
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={12}
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons color={theme.colors.text} name="chevron-back" size={24} />
        </Pressable>
      ) : null}

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <AuthBrandHeader tagline={brandTagline} />

        <View style={styles.headlineBlock}>
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.text,
                fontSize: 24,
                fontWeight: theme.typography.fontWeights.bold,
              },
            ]}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                styles.subtitle,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSizes.sm,
                  lineHeight: 22,
                },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.form}>{children}</View>

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </Animated.View>
    </KeyboardAwareScreen>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    marginBottom: 8,
    marginLeft: -4,
    width: 48,
  },
  headlineBlock: {
    gap: 8,
    marginBottom: 24,
  },
  title: {
    letterSpacing: -0.3,
  },
  subtitle: {},
  form: {
    gap: 16,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
});
