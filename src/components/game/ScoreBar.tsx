import React, { useEffect, useCallback, useState, useRef } from 'react';
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
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
        <Text style={styles.tilesLabel}>in bag</Text>
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

function ResultBadge({ won }: { won: boolean }) {
  return (
    <View style={[styles.resultBadge, won ? styles.wonBadge : styles.lostBadge]}>
      <Text style={[styles.resultBadgeText, !won && styles.lostBadgeText]}>
        {won ? 'Won' : 'Lost'}
      </Text>
    </View>
  );
}

function AnimatedPlayerSection({
  isActive,
  isWinner,
  isGameFinished,
  avatarColor,
  isRight,
  children,
}: {
  isActive: boolean;
  isWinner: boolean;
  isGameFinished: boolean;
  avatarColor: string | null | undefined;
  isRight: boolean;
  children: React.ReactNode;
}) {
  const pulse = useSharedValue(1);
  const boxOpacity = useSharedValue(isActive ? 1 : 0);
  const color = avatarColor || '#4A90D9';

  useEffect(() => {
    if (isActive && !isGameFinished) {
      boxOpacity.set(withTiming(1, { duration: 300 }));
      pulse.set(
        withRepeat(
          withTiming(0.6, {
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
          }),
          -1,
          true
        )
      );
    } else {
      boxOpacity.set(withTiming(0, { duration: 300 }));
      pulse.set(withTiming(1, { duration: 300 }));
    }
  }, [isActive, isGameFinished, pulse, boxOpacity]);

  const animatedStyle = useAnimatedStyle(() => {
    if (isGameFinished && isWinner) {
      return {
        backgroundColor: 'rgba(76, 175, 80, 0.12)',
        borderColor: 'rgba(76, 175, 80, 0.4)',
        opacity: 1,
      };
    }
    if (isGameFinished) {
      return {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        opacity: 1,
      };
    }
    // Active player gets colored box with pulse, inactive gets nothing
    const bgAlpha = interpolate(pulse.value, [0.6, 1], [0.1, 0.2]) * boxOpacity.value;
    const borderAlpha = interpolate(pulse.value, [0.6, 1], [0.3, 0.6]) * boxOpacity.value;
    return {
      backgroundColor: `rgba(${hexToRgb(color)}, ${bgAlpha})`,
      borderColor: `rgba(${hexToRgb(color)}, ${borderAlpha})`,
      opacity: 1,
    };
  });

  return (
    <ReAnimated.View
      style={[
        styles.playerSection,
        isRight && styles.playerSectionRight,
        animatedStyle,
      ]}
    >
      {children}
    </ReAnimated.View>
  );
}

function hexToRgb(hex: string): string {
  'worklet';
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result && result[1] && result[2] && result[3]) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '74, 144, 217';
}

