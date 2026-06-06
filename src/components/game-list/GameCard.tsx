import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { SmartAvatar } from '../ui/SmartAvatar';
import { Button } from '../ui/Button';
import { TurnTimer } from '../game/TurnTimer';
import { timeAgo } from '../../utils/timeAgo';
import { colors } from '../../config/theme';
import { RADIUS, SPACING } from '../../config/constants';
import { useStartGame } from '../../api/queries/useGames';
import type { GameListItem, GameListPlayer } from '../../types';

interface GameCardProps {
  game: GameListItem;
  userUlid: string | undefined;
  onPress: (gameUlid: string) => void;
  onDelete?: (gameUlid: string) => void;
}

const AVATAR_SIZE = 32;
const AVATAR_OVERLAP = 20;
const MAX_HEADER_AVATARS = 3;

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

/**
 * Ordinal placement (e.g. "1st of 4") for the current user in a finished game.
 *
 * Players are ranked by score descending; players who left rank last,
 * ordered among themselves by their frozen score. Ties share a rank.
 */
function computePlacement(
  players: GameListPlayer[],
  userUlid: string | undefined
): string | null {
  const me = players.find((p) => p.isMe || p.ulid === userUlid);
  if (!me) {
    return null;
  }

  const ranked = [...players].sort((a, b) => {
    if (a.hasLeft !== b.hasLeft) {
      return a.hasLeft ? 1 : -1;
    }
    return b.score - a.score;
  });

  let rank = 1;
  for (let i = 0; i < ranked.length; i++) {
    const player = ranked[i]!;
    if (
      i > 0 &&
      (ranked[i - 1]!.score !== player.score ||
        ranked[i - 1]!.hasLeft !== player.hasLeft)
    ) {
      rank = i + 1;
    }
    if (player.ulid === me.ulid) {
      return `${ordinal(rank)} of ${players.length}`;
    }
  }

  return null;
}

function ordinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const value = n % 100;
  return `${n}${suffixes[(value - 20) % 10] ?? suffixes[value] ?? suffixes[0]}`;
}

