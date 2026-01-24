import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUserProfile } from '../../../src/api/queries/useUsers';
import { useUserStats, useHeadToHead } from '../../../src/api/queries/useStats';
import {
  useIsFriend,
  useAddFriend,
  useRemoveFriend,
} from '../../../src/api/queries/useFriends';
import { useAuthStore } from '../../../src/stores/authStore';
import { SmartAvatar } from '../../../src/components/ui/SmartAvatar';
import { FeedbackModal } from '../../../src/components/ui/FeedbackModal';
import { getApiError } from '../../../src/api/client';
import { colors } from '../../../src/config/theme';
import { ROUTES } from '../../../src/config/routes';
import {
  StatsOverviewCard,
  StatsSection,
  StatRow,
  HeadToHeadCard,
} from '../../../src/components/stats';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const userUlid = id || '';
  const currentUserUlid = useAuthStore((s) => s.user?.ulid);
  const [errorModal, setErrorModal] = useState<{
    visible: boolean;
    message: string;
  }>({ visible: false, message: '' });

  const { data: user, isLoading, error } = useUserProfile(userUlid);
  const { data: friendStatus, isLoading: isCheckingFriend } =
    useIsFriend(userUlid);
  const addFriend = useAddFriend();
  const removeFriend = useRemoveFriend();

  const { data: stats, isLoading: statsLoading } = useUserStats(userUlid);
  const { data: headToHeadData = [], isLoading: h2hLoading } =
    useHeadToHead(userUlid);

  // Filter head-to-head to only show the record against the current user
  const myHeadToHead = currentUserUlid
    ? headToHeadData.find((record) => record.opponentUlid === currentUserUlid)
    : null;

  // If viewing own profile, redirect to profile screen
  React.useEffect(() => {
    if (userUlid && userUlid === currentUserUlid) {
      router.replace(ROUTES.PROFILE);
    }
  }, [userUlid, currentUserUlid, router]);

  if (userUlid === currentUserUlid) {
    return null;
  }

  const showError = (err: unknown) => {
    const apiError = getApiError(err);
    setErrorModal({ visible: true, message: apiError.message });
  };

  const handleAddFriend = async () => {
    try {
      await addFriend.mutateAsync(userUlid);
    } catch (err) {
      showError(err);
    }
  };

  const handleRemoveFriend = async () => {
    try {
      await removeFriend.mutateAsync(userUlid);
    } catch (err) {
      showError(err);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>User not found</Text>
        </View>
      </View>
    );
  }

  const isFriend = friendStatus?.isFriend ?? false;
  const isButtonLoading =
    addFriend.isPending || removeFriend.isPending || isCheckingFriend;
  const isStatsLoading = statsLoading || h2hLoading;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Avatar and Username */}
        <View style={styles.header}>
          <SmartAvatar
            uri={user.avatar}
            name={user.username}
            size={80}
            disabled
            backgroundColor={user.avatarColor ?? undefined}
          />
          <Text style={styles.username}>{user.username}</Text>
        </View>

        {/* Friend Button - only show for other users */}
        {currentUserUlid && userUlid !== currentUserUlid && (
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[
                styles.friendButton,
                isFriend ? styles.removeFriendButton : styles.addFriendButton,
              ]}
              onPress={isFriend ? handleRemoveFriend : handleAddFriend}
              disabled={isButtonLoading}
            >
              <View style={styles.buttonContent}>
                {isButtonLoading ? (
                  <ActivityIndicator
                    color={isFriend ? colors.textPrimary : '#FFF'}
                    size="small"
                  />
                ) : (
                  <Text
                    style={
                      isFriend ? styles.removeFriendText : styles.addFriendText
                    }
                  >
                    {isFriend ? 'Remove Friend' : 'Add Friend'}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Statistics Section */}
        {isStatsLoading ? (
          <View style={styles.statsLoadingContainer}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.statsLoadingText}>Loading statistics...</Text>
          </View>
        ) : stats ? (
          <>
            {/* Overview Card */}
            <StatsOverviewCard stats={stats} />

            {/* Head to Head - only show stats against the current user */}
            {myHeadToHead && (
              <StatsSection title="Head to Head">
                <HeadToHeadCard record={myHeadToHead} />
              </StatsSection>
            )}

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
            <Text style={styles.noStatsText}>No statistics available yet.</Text>
          </View>
        )}
      </ScrollView>

      <FeedbackModal
        visible={errorModal.visible}
        type="warning"
        title="Slow Down"
        message={errorModal.message}
        onDismiss={() => setErrorModal({ visible: false, message: '' })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
  },
  actionSection: {
    marginBottom: 24,
  },
  friendButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonContent: {
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addFriendButton: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  removeFriendButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  addFriendText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    lineHeight: 20,
  },
  removeFriendText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  statsLoadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  statsLoadingText: {
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
});
