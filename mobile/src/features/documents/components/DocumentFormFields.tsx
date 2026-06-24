import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useInputScrollOnFocus } from '../../../components/layout/useInputScrollOnFocus';
import type { DocumentSourceType } from '../../../api/types';
import { useTheme } from '../../../theme/ThemeProvider';
import { CollectionPicker } from './CollectionPicker';

export interface DocumentFormValues {
  title: string;
  content: string;
  sourceType: DocumentSourceType;
  collectionId: string | null;
}

export function createDefaultDocumentFormValues(
  overrides?: Partial<DocumentFormValues>,
): DocumentFormValues {
  return {
    title: '',
    content: '',
    sourceType: 'text',
    collectionId: null,
    ...overrides,
  };
}

interface DocumentFormFieldsProps {
  values: DocumentFormValues;
  onChange: (values: DocumentFormValues) => void;
  titleError?: string | null;
  contentError?: string | null;
  showCollectionPicker?: boolean;
  showSourceTypeSelector?: boolean;
  showContentField?: boolean;
}

const SOURCE_TYPES: { type: DocumentSourceType; label: string; enabled: boolean }[] = [
  { type: 'text', label: 'Text', enabled: true },
  { type: 'url', label: 'URL', enabled: true },
  { type: 'pdf', label: 'PDF', enabled: true },
  { type: 'youtube', label: 'YouTube', enabled: true },
  { type: 'upload', label: 'Upload', enabled: false },
];

export function DocumentFormFields({
  values,
  onChange,
  titleError,
  contentError,
  showCollectionPicker = true,
  showSourceTypeSelector = true,
  showContentField = true,
}: DocumentFormFieldsProps) {
  const { theme } = useTheme();
  const titleField = useInputScrollOnFocus();
  const contentField = useInputScrollOnFocus();

  const inputStyle = (hasError?: boolean) => [
    styles.input,
    {
      backgroundColor: theme.colors.surface,
      borderColor: hasError ? theme.colors.error : theme.colors.border,
      color: theme.colors.text,
    },
  ];

  return (
    <View style={styles.container}>
      <View ref={titleField.fieldRef} style={styles.field}>
        <Text
          style={[
            styles.label,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSizes.sm,
              fontWeight: theme.typography.fontWeights.medium,
            },
          ]}
        >
          Title *
        </Text>
        <TextInput
          accessibilityLabel="Document title"
          autoCapitalize="sentences"
          placeholder="Document title"
          placeholderTextColor={theme.colors.textSecondary}
          returnKeyType="next"
          style={inputStyle(Boolean(titleError))}
          value={values.title}
          onChangeText={(title) => onChange({ ...values, title })}
          onFocus={titleField.createFocusHandler()}
        />
        {titleError ? (
          <Text style={[styles.fieldError, { color: theme.colors.error }]}>{titleError}</Text>
        ) : null}
      </View>

      {showContentField ? (
        <View ref={contentField.fieldRef} style={styles.field}>
          <Text
            style={[
              styles.label,
              {
                color: theme.colors.text,
                fontSize: theme.typography.fontSizes.sm,
                fontWeight: theme.typography.fontWeights.medium,
              },
            ]}
          >
            Content *
          </Text>
          <TextInput
            accessibilityLabel="Document content"
            multiline
            placeholder="Paste or write your text here..."
            placeholderTextColor={theme.colors.textSecondary}
            returnKeyType="default"
            style={[inputStyle(Boolean(contentError)), styles.textArea]}
            textAlignVertical="top"
            value={values.content}
            onChangeText={(content) => onChange({ ...values, content })}
            onFocus={contentField.createFocusHandler()}
          />
          {contentError ? (
            <Text style={[styles.fieldError, { color: theme.colors.error }]}>{contentError}</Text>
          ) : null}
        </View>
      ) : null}

      {showSourceTypeSelector ? (
        <View style={styles.field}>
          <Text
            style={[
              styles.label,
              {
                color: theme.colors.text,
                fontSize: theme.typography.fontSizes.sm,
                fontWeight: theme.typography.fontWeights.medium,
              },
            ]}
          >
            Source type
          </Text>
          <View style={styles.sourceTypeRow}>
            {SOURCE_TYPES.map(({ type, label, enabled }) => {
              const selected = values.sourceType === type;

              return (
                <Pressable
                  key={type}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !enabled, selected }}
                  disabled={!enabled}
                  onPress={() => enabled && onChange({ ...values, sourceType: type })}
                  style={({ pressed }) => [
                    styles.sourceTypeChip,
                    {
                      backgroundColor: selected
                        ? theme.colors.primary
                        : theme.colors.surfaceSecondary,
                      borderColor: selected ? theme.colors.primary : theme.colors.border,
                      opacity: !enabled ? 0.45 : pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.sourceTypeText,
                      {
                        color: selected ? theme.colors.primaryText : theme.colors.textSecondary,
                        fontSize: theme.typography.fontSizes.sm,
                        fontWeight: theme.typography.fontWeights.medium,
                      },
                    ]}
                  >
                    {label}
                    {!enabled ? ' (soon)' : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {showCollectionPicker ? (
        <CollectionPicker
          selectedCollectionId={values.collectionId}
          onSelect={(collectionId) => onChange({ ...values, collectionId })}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {},
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 160,
  },
  fieldError: {
    fontSize: 13,
  },
  sourceTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sourceTypeChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sourceTypeText: {},
});
