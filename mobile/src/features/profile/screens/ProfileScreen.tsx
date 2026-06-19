import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { env } from '../../../config/env';
import { BottomSheet } from '../../../components/ui/BottomSheet';
import { useAuthMe } from '../../../hooks/queries/useAuthMe';
import { useCollections } from '../../../hooks/queries/useCollections';
import { useConversations } from '../../../hooks/queries/useConversations';
import { useDocuments } from '../../../hooks/queries/useDocuments';
import { useLogout } from '../../../hooks/mutations/useLogout';
import { formatDocumentDate } from '../../documents/utils/formatDocument';
import { getApiErrorMessage } from '../../../lib/apiError';
import { useTheme } from '../../../theme/ThemeProvider';
import { HelpFaqSheet } from '../components/HelpFaqSheet';
import { ProfileMenuRow, ProfileSection } from '../components/ProfileSection';

function openExternalUrl(url: string, label: string) {
  if (!url) {
    Alert.alert(
      `${label} unavailable`,
      `${label} URL is not configured. Set the corresponding EXPO_PUBLIC_* variable.`,
    );
    return;
  }

  void Linking.openURL(url).catch(() => {
    Alert.alert('Unable to open link', `Could not open ${label}.`);
  });
}

function getInitials(name?: string): string {
  if (!name?.trim()) {
    return '?';
  }

  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function getMemberLabel(createdAt?: string): string {
  if (!createdAt) {
    return 'Memora Member';
  }

  try {
    return `Member since ${formatDocumentDate(createdAt)}`;
  } catch {
    return 'Memora Member';
  }
}

function getAppVersionLabel(): string {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const build =
    Constants.nativeBuildVersion ??
    Constants.expoConfig?.ios?.buildNumber ??
    Constants.expoConfig?.android?.versionCode?.toString();

  return build ? `Version ${version} (${build})` : `Version ${version}`;
}

export function ProfileScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const { data: user, isLoading: isUserLoading } = useAuthMe();
  const { data: documents = [], isLoading: isDocumentsLoading } = useDocuments();
  const { data: collections = [], isLoading: isCollectionsLoading } = useCollections();
  const { data: conversations = [], isLoading: isChatsLoading } = useConversations();
  const logout = useLogout();

  const isLocalAccount = user?.provider === 'local';
  const isStatsLoading = isDocumentsLoading || isCollectionsLoading || isChatsLoading;

  const stats = useMemo(
    () => [
      { label: 'Documents', value: documents.length },
      { label: 'Collections', value: collections.length },
      { label: 'AI Chats', value: conversations.length },
    ],
    [collections.length, conversations.length, documents.length],
  );

  const handleContactSupport = () => {
    const subject = encodeURIComponent('Memora Support');
    const mailto = `mailto:${env.supportEmail}?subject=${subject}`;
    void Linking.openURL(mailto).catch(() => {
      Alert.alert('Unable to open email', `Please email ${env.supportEmail} for support.`);
    });
  };

  const handleRateApp = () => {
    if (env.playStoreUrl) {
      openExternalUrl(env.playStoreUrl, 'Play Store');
      return;
    }

    Alert.alert(
      'Rate Memora',
      'Rate feature will be enabled after public release.',
    );
  };

  const handleChangePassword = () => {
    setIsChangePasswordOpen(true);
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => logout.mutate(),
      },
    ]);
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + theme.spacing.md,
            paddingBottom: insets.bottom + theme.spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: theme.colors.background }}
      >
        <Text
          style={[
            styles.screenTitle,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSizes.xxl,
              fontWeight: theme.typography.fontWeights.bold,
            },
          ]}
        >
          Profile
        </Text>

        {isUserLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
        ) : user ? (
          <View
            style={[
              styles.profileCard,
              theme.elevation.soft,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: `${theme.colors.border}AA`,
                borderRadius: theme.radii.xl,
              },
            ]}
          >
            <View
              pointerEvents="none"
              style={[
                styles.profileGradient,
                {
                  backgroundColor: `${theme.colors.primary}10`,
                  borderTopLeftRadius: theme.radii.xl,
                  borderTopRightRadius: theme.radii.xl,
                },
              ]}
            />
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: `${theme.colors.primary}20`,
                  borderRadius: theme.radii.full,
                },
              ]}
            >
              <Text
                style={[
                  styles.avatarText,
                  {
                    color: theme.colors.primary,
                    fontSize: theme.typography.fontSizes.xl,
                    fontWeight: theme.typography.fontWeights.bold,
                  },
                ]}
              >
                {getInitials(user.name)}
              </Text>
            </View>
            <Text
              style={[
                styles.name,
                {
                  color: theme.colors.text,
                  fontSize: theme.typography.fontSizes.lg,
                  fontWeight: theme.typography.fontWeights.semibold,
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
                  fontSize: theme.typography.fontSizes.sm,
                },
              ]}
            >
              {user.email}
            </Text>
            <View
              style={[
                styles.memberBadge,
                {
                  backgroundColor: `${theme.colors.primary}12`,
                  borderRadius: theme.radii.full,
                },
              ]}
            >
              <Ionicons color={theme.colors.primary} name="sparkles" size={12} />
              <Text
                style={[
                  styles.memberText,
                  {
                    color: theme.colors.primary,
                    fontSize: theme.typography.fontSizes.xs,
                    fontWeight: theme.typography.fontWeights.medium,
                  },
                ]}
              >
                {getMemberLabel(user.createdAt)}
              </Text>
            </View>

            <View style={styles.statsRow}>
              {stats.map((stat) => (
                <View
                  key={stat.label}
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: theme.colors.surfaceSecondary,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radii.lg,
                    },
                  ]}
                >
                  {isStatsLoading ? (
                    <ActivityIndicator color={theme.colors.primary} size="small" />
                  ) : (
                    <Text
                      style={[
                        styles.statValue,
                        {
                          color: theme.colors.text,
                          fontSize: theme.typography.fontSizes.lg,
                          fontWeight: theme.typography.fontWeights.bold,
                        },
                      ]}
                    >
                      {stat.value}
                    </Text>
                  )}
                  <Text
                    style={[
                      styles.statLabel,
                      {
                        color: theme.colors.textSecondary,
                        fontSize: theme.typography.fontSizes.xs,
                      },
                    ]}
                  >
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
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

        {isLocalAccount ? (
          <ProfileSection title="Account">
            <ProfileMenuRow
              icon="lock-closed-outline"
              label="Change Password"
              onPress={handleChangePassword}
            />
          </ProfileSection>
        ) : null}

        <ProfileSection title="Support">
          <ProfileMenuRow
            icon="help-circle-outline"
            label="Help & FAQ"
            onPress={() => setIsHelpOpen(true)}
          />
          <ProfileMenuRow
            icon="mail-outline"
            label="Contact Support"
            onPress={handleContactSupport}
          />
          <ProfileMenuRow icon="star-outline" label="Rate the App" onPress={handleRateApp} />
        </ProfileSection>

        <ProfileSection title="Legal">
          <ProfileMenuRow
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => openExternalUrl(env.privacyPolicyUrl, 'Privacy Policy')}
          />
          <ProfileMenuRow
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => openExternalUrl(env.termsOfServiceUrl, 'Terms of Service')}
          />
        </ProfileSection>

        <ProfileSection title="About">
          <View
            style={[
              styles.aboutCard,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: `${theme.colors.border}AA`,
                borderRadius: theme.radii.lg,
              },
            ]}
          >
            <Text
              style={[
                styles.aboutVersion,
                {
                  color: theme.colors.text,
                  fontSize: theme.typography.fontSizes.sm,
                  fontWeight: theme.typography.fontWeights.medium,
                },
              ]}
            >
              {getAppVersionLabel()}
            </Text>
            <Text
              style={[
                styles.aboutTagline,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSizes.sm,
                },
              ]}
            >
              Made with ❤️ by Memora
            </Text>
            <Text
              style={[
                styles.aboutPowered,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSizes.xs,
                },
              ]}
            >
              Semantic search powered by Gemini AI
            </Text>
          </View>
        </ProfileSection>

        <ProfileSection title="Danger Zone">
          {logout.error ? (
            <Text style={[styles.error, { color: theme.colors.error }]}>
              {getApiErrorMessage(logout.error, 'Logout failed')}
            </Text>
          ) : null}
          <Pressable
            accessibilityLabel="Log out"
            accessibilityRole="button"
            disabled={logout.isPending}
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              {
                backgroundColor: `${theme.colors.error}10`,
                borderColor: `${theme.colors.error}44`,
                borderRadius: theme.radii.lg,
                opacity: pressed || logout.isPending ? 0.88 : 1,
              },
            ]}
          >
            {logout.isPending ? (
              <ActivityIndicator color={theme.colors.error} />
            ) : (
              <>
                <Ionicons color={theme.colors.error} name="log-out-outline" size={20} />
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
                  Log Out
                </Text>
              </>
            )}
          </Pressable>
        </ProfileSection>
      </ScrollView>

      <HelpFaqSheet visible={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <BottomSheet
        showCloseButton
        title="Change Password"
        visible={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      >
        <View
          style={[
            styles.placeholderCard,
            {
              backgroundColor: theme.colors.surfaceSecondary,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.lg,
            },
          ]}
        >
          <Ionicons color={theme.colors.primary} name="lock-closed-outline" size={28} />
          <Text
            style={[
              styles.placeholderTitle,
              {
                color: theme.colors.text,
                fontSize: theme.typography.fontSizes.md,
                fontWeight: theme.typography.fontWeights.semibold,
              },
            ]}
          >
            Coming soon
          </Text>
          <Text
            style={[
              styles.placeholderBody,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSizes.sm,
                lineHeight: 20,
              },
            ]}
          >
            This feature will be available soon.
          </Text>
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: 24,
    paddingHorizontal: 16,
  },
  screenTitle: {
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  loader: {
    marginVertical: 24,
  },
  profileCard: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
    overflow: 'hidden',
    paddingBottom: 18,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  profileGradient: {
    height: 96,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  avatar: {
    alignItems: 'center',
    height: 80,
    justifyContent: 'center',
    marginBottom: 4,
    width: 80,
  },
  avatarText: {},
  name: {
    textAlign: 'center',
  },
  email: {
    textAlign: 'center',
  },
  memberBadge: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  memberText: {},
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    width: '100%',
  },
  statCard: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: 4,
    minHeight: 68,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  statValue: {},
  statLabel: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  aboutCard: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  aboutVersion: {},
  aboutTagline: {},
  aboutPowered: {
    marginTop: 2,
    textAlign: 'center',
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
  },
  logoutButton: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 20,
  },
  logoutText: {},
  placeholderCard: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  placeholderTitle: {},
  placeholderBody: {
    textAlign: 'center',
  },
});
