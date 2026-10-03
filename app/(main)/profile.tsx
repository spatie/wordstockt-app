import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { ROUTES } from '../../src/config/routes';
import { useUserStats } from '../../src/api/queries/useStats';
import type { ThemeColors } from '../../src/config/theme';
import {
  useThemeColors,
  useThemedStyles,
} from '../../src/hooks/useThemeColors';
import {
  StatsOverviewCard,
  StatsSection,
  StatRow,
} from '../../src/components/stats';
import { LAYOUT } from '../../src/config/constants';
import { Avatar } from '../../src/components/ui/Avatar';
import { EditableAvatar } from '../../src/components/profile/EditableAvatar';

// Who you are and how you play. Account details and appearance live in
// Settings.
export default function ProfileScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.isGuest);

  const { data: stats, isLoading: statsLoading } = useUserStats(
    user?.ulid ?? '',
    { enabled: !isGuest }
  );

  if (!user) {
    return null;
  }

  if (isGuest) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <Avatar
              name={user.username}
              size={80}
              backgroundColor={user.avatarColor ?? undefined}
            />
            <Text style={styles.guestUsername}>{user.username}</Text>
            <View style={styles.guestBadge}>
              <Text style={styles.guestBadgeText}>Guest Account</Text>
            </View>
          </View>

          {/* Create Account Prompt */}
          <View style={styles.guestPromptCard}>
            <Ionicons
              name="person-add-outline"
              size={48}
              color={colors.primary}
            />
            <Text style={styles.guestPromptTitle}>
              Create Your Free Account
            </Text>
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
                <Text style={styles.benefitText}>
                  Track wins, stats & achievements
                </Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.gameWon}
                />
                <Text style={styles.benefitText}>
                  Add friends & send invites
                </Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.gameWon}
                />
                <Text style={styles.benefitText}>
                  Compete on the leaderboard
                </Text>
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
      >
        <View style={styles.header}>
          <EditableAvatar user={user} size={80} />
          <Text style={styles.username}>{user.username}</Text>
          <Pressable
            onPress={() => router.push(ROUTES.SETTINGS)}
            style={({ pressed }) => [
              styles.editButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons
              name="settings-outline"
              size={16}
              color={colors.textPrimary}
            />
            <Text style={styles.editButtonText}>Edit profile</Text>
          </Pressable>
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
    header: {
      alignItems: 'center',
      marginBottom: 32,
      gap: 12,
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
    username: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: colors.backgroundLight,
    },
    editButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
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
      color: colors.onPrimary,
    },
  });
