import { useState } from 'react';
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
import {
  createDefaultDocumentFormValues,
  DocumentFormFields,
  type DocumentFormValues,
} from '../components/DocumentFormFields';
import { PdfUploadButton } from '../components/PdfUploadButton';
import { UrlImportButton } from '../components/UrlImportButton';
import { YoutubeImportButton } from '../components/YoutubeImportButton';
import { useCreateDocument } from '../../../hooks/mutations/useCreateDocument';
import { getApiErrorMessage } from '../../../lib/apiError';
import type { DocumentsStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';

type Props = NativeStackScreenProps<DocumentsStackParamList, 'CreateDocument'>;

export function CreateDocumentScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const createDocument = useCreateDocument();
  const initialCollectionId = route.params?.collectionId ?? null;
  const [values, setValues] = useState<DocumentFormValues>(
    createDefaultDocumentFormValues({ collectionId: initialCollectionId }),
  );
  const [titleError, setTitleError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const isPdfMode = values.sourceType === 'pdf';
  const isUrlMode = values.sourceType === 'url';
  const isYoutubeMode = values.sourceType === 'youtube';
  const isAlternateSourceMode = isPdfMode || isUrlMode || isYoutubeMode;

  const handleSubmit = () => {
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

    createDocument.mutate(
      {
        title: values.title.trim(),
        content: values.content.trim(),
        sourceType: 'text',
        collectionId: values.collectionId ?? undefined,
      },
      {
        onSuccess: (document) => {
          navigation.replace('DocumentDetail', { documentId: document.id });
        },
        onError: (error) => {
          setApiError(getApiErrorMessage(error, 'Failed to create document'));
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
        <DocumentFormFields
          values={values}
          onChange={setValues}
          titleError={titleError}
          contentError={contentError}
          showContentField={!isAlternateSourceMode}
        />

        {isPdfMode ? (
          <PdfUploadButton
            collectionId={values.collectionId}
            title={values.title}
            onSuccess={(document) => {
              navigation.replace('DocumentDetail', { documentId: document.id });
            }}
          />
        ) : null}

        {isUrlMode ? (
          <UrlImportButton
            collectionId={values.collectionId}
            title={values.title}
            onSuccess={(document) => {
              navigation.replace('DocumentDetail', { documentId: document.id });
            }}
          />
        ) : null}

        {isYoutubeMode ? (
          <YoutubeImportButton
            collectionId={values.collectionId}
            title={values.title}
            onSuccess={(document) => {
              navigation.replace('DocumentDetail', { documentId: document.id });
            }}
          />
        ) : null}

        {apiError ? <ErrorBanner message={apiError} /> : null}

        {!isAlternateSourceMode ? (
          <Pressable
            accessibilityRole="button"
            disabled={createDocument.isPending}
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.submitButton,
              {
                backgroundColor: theme.colors.primary,
                opacity: pressed || createDocument.isPending ? 0.85 : 1,
              },
            ]}
          >
            {createDocument.isPending ? (
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
                Create document
              </Text>
            )}
          </Pressable>
        ) : null}
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
