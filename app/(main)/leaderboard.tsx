import React, { memo, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  Text,
  Pressable,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ActivityIndicator } from 'react-native-paper';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useLeaderboard } from '../../src/api/queries/useUsers';
import { ErrorView } from '../../src/components/ui/ErrorView';
import { Card } from '../../src/components/ui/Card';
import { TabBar } from '../../src/components/ui/TabBar';
import { SmartAvatar } from '../../src/components/ui/SmartAvatar';
import { colors } from '../../src/config/theme';
import { SPACING, LAYOUT } from '../../src/config/constants';
import type { LeaderboardEntry, LeaderboardType } from '../../src/types';

interface LeaderboardEntryCardProps {
  entry: LeaderboardEntry;
  rank: number;
  isTimeBased: boolean;
}

const LeaderboardEntryCard = memo(function LeaderboardEntryCard({
  entry,
  rank,
  isTimeBased,
}: LeaderboardEntryCardProps) {
  return (
    <Card padding="md" marginBottom="sm">
      <View style={styles.cardContent}>
        <Text style={styles.rank}>{rank}</Text>

        <SmartAvatar
          userUlid={entry.ulid}
          uri={entry.avatar}
          name={entry.username}
          size={40}
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
    </Card>
  );
});

type MainType = 'wins' | 'elo';
type PeriodType = 'monthly' | 'yearly';

const MAIN_TABS = [
  { value: 'wins' as const, label: 'Games Won' },
  { value: 'elo' as const, label: 'ELO Rating' },
];

const PILL_WIDTH = 56;

function PeriodToggle({
  value,
  onChange,
}: {
  value: PeriodType;
  onChange: (value: PeriodType) => void;
}) {
  const translateX = useSharedValue(value === 'monthly' ? 0 : PILL_WIDTH);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handlePress = (newValue: PeriodType) => {
    translateX.set(
      withTiming(newValue === 'monthly' ? 0 : PILL_WIDTH, {
        duration: 200,
      })
    );
    onChange(newValue);
  };

  return (
    <View style={styles.periodToggle}>
      <Animated.View style={[styles.periodIndicator, animatedIndicatorStyle]} />
      <Pressable
        style={styles.periodPill}
        onPress={() => handlePress('monthly')}
      >
        <Text
          style={[
            styles.periodPillText,
            value === 'monthly' && styles.periodPillTextActive,
          ]}
        >
          Month
        </Text>
      </Pressable>
      <Pressable
        style={styles.periodPill}
        onPress={() => handlePress('yearly')}
      >
        <Text
          style={[
            styles.periodPillText,
            value === 'yearly' && styles.periodPillTextActive,
          ]}
        >
          Year
        </Text>
      </Pressable>
    </View>
  );
}

export default function LeaderboardScreen() {
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

  const renderEntry = useCallback(
    ({ item, index }: { item: LeaderboardEntry; index: number }) => (
      <Animated.View entering={FadeInDown.duration(300).delay(index * 50)}>
        <LeaderboardEntryCard
          entry={item}
          rank={index + 1}
          isTimeBased={isTimeBased}
        />
      </Animated.View>
    ),
    [isTimeBased]
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
            <Text style={styles.rank}>{currentUser.rank}</Text>
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
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
            <PeriodToggle value={period} onChange={handlePeriodChange} />
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
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No players on the leaderboard yet
              </Text>
            </View>
          }
        />
      </Animated.View>

      {renderCurrentUserFooter()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: LAYOUT.contentMaxWidth,
    width: '100%',
    alignSelf: 'center' as const,
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    padding: 2,
    position: 'relative',
  },
  periodIndicator: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: PILL_WIDTH,
    height: 28,
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  periodPill: {
    width: PILL_WIDTH,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    zIndex: 1,
  },
  periodPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  periodPillTextActive: {
    color: colors.textPrimary,
  },
  list: {
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: 120,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    width: 24,
    textAlign: 'center',
  },
  info: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  stats: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  valueContainer: {
    alignItems: 'flex-end',
  },
  valueText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
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
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
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
