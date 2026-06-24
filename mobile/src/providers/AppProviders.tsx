import { useEffect, type ReactNode } from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';

import { linking } from '../navigation/linking';
import { navigationRef } from '../navigation/navigationRef';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppErrorBoundary } from '../components/ui/AppErrorBoundary';
import { setupInterceptors } from '../api/interceptors';
import { configureGoogleSignIn } from '../lib/googleSignIn';
import { queryClient } from '../lib/queryClient';
import { useAuthStore } from '../stores/auth.store';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';

setupInterceptors();

function AuthGate({ children }: { children: ReactNode }) {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    configureGoogleSignIn();
    void hydrate();
  }, [hydrate]);

  return <>{children}</>;
}

function NavigationShell({ children }: { children: ReactNode }) {
  const { isDark } = useTheme();

  return (
    <SafeAreaProvider>
      <NavigationContainer
        ref={navigationRef}
        linking={linking}
        theme={isDark ? DarkTheme : DefaultTheme}
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />
        {children}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppErrorBoundary>
          <AuthGate>
            <NavigationShell>{children}</NavigationShell>
          </AuthGate>
        </AppErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
