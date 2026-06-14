import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useGoogleSignIn } from '../../../hooks/mutations/useGoogleSignIn';
import { getApiErrorMessage } from '../../../lib/apiError';
import {
  extractGoogleIdToken,
  isGoogleSignInConfigured,
  useGoogleIdTokenRequest,
} from '../../../lib/googleSignIn';
import { useTheme } from '../../../theme/ThemeProvider';

interface GoogleSignInButtonProps {
  onError?: (message: string) => void;
}

export function GoogleSignInButton({ onError }: GoogleSignInButtonProps) {
  const { theme } = useTheme();
  const [request, response, promptAsync] = useGoogleIdTokenRequest();
  const googleSignIn = useGoogleSignIn();
  const { mutate: signInWithGoogle } = googleSignIn;
  const [isPrompting, setIsPrompting] = useState(false);

  const isLoading = isPrompting || googleSignIn.isPending;
  const isConfigured = isGoogleSignInConfigured();

  useEffect(() => {
    if (!response) {
      return;
    }

    setIsPrompting(false);

    const idToken = extractGoogleIdToken(response);
    if (!idToken) {
      if (response.type === 'error') {
        onError?.('Google sign-in was cancelled or failed');
      }
      return;
    }

    signInWithGoogle(
      { idToken },
      {
        onError: (error) => {
          onError?.(getApiErrorMessage(error, 'Google sign-in failed'));
        },
      },
    );
  }, [response, signInWithGoogle, onError]);

  const handlePress = async () => {
    if (!isConfigured) {
      onError?.('Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.');
      return;
    }

    if (!request) {
      onError?.('Google Sign-In is not ready yet. Please try again.');
      return;
    }

    setIsPrompting(true);
    try {
      await promptAsync();
    } catch {
      setIsPrompting(false);
      onError?.('Could not open Google sign-in');
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.dividerRow, { marginVertical: theme.spacing.md }]}>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <Text style={[styles.dividerText, { color: theme.colors.textSecondary }]}>or</Text>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={isLoading}
        onPress={() => void handlePress()}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: pressed || isLoading ? 0.85 : 1,
          },
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : (
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
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: 14,
  },
  button: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonText: {
    textAlign: 'center',
  },
});
