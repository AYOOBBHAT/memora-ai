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
import { useRegister } from '../../../hooks/mutations/useRegister';
import { getApiErrorMessage } from '../../../lib/apiError';
import type { AuthStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const register = useRegister();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const validate = (): boolean => {
    if (!name.trim()) {
      setFieldError('Name is required');
      return false;
    }
    if (!email.trim()) {
      setFieldError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFieldError('Enter a valid email address');
      return false;
    }
    if (password.length < 8) {
      setFieldError('Password must be at least 8 characters');
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

    register.mutate(
      { name: name.trim(), email: email.trim(), password },
      {
        onError: (error) => {
          setApiError(getApiErrorMessage(error, 'Registration failed'));
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
      title="Create account"
      subtitle="Start building your AI-powered memory library"
      footer={
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          Already have an account?{' '}
          <Text
            style={{ color: theme.colors.primary, fontWeight: theme.typography.fontWeights.semibold }}
            onPress={() => navigation.navigate('Login')}
          >
            Sign in
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
        <Text style={[styles.label, { color: theme.colors.text }]}>Name</Text>
        <TextInput
          autoCapitalize="words"
          autoComplete="name"
          placeholder="Your name"
          placeholderTextColor={theme.colors.textSecondary}
          style={inputStyle}
          value={name}
          onChangeText={setName}
        />
      </View>

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
        <Text style={[styles.label, { color: theme.colors.text }]}>Password</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="new-password"
          placeholder="At least 8 characters"
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
        disabled={register.isPending}
        onPress={handleSubmit}
        style={({ pressed }) => [
          styles.primaryButton,
          {
            backgroundColor: theme.colors.primary,
            opacity: pressed || register.isPending ? 0.85 : 1,
          },
        ]}
      >
        {register.isPending ? (
          <ActivityIndicator color={theme.colors.primaryText} />
        ) : (
          <Text
            style={[
              styles.primaryButtonText,
              { color: theme.colors.primaryText, fontWeight: theme.typography.fontWeights.semibold },
            ]}
          >
            Create account
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
  label: {
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
