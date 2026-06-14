import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  CollectionFormFields,
  createDefaultFormValues,
  type CollectionFormValues,
} from '../components/CollectionFormFields';
import { ErrorBanner } from '../components/ErrorBanner';
import { useCreateCollection } from '../../../hooks/mutations/useCreateCollection';
import { getApiErrorMessage } from '../../../lib/apiError';
import type { CollectionsStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';

type Props = NativeStackScreenProps<CollectionsStackParamList, 'CreateCollection'>;

export function CreateCollectionScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const createCollection = useCreateCollection();
  const [values, setValues] = useState<CollectionFormValues>(createDefaultFormValues());
  const [nameError, setNameError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSubmit = () => {
    setApiError(null);

    if (!values.name.trim()) {
      setNameError('Name is required');
      return;
    }

    setNameError(null);

    createCollection.mutate(
      {
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        color: values.color,
        icon: values.icon,
      },
      {
        onSuccess: (collection) => {
          navigation.replace('CollectionDetail', { collectionId: collection.id });
        },
        onError: (error) => {
          setApiError(getApiErrorMessage(error, 'Failed to create collection'));
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <CollectionFormFields values={values} onChange={setValues} nameError={nameError} />

        {apiError ? <ErrorBanner message={apiError} /> : null}

        <Pressable
          accessibilityRole="button"
          disabled={createCollection.isPending}
          onPress={handleSubmit}
          style={({ pressed }) => [
            styles.submitButton,
            {
              backgroundColor: theme.colors.primary,
              opacity: pressed || createCollection.isPending ? 0.85 : 1,
            },
          ]}
        >
          {createCollection.isPending ? (
            <ActivityIndicator color={theme.colors.primaryText} />
          ) : (
            <Text
              style={[
                styles.submitText,
                {
                  color: theme.colors.primaryText,
                  fontSize: theme.typography.fontSizes.md,
                  fontWeight: theme.typography.fontWeights.semibold,
                },
              ]}
            >
              Create collection
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 20,
    paddingBottom: 32,
  },
  submitButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {},
});
