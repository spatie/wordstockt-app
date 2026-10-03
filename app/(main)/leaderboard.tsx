import type { ThemeColors } from '../../src/config/theme';
import {
  useThemeColors,
  useThemedStyles,
} from '../../src/hooks/useThemeColors';
import React, { memo, useState, useCallback } from 'react';
import { View, StyleSheet, RefreshControl, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useLeaderboard } from '../../src/api/queries/useUsers';
import { ErrorView } from '../../src/components/ui/ErrorView';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ListRowSkeletons } from '../../src/components/ui/Skeleton';
import { Card } from '../../src/components/ui/Card';
import { GroupedRow } from '../../src/components/ui/GroupedRow';
import { useAuthStore } from '../../src/stores/authStore';
import { ROUTES } from '../../src/config/routes';
import { TabBar } from '../../src/components/ui/TabBar';
import { SmartAvatar } from '../../src/components/ui/SmartAvatar';
import { SPACING, LAYOUT } from '../../src/config/constants';
import type { LeaderboardEntry, LeaderboardType } from '../../src/types';
import { typography } from '../../src/config/typography';

const RANK_WIDTH = 24;
const AVATAR_SIZE = 40;

interface LeaderboardEntryRowProps {
  entry: LeaderboardEntry;
  rank: number;
  isTimeBased: boolean;
  isFirst: boolean;
  isLast: boolean;
}

const LeaderboardEntryRow = memo(function LeaderboardEntryRow({
  entry,
  rank,
  isTimeBased,
  isFirst,
  isLast,
}: LeaderboardEntryRowProps) {
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const currentUserUlid = useAuthStore((s) => s.user?.ulid);

  const handlePress = useCallback(() => {
    router.push(
      entry.ulid === currentUserUlid
        ? ROUTES.PROFILE
        : ROUTES.USER_PROFILE(entry.ulid)
    );
  }, [router, entry.ulid, currentUserUlid]);

  return (
    <GroupedRow
      isFirst={isFirst}
      isLast={isLast}
      onPress={handlePress}
      showChevron={false}
      // Line up the separator with the names: padding, rank, avatar and gaps
      separatorInset={16 + RANK_WIDTH + 12 + AVATAR_SIZE + 12}
    >
      <View style={styles.cardContent}>
        <Text style={styles.rank} numberOfLines={1}>
          {rank}
        </Text>

        <SmartAvatar
          userUlid={entry.ulid}
          uri={entry.avatar}
          name={entry.username}
          size={AVATAR_SIZE}
          backgroundColor={entry.avatarColor ?? undefined}
        />

        <View style={styles.info}>
          <Text style={styles.username}>{entry.username}</Text>
          <Text style={styles.stats}>
            {entry.gamesWon}W / {entry.gamesPlayed}G
          </Text>
        </View>

        <View style={styles.valueContainer}>
          <Text style={styles.valueText}>
            {isTimeBased ? entry.winsInPeriod : entry.eloRating}
          </Text>
          <Text style={styles.metricLabel}>{isTimeBased ? 'wins' : 'ELO'}</Text>
        </View>
      </View>
    </GroupedRow>
  );
});

type MainType = 'wins' | 'elo';
type PeriodType = 'monthly' | 'yearly';

const MAIN_TABS = [
  { value: 'wins' as const, label: 'Games Won' },
  { value: 'elo' as const, label: 'ELO Rating' },
];

const PERIOD_TABS = [
  { value: 'monthly' as const, label: 'Month' },
  { value: 'yearly' as const, label: 'Year' },
];

