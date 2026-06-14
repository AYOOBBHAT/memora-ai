import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthFormLayout } from '../components/AuthFormLayout';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useLogin } from '../../../hooks/mutations/useLogin';
import { getApiErrorMessage } from '../../../lib/apiError';
import type { AuthStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const validate = (): boolean => {
    if (!email.trim()) {
      setFieldError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFieldError('Enter a valid email address');
      return false;
    }
    if (!password) {
      setFieldError('Password is required');
      return false;
    }
    setFieldError(null);
    return true;
  };

  const handleSubmit = () => {
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

  const inputStyle = [
    styles.input,
    {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      color: theme.colors.text,
    },
  ];

  return (
    <AuthFormLayout
      title="Welcome back"
      subtitle="Sign in to access your memories"
      footer={
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          Don&apos;t have an account?{' '}
          <Text
            style={{ color: theme.colors.primary, fontWeight: theme.typography.fontWeights.semibold }}
            onPress={() => navigation.navigate('Register')}
          >
            Sign up
          </Text>
        </Text>
      }
    >
      {apiError ? (
        <View style={[styles.errorBox, { backgroundColor: `${theme.colors.error}15` }]}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{apiError}</Text>
        </View>
      ) : null}

      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Email</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor={theme.colors.textSecondary}
          style={inputStyle}
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.field}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Password</Text>
          <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={[styles.link, { color: theme.colors.primary }]}>Forgot password?</Text>
          </Pressable>
        </View>
        <TextInput
          autoCapitalize="none"
          autoComplete="password"
          placeholder="••••••••"
          placeholderTextColor={theme.colors.textSecondary}
          secureTextEntry
          style={inputStyle}
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {fieldError ? (
        <Text style={[styles.fieldError, { color: theme.colors.error }]}>{fieldError}</Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        disabled={login.isPending}
        onPress={handleSubmit}
        style={({ pressed }) => [
          styles.primaryButton,
          {
            backgroundColor: theme.colors.primary,
            opacity: pressed || login.isPending ? 0.85 : 1,
          },
        ]}
      >
        {login.isPending ? (
          <ActivityIndicator color={theme.colors.primaryText} />
        ) : (
          <Text
            style={[
              styles.primaryButtonText,
              { color: theme.colors.primaryText, fontWeight: theme.typography.fontWeights.semibold },
            ]}
          >
            Sign in
          </Text>
        )}
      </Pressable>

      <GoogleSignInButton onError={setApiError} />
    </AuthFormLayout>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  link: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  fieldError: {
    fontSize: 14,
  },
  errorBox: {
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    fontSize: 16,
  },
  footerText: {
    fontSize: 15,
    textAlign: 'center',
  },
});
