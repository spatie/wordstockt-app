import React, { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Pressable, Animated, Platform } from 'react-native';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { colors } from '../../config/theme';
import { DIMENSIONS } from '../../config/constants';
import { ROUTES } from '../../config/routes';
import { useAuthStore } from '../../stores/authStore';
import { Avatar } from '../ui/Avatar';
import { SmartAvatar } from '../ui/SmartAvatar';
import { TurnTimer } from './TurnTimer';
import { AnimatedScore } from './AnimatedScore';
import { AnimatedTilesCount } from './AnimatedTilesCount';
import { calculateTilesPlayedBonus } from '../../utils/scoring';
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
  tilesPlayed?: number;
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
  const router = useRouter();
  const currentUserUlid = useAuthStore((s) => s.user?.ulid);

  const opacity = useSharedValue(isActive ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 750, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 750, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );
    } else {
      opacity.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(1, { duration: 150 });
    }
  }, [isActive, opacity, scale]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    if (!player?.ulid) return;

    if (player.ulid === currentUserUlid) {
      router.push(ROUTES.PROFILE);
    } else {
      router.push(ROUTES.USER_PROFILE(player.ulid));
    }
  }, [player?.ulid, currentUserUlid, router]);

  return (
    <Pressable
      style={styles.avatarContainer}
      onPress={handlePress}
      disabled={!player?.ulid}
    >
      <ReAnimated.View
        pointerEvents="none"
        style={[styles.activeIndicator, animatedIndicatorStyle]}
      />
      <Avatar
        uri={player?.avatar}
        name={player?.username || '?'}
        size={AVATAR_SIZE}
        backgroundColor={player?.avatarColor ?? undefined}
      />
    </Pressable>
  );
}

const ANIMATION_DURATION = 150;

export function ScoreBar({
  game,
  currentUserUlid,
  onInvite,
  onRevokeInvitation,
  tilesPlayed = 0,
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

  // Show +25 empty rack bonus indicator (from server flag)
  const myPlayerGotEmptyRackBonus = myPlayer?.receivedEmptyRackBonus === true;
  const opponentGotEmptyRackBonus = opponent?.receivedEmptyRackBonus === true;

  const lastMoveText = formatLastMove(
    game.lastMove,
    currentUserUlid,
    opponent?.username ?? 'Opponent'
  );

  // Calculate bonus for tiles played
  const bonus = calculateTilesPlayedBonus(tilesPlayed);
  const showBonus = bonus > 0;

  // Animation value for bonus display - simple fade
  const bonusOpacity = useRef(new Animated.Value(0)).current;
  const prevShowBonus = useRef(false);

  useEffect(() => {
    const useNativeDriver = Platform.OS !== 'web';

    if (showBonus && !prevShowBonus.current) {
      Animated.timing(bonusOpacity, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver,
      }).start();
    } else if (!showBonus && prevShowBonus.current) {
      Animated.timing(bonusOpacity, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver,
      }).start();
    }

    prevShowBonus.current = showBonus;
  }, [showBonus, bonusOpacity]);

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
          {myPlayerGotEmptyRackBonus && (
            <Text style={styles.emptyRackBonus}>+25</Text>
          )}
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
        {/* Long word bonus - same styling as lastMoveText */}
        <Animated.Text
          style={[
            styles.bonusText,
            !lastMoveText && styles.bonusNoLastMove,
            { opacity: bonusOpacity },
          ]}
        >
          +{bonus} long word bonus
        </Animated.Text>
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
          <View style={styles.inviteContainer}>
            <Text style={styles.invitePrompt}>Invite opponent</Text>
            <Pressable
              style={({ pressed }) => [
                styles.inviteButton,
                pressed && { opacity: 0.5 },
              ]}
              onPressOut={onInvite}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.inviteText}>+</Text>
            </Pressable>
          </View>
        ) : hasPendingInvitation ? (
          <View style={styles.pendingInviteSection}>
            <View style={[styles.playerInfo, styles.playerInfoRight]}>
              <Text style={styles.playerName} numberOfLines={1}>
                {game.pendingInvitation!.invitee.username}
              </Text>
              <Text style={styles.pendingLabel}>Invited</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.pendingAvatarContainer,
                pressed && { opacity: 0.7 },
              ]}
              onPressOut={() =>
                onRevokeInvitation?.(game.pendingInvitation!.ulid)
              }
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
            </Pressable>
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
              {opponentGotEmptyRackBonus && (
                <Text style={styles.emptyRackBonus}>+25</Text>
              )}
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
    borderWidth: 3.5,
    borderColor: colors.warning,
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
  emptyRackBonus: {
    fontSize: 9,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 1,
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
  bonusText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontStyle: 'italic',
    textAlign: 'center',
    maxWidth: 200,
  },
  bonusNoLastMove: {
    marginTop: 4,
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
  inviteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'center',
    lineHeight: 18,
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
    top: Platform.OS === 'android' ? -6 : -2,
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
