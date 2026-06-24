import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useGoogleSignIn } from '../../../hooks/mutations/useGoogleSignIn';
import { getApiErrorMessage } from '../../../lib/apiError';
import {
  getGoogleSignInErrorMessage,
  isGoogleSignInConfigured,
  requestGoogleIdToken,
} from '../../../lib/googleSignIn';
import { useTheme } from '../../../theme/ThemeProvider';

interface GoogleSignInButtonProps {
  onError?: (message: string) => void;
}

export function GoogleSignInButton({ onError }: GoogleSignInButtonProps) {
  const { theme } = useTheme();
  const googleSignIn = useGoogleSignIn();
  const { mutate: signInWithGoogle } = googleSignIn;
  const [isPrompting, setIsPrompting] = useState(false);

  const isLoading = isPrompting || googleSignIn.isPending;
  const isConfigured = isGoogleSignInConfigured();

  const handlePress = async () => {
    if (!isConfigured) {
      onError?.('Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.');
      return;
    }

    setIsPrompting(true);

    try {
      const idToken = await requestGoogleIdToken();

      signInWithGoogle(
        { idToken },
        {
          onError: (error) => {
            onError?.(getApiErrorMessage(error, 'Google sign-in failed'));
          },
          onSettled: () => {
            setIsPrompting(false);
          },
        },
      );
    } catch (error) {
      setIsPrompting(false);
      const message = getGoogleSignInErrorMessage(error);
      if (message) {
        onError?.(message);
      }
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.dividerRow}>
        <View style={[styles.divider, { backgroundColor: `${theme.colors.border}99` }]} />
        <Text
          style={[
            styles.dividerText,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSizes.xs,
              fontWeight: theme.typography.fontWeights.medium,
            },
          ]}
        >
          OR
        </Text>
        <View style={[styles.divider, { backgroundColor: `${theme.colors.border}99` }]} />
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={isLoading}
        onPress={() => void handlePress()}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: 'transparent',
            borderColor: theme.colors.border,
            borderRadius: theme.radii.lg,
            opacity: pressed || isLoading ? 0.9 : 1,
          },
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color={theme.colors.text} />
        ) : (
          <View style={styles.buttonContent}>
            <Ionicons color={theme.colors.icon} name="logo-google" size={20} />
            <Text
              style={[
                styles.buttonText,
                {
                  color: theme.colors.text,
                  fontSize: theme.typography.fontSizes.md,
                  fontWeight: theme.typography.fontWeights.medium,
                },
              ]}
            >
              Continue with Google
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 16,
    marginTop: 8,
    width: '100%',
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    letterSpacing: 1.2,
  },
  button: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 18,
  },
  buttonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  buttonText: {},
});
