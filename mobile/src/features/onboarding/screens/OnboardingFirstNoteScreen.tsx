import { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';

import { KeyboardAwareScreen } from '../../../components/layout/KeyboardAwareScreen';
import { useInputScrollOnFocus } from '../../../components/layout/useInputScrollOnFocus';
import { ErrorBanner } from '../../collections/components/ErrorBanner';
import {
  OnboardingLayout,
  OnboardingPrimaryButton,
} from '../components/OnboardingLayout';
import { useOnboardingFlow } from '../OnboardingNavigator';
import { getCategoryById, QUICK_NOTES_COLLECTION_NAME } from '../constants';
import { ensureQuickNotesCollection } from '../utils/quickNotes';
import { useCreateDocument } from '../../../hooks/mutations/useCreateDocument';
import { getApiErrorMessage } from '../../../lib/apiError';
import { queryKeys } from '../../../lib/queryClient';
import type { OnboardingStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'FirstNote'>;

export function OnboardingFirstNoteScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { skipOnboarding } = useOnboardingFlow();
  const createDocument = useCreateDocument();
  const queryClient = useQueryClient();
  const contentInputRef = useRef<TextInput>(null);
  const category = useMemo(
    () => getCategoryById(route.params.categoryId),
    [route.params.categoryId],
  );
  const [title, setTitle] = useState('My first note');
  const [content, setContent] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const titleField = useInputScrollOnFocus();
  const contentField = useInputScrollOnFocus();

  const handleSave = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setApiError('Write a short note to continue.');
      return;
    }

    setApiError(null);
    setIsSaving(true);

    try {
      const collectionId = await ensureQuickNotesCollection();
      await queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
      await createDocument.mutateAsync({
        title: title.trim() || 'My first note',
        content: trimmedContent,
        sourceType: 'text',
        collectionId,
        metadata: {
          onboarding: true,
          knowledgeCategory: category.id,
        },
      });

      navigation.navigate('FirstQuestion', { categoryId: category.id });
    } catch (error) {
      setApiError(getApiErrorMessage(error, 'Failed to save your note'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <OnboardingLayout
      step={3}
      footer={
        <OnboardingPrimaryButton
          label="Save note"
          loading={isSaving || createDocument.isPending}
          onPress={() => void handleSave()}
        />
      }
      onSkip={() => void skipOnboarding()}
    >
      <KeyboardAwareScreen
        contentContainerStyle={styles.scrollContent}
        style={styles.flex}
        variant="scroll"
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
          Create your first note
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
          Saved to your {QUICK_NOTES_COLLECTION_NAME} collection {category.icon}
        </Text>

        {apiError ? <ErrorBanner message={apiError} onRetry={() => setApiError(null)} /> : null}

        <View ref={titleField.fieldRef} style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Title</Text>
          <TextInput
            returnKeyType="next"
            value={title}
            onChangeText={setTitle}
            placeholder="Note title"
            placeholderTextColor={theme.colors.textSecondary}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            onFocus={titleField.createFocusHandler()}
            onSubmitEditing={() => contentInputRef.current?.focus()}
          />
        </View>

        <View ref={contentField.fieldRef} style={[styles.fieldGroup, styles.contentGroup]}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Content</Text>
          <TextInput
            ref={contentInputRef}
            multiline
            returnKeyType="done"
            value={content}
            onChangeText={setContent}
            placeholder={category.notePlaceholder}
            placeholderTextColor={theme.colors.textSecondary}
            style={[
              styles.input,
              styles.contentInput,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            textAlignVertical="top"
            onFocus={contentField.createFocusHandler()}
            onSubmitEditing={() => void handleSave()}
          />
        </View>
      </KeyboardAwareScreen>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    gap: 0,
    paddingBottom: 16,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 20,
    lineHeight: 22,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  contentGroup: {
    minHeight: 160,
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  contentInput: {
    minHeight: 140,
  },
});
