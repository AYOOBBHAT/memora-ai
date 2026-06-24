import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthFooterLink } from '../components/AuthFooterLink';
import { AuthFormLayout } from '../components/AuthFormLayout';
import { AuthPrimaryButton } from '../components/AuthPrimaryButton';
import { AuthTextInput } from '../components/AuthTextInput';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useLogin } from '../../../hooks/mutations/useLogin';
import { getApiErrorMessage } from '../../../lib/apiError';
import { validateEmail, validatePassword } from '../utils/authValidation';
import type { AuthStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const login = useLogin();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const clearError = (field: keyof typeof errors) => {
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = (): boolean => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    const nextErrors = {
      email: emailError ?? undefined,
      password: passwordError ?? undefined,
    };

    setErrors(nextErrors);
    return !emailError && !passwordError;
  };

  const handleSubmit = () => {
    if (login.isPending) {
      return;
    }

    setApiError(null);
    if (!validate()) {
      return;
    }

    login.mutate(
      { email: email.trim(), password },
      {
        onError: (error) => {
          setApiError(getApiErrorMessage(error, 'Login failed'));
        },
      },
    );
  };

  return (
    <AuthFormLayout
      brandTagline="Your knowledge workspace"
      footer={
        <AuthFooterLink
          actionLabel="Sign up"
          prompt="Don't have an account?"
          onPress={() => navigation.navigate('Register')}
        />
      }
      subtitle="Access your AI-powered knowledge library and continue where you left off."
      title="Welcome back"
    >
      {apiError ? (
        <View style={[styles.errorBox, { backgroundColor: `${theme.colors.error}15` }]}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{apiError}</Text>
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
        onSubmitEditing={() => passwordRef.current?.focus()}
      />

      <View style={styles.passwordField}>
        <View style={styles.labelRow}>
          <Text
            style={[
              styles.passwordLabel,
              {
                color: theme.colors.text,
                fontSize: theme.typography.fontSizes.sm,
                fontWeight: theme.typography.fontWeights.medium,
              },
            ]}
          >
            Password
          </Text>
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => navigation.navigate('ForgotPassword')}
            style={({ pressed }) => [
              styles.forgotLink,
              { opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Text
              style={[
                styles.link,
                {
                  color: theme.colors.primary,
                  fontSize: theme.typography.fontSizes.sm,
                  fontWeight: theme.typography.fontWeights.medium,
                },
              ]}
            >
              Forgot password?
            </Text>
          </Pressable>
        </View>
        <AuthTextInput
          ref={passwordRef}
          autoCapitalize="none"
          autoComplete="password"
          autoCorrect={false}
          error={errors.password}
          passwordToggle
          placeholder="••••••••"
          returnKeyType="done"
          secureTextEntry
          textContentType="password"
          value={password}
          onChangeText={(value) => {
            clearError('password');
            setPassword(value);
          }}
          onSubmitEditing={handleSubmit}
        />
      </View>

      <AuthPrimaryButton
        label="Sign in"
        loading={login.isPending}
        loadingLabel="Signing in…"
        onPress={handleSubmit}
      />

      <GoogleSignInButton onError={setApiError} />
    </AuthFormLayout>
  );
}

const styles = StyleSheet.create({
  passwordField: {
    gap: 0,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  passwordLabel: {},
  forgotLink: {
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 4,
  },
  link: {},
  errorBox: {
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
