import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  Text,
  SectionList,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAchievements } from '../../src/api/queries/useAchievements';
import { ErrorView } from '../../src/components/ui/ErrorView';
import { Card } from '../../src/components/ui/Card';
import { colors } from '../../src/config/theme';
import { SPACING, LAYOUT } from '../../src/config/constants';
import type { UserAchievement } from '../../src/types';

const CATEGORY_LABELS: Record<string, string> = {
  game_milestones: 'Game Milestones',
  word_mastery: 'Word Mastery',
  scoring: 'Scoring',
  streaks: 'Streaks',
  fun: 'Fun',
  word_frequency: 'Word Frequency',
};

function AchievementCard({
  achievement,
  index,
}: {
  achievement: UserAchievement;
  index: number;
}) {
  const isUnlocked = achievement.isUnlocked;

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 30)}>
      <Card padding="md" marginBottom="sm">
        <View
          style={[styles.cardContent, !isUnlocked && styles.cardContentLocked]}
        >
          <View
            style={[
              styles.iconContainer,
              !isUnlocked && styles.iconContainerLocked,
            ]}
          >
            <Text style={[styles.icon, !isUnlocked && styles.iconLocked]}>
              {achievement.icon}
            </Text>
          </View>
          <View style={styles.info}>
            <Text
              style={[styles.name, !isUnlocked && styles.textLocked]}
              numberOfLines={1}
            >
              {achievement.name}
            </Text>
            <Text
              style={[styles.description, !isUnlocked && styles.textLocked]}
              numberOfLines={2}
            >
              {achievement.description}
            </Text>
          </View>
          {isUnlocked && (
            <View style={styles.checkContainer}>
              <Text style={styles.checkmark}>{'\u2713'}</Text>
            </View>
          )}
        </View>
      </Card>
    </Animated.View>
  );
}

export default function AchievementsScreen() {
  const { data, isLoading, error, refetch } = useAchievements();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const sections = useMemo(() => {
    if (!data) return [];

    const grouped: Record<string, UserAchievement[]> = {};

    data.achievements.forEach((achievement) => {
      if (!grouped[achievement.category]) {
        grouped[achievement.category] = [];
      }
      grouped[achievement.category]!.push(achievement);
    });

    return Object.entries(grouped).map(([category, achievements]) => ({
      title: CATEGORY_LABELS[category] ?? category,
      data: achievements,
      category,
    }));
  }, [data]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <ErrorView message="Failed to load achievements" onRetry={refetch} />
    );
  }

  const renderSectionHeader = ({
    section,
  }: {
    section: { title: string; category: string };
  }) => {
    const categoryStats = data?.categories[section.category];
    const unlocked = categoryStats?.unlocked ?? 0;
    const total = categoryStats?.total ?? 0;

    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.sectionCount}>
          {unlocked}/{total}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(200)} style={styles.header}>
        <Text style={styles.headerTitle}>
          {data?.totalUnlocked ?? 0} / {data?.totalAvailable ?? 0}
        </Text>
        <Text style={styles.headerSubtitle}>achievements unlocked</Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${((data?.totalUnlocked ?? 0) / (data?.totalAvailable ?? 1)) * 100}%`,
              },
            ]}
          />
        </View>
      </Animated.View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <AchievementCard achievement={item} index={index} />
        )}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textSecondary}
          />
        }
        ListEmptyComponent={
          <Animated.View
            style={styles.emptyContainer}
            entering={FadeIn.duration(300)}
          >
            <Text style={styles.emptyText}>No achievements available</Text>
          </Animated.View>
        }
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: SPACING.xs,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.backgroundLight,
    borderRadius: 4,
    marginTop: SPACING.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  list: {
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardContentLocked: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  iconContainerLocked: {
    borderColor: colors.border,
  },
  icon: {
    fontSize: 24,
  },
  iconLocked: {
    opacity: 0.4,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  textLocked: {
    color: colors.textSecondary,
  },
  checkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
