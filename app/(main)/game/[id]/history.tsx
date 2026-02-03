import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMoveHistory } from '../../../../src/api/queries/useMoveHistory';
import { useGame } from '../../../../src/api/queries/useGame';
import { LoadingView } from '../../../../src/components/ui/LoadingView';
import { Avatar } from '../../../../src/components/ui/Avatar';
import { colors, MULTIPLIER_COLORS } from '../../../../src/config/theme';
import { SPACING, RADIUS } from '../../../../src/config/constants';
import type { MoveHistoryItem, MoveType, Bonus } from '../../../../src/types';

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function MultiplierBadge({ type }: { type: string }) {
  const normalizedType = type.toUpperCase();
  const bgColor =
    MULTIPLIER_COLORS[normalizedType as keyof typeof MULTIPLIER_COLORS] ??
    colors.primary;

  return (
    <View style={[styles.multiplierBadge, { backgroundColor: bgColor }]}>
      <Text style={styles.multiplierBadgeText}>{normalizedType}</Text>
    </View>
  );
}

function getBonusIcon(rule: string): string {
  if (rule.includes('bingo') || rule.includes('all_tiles')) return '\u2605';
  if (rule.includes('length') || rule.includes('tiles_played')) return '\u2666';
  if (rule.includes('extend')) return '\u2194';
  if (rule.includes('empty_rack')) return '\u2713';
  return '\u2022';
}

function getBonusColor(rule: string): string {
  if (rule.includes('bingo') || rule.includes('all_tiles')) return '#F39C12';
  if (rule.includes('length') || rule.includes('tiles_played')) return '#27AE60';
  if (rule.includes('extend')) return '#9B59B6';
  if (rule.includes('empty_rack')) return '#3498DB';
  return colors.primary;
}

