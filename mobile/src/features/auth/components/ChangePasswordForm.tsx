import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthFieldError } from './AuthFieldError';
import { AuthPrimaryButton } from './AuthPrimaryButton';
import { AuthTextInput } from './AuthTextInput';
import {
  validateConfirmPassword,
  validatePassword,
} from '../utils/authValidation';
import { useTheme } from '../../../theme/ThemeProvider';

interface ChangePasswordFormProps {
  /** When false, omits the current-password field (e.g. forgot-password flow). */
  requireCurrentPassword?: boolean;
  submitLabel?: string;
  loadingLabel?: string;
  onSubmit?: () => void;
  disabled?: boolean;
  loading?: boolean;
  infoMessage?: string | null;
}

export function ChangePasswordForm({
  requireCurrentPassword = true,
  submitLabel = 'Update password',
  loadingLabel = 'Updating…',
  onSubmit,
  disabled = false,
  loading = false,
  infoMessage = null,
}: ChangePasswordFormProps) {
  const { theme } = useTheme();
  const currentPasswordRef = useRef<TextInput>(null);
  const newPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const clearError = (field: keyof typeof errors) => {
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = () => {
    const nextErrors: typeof errors = {};

    if (requireCurrentPassword && !currentPassword) {
      nextErrors.currentPassword = 'Current password is required';
    }

    const newPasswordError = validatePassword(newPassword);
    if (newPasswordError) {
      nextErrors.newPassword = newPasswordError;
    }

    const confirmError = validateConfirmPassword(newPassword, confirmPassword);
    if (confirmError) {
      nextErrors.confirmPassword = confirmError;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    onSubmit?.();
  };

  return (
    <View style={styles.form}>
      {infoMessage ? (
        <View style={[styles.infoBox, { backgroundColor: `${theme.colors.primary}12` }]}>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            {infoMessage}
          </Text>
        </View>
      ) : null}

      {requireCurrentPassword ? (
        <AuthTextInput
          ref={currentPasswordRef}
          autoCapitalize="none"
          autoComplete="password"
          autoCorrect={false}
          error={errors.currentPassword}
          label="Current password"
          passwordToggle
          placeholder="Enter current password"
          returnKeyType="next"
          secureTextEntry
          textContentType="password"
          value={currentPassword}
          onChangeText={(value) => {
            clearError('currentPassword');
            setCurrentPassword(value);
          }}
          onSubmitEditing={() => newPasswordRef.current?.focus()}
        />
      ) : null}

      <AuthTextInput
        ref={newPasswordRef}
        autoCapitalize="none"
        autoComplete="new-password"
        autoCorrect={false}
        error={errors.newPassword}
        label="New password"
        passwordToggle
        placeholder="At least 8 characters"
        returnKeyType="next"
        secureTextEntry
        textContentType="newPassword"
        value={newPassword}
        onChangeText={(value) => {
          clearError('newPassword');
          setNewPassword(value);
        }}
        onSubmitEditing={() => confirmPasswordRef.current?.focus()}
      />

      <AuthTextInput
        ref={confirmPasswordRef}
        autoCapitalize="none"
        autoComplete="new-password"
        autoCorrect={false}
        error={errors.confirmPassword}
        label="Confirm password"
        passwordToggle
        placeholder="Re-enter new password"
        returnKeyType="done"
        secureTextEntry
        textContentType="newPassword"
        value={confirmPassword}
        onChangeText={(value) => {
          clearError('confirmPassword');
          setConfirmPassword(value);
        }}
        onSubmitEditing={handleSubmit}
      />

      <AuthPrimaryButton
        disabled={disabled}
        label={submitLabel}
        loading={loading}
        loadingLabel={loadingLabel}
        onPress={handleSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  infoBox: {
    borderRadius: 12,
    padding: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
