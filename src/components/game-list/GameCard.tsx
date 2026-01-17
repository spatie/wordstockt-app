import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { SmartAvatar } from '../ui/SmartAvatar';
import { Button } from '../ui/Button';
import { TurnTimer } from '../game/TurnTimer';
import { timeAgo } from '../../utils/timeAgo';
import { colors } from '../../config/theme';
import { RADIUS, SPACING } from '../../config/constants';
import type { GameListItem } from '../../types';

interface GameCardProps {
  game: GameListItem;
  userUlid: string | undefined;
  onPress: () => void;
  onDelete?: () => void;
}

function formatLastMove(
  description: string | null,
  status: string,
  isMyTurn: boolean
): string {
  if (!description) {
    return status === 'pending'
      ? 'Waiting for opponent...'
      : 'Game in progress';
  }

  // For opponent's turn, start with "You" to show what the current player did
  const prefix = !isMyTurn ? 'You ' : '';

  // Convert "Played HELLO for 12 points" to "You played "HELLO" +12" (opponent's turn)
  // Convert "jessica played 'WORD' for 6 points" or "Played HELLO for 12 points" to "Played "WORD" +6" (your turn)
  const playedMatch = description.match(
    /(?:.*\s+)?played '?([^']+)'? for (\d+) points?/i
  );
  if (playedMatch) {
    return `${prefix}played "${playedMatch[1]}" +${playedMatch[2]}`;
  }
  // Convert "You swapped tiles" / "jessica swapped tiles" to appropriate format
  if (description.toLowerCase().includes('swapped')) {
    return `${prefix}swapped tiles`;
  }
  // Convert "You passed" / "jessica passed" to appropriate format
  if (description.toLowerCase().includes('passed')) {
    return `${prefix}passed`;
  }
  return description;
}

export function GameCard({ game, userUlid, onPress, onDelete }: GameCardProps) {
  const isCompleted = game.status === 'finished';
  const isWinner = game.winnerUlid === userUlid;
  const isAwaitingOpponent = game.status === 'pending' && !game.opponent;
  const hasPendingInvitation = isAwaitingOpponent && game.pendingInvitation;

  // Determine what to show in the avatar/name area
  const getDisplayInfo = () => {
    if (hasPendingInvitation) {
      return {
        name: game.pendingInvitation!.invitee.username,
        avatar: game.pendingInvitation!.invitee.avatar,
        avatarColor: game.pendingInvitation!.invitee.avatarColor,
        ulid: game.pendingInvitation!.invitee.ulid,
        subtitle: 'Waiting for response...',
        showInvitedBadge: true,
      };
    }
    if (isAwaitingOpponent) {
      return {
        name: game.isPublic ? 'Public game' : 'Invite a player',
        avatar: null,
        avatarColor: null,
        ulid: undefined,
        subtitle: game.isPublic
          ? 'Waiting for someone to join...'
          : 'Tap to find an opponent',
        showInviteIcon: !game.isPublic,
        showPublicIcon: game.isPublic,
      };
    }
    return {
      name: game.opponent?.username || 'Unknown',
      avatar: game.opponent?.avatar,
      avatarColor: game.opponent?.avatarColor,
      ulid: game.opponent?.ulid,
      subtitle: formatLastMove(
        game.lastMoveDescription,
        game.status,
        game.isMyTurn
      ),
    };
  };

  const displayInfo = getDisplayInfo();

  return (
    <Card
      onPress={onPress}
      showAccent={game.isMyTurn}
      style={[!game.isMyTurn && styles.opponentTurnCard]}
    >
      <View style={styles.cardTop}>
        {displayInfo.showPublicIcon ? (
          <View style={styles.publicIconContainer}>
            <Ionicons name="globe-outline" size={18} color={colors.primary} />
          </View>
        ) : displayInfo.showInviteIcon ? (
          <View style={styles.inviteIconContainer}>
            <Ionicons name="person-add" size={18} color={colors.primary} />
          </View>
        ) : (
          <SmartAvatar
            userUlid={displayInfo.ulid}
            uri={displayInfo.avatar}
            name={displayInfo.name}
            size={32}
            backgroundColor={displayInfo.avatarColor ?? undefined}
          />
        )}
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.opponentName}>{displayInfo.name}</Text>
            {displayInfo.showInvitedBadge && (
              <View style={styles.invitedBadge}>
                <Text style={styles.invitedBadgeText}>INVITED</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.lastMove,
              !game.isMyTurn && styles.lastMoveOpponentTurn,
            ]}
            numberOfLines={1}
          >
            {displayInfo.subtitle}
          </Text>
        </View>
        {!isAwaitingOpponent && (
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>SCORE</Text>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreText}>
                {game.myScore} <Text style={styles.scoreVs}>vs</Text>{' '}
                {game.opponentScore}
              </Text>
            </View>
          </View>
        )}
      </View>
      <View style={styles.cardDivider} />
      <View style={styles.cardBottom}>
        <View style={styles.timeContainer}>
          <Text style={styles.languageBadge}>
            {game.language.toUpperCase()}
          </Text>
          <Text style={styles.timeSeparator}>•</Text>
          <Text style={styles.timeText}>{timeAgo(game.updatedAt)}</Text>
          {!isCompleted && !isAwaitingOpponent && game.turnExpiresAt && (
            <>
              <Text style={styles.timerSeparator}>•</Text>
              <TurnTimer
                expiresAt={game.turnExpiresAt}
                isMyTurn={game.isMyTurn}
                compact
                alwaysShow
              />
            </>
          )}
        </View>
        {isCompleted ? (
          <View
            style={[
              styles.outcomeBadge,
              isWinner ? styles.wonBadge : styles.lostBadge,
            ]}
          >
            <Text style={styles.outcomeText}>{isWinner ? 'Won' : 'Lost'}</Text>
          </View>
        ) : isAwaitingOpponent ? (
          <View style={styles.actionButtons}>
            {onDelete && (
              <Button
                label="Delete"
                onPress={onDelete}
                variant="outline"
                size="sm"
                rounded
                style={styles.deleteButton}
              />
            )}
            <Button
              label={hasPendingInvitation ? 'Open' : 'Invite'}
              onPress={onPress}
              size="sm"
              rounded
              style={styles.playButton}
            />
          </View>
        ) : (
          <Button
            label={game.isMyTurn ? 'Play' : 'View'}
            onPress={onPress}
            size="sm"
            rounded
            style={[styles.playButton, !game.isMyTurn && styles.viewButton]}
          />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 4,
  },
  opponentName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  inviteIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  publicIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  invitedBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  invitedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  lastMove: {
    fontSize: 14,
    color: colors.primary,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  scoreBox: {
    backgroundColor: colors.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  scoreVs: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: SPACING.md,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageBadge: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  timeSeparator: {
    color: colors.textMuted,
    marginHorizontal: 6,
    fontSize: 13,
  },
  timeText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  timerSeparator: {
    color: colors.textSecondary,
    marginHorizontal: 6,
    fontSize: 13,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  playButton: {
    paddingHorizontal: SPACING.xl,
  },
  deleteButton: {
    paddingHorizontal: SPACING.md,
  },
  outcomeBadge: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  wonBadge: {
    backgroundColor: colors.gameWon,
  },
  lostBadge: {
    backgroundColor: colors.gameLost,
  },
  outcomeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  opponentTurnCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight,
  },
  viewButton: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lastMoveOpponentTurn: {
    color: colors.textSecondary,
  },
});
