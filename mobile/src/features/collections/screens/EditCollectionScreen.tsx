import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  CollectionFormFields,
  createDefaultFormValues,
  type CollectionFormValues,
} from '../components/CollectionFormFields';
import { ErrorBanner } from '../components/ErrorBanner';
import { DEFAULT_COLLECTION_COLOR, DEFAULT_COLLECTION_ICON } from '../constants';
import { useUpdateCollection } from '../../../hooks/mutations/useUpdateCollection';
import { useCollection } from '../../../hooks/queries/useCollection';
import { getApiErrorMessage } from '../../../lib/apiError';
import type { CollectionsStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';

type Props = NativeStackScreenProps<CollectionsStackParamList, 'EditCollection'>;

export function EditCollectionScreen({ navigation, route }: Props) {
  const { collectionId } = route.params;
  const { theme } = useTheme();
  const { data: collection, isLoading } = useCollection(collectionId);
  const updateCollection = useUpdateCollection(collectionId);
  const [values, setValues] = useState<CollectionFormValues | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (collection) {
      setValues(
        createDefaultFormValues({
          name: collection.name,
          description: collection.description ?? '',
          color: collection.color ?? DEFAULT_COLLECTION_COLOR,
          icon: collection.icon ?? DEFAULT_COLLECTION_ICON,
        }),
      );
    }
  }, [collection]);

  const handleSubmit = () => {
    if (!values) {
      return;
    }

    setApiError(null);

    if (!values.name.trim()) {
      setNameError('Name is required');
      return;
    }

    setNameError(null);

    updateCollection.mutate(
      {
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        color: values.color,
        icon: values.icon,
      },
      {
        onSuccess: () => {
          navigation.goBack();
        },
        onError: (error) => {
          setApiError(getApiErrorMessage(error, 'Failed to update collection'));
        },
      },
    );
  };

  if (isLoading || !values) {
    return (
      <ActivityIndicator
        color={theme.colors.primary}
        size="large"
        style={[styles.loader, { backgroundColor: theme.colors.background }]}
      />
    );
  }

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
          disabled={updateCollection.isPending}
          onPress={handleSubmit}
          style={({ pressed }) => [
            styles.submitButton,
            {
              backgroundColor: theme.colors.primary,
              opacity: pressed || updateCollection.isPending ? 0.85 : 1,
            },
          ]}
        >
          {updateCollection.isPending ? (
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
              Save changes
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
  loader: {
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
