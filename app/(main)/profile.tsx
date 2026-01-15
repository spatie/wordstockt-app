import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { ROUTES } from '../../src/config/routes';
import { useUpdateProfile } from '../../src/api/queries/useAuth';
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
  const updateProfile = useUpdateProfile();

  const [username, setUsername] = useState(user?.username ?? '');
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor ?? null);
  const [error, setError] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useUserStats(
    user?.ulid ?? ''
  );

  if (!user) {
    return null;
  }

  const hasUsernameChanges = username !== user.username;
  const hasColorChanges = avatarColor !== user.avatarColor;
  const hasChanges = hasUsernameChanges || hasColorChanges;
  const isValidUsername =
    username.length >= 3 &&
    username.length <= 20 &&
    /^[a-zA-Z0-9_]+$/.test(username);

  const handleSave = async () => {
    setError(null);
    try {
      await updateProfile.mutateAsync({
        ...(hasUsernameChanges && { username }),
        ...(hasColorChanges && { avatar_color: avatarColor }),
      });
    } catch (err) {
      const apiError = getApiError(err);
      setError(apiError.message);
      throw err;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Avatar and Email */}
        <View style={styles.header}>
          <Avatar
            name={user.username}
            size={80}
            backgroundColor={avatarColor ?? undefined}
          />
          <View style={styles.emailRow}>
            <Text style={styles.email}>{user.email}</Text>
            {!isEmailVerified(user) && (
              <View style={styles.unverifiedBadge}>
                <Text style={styles.unverifiedText}>Unverified</Text>
              </View>
            )}
          </View>
        </View>

        {/* Profile Form */}
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
            disabled={!hasChanges || !isValidUsername}
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
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  email: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  unverifiedBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unverifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000',
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
});