function MoveCard({
  move,
  moveNumber,
}: {
  move: MoveHistoryItem;
  moveNumber: number;
}) {
  const isPlay = move.type === 'play';
  const hasBreakdown = move.scoreBreakdown !== null;

  return (
    <View style={styles.moveCard}>
      {/* Header */}
      <View style={styles.moveHeader}>
        <View style={styles.playerInfo}>
          <Avatar
            uri={move.user.avatar}
            name={move.user.username}
            size={42}
            backgroundColor={move.user.avatarColor ?? undefined}
          />
          <View style={styles.playerDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.playerName}>{move.user.username}</Text>
              <View style={styles.moveNumberBadge}>
                <Text style={styles.moveNumberText}>#{moveNumber}</Text>
              </View>
            </View>
            <Text style={styles.moveTime}>
              {formatRelativeTime(move.createdAt)}
            </Text>
          </View>
        </View>
        {isPlay && move.score > 0 && (
          <View style={styles.moveScore}>
            <Text style={styles.scoreTotalText}>+{move.score}</Text>
            <Text style={styles.scoreLabel}>points</Text>
          </View>
        )}
      </View>

      {/* Body - depends on move type */}
      {isPlay && hasBreakdown ? (
        <View style={styles.moveBody}>
          {/* Words Section */}
          <View style={styles.wordsSection}>
            <Text style={styles.sectionLabel}>WORDS PLAYED</Text>
            {move.scoreBreakdown!.words.map((wordScore, idx) => (
              <View key={idx} style={styles.wordRow}>
                <View style={styles.wordLeft}>
                  <Text style={styles.wordText}>
                    {wordScore.word.toUpperCase()}
                  </Text>
                  <View style={styles.multipliers}>
                    {wordScore.multipliers.map((m, mIdx) => (
                      <MultiplierBadge
                        key={mIdx}
                        type={`${m.value}${m.type === 'word' ? 'W' : 'L'}`}
                      />
                    ))}
                  </View>
                </View>
                <View style={styles.wordScore}>
                  <Text style={styles.wordScoreValue}>
                    {wordScore.multipliedScore}
                  </Text>
                  {wordScore.multipliedScore !== wordScore.baseScore && (
                    <Text style={styles.wordScoreCalc}>
                      {wordScore.baseScore} x{' '}
                      {Math.round(
                        wordScore.multipliedScore / wordScore.baseScore
                      )}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Bonuses Section */}
          {move.scoreBreakdown!.bonuses.length > 0 && (
            <View style={styles.bonusesSection}>
              <Text style={styles.sectionLabel}>BONUSES</Text>
              {move.scoreBreakdown!.bonuses.map((bonus: Bonus, idx: number) => (
                <View key={idx} style={styles.bonusRow}>
                  <View style={styles.bonusLeft}>
                    <View
                      style={[
                        styles.bonusIcon,
                        { backgroundColor: getBonusColor(bonus.rule) },
                      ]}
                    >
                      <Text style={styles.bonusIconText}>
                        {getBonusIcon(bonus.rule)}
                      </Text>
                    </View>
                    <Text style={styles.bonusText}>{bonus.description}</Text>
                  </View>
                  <Text style={styles.bonusScore}>+{bonus.points}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Total Breakdown */}
          <View style={styles.totalBreakdown}>
            <View style={styles.breakdownItems}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownValue}>
                  {move.scoreBreakdown!.wordsTotal}
                </Text>
                <Text style={styles.breakdownLabel}>Words</Text>
              </View>
              {move.scoreBreakdown!.bonusTotal > 0 && (
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownValue}>
                    {move.scoreBreakdown!.bonusTotal}
                  </Text>
                  <Text style={styles.breakdownLabel}>Bonus</Text>
                </View>
              )}
            </View>
            <View style={styles.breakdownTotal}>
              <Text style={styles.breakdownTotalValue}>{move.score}</Text>
              <Text style={styles.breakdownTotalLabel}>Total</Text>
            </View>
          </View>
        </View>
      ) : isPlay && !hasBreakdown ? (
        // Play move without breakdown (older game)
        <View style={styles.moveSimple}>
          <Text style={styles.simpleText}>
            Played: {move.words?.map((w) => w.toUpperCase()).join(', ')}
          </Text>
        </View>
      ) : (
        // Pass, Swap, Resign
        <View style={styles.moveSimple}>
          <View
            style={[
              styles.simpleIcon,
              move.type === 'pass' && styles.simpleIconPass,
              move.type === 'swap' && styles.simpleIconSwap,
              move.type === 'resign' && styles.simpleIconResign,
            ]}
          >
            <Text style={styles.simpleIconText}>
              {move.type === 'pass' && '\u2192'}
              {move.type === 'swap' && '\u21C5'}
              {move.type === 'resign' && '\u2717'}
            </Text>
          </View>
          <Text
            style={[
              styles.simpleText,
              move.type === 'resign' && styles.simpleTextResign,
            ]}
          >
            {move.type === 'pass' && 'Passed turn'}
            {move.type === 'swap' && `Swapped ${move.tilesCount} tiles`}
            {move.type === 'resign' && 'Resigned from game'}
          </Text>
        </View>
      )}
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>{'\u23F0'}</Text>
      </View>
      <Text style={styles.emptyTitle}>History Not Available</Text>
      <Text style={styles.emptyDescription}>
        Detailed move history is only available for games started after this
        feature was added.
      </Text>
    </View>
  );
}

export default function MoveHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const gameUlid = id ?? '';

  const { data: game, isLoading: isGameLoading } = useGame(gameUlid);
  const { data: moves, isLoading: isMovesLoading } = useMoveHistory(gameUlid);

  const isLoading = isGameLoading || isMovesLoading;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LoadingView />
      </View>
    );
  }

  // Check if any move has score_breakdown - if not, show empty state
  const hasDetailedHistory = moves?.some((m) => m.scoreBreakdown !== null);

  if (!hasDetailedHistory && moves && moves.length > 0) {
    return (
      <View style={styles.container}>
        <EmptyState />
      </View>
    );
  }

  const totalMoves = moves?.length ?? 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Move History</Text>
          <Text style={styles.headerSubtitle}>
            {game?.players.map((p) => p.username).join(' vs ') ?? 'Game'} •{' '}
            {totalMoves} moves
          </Text>
        </View>

        {moves?.map((move, index) => (
          <MoveCard
            key={move.ulid}
            move={move}
            moveNumber={totalMoves - index}
          />
        ))}

        {(!moves || moves.length === 0) && (
          <View style={styles.noMoves}>
            <Text style={styles.noMovesText}>No moves yet</Text>
          </View>
        )}
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
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  moveCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 217, 0.1)',
  },
  moveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74, 144, 217, 0.08)',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  playerDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  moveNumberBadge: {
    backgroundColor: 'rgba(74, 144, 217, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  moveNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  moveTime: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  moveScore: {
    alignItems: 'flex-end',
  },
  scoreTotalText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#27AE60',
    lineHeight: 28,
  },
  scoreLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  moveBody: {
    padding: SPACING.md,
  },
  wordsSection: {
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.sm,
    backgroundColor: 'rgba(44, 62, 80, 0.4)',
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  wordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  wordText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  multipliers: {
    flexDirection: 'row',
    gap: 4,
  },
  multiplierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  multiplierBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  wordScore: {
    alignItems: 'flex-end',
  },
  wordScoreValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  wordScoreCalc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  bonusesSection: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(74, 144, 217, 0.15)',
    borderStyle: 'dashed',
  },
  bonusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  bonusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  bonusIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bonusIconText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  bonusText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  bonusScore: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F39C12',
  },
  totalBreakdown: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(74, 144, 217, 0.15)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  breakdownItems: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  breakdownLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  breakdownTotal: {
    alignItems: 'flex-end',
  },
  breakdownTotalValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#27AE60',
    lineHeight: 30,
  },
  breakdownTotalLabel: {
    fontSize: 10,
    color: '#27AE60',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  moveSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  simpleIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simpleIconPass: {
    backgroundColor: 'rgba(139, 157, 195, 0.15)',
  },
  simpleIconSwap: {
    backgroundColor: 'rgba(74, 144, 217, 0.15)',
  },
  simpleIconResign: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
  },
  simpleIconText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  simpleText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  simpleTextResign: {
    color: '#E74C3C',
    fontWeight: '600',
    fontStyle: 'normal',
  },
  noMoves: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  noMovesText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(74, 144, 217, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyIconText: {
    fontSize: 36,
    opacity: 0.4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});
