import { useEffect, type ReactNode } from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { setupInterceptors } from '../api/interceptors';
import { queryClient } from '../lib/queryClient';
import { useAuthStore } from '../stores/auth.store';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';

setupInterceptors();

function AuthGate({ children }: { children: ReactNode }) {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return <>{children}</>;
}

function NavigationShell({ children }: { children: ReactNode }) {
  const { isDark } = useTheme();

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
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
        <AuthGate>
          <NavigationShell>{children}</NavigationShell>
        </AuthGate>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
