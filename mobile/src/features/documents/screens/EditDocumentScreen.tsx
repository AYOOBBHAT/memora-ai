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

import { ErrorBanner } from '../../collections/components/ErrorBanner';
import { LoadErrorState } from '../../../components/ui/LoadErrorState';
import {
  createDefaultDocumentFormValues,
  DocumentFormFields,
  type DocumentFormValues,
} from '../components/DocumentFormFields';
import { formatDocumentContent } from '../utils/formatDocument';
import { useUpdateDocument } from '../../../hooks/mutations/useUpdateDocument';
import { useDocument } from '../../../hooks/queries/useDocuments';
import { getApiErrorMessage } from '../../../lib/apiError';
import type { DocumentsStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';

type Props = NativeStackScreenProps<DocumentsStackParamList, 'EditDocument'>;

export function EditDocumentScreen({ navigation, route }: Props) {
  const { documentId } = route.params;
  const { theme } = useTheme();
  const { data: document, isLoading, isError, error, refetch, isFetching } = useDocument(documentId);
  const updateDocument = useUpdateDocument(documentId);
  const [values, setValues] = useState<DocumentFormValues | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (document) {
      setValues(
        createDefaultDocumentFormValues({
          title: document.title,
          content: formatDocumentContent(document.content),
          sourceType: document.sourceType,
          collectionId: document.collectionId ?? null,
        }),
      );
    }
  }, [document]);

  const handleSubmit = () => {
    if (!values) {
      return;
    }

    setApiError(null);
    let hasError = false;

    if (!values.title.trim()) {
      setTitleError('Title is required');
      hasError = true;
    } else {
      setTitleError(null);
    }

    if (!values.content.trim()) {
      setContentError('Content is required');
      hasError = true;
    } else {
      setContentError(null);
    }

    if (hasError) {
      return;
    }

    updateDocument.mutate(
      {
        title: values.title.trim(),
        content: values.content.trim(),
        sourceType: values.sourceType,
      },
      {
        onSuccess: () => {
          navigation.goBack();
        },
        onError: (error) => {
          setApiError(getApiErrorMessage(error, 'Failed to update document'));
        },
      },
    );
  };

  if (isLoading && !values) {
    return (
      <ActivityIndicator
        color={theme.colors.primary}
        size="large"
        style={[styles.loader, { backgroundColor: theme.colors.background }]}
      />
    );
  }

  if ((isError || !document) && !values) {
    return (
      <LoadErrorState
        isRetrying={isFetching}
        message={getApiErrorMessage(error, 'Could not load this document.')}
        onRetry={() => void refetch()}
        onBack={() => navigation.goBack()}
      />
    );
  }

  if (!values) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <DocumentFormFields
          values={values}
          onChange={setValues}
          titleError={titleError}
          contentError={contentError}
          showCollectionPicker={false}
          showSourceTypeSelector={false}
        />

        {apiError ? <ErrorBanner message={apiError} /> : null}

        <Pressable
          accessibilityRole="button"
          disabled={updateDocument.isPending}
          onPress={handleSubmit}
          style={({ pressed }) => [
            styles.submitButton,
            {
              backgroundColor: theme.colors.primary,
              opacity: pressed || updateDocument.isPending ? 0.85 : 1,
            },
          ]}
        >
          {updateDocument.isPending ? (
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
