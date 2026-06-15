import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  OnboardingLayout,
  OnboardingPrimaryButton,
} from '../components/OnboardingLayout';
import { KNOWLEDGE_CATEGORIES } from '../constants';
import { useOnboardingFlow } from '../OnboardingNavigator';
import { setKnowledgeCategory } from '../storage';
import type { OnboardingStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Category'>;

export function OnboardingCategoryScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { skipOnboarding } = useOnboardingFlow();
  const [selectedId, setSelectedId] = useState(KNOWLEDGE_CATEGORIES[0].id);
  const [isSaving, setIsSaving] = useState(false);

  const handleContinue = async () => {
    setIsSaving(true);
    try {
      await setKnowledgeCategory(selectedId);
      navigation.navigate('FirstNote', { categoryId: selectedId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <OnboardingLayout
      step={2}
      footer={
        <OnboardingPrimaryButton
          disabled={!selectedId}
          label="Continue"
          loading={isSaving}
          onPress={() => void handleContinue()}
        />
      }
      onSkip={() => void skipOnboarding()}
    >
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
        What kind of knowledge will you save?
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
        Pick a category to personalize your experience. You can change this anytime.
      </Text>

      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        {KNOWLEDGE_CATEGORIES.map((category) => {
          const isSelected = category.id === selectedId;
          return (
            <Pressable
              key={category.id}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => setSelectedId(category.id)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={styles.optionIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.optionLabel,
                  {
                    color: isSelected ? theme.colors.primaryText : theme.colors.text,
                    fontWeight: theme.typography.fontWeights.medium,
                  },
                ]}
              >
                {category.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 24,
    lineHeight: 22,
  },
  scroll: {
    flex: 1,
  },
  grid: {
    gap: 12,
    paddingBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionIcon: {
    fontSize: 22,
  },
  optionLabel: {
    fontSize: 16,
  },
});
