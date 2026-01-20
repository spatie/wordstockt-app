import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';
import { useAuthStore } from '../../src/stores/authStore';
import { ROUTES } from '../../src/config/routes';
import { useUpdateProfile, useResendVerification, useCurrentUser } from '../../src/api/queries/useAuth';
import { useUserStats } from '../../src/api/queries/useStats';
import { getApiError } from '../../src/api/client';
import { colors } from '../../src/config/theme';
import {
  StatsOverviewCard,
  StatsSection,
  StatRow,
} from '../../src/components/stats';
import { Avatar } from '../../src/components/ui/Avatar';
import { AvatarColorPicker } from '../../src/components/ui/AvatarColorPicker';
import { AnimatedSaveButton } from '../../src/components/ui/AnimatedSaveButton';
import { isEmailVerified } from '../../src/utils/emailVerification';

export default function ProfileScreen() {
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

  useFocusEffect(
    useCallback(() => {
      if (!isEmailVerified(user)) {
        refetchUser();
      }
    }, [user, refetchUser])
  );

  const { data: stats, isLoading: statsLoading } = useUserStats(
    user?.ulid ?? '',
    { enabled: !isGuest }
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
      Alert.alert('Email Sent', 'A verification email has been sent to your inbox.');
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
          {/* Avatar and Username */}
          <View style={styles.header}>
            <Avatar
              name={user.username}
              size={80}
              backgroundColor={avatarColor ?? undefined}
            />
            <Text style={styles.guestUsername}>{user.username}</Text>
            <View style={styles.guestBadge}>
              <Text style={styles.guestBadgeText}>Guest Account</Text>
            </View>
          </View>

          {/* Avatar Color Picker */}
          <AvatarColorPicker
            selectedColor={avatarColor}
            onSelectColor={setAvatarColor}
          />

          {/* Save Color Button */}
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

          {/* Create Account Prompt */}
          <View style={styles.guestPromptCard}>
            <Ionicons
              name="person-add-outline"
              size={48}
              color={colors.primary}
            />
            <Text style={styles.guestPromptTitle}>Create Your Free Account</Text>
            <Text style={styles.guestPromptText}>
              100% free. No ads. Your data stays private.
            </Text>

            <View style={styles.benefitsList}>
              <View style={styles.benefitRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.gameWon}
                />
                <Text style={styles.benefitText}>Choose your own username</Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.gameWon}
                />
                <Text style={styles.benefitText}>Unlimited games</Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.gameWon}
                />
                <Text style={styles.benefitText}>Track wins, stats & achievements</Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.gameWon}
                />
                <Text style={styles.benefitText}>Add friends & send invites</Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.gameWon}
                />
                <Text style={styles.benefitText}>Compete on the leaderboard</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.createAccountButton,
                pressed && styles.createAccountButtonPressed,
              ]}
              onPress={() => router.push(ROUTES.CONVERT_ACCOUNT)}
            >
              <Text style={styles.createAccountButtonText}>
                Create Free Account
              </Text>
            </Pressable>
          </View>
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
        {/* Avatar */}
        <View style={styles.header}>
          <Avatar
            name={user.username}
            size={80}
            backgroundColor={avatarColor ?? undefined}
          />
        </View>

        {/* Verification Warning */}
        {!isEmailVerified(user) && (
          <View style={styles.verificationCard}>
            <View style={styles.verificationHeader}>
              <Ionicons name="mail-outline" size={24} color={colors.warning} />
              <Text style={styles.verificationTitle}>Verify your email</Text>
            </View>
            <Text style={styles.verificationText}>
              Please verify your email within 7 days of creating your account.
              After that, you won't be able to log in until verified.
            </Text>
            <TouchableOpacity
              onPress={handleResendVerification}
              disabled={resendVerification.isPending}
              style={styles.resendButton}
            >
              <Text style={styles.resendButtonText}>
                {resendVerification.isPending ? 'Sending...' : 'Resend verification email'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Profile Form */}
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
            editable={true}
          />
          {hasEmailChanges && (
            <Text style={styles.warningHint}>
              Your email will become unverified. A new verification link will be sent.
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

        {/* Avatar Color Picker */}
        <AvatarColorPicker
          selectedColor={avatarColor}
          onSelectColor={setAvatarColor}
        />

        {/* Save Button */}
        <View style={styles.saveSection}>
          {error && <Text style={styles.error}>{error}</Text>}
          <AnimatedSaveButton
            onPress={handleSave}
            label="Save Changes"
            successLabel="Profile saved!"
            disabled={!hasChanges || !isValidUsername || !isValidEmail}
          />
        </View>

        {/* Statistics Section */}
        {statsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loadingText}>Loading statistics...</Text>
          </View>
        ) : stats ? (
          <>
            {/* Overview Card */}
            <StatsOverviewCard stats={stats} />

            {/* Word & Move Stats */}
            <StatsSection title="Word & Move Records">
              {stats.highestScoringWord && (
                <StatRow
                  label="Highest scoring word"
                  value={stats.highestScoringWord.word.toUpperCase()}
                  suffix={`${stats.highestScoringWord.score} pts`}
                  highlight
                />
              )}
              <StatRow
                label="Highest single move"
                value={stats.highestScoringMove}
                suffix="pts"
              />
              <StatRow label="Bingos" value={stats.bingosCount} highlight />
              <StatRow
                label="Total words played"
                value={stats.totalWordsPlayed}
              />
              <StatRow
                label="Total points scored"
                value={stats.totalPointsScored.toLocaleString()}
              />
            </StatsSection>

            {/* Game Performance */}
            <StatsSection title="Game Performance">
              <StatRow
                label="Highest game score"
                value={stats.highestGameScore}
                suffix="pts"
                highlight
              />
              <StatRow
                label="Average game score"
                value={stats.averageGameScore.toFixed(0)}
                suffix="pts"
              />
              <StatRow
                label="Best win streak"
                value={stats.bestWinStreak}
                suffix="games"
              />
              {stats.biggestComeback > 0 && (
                <StatRow
                  label="Biggest comeback"
                  value={stats.biggestComeback}
                  suffix="pts"
                  highlight
                />
              )}
              {stats.closestVictory !== null && stats.closestVictory > 0 && (
                <StatRow
                  label="Closest victory"
                  value={stats.closestVictory}
                  suffix="pts"
                />
              )}
            </StatsSection>

            {/* Special Tiles */}
            <StatsSection title="Special Tiles">
              <StatRow
                label="Triple word tiles used"
                value={stats.tripleWordTilesUsed}
              />
              <StatRow
                label="Double word tiles used"
                value={stats.doubleWordTilesUsed}
              />
              <StatRow
                label="Blank tiles played"
                value={stats.blankTilesPlayed}
              />
              <StatRow
                label="First move win rate"
                value={`${stats.firstMoveWinRate.toFixed(0)}%`}
              />
            </StatsSection>
          </>
        ) : (
          <View style={styles.noStatsContainer}>
            <Text style={styles.noStatsText}>
              Play some games to start tracking your statistics!
            </Text>
          </View>
        )}

        {/* Delete Account Link */}
        <View style={styles.dangerZone}>
          <TouchableOpacity
            onPress={() => router.push(ROUTES.DELETE_ACCOUNT)}
            style={styles.deleteLink}
          >
            <Text style={styles.deleteLinkText}>Delete account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 12,
  },
  email: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
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
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textMuted,
  },
  noStatsContainer: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  noStatsText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  dangerZone: {
    marginTop: 48,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  deleteLink: {
    padding: 8,
  },
  deleteLinkText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  guestUsername: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 8,
  },
  guestBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  guestBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  guestPromptCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  guestPromptTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  guestPromptText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  benefitsList: {
    alignSelf: 'stretch',
    gap: 12,
    marginBottom: 24,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  createAccountButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  createAccountButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  createAccountButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  privacyText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 12,
    textAlign: 'center',
  },
});
