import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useInputScrollOnFocus } from '../../../components/layout/useInputScrollOnFocus';
import {
  COLLECTION_COLORS,
  COLLECTION_ICON_OPTIONS,
  DEFAULT_COLLECTION_COLOR,
  DEFAULT_COLLECTION_ICON,
} from '../constants';
import { CollectionIconDisplay } from './CollectionIconDisplay';
import { encodeCollectionIcon } from '../utils/collectionIcon';
import { useTheme } from '../../../theme/ThemeProvider';

export interface CollectionFormValues {
  name: string;
  description: string;
  color: string;
  icon: string;
}

interface CollectionFormFieldsProps {
  values: CollectionFormValues;
  onChange: (values: CollectionFormValues) => void;
  nameError?: string | null;
}

export function CollectionFormFields({ values, onChange, nameError }: CollectionFormFieldsProps) {
  const { theme } = useTheme();
  const nameField = useInputScrollOnFocus();
  const descriptionField = useInputScrollOnFocus();

  const inputStyle = [
    styles.input,
    {
      backgroundColor: theme.colors.surface,
      borderColor: nameError ? theme.colors.error : theme.colors.border,
      color: theme.colors.text,
    },
  ];

  return (
    <View style={styles.container}>
      <View ref={nameField.fieldRef} style={styles.field}>
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
          Name *
        </Text>
        <TextInput
          accessibilityLabel="Collection name"
          autoCapitalize="sentences"
          placeholder="My collection"
          placeholderTextColor={theme.colors.textSecondary}
          returnKeyType="next"
          style={inputStyle}
          value={values.name}
          onChangeText={(name) => onChange({ ...values, name })}
          onFocus={nameField.createFocusHandler()}
        />
        {nameError ? (
          <Text style={[styles.fieldError, { color: theme.colors.error }]}>{nameError}</Text>
        ) : null}
      </View>

      <View ref={descriptionField.fieldRef} style={styles.field}>
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
          Description
        </Text>
        <TextInput
          accessibilityLabel="Collection description"
          multiline
          numberOfLines={3}
          placeholder="Optional description"
          placeholderTextColor={theme.colors.textSecondary}
          style={[inputStyle, styles.textArea]}
          textAlignVertical="top"
          value={values.description}
          onChangeText={(description) => onChange({ ...values, description })}
          onFocus={descriptionField.createFocusHandler()}
        />
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
          Color
        </Text>
        <View style={styles.pickerRow}>
          {COLLECTION_COLORS.map((color) => {
            const selected = values.color === color;
            return (
              <Pressable
                key={color}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onChange({ ...values, color })}
                style={[
                  styles.colorSwatch,
                  {
                    backgroundColor: color,
                    borderColor: selected ? theme.colors.text : theme.colors.border,
                    borderWidth: selected ? 3 : 1,
                  },
                ]}
              />
            );
          })}
        </View>
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
          Icon
        </Text>
        <View style={styles.pickerRow}>
          {COLLECTION_ICON_OPTIONS.map((option) => {
            const encodedIcon = encodeCollectionIcon(option);
            const selected = values.icon === encodedIcon;

            return (
              <Pressable
                key={encodedIcon}
                accessibilityLabel={option.label}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onChange({ ...values, icon: encodedIcon })}
                style={[
                  styles.iconButton,
                  {
                    backgroundColor: selected ? theme.colors.surfaceSecondary : theme.colors.surface,
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                <CollectionIconDisplay
                  color={option.kind === 'ionicon' ? theme.colors.text : undefined}
                  icon={encodedIcon}
                  size={22}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export function createDefaultFormValues(overrides?: Partial<CollectionFormValues>): CollectionFormValues {
  return {
    name: '',
    description: '',
    color: DEFAULT_COLLECTION_COLOR,
    icon: DEFAULT_COLLECTION_ICON,
    ...overrides,
  };
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
    minHeight: 88,
  },
  fieldError: {
    fontSize: 13,
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
