import React, { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
  interpolate,
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
import { StatusInfoModal } from './StatusInfoModal';
import { calculateTilesPlayedBonus } from '../../utils/scoring';
import type { Game, Move, Player } from '../../types';

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

function TilesBadge({ count }: { count: number }) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    // Wobble animation: rotate back and forth while bouncing
    rotation.set(
      withSequence(
        withTiming(-12, { duration: 50 }),
        withTiming(10, { duration: 60 }),
        withTiming(-8, { duration: 60 }),
        withTiming(6, { duration: 60 }),
        withTiming(-3, { duration: 50 }),
        withTiming(0, { duration: 50 })
      )
    );
    scale.set(
      withSequence(
        withSpring(1.15, { damping: 8, stiffness: 400 }),
        withSpring(1, { damping: 10, stiffness: 300 })
      )
    );
  }, [rotation, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  return (
    <Pressable onPress={handlePress}>
      <ReAnimated.View style={[styles.tilesBadge, animatedStyle]}>
        <AnimatedTilesCount count={count} />
        <Text style={styles.tilesLabel}>{count === 1 ? 'tile' : 'tiles'}</Text>
      </ReAnimated.View>
    </Pressable>
  );
}

function StatusDots({
  hasFreeSwap,
  hasReceivedBlank,
  onPress,
}: {
  hasFreeSwap?: boolean;
  hasReceivedBlank?: boolean;
  onPress?: () => void;
}) {
  const showBlankPending = hasReceivedBlank === false;
  const showFreeSwap = hasFreeSwap === true;

  if (!showBlankPending && !showFreeSwap) return null;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.statusDots,
        { opacity: pressed ? 0.7 : 1 },
      ]}
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {showBlankPending && <View style={[styles.dot, styles.blankDot]} />}
      {showFreeSwap && <View style={[styles.dot, styles.swapDot]} />}
    </Pressable>
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

  const visible = useSharedValue(isActive ? 1 : 0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      visible.set(withTiming(1, { duration: 300 }));
      pulse.set(1);
      pulse.set(
        withRepeat(
          withSequence(
            withTiming(0.3, {
              duration: 1200,
              easing: Easing.inOut(Easing.quad),
            }),
            withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) })
          ),
          -1,
          false
        )
      );
    } else {
      visible.set(withTiming(0, { duration: 300 }));
      pulse.set(1);
    }
  }, [isActive, visible, pulse]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    opacity: visible.value * interpolate(pulse.value, [0.3, 1], [0.6, 1]),
    shadowOpacity:
      visible.value * interpolate(pulse.value, [0.3, 1], [0.3, 0.8]),
    shadowRadius: interpolate(pulse.value, [0.3, 1], [6, 14]),
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
      style={({ pressed }) => [
        styles.avatarWrapper,
        { opacity: pressed && player?.ulid ? 0.7 : 1 },
      ]}
      onPress={handlePress}
      disabled={!player?.ulid}
    >
      <ReAnimated.View
        style={[styles.activeIndicator, animatedIndicatorStyle]}
        pointerEvents="none"
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
  const [statusModalPlayer, setStatusModalPlayer] = useState<
    'me' | 'opponent' | null
  >(null);
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

  // Animation for bonus display using Reanimated for consistent behavior
  const bonusOpacity = useSharedValue(0);

  useEffect(() => {
    bonusOpacity.set(
      withTiming(showBonus ? 1 : 0, {
        duration: ANIMATION_DURATION,
      })
    );
  }, [showBonus, bonusOpacity]);

  const bonusAnimatedStyle = useAnimatedStyle(() => ({
    opacity: bonusOpacity.value,
  }));

  return (
    <View style={styles.containerWrapper}>
      <BlurView intensity={40} tint="dark" style={styles.container}>
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
                <Text style={styles.rackCount}>
                  ({myPlayer?.rackCount ?? 0})
                </Text>
              )}
            </View>
            <StatusDots
              hasFreeSwap={myPlayer?.hasFreeSwap}
              hasReceivedBlank={myPlayer?.hasReceivedBlank}
              onPress={() => setStatusModalPlayer('me')}
            />
            {myPlayerGotEmptyRackBonus && (
              <Text style={styles.emptyRackBonus}>+25</Text>
            )}
          </View>
        </View>

        {/* Center section */}
        <View style={styles.centerSection}>
          <TilesBadge count={game.tilesRemaining} />
          {lastMoveText && (
            <Text style={styles.lastMoveText} numberOfLines={1}>
              {lastMoveText}
            </Text>
          )}
          {/* Long word bonus - same styling as lastMoveText */}
          <ReAnimated.Text
            style={[
              styles.bonusText,
              !lastMoveText && styles.bonusNoLastMove,
              bonusAnimatedStyle,
            ]}
          >
            +{bonus} long word bonus
          </ReAnimated.Text>
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
                  style={[
                    styles.playerName,
                    isOpponentTurn && styles.activeName,
                  ]}
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
                  onPress={() => setStatusModalPlayer('opponent')}
                />
                {opponentGotEmptyRackBonus && (
                  <Text style={styles.emptyRackBonus}>+25</Text>
                )}
              </View>
              <PlayerAvatar player={opponent} isActive={isOpponentTurn} />
            </>
          )}
        </View>
      </BlurView>

      <StatusInfoModal
        visible={statusModalPlayer !== null}
        onClose={() => setStatusModalPlayer(null)}
        showBlankPending={
          statusModalPlayer === 'me'
            ? myPlayer?.hasReceivedBlank === false
            : opponent?.hasReceivedBlank === false
        }
        showFreeSwap={
          statusModalPlayer === 'me'
            ? myPlayer?.hasFreeSwap === true
            : opponent?.hasFreeSwap === true
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  containerWrapper: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(27, 40, 56, 0.5)',
  },
  playerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.3,
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
  avatarWrapper: {
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
    shadowColor: colors.warning,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
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
    paddingHorizontal: 4,
    flex: 2.4,
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
  },
  bonusText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontStyle: 'italic',
    textAlign: 'center',
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
