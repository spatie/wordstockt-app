import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../config/theme';
import type { UserStats } from '../../types';

interface StatsOverviewCardProps {
  stats: UserStats;
}

export function StatsOverviewCard({ stats }: StatsOverviewCardProps) {
  return (
    <View style={styles.container}>
      {/* ELO Section */}
      <View style={styles.eloSection}>
        <View style={styles.eloMain}>
          <Text style={styles.eloValue}>{stats.eloRating}</Text>
          <Text style={styles.eloLabel}>Current ELO</Text>
        </View>
        <View style={styles.eloStats}>
          <View style={styles.eloStat}>
            <Text style={styles.eloStatValue}>{stats.highestEloEver}</Text>
            <Text style={styles.eloStatLabel}>Highest</Text>
          </View>
          <View style={styles.eloStatDivider} />
          <View style={styles.eloStat}>
            <Text style={styles.eloStatValue}>{stats.lowestEloEver}</Text>
            <Text style={styles.eloStatLabel}>Lowest</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Games Section */}
      <View style={styles.gamesSection}>
        <Text style={styles.gamesText}>
          <Text style={styles.gamesWon}>{stats.gamesWon}</Text>
          <Text style={styles.gamesLabel}> won / </Text>
          <Text style={styles.gamesPlayed}>{stats.gamesPlayed}</Text>
          <Text style={styles.gamesLabel}> played</Text>
        </Text>
        <Text style={styles.winRate}>{stats.winRate.toFixed(0)}% win rate</Text>
      </View>

      {/* Streak Section */}
      {stats.currentWinStreak > 0 && (
        <>
          <View style={styles.divider} />
          <View style={styles.streakSection}>
            <Text style={styles.streakLabel}>Current win streak</Text>
            <Text style={styles.streakValue}>
              {stats.currentWinStreak} games
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  eloSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eloMain: {
    flex: 1,
  },
  eloValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },
  eloLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  eloStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  eloStat: {
    alignItems: 'center',
  },
  eloStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  eloStatLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  eloStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  gamesSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gamesText: {
    fontSize: 14,
  },
  gamesWon: {
    fontWeight: '700',
    color: colors.primary,
  },
  gamesPlayed: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  gamesLabel: {
    color: colors.textSecondary,
  },
  winRate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  streakSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  streakValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27AE60',
  },
});
