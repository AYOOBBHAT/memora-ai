import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  OnboardingLayout,
  OnboardingPrimaryButton,
} from '../components/OnboardingLayout';
import { useOnboardingFlow } from '../OnboardingNavigator';
import type { OnboardingStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Intro'>;

export function OnboardingIntroScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { skipOnboarding } = useOnboardingFlow();

  return (
    <OnboardingLayout
      step={1}
      footer={
        <OnboardingPrimaryButton
          label="Get Started"
          onPress={() => navigation.navigate('Category')}
        />
      }
      onSkip={() => void skipOnboarding()}
    >
      <View style={styles.hero}>
        <Text style={[styles.emoji, { fontSize: 56 }]}>🧠</Text>
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.text,
              fontSize: theme.typography.h1.fontSize,
              fontWeight: theme.typography.h1.fontWeight,
              lineHeight: theme.typography.h1.lineHeight,
            },
          ]}
        >
          Welcome to Memora AI
        </Text>
        <Text
          style={[
            styles.subtitle,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSizes.lg,
            },
          ]}
        >
          Your personal AI memory assistant
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <FeatureRow
          emoji="📚"
          text="Save notes, links, and PDFs in organized collections"
          theme={theme}
        />
        <FeatureRow
          emoji="🔍"
          text="Find anything instantly with smart search"
          theme={theme}
        />
        <FeatureRow
          emoji="💬"
          text="Ask questions and get answers from your own knowledge"
          theme={theme}
        />
      </View>
    </OnboardingLayout>
  );
}

function FeatureRow({
  emoji,
  text,
  theme,
}: {
  emoji: string;
  text: string;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <Text
        style={[
          styles.featureText,
          {
            color: theme.colors.text,
            fontSize: theme.typography.fontSizes.md,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: {
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureEmoji: {
    fontSize: 22,
  },
  featureText: {
    flex: 1,
    lineHeight: 22,
  },
});