export const GameCard = memo(function GameCard({
  game,
  userUlid,
  onPress,
  onDelete,
}: GameCardProps) {
  const startGame = useStartGame();

  const isCompleted = game.status === 'finished';
  const isWinner = game.winnerUlid === userUlid;

  const otherPlayers = game.players.filter((p) => !p.isMe);
  const isAwaitingPlayers =
    game.status === 'pending' && otherPlayers.length === 0;
  const hasPendingInvitation = isAwaitingPlayers && game.pendingInvitation;

  // The creator is the first player in the roster. They can manually start a
  // pending game once at least one other player has joined (>= 2 total).
  const isCreator = game.players[0]?.ulid === userUlid;
  const canStartNow =
    game.status === 'pending' && isCreator && game.players.length >= 2;

  const placement = isCompleted
    ? computePlacement(game.players, userUlid)
    : null;

  const handlePress = useCallback(() => {
    onPress(game.ulid);
  }, [onPress, game.ulid]);

  const handleDelete = useCallback(() => {
    onDelete?.(game.ulid);
  }, [onDelete, game.ulid]);

  const handleStart = useCallback(() => {
    if (startGame.isPending) {
      return;
    }
    startGame.mutate(game.ulid);
  }, [startGame, game.ulid]);

  // Determine what to show in the avatar/name area for empty/pending states.
  const getEmptyStateInfo = () => {
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
  };

  const emptyState = isAwaitingPlayers ? getEmptyStateInfo() : null;

  // For a pending game that already has other players joined (but isn't full),
  // show how many seats are still open.
  const openSeats = game.maxPlayers - game.players.length;
  const headerNames = otherPlayers.map((p) => p.username).join(', ');
  const subtitle =
    game.status === 'pending' && openSeats > 0
      ? `Waiting for ${openSeats} player${openSeats > 1 ? 's' : ''}…`
      : isCompleted
        ? null
        : formatLastMove(game.lastMoveDescription, game.status, game.isMyTurn);

  return (
    <Card
      onPress={handlePress}
      showAccent={!isCompleted && game.isMyTurn}
      style={[!game.isMyTurn && styles.opponentTurnCard]}
    >
      <View style={styles.cardTop}>
        {emptyState ? (
          emptyState.showPublicIcon ? (
            <View style={styles.publicIconContainer}>
              <Ionicons name="globe-outline" size={18} color={colors.primary} />
            </View>
          ) : emptyState.showInviteIcon ? (
            <View style={styles.inviteIconContainer}>
              <Ionicons name="person-add" size={18} color={colors.primary} />
            </View>
          ) : (
            <SmartAvatar
              userUlid={emptyState.ulid}
              uri={emptyState.avatar}
              name={emptyState.name}
              size={AVATAR_SIZE}
              backgroundColor={emptyState.avatarColor ?? undefined}
            />
          )
        ) : (
          <View style={styles.avatarStack}>
            {otherPlayers.slice(0, MAX_HEADER_AVATARS).map((player, index) => (
              <View
                key={player.ulid}
                style={index > 0 ? { marginLeft: -AVATAR_OVERLAP } : undefined}
              >
                <SmartAvatar
                  userUlid={player.ulid}
                  uri={player.avatar}
                  name={player.username}
                  size={AVATAR_SIZE}
                  backgroundColor={player.avatarColor ?? undefined}
                />
              </View>
            ))}
          </View>
        )}
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.opponentName} numberOfLines={1}>
              {emptyState ? emptyState.name : headerNames}
            </Text>
            {emptyState?.showInvitedBadge && (
              <View style={styles.invitedBadge}>
                <Text style={styles.invitedBadgeText}>INVITED</Text>
              </View>
            )}
          </View>
          {(emptyState ? emptyState.subtitle : subtitle) && (
            <Text
              style={[
                styles.lastMove,
                !game.isMyTurn && styles.lastMoveOpponentTurn,
              ]}
              numberOfLines={1}
            >
              {emptyState ? emptyState.subtitle : subtitle}
            </Text>
          )}
        </View>
        {!isAwaitingPlayers && (
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>SCORES</Text>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreText}>
                {game.players.map((player, index) => (
                  <Text key={player.ulid}>
                    {index > 0 && (
                      <Text style={styles.scoreSeparator}> · </Text>
                    )}
                    <Text
                      style={[
                        player.isMe && styles.scoreMine,
                        player.hasLeft && styles.scoreLeft,
                      ]}
                    >
                      {player.score}
                    </Text>
                  </Text>
                ))}
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
          {!isCompleted && !isAwaitingPlayers && game.turnExpiresAt && (
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
          <View style={styles.outcomeRow}>
            {placement && <Text style={styles.placementText}>{placement}</Text>}
            <View
              style={[
                styles.outcomeBadge,
                isWinner ? styles.wonBadge : styles.lostBadge,
              ]}
            >
              <Text style={styles.outcomeText}>
                {isWinner ? 'Won' : 'Lost'}
              </Text>
            </View>
          </View>
        ) : game.status === 'pending' ? (
          <View style={styles.actionButtons}>
            {onDelete && isAwaitingPlayers && (
              <Button
                label="Delete"
                onPress={handleDelete}
                variant="outline"
                size="sm"
                rounded
                style={styles.deleteButton}
              />
            )}
            {canStartNow && (
              <Button
                label="Start now"
                onPress={handleStart}
                loading={startGame.isPending}
                size="sm"
                rounded
                style={styles.playButton}
              />
            )}
            {!canStartNow && (
              <Button
                label={hasPendingInvitation ? 'Open' : 'Invite'}
                onPress={handlePress}
                size="sm"
                rounded
                style={styles.playButton}
              />
            )}
          </View>
        ) : (
          <Button
            label={game.isMyTurn ? 'Play' : 'View'}
            onPress={handlePress}
            size="sm"
            rounded
            style={[styles.playButton, !game.isMyTurn && styles.viewButton]}
          />
        )}
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexShrink: 1,
  },
  inviteIconContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  publicIconContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
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
    fontWeight: '400',
    color: colors.textSecondary,
  },
  scoreMine: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scoreLeft: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  scoreSeparator: {
    color: colors.textMuted,
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
  outcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  placementText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
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
