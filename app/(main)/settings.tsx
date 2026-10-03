import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { ROUTES } from '../../src/config/routes';
import {
  useUpdateProfile,
  useResendVerification,
  useCurrentUser,
} from '../../src/api/queries/useAuth';
import { getApiError } from '../../src/api/client';
import type { ThemeColors } from '../../src/config/theme';
import {
  useThemeColors,
  useThemedStyles,
} from '../../src/hooks/useThemeColors';
import { ThemePicker } from '../../src/components/profile/ThemePicker';
import { LAYOUT } from '../../src/config/constants';
import { AvatarColorPicker } from '../../src/components/ui/AvatarColorPicker';
import { AnimatedSaveButton } from '../../src/components/ui/AnimatedSaveButton';
import { isEmailVerified } from '../../src/utils/emailVerification';

export default function SettingsScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.isGuest);
  const updateProfile = useUpdateProfile();
  const resendVerification = useResendVerification();
  const { refetch: refetchUser } = useCurrentUser();

  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor ?? null);
  const [error, setError] = useState<string | null>(null);

  // Resync the form when the user identity changes (e.g. account switch or the
  // current user's record is replaced from the server). Keyed on
  // user.ulid so in-progress edits to the same account aren't wiped.
  const syncedUserUlid = useRef(user?.ulid);
  useEffect(() => {
    if (user && user.ulid !== syncedUserUlid.current) {
      syncedUserUlid.current = user.ulid;
      setUsername(user.username ?? '');
      setEmail(user.email ?? '');
      setAvatarColor(user.avatarColor ?? null);
      setError(null);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (!isEmailVerified(user)) {
        refetchUser();
      }
    }, [user, refetchUser])
  );

  if (!user) {
    return null;
  }

  const hasUsernameChanges = username !== user.username;
  const hasEmailChanges = email !== user.email;
  const hasColorChanges = avatarColor !== user.avatarColor;
  const hasChanges = hasUsernameChanges || hasEmailChanges || hasColorChanges;
  const isValidUsername =
    username.length >= 3 &&
    username.length <= 20 &&
    /^[a-zA-Z0-9_]+$/.test(username);
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSave = async () => {
    setError(null);
    try {
      await updateProfile.mutateAsync({
        ...(hasUsernameChanges && { username }),
        ...(hasEmailChanges && { email }),
        ...(hasColorChanges && { avatar_color: avatarColor }),
      });
    } catch (err) {
      const apiError = getApiError(err);
      setError(apiError.message);
      throw err;
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerification.mutateAsync();
      Alert.alert(
        'Email Sent',
        'A verification email has been sent to your inbox.'
      );
    } catch (err) {
      const apiError = getApiError(err);
      Alert.alert('Error', apiError.message);
    }
  };

  if (isGuest) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
        >
          <AvatarColorPicker
            selectedColor={avatarColor}
            onSelectColor={setAvatarColor}
          />

          {hasColorChanges && (
            <View style={styles.saveSection}>
              {error && <Text style={styles.error}>{error}</Text>}
              <AnimatedSaveButton
                onPress={handleSave}
                label="Save Color"
                successLabel="Saved!"
              />
            </View>
          )}

          <ThemePicker />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {!isEmailVerified(user) && (
          <View style={styles.verificationCard}>
            <View style={styles.verificationHeader}>
              <Ionicons name="mail-outline" size={24} color={colors.warning} />
              <Text style={styles.verificationTitle}>Verify your email</Text>
            </View>
            <Text style={styles.verificationText}>
              Please verify your email within 7 days of creating your account.
              After that, you won&apos;t be able to log in until verified.
            </Text>
            <Pressable
              onPress={handleResendVerification}
              disabled={resendVerification.isPending}
              style={({ pressed }) => [
                styles.resendButton,
                { opacity: pressed && !resendVerification.isPending ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.resendButtonText}>
                {resendVerification.isPending
                  ? 'Sending...'
                  : 'Resend verification email'}
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.formSection} pointerEvents="box-none">
          <View style={styles.labelRow} pointerEvents="box-none">
            <Text style={styles.label}>Email</Text>
            {!isEmailVerified(user) && (
              <View style={styles.unverifiedBadge}>
                <Text style={styles.unverifiedText}>Unverified</Text>
              </View>
            )}
          </View>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {hasEmailChanges && (
            <Text style={styles.warningHint}>
              Your email will become unverified. A new verification link will be
              sent.
            </Text>
          )}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
          />
          <Text style={styles.hint}>
            3-20 characters, letters, numbers, and underscores only
          </Text>
        </View>

        <AvatarColorPicker
          selectedColor={avatarColor}
          onSelectColor={setAvatarColor}
        />

        <View style={styles.saveSection}>
          {error && <Text style={styles.error}>{error}</Text>}
          <AnimatedSaveButton
            onPress={handleSave}
            label="Save Changes"
            successLabel="Profile saved!"
            disabled={!hasChanges || !isValidUsername || !isValidEmail}
          />
        </View>

        <ThemePicker />

        <View style={styles.rowGroup}>
          <Pressable
            onPress={() => router.push(ROUTES.CHANGE_PASSWORD)}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <Ionicons name="key-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.rowLabel}>Change password</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        </View>

        <View style={styles.dangerZone}>
          <Pressable
            onPress={() => router.push(ROUTES.DELETE_ACCOUNT)}
            style={({ pressed }) => [
              styles.deleteLink,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.deleteLinkText}>Delete account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      maxWidth: LAYOUT.contentMaxWidth,
      width: '100%',
      alignSelf: 'center' as const,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 24,
      paddingBottom: 40,
    },
    verificationCard: {
      backgroundColor: 'rgba(255, 152, 0, 0.1)',
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: 'rgba(255, 152, 0, 0.3)',
    },
    verificationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 8,
    },
    verificationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.warning,
    },
    verificationText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    resendButton: {
      backgroundColor: colors.warning,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    resendButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#000',
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    unverifiedBadge: {
      backgroundColor: colors.warning,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    unverifiedText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#000',
    },
    warningHint: {
      fontSize: 12,
      color: colors.warning,
      marginTop: 8,
    },
    formSection: {
      marginBottom: 16,
    },
    saveSection: {
      marginBottom: 32,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: colors.backgroundLight,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.textPrimary,
    },
    hint: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 8,
    },
    error: {
      fontSize: 14,
      color: '#E74C3C',
      marginBottom: 8,
    },
    rowGroup: {
      backgroundColor: colors.backgroundLight,
      borderRadius: 12,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    rowPressed: {
      backgroundColor: colors.border,
    },
    rowLabel: {
      flex: 1,
      fontSize: 16,
      color: colors.textPrimary,
    },
    dangerZone: {
      marginTop: 32,
      alignItems: 'center',
    },
    deleteLink: {
      padding: 8,
    },
    deleteLinkText: {
      fontSize: 14,
      color: colors.textMuted,
    },
  });
