import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SplashScreen } from '../features/auth/screens/SplashScreen';
import { OnboardingNavigator } from '../features/onboarding/OnboardingNavigator';
import { getOnboardingCompleted } from '../features/onboarding/storage';
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
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  const handleSplashReady = useCallback(() => {
    setIsBootstrapped(true);
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setOnboardingComplete(true);
  }, []);

  useShareIntentBridge(isBootstrapped && onboardingComplete === true);

  useEffect(() => {
    if (!isBootstrapped || !isAuthenticated) {
      setOnboardingComplete(null);
      return;
    }

    let cancelled = false;

    void getOnboardingCompleted().then((completed) => {
      if (!cancelled) {
        setOnboardingComplete(completed);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isBootstrapped, isAuthenticated]);

  if (!isBootstrapped) {
    return <SplashScreen onReady={handleSplashReady} />;
  }

  if (!isAuthenticated) {
    return <AuthStack />;
  }

  if (onboardingComplete === null) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (!onboardingComplete) {
    return <OnboardingNavigator onComplete={handleOnboardingComplete} />;
  }

  return <MainAppEntry />;
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
