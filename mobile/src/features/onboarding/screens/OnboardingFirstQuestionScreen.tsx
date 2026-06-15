import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  OnboardingLayout,
  OnboardingPrimaryButton,
  OnboardingSecondaryButton,
} from '../components/OnboardingLayout';
import { useOnboardingFlow } from '../OnboardingNavigator';
import { getCategoryById } from '../constants';
import type { OnboardingStackParamList } from '../../../navigation/types';
import { useOnboardingLaunchStore } from '../../../stores/onboarding.store';
import { useTheme } from '../../../theme/ThemeProvider';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'FirstQuestion'>;

export function OnboardingFirstQuestionScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { skipOnboarding } = useOnboardingFlow();
  const setPendingChatLaunch = useOnboardingLaunchStore((state) => state.setPendingChatLaunch);
  const category = useMemo(
    () => getCategoryById(route.params.categoryId),
    [route.params.categoryId],
  );

  const handleAskInChat = () => {
    setPendingChatLaunch(category.suggestedQuestion);
    navigation.navigate('Success', { openChat: true });
  };

  const handleContinue = () => {
    setPendingChatLaunch(null);
    navigation.navigate('Success');
  };

  return (
    <OnboardingLayout
      step={4}
      footer={
        <>
          <OnboardingPrimaryButton label="Ask in Chat" onPress={handleAskInChat} />
          <OnboardingSecondaryButton label="Skip for now" onPress={handleContinue} />
        </>
      }
      onSkip={() => void skipOnboarding()}
    >
      <Text style={styles.emoji}>💬</Text>
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.text,
            fontSize: theme.typography.fontSizes.xl,
            fontWeight: theme.typography.fontWeights.bold,
          },
        ]}
      >
        Ask your first question
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
        Memora answers from your saved notes. Try a suggested question to see it in action.
      </Text>

      <View style={[styles.questionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.questionLabel, { color: theme.colors.textSecondary }]}>Suggested question</Text>
        <Text
          style={[
            styles.questionText,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSizes.md,
            },
          ]}
        >
          "{category.suggestedQuestion}"
        </Text>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  emoji: {
    fontSize: 48,
    marginBottom: 16,
    textAlign: 'center',
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 24,
    lineHeight: 22,
    textAlign: 'center',
  },
  questionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  questionText: {
    lineHeight: 24,
    fontStyle: 'italic',
  },
});
