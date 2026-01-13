import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '../../config/theme';
import { DIMENSIONS } from '../../config/constants';
import { SmartAvatar } from '../ui/SmartAvatar';
import { TurnTimer } from './TurnTimer';
import { AnimatedScore } from './AnimatedScore';
import { AnimatedTilesCount } from './AnimatedTilesCount';
import type { Game, Move, Player, PendingInvitation } from '../../types';

const AVATAR_SIZE = DIMENSIONS.avatarScoreBar;
const AVATAR_CONTAINER_SIZE = DIMENSIONS.avatarScoreBarContainer;

function formatLastMove(
  move: Move | null,
  currentUserUlid: string | undefined,
  opponentName: string
): string | null {
  if (!move) return null;

  const actor = move.userUlid === currentUserUlid ? 'You' : opponentName;

  switch (move.type) {
    case 'play': {
      if (!move.words?.length) {
        return `${actor} played for ${move.score} pts`;
      }
      const word = [...move.words].sort((a, b) => b.length - a.length)[0] ?? '';
      return `${actor} played '${word.toUpperCase()}' for ${move.score} pts`;
    }
    case 'pass':
      return `${actor} passed`;
    case 'swap':
      return `${actor} swapped tiles`;
    case 'resign':
      return `${actor} resigned`;
    default:
      return null;
  }
}

interface ScoreBarProps {
  game: Game;
  currentUserUlid: string | undefined;
  onInvite?: () => void;
  onRevokeInvitation?: (invitationUlid: string) => void;
}

function StatusDots({
  hasFreeSwap,
  hasReceivedBlank,
}: {
  hasFreeSwap?: boolean;
  hasReceivedBlank?: boolean;
}) {
  const showBlankPending = hasReceivedBlank === false;
  const showFreeSwap = hasFreeSwap === true;

  if (!showBlankPending && !showFreeSwap) return null;

  return (
    <View style={styles.statusDots}>
      {showBlankPending && <View style={[styles.dot, styles.blankDot]} />}
      {showFreeSwap && <View style={[styles.dot, styles.swapDot]} />}
    </View>
  );
}

