import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../config/theme';
import { SmartAvatar } from '../ui/SmartAvatar';
import type { HeadToHeadRecord } from '../../types';

interface HeadToHeadCardProps {
  record: HeadToHeadRecord;
  onPress?: () => void;
}

export function HeadToHeadCard({ record, onPress }: HeadToHeadCardProps) {
  const isWinning = record.wins > record.losses;
  const isLosing = record.losses > record.wins;
  const isTied = record.wins === record.losses;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <View style={styles.opponentInfo}>
          <SmartAvatar
            userUlid={record.opponentUlid}
            uri={record.opponentAvatar}
            name={record.opponentUsername}
            size={32}
            backgroundColor={record.opponentAvatarColor ?? undefined}
            disabled
          />
          <Text style={styles.username} numberOfLines={1}>
            {record.opponentUsername}
          </Text>
        </View>

        <View style={styles.recordContainer}>
          <Text style={[styles.recordNumber, styles.wins]}>{record.wins}</Text>
          <Text style={styles.recordSeparator}>-</Text>
          <Text style={[styles.recordNumber, styles.draws]}>
            {record.draws}
          </Text>
          <Text style={styles.recordSeparator}>-</Text>
          <Text style={[styles.recordNumber, styles.losses]}>
            {record.losses}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Win Rate</Text>
          <Text
            style={[
              styles.statValue,
              isWinning && styles.statValuePositive,
              isLosing && styles.statValueNegative,
              isTied && styles.statValueNeutral,
            ]}
          >
            {record.winRate.toFixed(0)}%
          </Text>
        </View>

        <View style={styles.stat}>
          <Text style={styles.statLabel}>Avg. Score</Text>
          <Text
            style={[
              styles.statValue,
              record.averageScoreDifference > 0 && styles.statValuePositive,
              record.averageScoreDifference < 0 && styles.statValueNegative,
              record.averageScoreDifference === 0 && styles.statValueNeutral,
            ]}
          >
            {record.averageScoreDifference > 0 ? '+' : ''}
            {record.averageScoreDifference.toFixed(0)}
          </Text>
        </View>

        <View style={styles.stat}>
          <Text style={styles.statLabel}>Games</Text>
          <Text style={styles.statValue}>{record.totalGames}</Text>
        </View>
      </View>

      {record.bestWord && (
        <View style={styles.bestWordRow}>
          <Text style={styles.bestWordLabel}>Best word:</Text>
          <Text style={styles.bestWordValue}>
            {record.bestWord.word.toUpperCase()}
          </Text>
          <Text style={styles.bestWordScore}>{record.bestWord.score} pts</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  opponentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  username: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  recordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordNumber: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
  recordSeparator: {
    fontSize: 16,
    color: colors.textMuted,
    marginHorizontal: 4,
  },
  wins: {
    color: '#27AE60',
  },
  draws: {
    color: colors.textSecondary,
  },
  losses: {
    color: '#E74C3C',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statValuePositive: {
    color: '#27AE60',
  },
  statValueNegative: {
    color: '#E74C3C',
  },
  statValueNeutral: {
    color: colors.textSecondary,
  },
  bestWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bestWordLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginRight: 8,
  },
  bestWordValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
  },
  bestWordScore: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
  },
});