function PlayerAvatar({ player }: { player: Player | undefined }) {
  const router = useRouter();
  const currentUserUlid = useAuthStore((s) => s.user?.ulid);

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

interface FooterHistoryProps {
  gameUlid: string;
  lastMoveText: string | null;
  showBonus: boolean;
  bonus: number;
}

function FooterHistory({
  gameUlid,
  lastMoveText,
  showBonus,
  bonus,
}: FooterHistoryProps) {
  const router = useRouter();
  const isFirstRender = useRef(true);
  const opacity = useSharedValue(1);
  const bonusOpacity = useSharedValue(showBonus ? 1 : 0);
  const [displayedText, setDisplayedText] = useState(lastMoveText);
  const [displayedBonus, setDisplayedBonus] = useState({ showBonus, bonus });

  useEffect(() => {
    // Skip animation on first render - show immediately
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setDisplayedText(lastMoveText);
      setDisplayedBonus({ showBonus, bonus });
      return;
    }

    if (lastMoveText) {
      // Fade out, update text, fade in
      opacity.set(withTiming(0, { duration: ANIMATION_DURATION }));
      const timeout = setTimeout(() => {
        setDisplayedText(lastMoveText);
        setDisplayedBonus({ showBonus, bonus });
        opacity.set(withTiming(1, { duration: ANIMATION_DURATION }));
      }, ANIMATION_DURATION);
      return () => clearTimeout(timeout);
    }
    opacity.set(withTiming(0, { duration: ANIMATION_DURATION }));
  }, [lastMoveText, showBonus, bonus, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (isFirstRender.current) return;
    bonusOpacity.set(
      withTiming(displayedBonus.showBonus ? 1 : 0, {
        duration: ANIMATION_DURATION,
      })
    );
  }, [displayedBonus.showBonus, bonusOpacity]);

  const bonusAnimatedStyle = useAnimatedStyle(() => ({
    opacity: bonusOpacity.value,
  }));

  const handlePress = useCallback(() => {
    router.push(ROUTES.GAME_HISTORY(gameUlid));
  }, [router, gameUlid]);

  if (!lastMoveText) {
    return null;
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.footer,
        pressed && styles.footerPressed,
      ]}
      onPress={handlePress}
    >
      <ReAnimated.View style={[styles.footerContent, animatedStyle]}>
        <Text style={styles.lastMoveText} numberOfLines={1}>
          {displayedText}
        </Text>
      </ReAnimated.View>
      <View style={styles.footerRight}>
        {displayedBonus.showBonus && (
          <ReAnimated.Text style={[styles.bonusText, bonusAnimatedStyle]}>
            {`inc. +${displayedBonus.bonus} length bonus`}
          </ReAnimated.Text>
        )}
        <MaterialCommunityIcons
          name="chevron-right"
          size={14}
          color="rgba(255, 255, 255, 0.4)"
        />
      </View>
    </Pressable>
  );
}

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
  const isGameFinished = game.status === 'finished';
  const canInvite =
    !opponent &&
    !game.pendingInvitation &&
    game.status === 'pending' &&
    onInvite;
  const hasPendingInvitation =
    !opponent && game.pendingInvitation && game.status === 'pending';
  const showRackCount = game.tilesRemaining === 0;

  const myPlayerWon = isGameFinished && game.winnerUlid === currentUserUlid;
  const opponentWon = isGameFinished && game.winnerUlid === opponent?.ulid;

  const myPlayerGotEmptyRackBonus = myPlayer?.receivedEmptyRackBonus === true;
  const opponentGotEmptyRackBonus = opponent?.receivedEmptyRackBonus === true;

  const lastMoveText = isGameFinished
    ? 'Game finished'
    : formatLastMove(
        game.lastMove,
        currentUserUlid,
        opponent?.username ?? 'Opponent'
      );

  // Calculate bonus: either from tiles being placed now, or from the last move
  const currentBonus = calculateTilesPlayedBonus(tilesPlayed);
  const lastMoveBonus =
    game.lastMove?.type === 'play' && game.lastMove.tiles
      ? calculateTilesPlayedBonus(game.lastMove.tiles.length)
      : 0;

  // Show current bonus while placing tiles, otherwise show last move bonus
  const bonus = currentBonus > 0 ? currentBonus : lastMoveBonus;
  const showBonus = bonus > 0 && !isGameFinished;

  return (
    <View style={styles.containerWrapper}>
      <BlurView intensity={40} tint="dark" style={styles.container}>
        {/* Main content */}
        <View style={styles.mainContent}>
          {/* Left player section */}
          <AnimatedPlayerSection
            isActive={isMyTurn}
            isWinner={myPlayerWon}
            isGameFinished={isGameFinished}
            avatarColor={myPlayer?.avatarColor}
            isRight={false}
          >
            <PlayerAvatar player={myPlayer} />
            <View style={styles.playerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.playerName} numberOfLines={1}>
                  You
                </Text>
                {isGameFinished && <ResultBadge won={myPlayerWon} />}
              </View>
              <AnimatedScore score={myPlayer?.score ?? 0} />
              <View style={styles.metaRow}>
                {showRackCount && (
                  <Text style={styles.rackCount}>
                    {myPlayer?.rackCount ?? 0} tiles
                  </Text>
                )}
                {myPlayerGotEmptyRackBonus && (
                  <Text style={styles.finishBonus}>
                    +25 finish
                  </Text>
                )}
                {!myPlayerGotEmptyRackBonus && (
                  <StatusDots
                    hasFreeSwap={myPlayer?.hasFreeSwap}
                    hasReceivedBlank={myPlayer?.hasReceivedBlank}
                    onPress={() => setStatusModalPlayer('me')}
                  />
                )}
              </View>
            </View>
          </AnimatedPlayerSection>

          {/* Center section */}
          <View style={styles.centerSection}>
            <TilesBadge count={game.tilesRemaining} />
            {game.status === 'active' && isMyTurn && game.turnExpiresAt && (
              <TurnTimer expiresAt={game.turnExpiresAt} isMyTurn={isMyTurn} />
            )}
          </View>

          {/* Right player section */}
          <AnimatedPlayerSection
            isActive={isOpponentTurn}
            isWinner={opponentWon}
            isGameFinished={isGameFinished}
            avatarColor={opponent?.avatarColor}
            isRight={true}
          >
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
                <PlayerAvatar player={opponent} />
                <View style={[styles.playerInfo, styles.playerInfoRight]}>
                  <View style={[styles.nameRow, styles.nameRowRight]}>
                    {isGameFinished && <ResultBadge won={opponentWon} />}
                    <Text style={styles.playerName} numberOfLines={1}>
                      {opponent?.username ?? 'Opponent'}
                    </Text>
                  </View>
                  <AnimatedScore score={opponent?.score ?? 0} />
                  <View style={[styles.metaRow, styles.metaRowRight]}>
                    {opponentGotEmptyRackBonus && (
                      <Text style={styles.finishBonus}>
                        +25 finish
                      </Text>
                    )}
                    {!opponentGotEmptyRackBonus && (
                      <StatusDots
                        hasFreeSwap={opponent?.hasFreeSwap}
                        hasReceivedBlank={opponent?.hasReceivedBlank}
                        onPress={() => setStatusModalPlayer('opponent')}
                      />
                    )}
                    {showRackCount && (
                      <Text style={styles.rackCount}>
                        {opponent?.rackCount ?? 0} tiles
                      </Text>
                    )}
                  </View>
                </View>
              </>
            )}
          </AnimatedPlayerSection>
        </View>

        {/* Footer - tappable to navigate to move history */}
        <FooterHistory
          gameUlid={game.ulid}
          lastMoveText={lastMoveText}
          showBonus={showBonus}
          bonus={bonus}
        />
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
    borderRadius: 16,
    overflow: 'hidden',
  },
  container: {
    backgroundColor: 'rgba(27, 40, 56, 0.5)',
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    padding: 10,
    gap: 6,
  },
  playerSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  playerSectionRight: {
    flexDirection: 'row-reverse',
  },
  playerInfo: {
    flex: 1,
    minWidth: 0,
  },
  playerInfoRight: {
    alignItems: 'flex-end',
  },
  avatarWrapper: {
    width: AVATAR_CONTAINER_SIZE,
    height: AVATAR_CONTAINER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  nameRowRight: {
    flexDirection: 'row-reverse',
  },
  playerName: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
  },
  resultBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  wonBadge: {
    backgroundColor: '#4CAF50',
  },
  lostBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  resultBadgeText: {
    color: colors.textPrimary,
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  lostBadgeText: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  metaRowRight: {
    flexDirection: 'row-reverse',
  },
  rackCount: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 9,
  },
  finishBonus: {
    color: '#4CAF50',
    fontSize: 9,
    fontWeight: '500',
  },
  statusDots: {
    flexDirection: 'row',
    gap: 3,
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
    justifyContent: 'center',
    paddingHorizontal: 6,
    minWidth: 55,
  },
  tilesBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignItems: 'center',
  },
  tilesLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 7,
  },
  footer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 7,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lastMoveText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    fontStyle: 'italic',
    flex: 1,
  },
  bonusText: {
    color: '#4CAF50',
    fontSize: 9,
    fontWeight: '500',
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
    gap: 8,
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