function PlayerAvatar({
  player,
  isActive,
}: {
  player: Player | undefined;
  isActive: boolean;
}) {
  const activeOpacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(activeOpacity, {
      toValue: isActive ? 1 : 0,
      duration: 300,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [isActive, activeOpacity]);

  return (
    <View style={styles.avatarContainer}>
      <Animated.View
        style={[styles.activeIndicator, { opacity: activeOpacity }]}
      />
      <View style={styles.avatarWrapper}>
        <SmartAvatar
          userUlid={player?.ulid}
          uri={player?.avatar}
          name={player?.username || '?'}
          size={AVATAR_SIZE}
          disabled={!player?.ulid}
          backgroundColor={player?.avatarColor ?? undefined}
        />
      </View>
    </View>
  );
}

export function ScoreBar({
  game,
  currentUserUlid,
  onInvite,
  onRevokeInvitation,
}: ScoreBarProps) {
  const myPlayer = game.players.find((p) => p.ulid === currentUserUlid);
  const opponent = game.players.find((p) => p.ulid !== currentUserUlid);

  const isMyTurn = myPlayer?.isCurrentTurn ?? false;
  const isOpponentTurn = opponent?.isCurrentTurn ?? false;
  const canInvite =
    !opponent &&
    !game.pendingInvitation &&
    game.status === 'pending' &&
    onInvite;
  const hasPendingInvitation =
    !opponent && game.pendingInvitation && game.status === 'pending';
  const showRackCount = game.tilesRemaining === 0;

  const lastMoveText = formatLastMove(
    game.lastMove,
    currentUserUlid,
    opponent?.username ?? 'Opponent'
  );

  return (
    <View style={styles.container}>
      {/* Left player section */}
      <View style={styles.playerSection}>
        <PlayerAvatar player={myPlayer} isActive={isMyTurn} />
        <View style={styles.playerInfo}>
          <Text
            style={[styles.playerName, isMyTurn && styles.activeName]}
            numberOfLines={1}
          >
            You
          </Text>
          <View style={styles.scoreRow}>
            <AnimatedScore score={myPlayer?.score ?? 0} />
            {showRackCount && (
              <Text style={styles.rackCount}>({myPlayer?.rackCount ?? 0})</Text>
            )}
          </View>
          <StatusDots
            hasFreeSwap={myPlayer?.hasFreeSwap}
            hasReceivedBlank={myPlayer?.hasReceivedBlank}
          />
        </View>
      </View>

      {/* Center section */}
      <View style={styles.centerSection}>
        <View style={styles.tilesBadge}>
          <AnimatedTilesCount count={game.tilesRemaining} />
          <Text style={styles.tilesLabel}>tiles</Text>
        </View>
        {lastMoveText && (
          <Text style={styles.lastMoveText} numberOfLines={1}>
            {lastMoveText}
          </Text>
        )}
        {game.status === 'finished' && (
          <View
            style={[
              styles.statusChip,
              game.winnerUlid === currentUserUlid
                ? styles.winChip
                : styles.loseChip,
            ]}
          >
            <Text style={styles.statusText}>
              {game.winnerUlid === currentUserUlid ? 'Won' : 'Lost'}
            </Text>
          </View>
        )}
        {game.status === 'active' && isMyTurn && game.turnExpiresAt && (
          <TurnTimer expiresAt={game.turnExpiresAt} isMyTurn={isMyTurn} />
        )}
      </View>

      {/* Right player section */}
      <View style={[styles.playerSection, styles.playerSectionRight]}>
        {canInvite ? (
          <>
            <Text style={styles.invitePrompt}>Invite opponent</Text>
            <TouchableOpacity style={styles.inviteButton} onPress={onInvite}>
              <Text style={styles.inviteText}>+</Text>
            </TouchableOpacity>
          </>
        ) : hasPendingInvitation ? (
          <View style={styles.pendingInviteSection}>
            <View style={[styles.playerInfo, styles.playerInfoRight]}>
              <Text style={styles.playerName} numberOfLines={1}>
                {game.pendingInvitation!.invitee.username}
              </Text>
              <Text style={styles.pendingLabel}>Invited</Text>
            </View>
            <TouchableOpacity
              style={styles.pendingAvatarContainer}
              onPress={() => onRevokeInvitation?.(game.pendingInvitation!.ulid)}
              activeOpacity={0.7}
            >
              <SmartAvatar
                userUlid={game.pendingInvitation!.invitee.ulid}
                uri={game.pendingInvitation!.invitee.avatar}
                name={game.pendingInvitation!.invitee.username}
                size={AVATAR_SIZE}
                disabled
                backgroundColor={
                  game.pendingInvitation!.invitee.avatarColor ?? undefined
                }
              />
              <View style={styles.revokeOverlay}>
                <Text style={styles.revokeIcon}>×</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[styles.playerInfo, styles.playerInfoRight]}>
              <Text
                style={[styles.playerName, isOpponentTurn && styles.activeName]}
                numberOfLines={1}
              >
                {opponent?.username ?? 'Opponent'}
              </Text>
              <View style={styles.scoreRow}>
                {showRackCount && (
                  <Text style={styles.rackCount}>
                    ({opponent?.rackCount ?? 0})
                  </Text>
                )}
                <AnimatedScore score={opponent?.score ?? 0} />
              </View>
              <StatusDots
                hasFreeSwap={opponent?.hasFreeSwap}
                hasReceivedBlank={opponent?.hasReceivedBlank}
              />
            </View>
            <PlayerAvatar player={opponent} isActive={isOpponentTurn} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.backgroundLight,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
  },
  playerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerSectionRight: {
    justifyContent: 'flex-end',
  },
  playerInfo: {
    marginLeft: 6,
    flex: 1,
  },
  playerInfoRight: {
    marginLeft: 0,
    marginRight: 6,
    alignItems: 'flex-end',
  },
  avatarContainer: {
    width: AVATAR_CONTAINER_SIZE,
    height: AVATAR_CONTAINER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    width: AVATAR_CONTAINER_SIZE,
    height: AVATAR_CONTAINER_SIZE,
    borderRadius: AVATAR_CONTAINER_SIZE / 2,
    borderWidth: 2.5,
    borderColor: colors.warning,
  },
  avatarWrapper: {
    width: AVATAR_SIZE + 2,
    height: AVATAR_SIZE + 2,
    borderRadius: (AVATAR_SIZE + 2) / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerName: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  activeName: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rackCount: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  statusDots: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  blankDot: {
    backgroundColor: '#FF6B6B',
  },
  swapDot: {
    backgroundColor: '#4A90D9',
  },
  centerSection: {
    alignItems: 'center',
    paddingHorizontal: 6,
    minWidth: 60,
  },
  tilesBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignItems: 'center',
  },
  tilesLabel: {
    color: colors.textPrimary,
    fontSize: 9,
    opacity: 0.8,
    marginTop: -1,
  },
  lastMoveText: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
    fontStyle: 'italic',
    textAlign: 'center',
    maxWidth: 200,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  winChip: {
    backgroundColor: '#4CAF50',
  },
  loseChip: {
    backgroundColor: '#E91E63',
  },
  statusText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  invitePrompt: {
    color: colors.textSecondary,
    fontSize: 11,
    marginRight: 8,
  },
  inviteButton: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  pendingInviteSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontStyle: 'italic',
  },
  pendingAvatarContainer: {
    position: 'relative',
  },
  revokeOverlay: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E91E63',
    justifyContent: 'center',
    alignItems: 'center',
  },
  revokeIcon: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 14,
  },
});
