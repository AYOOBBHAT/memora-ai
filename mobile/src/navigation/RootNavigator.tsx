import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { OnboardingNavigator } from '../features/onboarding/OnboardingNavigator';
import { getOnboardingCompleted } from '../features/onboarding/storage';
import { StartupScreen } from '../features/startup/StartupScreen';
import { LAUNCH_BACKGROUND } from '../features/startup/startupTheme';
import { ShareHandlerScreen } from '../features/share/screens/ShareHandlerScreen';
import { useShareIntentBridge } from '../hooks/useShareIntentBridge';
import { useAuthStore } from '../stores/auth.store';
import { useTheme } from '../theme/ThemeProvider';

import { AuthStack } from './AuthStack';
import { MainAppEntry } from './MainAppEntry';
import type { RootStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();

function AppShell() {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuthStore();
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [startupMounted, setStartupMounted] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  const handleBootstrapReady = useCallback(() => {
    setIsBootstrapped(true);
  }, []);

  const handleStartupHidden = useCallback(() => {
    setStartupMounted(false);
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setOnboardingComplete(true);
  }, []);

  const destinationReady =
    isBootstrapped && (!isAuthenticated || onboardingComplete !== null);

  useShareIntentBridge(isBootstrapped && onboardingComplete === true);

  useEffect(() => {
    if (!isBootstrapped || !isAuthenticated) {
      setOnboardingComplete(null);
      return;
    }

    let cancelled = false;

    void getOnboardingCompleted()
      .then((completed) => {
        if (!cancelled) {
          setOnboardingComplete(completed);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOnboardingComplete(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isBootstrapped, isAuthenticated]);

  let destination: ReactNode = null;

  if (isBootstrapped) {
    if (!isAuthenticated) {
      destination = <AuthStack />;
    } else if (onboardingComplete === null) {
      destination = startupMounted ? null : (
        <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      );
    } else if (!onboardingComplete) {
      destination = <OnboardingNavigator onComplete={handleOnboardingComplete} />;
    } else {
      destination = <MainAppEntry />;
    }
  }

  return (
    <View style={styles.shell}>
      <View style={styles.destination}>{destination}</View>
      {startupMounted ? (
        <StartupScreen
          canDismiss={destinationReady}
          onHidden={handleStartupHidden}
          onReady={handleBootstrapReady}
        />
      ) : null}
    </View>
  );
}

export function RootNavigator() {
  const { theme } = useTheme();

  return (
    <RootStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <RootStack.Screen
        name="App"
        component={AppShell}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="ShareHandler"
        component={ShareHandlerScreen}
        options={{
          title: 'Save to Memora',
          presentation: 'modal',
        }}
      />
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: LAUNCH_BACKGROUND,
  },
  destination: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
