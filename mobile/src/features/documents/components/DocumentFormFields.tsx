import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { DocumentSourceType } from '../../../api/types';
import { useCollections } from '../../../hooks/queries/useCollections';
import { useTheme } from '../../../theme/ThemeProvider';

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
}

const SOURCE_TYPES: { type: DocumentSourceType; label: string; enabled: boolean }[] = [
  { type: 'text', label: 'Text', enabled: true },
  { type: 'url', label: 'URL', enabled: false },
  { type: 'pdf', label: 'PDF', enabled: false },
  { type: 'youtube', label: 'YouTube', enabled: false },
  { type: 'upload', label: 'Upload', enabled: false },
];

export function DocumentFormFields({
  values,
  onChange,
  titleError,
  contentError,
  showCollectionPicker = true,
  showSourceTypeSelector = true,
}: DocumentFormFieldsProps) {
  const { theme } = useTheme();
  const { data: collections = [] } = useCollections();

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
          Title *
        </Text>
        <TextInput
          accessibilityLabel="Document title"
          autoCapitalize="sentences"
          placeholder="Document title"
          placeholderTextColor={theme.colors.textSecondary}
          style={inputStyle(Boolean(titleError))}
          value={values.title}
          onChangeText={(title) => onChange({ ...values, title })}
        />
        {titleError ? (
          <Text style={[styles.fieldError, { color: theme.colors.error }]}>{titleError}</Text>
        ) : null}
      </View>

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
          Content *
        </Text>
        <TextInput
          accessibilityLabel="Document content"
          multiline
          placeholder="Paste or write your text here..."
          placeholderTextColor={theme.colors.textSecondary}
          style={[inputStyle(Boolean(contentError)), styles.textArea]}
          textAlignVertical="top"
          value={values.content}
          onChangeText={(content) => onChange({ ...values, content })}
        />
        {contentError ? (
          <Text style={[styles.fieldError, { color: theme.colors.error }]}>{contentError}</Text>
        ) : null}
      </View>

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
            Collection (optional)
          </Text>
          <View style={styles.collectionList}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: values.collectionId === null }}
              onPress={() => onChange({ ...values, collectionId: null })}
              style={({ pressed }) => [
                styles.collectionOption,
                {
                  backgroundColor:
                    values.collectionId === null ? theme.colors.surfaceSecondary : theme.colors.surface,
                  borderColor:
                    values.collectionId === null ? theme.colors.primary : theme.colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.collectionOptionText,
                  {
                    color: theme.colors.text,
                    fontSize: theme.typography.fontSizes.sm,
                  },
                ]}
              >
                No collection
              </Text>
            </Pressable>
            {collections.map((collection) => {
              const selected = values.collectionId === collection.id;

              return (
                <Pressable
                  key={collection.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => onChange({ ...values, collectionId: collection.id })}
                  style={({ pressed }) => [
                    styles.collectionOption,
                    {
                      backgroundColor: selected
                        ? theme.colors.surfaceSecondary
                        : theme.colors.surface,
                      borderColor: selected ? theme.colors.primary : theme.colors.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text style={styles.collectionIcon}>{collection.icon ?? '📁'}</Text>
                  <Text
                    style={[
                      styles.collectionOptionText,
                      {
                        color: theme.colors.text,
                        fontSize: theme.typography.fontSizes.sm,
                      },
                    ]}
                  >
                    {collection.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
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
  collectionList: {
    gap: 8,
  },
  collectionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  collectionIcon: {
    fontSize: 18,
  },
  collectionOptionText: {
    flex: 1,
  },
});
