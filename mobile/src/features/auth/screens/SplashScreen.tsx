import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import * as authService from '../../../api/services/auth.service';
import { useAuthStore } from '../../../stores/auth.store';
import { useTheme } from '../../../theme/ThemeProvider';

interface SplashScreenProps {
  onReady: () => void;
}

export function SplashScreen({ onReady }: SplashScreenProps) {
  const { theme } = useTheme();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [statusText, setStatusText] = useState('Loading…');

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      if (!isAuthenticated) {
        if (!cancelled) {
          onReady();
        }
        return;
      }

      setStatusText('Restoring session…');

      try {
        await authService.getMe();
      } catch {
        await clearSession();
      } finally {
        if (!cancelled) {
          onReady();
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, isAuthenticated, clearSession, onReady]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text
        style={[
          styles.logo,
          {
            color: theme.colors.primary,
            fontSize: theme.typography.fontSizes.xxl,
            fontWeight: theme.typography.fontWeights.bold,
          },
        ]}
      >
        Memora
      </Text>
      <Text
        style={[
          styles.tagline,
          {
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSizes.md,
          },
        ]}
      >
        Your AI memory assistant
      </Text>
      <ActivityIndicator
        style={styles.spinner}
        size="large"
        color={theme.colors.primary}
      />
      <Text style={[styles.status, { color: theme.colors.textSecondary }]}>
        {statusText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    letterSpacing: 1,
    marginBottom: 8,
  },
  tagline: {
    marginBottom: 32,
  },
  spinner: {
    marginBottom: 16,
  },
  status: {
    fontSize: 14,
  },
});
