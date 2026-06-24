import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthFooterLink } from '../components/AuthFooterLink';
import { AuthFormLayout } from '../components/AuthFormLayout';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { AuthTextInput } from '../components/AuthTextInput';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useRegister } from '../../../hooks/mutations/useRegister';
import { getApiErrorMessage } from '../../../lib/apiError';
import {
  validateConfirmPassword,
  validateEmail,
  validateName,
  validatePassword,
} from '../utils/authValidation';
import type { AuthStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const register = useRegister();
  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const clearError = (field: keyof typeof errors) => {
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = (): boolean => {
    const nextErrors = {
      name: validateName(name) ?? undefined,
      email: validateEmail(email) ?? undefined,
      password: validatePassword(password) ?? undefined,
      confirmPassword: validateConfirmPassword(password, confirmPassword) ?? undefined,
    };

    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleSubmit = () => {
    if (register.isPending) {
      return;
    }

    setApiError(null);
    if (!validate()) {
      return;
    }

    register.mutate(
      { name: name.trim(), email: email.trim(), password },
      {
        onError: (error) => {
          setApiError(getApiErrorMessage(error, 'Registration failed'));
        },
      },
    );
  };

  return (
    <AuthFormLayout
      brandTagline="Organize everything. Remember anything."
      showBack
      footer={
        <AuthFooterLink
          actionLabel="Sign in"
          prompt="Already have an account?"
          onPress={() => navigation.navigate('Login')}
        />
      }
      subtitle="Start building your personal AI knowledge base with documents, notes, websites and YouTube."
      title="Create account"
      onBack={() => navigation.goBack()}
    >
      {apiError ? (
        <View style={[styles.errorBox, { backgroundColor: `${theme.colors.error}15` }]}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{apiError}</Text>
        </View>
      ) : null}

      <AuthTextInput
        ref={nameRef}
        autoCapitalize="words"
        autoComplete="name"
        error={errors.name}
        label="Name"
        placeholder="Your name"
        returnKeyType="next"
        textContentType="name"
        value={name}
        onChangeText={(value) => {
          clearError('name');
          setName(value);
        }}
        onSubmitEditing={() => emailRef.current?.focus()}
      />

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
        onSubmitEditing={() => passwordRef.current?.focus()}
      />

      <AuthTextInput
        ref={passwordRef}
        autoCapitalize="none"
        autoComplete="new-password"
        autoCorrect={false}
        error={errors.password}
        label="Password"
        passwordToggle
        placeholder="At least 8 characters"
        returnKeyType="next"
        secureTextEntry
        textContentType="newPassword"
        value={password}
        onChangeText={(value) => {
          clearError('password');
          setPassword(value);
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
        placeholder="Re-enter your password"
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
        label="Create account"
        loading={register.isPending}
        loadingLabel="Creating account…"
        onPress={handleSubmit}
      />

      <GoogleSignInButton onError={setApiError} />
    </AuthFormLayout>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
