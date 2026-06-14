import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthFormLayout } from '../components/AuthFormLayout';
import type { AuthStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { theme } = useTheme();

  return (
    <AuthFormLayout
      title="Reset password"
      subtitle="Password recovery is not available yet"
      footer={
        <Pressable onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.backLink, { color: theme.colors.primary }]}>
            Back to sign in
          </Text>
        </Pressable>
      }
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surfaceSecondary,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.comingSoon, { color: theme.colors.text }]}>
          Coming soon
        </Text>
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          We&apos;re working on password reset via email. For now, contact support if you need
          help accessing your account.
        </Text>
      </View>
    </AuthFormLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  comingSoon: {
    fontSize: 20,
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  backLink: {
    fontSize: 15,
    fontWeight: '600',
  },
});
