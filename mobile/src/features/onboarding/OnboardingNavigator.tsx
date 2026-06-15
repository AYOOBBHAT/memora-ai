import { createContext, useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { OnboardingCategoryScreen } from './screens/OnboardingCategoryScreen';
import { OnboardingFirstNoteScreen } from './screens/OnboardingFirstNoteScreen';
import { OnboardingFirstQuestionScreen } from './screens/OnboardingFirstQuestionScreen';
import { OnboardingIntroScreen } from './screens/OnboardingIntroScreen';
import { OnboardingSuccessScreen } from './screens/OnboardingSuccessScreen';
import { setOnboardingCompleted } from './storage';
import type { OnboardingStackParamList } from '../../navigation/types';
import { useOnboardingLaunchStore } from '../../stores/onboarding.store';
import { useTheme } from '../../theme/ThemeProvider';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

interface OnboardingFlowContextValue {
  skipOnboarding: () => Promise<void>;
  finishOnboarding: () => Promise<void>;
}

const OnboardingFlowContext = createContext<OnboardingFlowContextValue | null>(null);

export function useOnboardingFlow(): OnboardingFlowContextValue {
  const context = useContext(OnboardingFlowContext);
  if (!context) {
    throw new Error('useOnboardingFlow must be used within OnboardingNavigator');
  }
  return context;
}

interface OnboardingNavigatorProps {
  onComplete: () => void;
}

export function OnboardingNavigator({ onComplete }: OnboardingNavigatorProps) {
  const { theme } = useTheme();

  const skipOnboarding = async () => {
    useOnboardingLaunchStore.getState().setPendingChatLaunch(null);
    await setOnboardingCompleted(true);
    onComplete();
  };

  const finishOnboarding = async () => {
    await setOnboardingCompleted(true);
    onComplete();
  };

  return (
    <OnboardingFlowContext.Provider value={{ skipOnboarding, finishOnboarding }}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Intro" component={OnboardingIntroScreen} />
        <Stack.Screen name="Category" component={OnboardingCategoryScreen} />
        <Stack.Screen name="FirstNote" component={OnboardingFirstNoteScreen} />
        <Stack.Screen name="FirstQuestion" component={OnboardingFirstQuestionScreen} />
        <Stack.Screen name="Success" component={OnboardingSuccessScreen} />
      </Stack.Navigator>
    </OnboardingFlowContext.Provider>
  );
}
