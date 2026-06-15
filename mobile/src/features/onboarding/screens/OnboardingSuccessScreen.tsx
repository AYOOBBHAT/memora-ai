import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  OnboardingLayout,
  OnboardingPrimaryButton,
} from '../components/OnboardingLayout';
import { useOnboardingFlow } from '../OnboardingNavigator';
import type { OnboardingStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Success'>;

export function OnboardingSuccessScreen({ route }: Props) {
  const { theme } = useTheme();
  const { finishOnboarding } = useOnboardingFlow();
  const openChat = route.params?.openChat ?? false;

  const handleEnterApp = () => {
    void finishOnboarding();
  };

  return (
    <OnboardingLayout
      step={5}
      showSkip={false}
      footer={
        <OnboardingPrimaryButton
          label={openChat ? 'Enter Memora & open Chat' : 'Enter Memora'}
          onPress={handleEnterApp}
        />
      }
    >
      <View style={styles.center}>
        <Text style={styles.emoji}>🎉</Text>
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSizes.xxl,
              fontWeight: theme.typography.fontWeights.bold,
            },
          ]}
        >
          You're all set!
        </Text>
        <Text
          style={[
            styles.subtitle,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSizes.md,
            },
          ]}
        >
          {openChat
            ? 'Your note is saved and Memora is ready to answer your first question.'
            : 'Start saving knowledge and chatting with your personal AI memory.'}
        </Text>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
});
