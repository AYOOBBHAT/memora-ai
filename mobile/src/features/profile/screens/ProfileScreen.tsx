import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuthMe } from '../../../hooks/queries/useAuthMe';
import { useLogout } from '../../../hooks/mutations/useLogout';
import { getApiErrorMessage } from '../../../lib/apiError';
import { useTheme } from '../../../theme/ThemeProvider';

export function ProfileScreen() {
  const { theme } = useTheme();
  const { data: user, isLoading } = useAuthMe();
  const logout = useLogout();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.text,
            fontSize: theme.typography.fontSizes.xl,
            fontWeight: theme.typography.fontWeights.semibold,
          },
        ]}
      >
        Profile
      </Text>

      {isLoading ? (
        <ActivityIndicator color={theme.colors.primary} />
      ) : user ? (
        <View style={styles.userInfo}>
          <Text
            style={[
              styles.name,
              {
                color: theme.colors.text,
                fontSize: theme.typography.fontSizes.lg,
                fontWeight: theme.typography.fontWeights.medium,
              },
            ]}
          >
            {user.name}
          </Text>
          <Text
            style={[
              styles.email,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSizes.md,
              },
            ]}
          >
            {user.email}
          </Text>
        </View>
      ) : (
        <Text
          style={[
            styles.subtitle,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSizes.md,
            },
          ]}
        >
          Unable to load profile
        </Text>
      )}

      {logout.error ? (
        <Text style={[styles.error, { color: theme.colors.error }]}>
          {getApiErrorMessage(logout.error, 'Logout failed')}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        disabled={logout.isPending}
        onPress={() => logout.mutate()}
        style={({ pressed }) => [
          styles.logoutButton,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: pressed || logout.isPending ? 0.85 : 1,
          },
        ]}
      >
        {logout.isPending ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : (
          <Text
            style={[
              styles.logoutText,
              {
                color: theme.colors.error,
                fontSize: theme.typography.fontSizes.md,
                fontWeight: theme.typography.fontWeights.semibold,
              },
            ]}
          >
            Log out
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  userInfo: {
    alignItems: 'center',
    gap: 4,
  },
  name: {
    textAlign: 'center',
  },
  email: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  logoutButton: {
    marginTop: 16,
    minWidth: 160,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoutText: {
    textAlign: 'center',
  },
});