export default function LeaderboardScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const [mainType, setMainType] = useState<MainType>('wins');
  const [period, setPeriod] = useState<PeriodType>('monthly');

  const leaderboardType: LeaderboardType = mainType === 'elo' ? 'elo' : period;

  const { data, isLoading, error, refetch } = useLeaderboard(leaderboardType);
  const [refreshing, setRefreshing] = useState(false);

  const tabOpacity = useSharedValue(1);
  const tabTranslateY = useSharedValue(0);

  const tabContentStyle = useAnimatedStyle(() => ({
    opacity: tabOpacity.value,
    transform: [{ translateY: tabTranslateY.value }],
  }));

  const animateTabChange = useCallback(() => {
    tabOpacity.set(0);
    tabTranslateY.set(10);
    tabOpacity.set(withTiming(1, { duration: 200 }));
    tabTranslateY.set(withTiming(0, { duration: 200 }));
  }, [tabOpacity, tabTranslateY]);

  const handleMainTypeChange = useCallback(
    (newType: MainType) => {
      if (newType === mainType) return;
      animateTabChange();
      setMainType(newType);
    },
    [mainType, animateTabChange]
  );

  const handlePeriodChange = useCallback(
    (newPeriod: PeriodType) => {
      if (newPeriod === period) return;
      animateTabChange();
      setPeriod(newPeriod);
    },
    [period, animateTabChange]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const isTimeBased = mainType === 'wins';

  const entryCount = data?.data?.length ?? 0;

  const renderEntry = useCallback(
    ({ item, index }: { item: LeaderboardEntry; index: number }) => (
      <LeaderboardEntryRow
        entry={item}
        rank={index + 1}
        isTimeBased={isTimeBased}
        isFirst={index === 0}
        isLast={index === entryCount - 1}
      />
    ),
    [isTimeBased, entryCount]
  );

  const keyExtractor = useCallback((item: LeaderboardEntry) => item.ulid, []);

  const renderCurrentUserFooter = () => {
    const currentUser = data?.meta?.currentUser;

    if (!currentUser) return null;

    if (currentUser.rank === null) {
      return (
        <View style={styles.currentUserFooter}>
          <Text style={styles.footerLabel}>YOUR RANK</Text>
          <Card marginBottom="xs">
            <View style={styles.currentUserMessage}>
              <Text style={styles.messageText}>{currentUser.message}</Text>
            </View>
          </Card>
        </View>
      );
    }

    if (!currentUser.ulid) return null;

    return (
      <View style={styles.currentUserFooter}>
        <Text style={styles.footerLabel}>YOUR RANK</Text>
        <Card marginBottom="xs">
          <View style={styles.cardContent}>
            <Text style={styles.rank} numberOfLines={1}>
              {currentUser.rank}
            </Text>
            <SmartAvatar
              userUlid={currentUser.ulid}
              uri={currentUser.avatar ?? null}
              name={currentUser.username ?? ''}
              size={40}
              backgroundColor={currentUser.avatarColor ?? undefined}
            />
            <View style={styles.info}>
              <Text style={styles.username}>{currentUser.username}</Text>
            </View>
            <View style={styles.valueContainer}>
              <Text style={styles.valueText}>
                {isTimeBased ? currentUser.winsInPeriod : currentUser.eloRating}
              </Text>
              <Text style={styles.metricLabel}>
                {isTimeBased ? 'wins' : 'ELO'}
              </Text>
            </View>
          </View>
        </Card>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ListRowSkeletons />
      </View>
    );
  }

  if (error) {
    return <ErrorView message="Failed to load leaderboard" onRetry={refetch} />;
  }

  return (
    <View style={styles.container}>
      <TabBar
        tabs={MAIN_TABS}
        value={mainType}
        onChange={handleMainTypeChange}
      />

      <Animated.View style={[styles.contentContainer, tabContentStyle]}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{data?.meta?.label ?? 'Leaderboard'}</Text>
          {mainType === 'wins' && (
            <TabBar
              tabs={PERIOD_TABS}
              value={period}
              onChange={handlePeriodChange}
              style={styles.periodTabs}
            />
          )}
        </View>

        <FlashList
          data={data?.data}
          renderItem={renderEntry}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.textSecondary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="podium-outline"
              title="No one here yet"
              message="Win a game this period to be the first on the leaderboard."
            />
          }
        />
      </Animated.View>

      {renderCurrentUserFooter()}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    periodTabs: {
      width: 150,
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    container: {
      flex: 1,
      maxWidth: LAYOUT.contentMaxWidth,
      width: '100%',
      alignSelf: 'center' as const,
    },
    contentContainer: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING.sm,
    },
    title: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      letterSpacing: 0.5,
    },
    list: {
      padding: SPACING.lg,
      paddingTop: SPACING.sm,
      paddingBottom: 120,
    },
    cardContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    rank: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.textPrimary,
      minWidth: RANK_WIDTH,
      textAlign: 'center',
    },
    info: {
      flex: 1,
    },
    username: {
      ...typography.headline,
      color: colors.textPrimary,
    },
    stats: {
      ...typography.footnote,
      ...typography.number,
      color: colors.textSecondary,
    },
    valueContainer: {
      alignItems: 'flex-end',
    },
    valueText: {
      ...typography.title,
      ...typography.number,
      color: colors.primary,
    },
    metricLabel: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    currentUserFooter: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.background,
      padding: SPACING.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    footerLabel: {
      ...typography.sectionLabel,
      color: colors.textSecondary,
      marginBottom: SPACING.sm,
    },
    currentUserMessage: {
      alignItems: 'center',
      paddingVertical: SPACING.sm,
    },
    messageText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
  });
