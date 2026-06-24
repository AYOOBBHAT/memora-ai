import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useHeaderHeight } from '@react-navigation/elements';

import { AuthFormLayout } from '../components/AuthFormLayout';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { AuthTextInput } from '../components/AuthTextInput';
import {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
} from '../utils/authValidation';
import type { AuthStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const emailRef = useRef<TextInput>(null);
  const newPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    email?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const clearError = (field: keyof typeof errors) => {
    setErrors((current) => ({ ...current, [field]: undefined }));
    setInfoMessage(null);
  };

  const validate = (): boolean => {
    const nextErrors = {
      email: validateEmail(email) ?? undefined,
      newPassword: validatePassword(newPassword) ?? undefined,
      confirmPassword: validateConfirmPassword(newPassword, confirmPassword) ?? undefined,
    };

    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleSubmit = () => {
    setInfoMessage(null);
    if (!validate()) {
      return;
    }

    setInfoMessage(
      'Password reset via email is coming soon. Contact support if you need help accessing your account.',
    );
  };

  return (
    <AuthFormLayout
      keyboardVerticalOffset={headerHeight}
      subtitle="Enter your email and choose a new password. We'll enable email reset soon."
      title="Reset password"
      footer={
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => navigation.navigate('Login')}
          style={({ pressed }) => [
            styles.backLink,
            { opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <Text
            style={[
              styles.backLinkText,
              {
                color: theme.colors.primary,
                fontSize: theme.typography.fontSizes.sm,
                fontWeight: theme.typography.fontWeights.semibold,
              },
            ]}
          >
            Back to sign in
          </Text>
        </Pressable>
      }
    >
      {infoMessage ? (
        <View style={[styles.infoBox, { backgroundColor: `${theme.colors.primary}12` }]}>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            {infoMessage}
          </Text>
        </View>
      ) : null}

      <AuthTextInput
        ref={emailRef}
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        error={errors.email}
        keyboardType="email-address"
        label="Email"
        placeholder="you@example.com"
        returnKeyType="next"
        textContentType="emailAddress"
        value={email}
        onChangeText={(value) => {
          clearError('email');
          setEmail(value);
        }}
        onSubmitEditing={() => newPasswordRef.current?.focus()}
      />

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

      <AuthPrimaryButton label="Reset password" onPress={handleSubmit} />
    </AuthFormLayout>
  );
}

const styles = StyleSheet.create({
  infoBox: {
    borderRadius: 12,
    padding: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  backLink: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 8,
  },
  backLinkText: {},
});
