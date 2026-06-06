import React, {
  useEffect,
  useCallback,
  useState,
  useRef,
  useMemo,
} from 'react';
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
import { DIMENSIONS, LAYOUT } from '../../config/constants';
import { ROUTES } from '../../config/routes';
import { useAuthStore } from '../../stores/authStore';
import { Avatar } from '../ui/Avatar';
import { SmartAvatar } from '../ui/SmartAvatar';
import { TurnTimer } from './TurnTimer';
import { AnimatedScore } from './AnimatedScore';
import { AnimatedTilesCount } from './AnimatedTilesCount';
import { StatusInfoModal } from './StatusInfoModal';
import { useStartGame } from '../../api/queries/useGames';
import { calculateTilesPlayedBonus } from '../../utils/scoring';
import type { Game, Move, Player } from '../../types';

const AVATAR_SIZE = DIMENSIONS.avatarScoreBar;
const AVATAR_CONTAINER_SIZE = DIMENSIONS.avatarScoreBarContainer;

function formatLastMove(
  move: Move | null,
  currentUserUlid: string | undefined,
  players: Player[]
): string | null {
  if (!move) return null;

  const actorPlayer = players.find((p) => p.ulid === move.userUlid);
  const actor =
    move.userUlid === currentUserUlid
      ? 'You'
      : (actorPlayer?.username ?? 'Opponent');

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
    <View
      style={[styles.resultBadge, won ? styles.wonBadge : styles.lostBadge]}
    >
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
  children,
}: {
  isActive: boolean;
  isWinner: boolean;
  isGameFinished: boolean;
  avatarColor: string | null | undefined;
  children: React.ReactNode;
}) {
  const pulse = useSharedValue(1);
  const boxOpacity = useSharedValue(isActive ? 1 : 0);
  const color = avatarColor || '#4A90D9';

  // Precompute rgb components once per color (regex parsing must not run in the
  // per-frame animation worklet).
  const [rgbR, rgbG, rgbB] = useMemo(() => hexToRgbComponents(color), [color]);

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
    // Active player gets colored box with pulse, inactive gets nothing.
    const bgAlpha =
      interpolate(pulse.value, [0.6, 1], [0.1, 0.2]) * boxOpacity.value;
    const borderAlpha =
      interpolate(pulse.value, [0.6, 1], [0.3, 0.6]) * boxOpacity.value;
    return {
      backgroundColor: rgbaWithAlpha(rgbR, rgbG, rgbB, bgAlpha),
      borderColor: rgbaWithAlpha(rgbR, rgbG, rgbB, borderAlpha),
      opacity: 1,
    };
  });

  return (
    <ReAnimated.View style={[styles.playerSection, animatedStyle]}>
      {children}
    </ReAnimated.View>
  );
}

// Plain JS (NOT a worklet): parse hex once, memoized per color in the component.
// The regex is expensive and must not run inside the per-frame animation worklet.
/**
 * Build an `rgba()` string with the alpha formatted to a fixed number of
 * decimals. An animated alpha fading toward 0 can otherwise be serialized in
 * scientific notation (e.g. `3.4e-7`), which Reanimated's color parser rejects
 * and throws an uncaught error on. Safe to call from a Reanimated worklet.
 */
export function rgbaWithAlpha(
  r: number,
  g: number,
  b: number,
  alpha: number
): string {
  'worklet';

  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
}

function hexToRgbComponents(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result && result[1] && result[2] && result[3]) {
    return [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
    ];
  }
  return [74, 144, 217];
}

function PlayerAvatar({
  player,
  dimmed,
}: {
  player: Player | undefined;
  dimmed?: boolean;
}) {
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
      <View style={dimmed ? styles.dimmedAvatar : undefined}>
        <Avatar
          uri={player?.avatar}
          name={player?.username || '?'}
          size={AVATAR_SIZE}
          backgroundColor={
            dimmed ? colors.textMuted : (player?.avatarColor ?? undefined)
          }
        />
      </View>
    </Pressable>
  );
}

/**
 * A single player chip in the score-bar row: avatar, name, score, status dots
 * (or a "LEFT" tag for departed players) and a turn highlight on the active
 * player. Used for every joined seat regardless of the player count.
 */
function PlayerChip({
  player,
  isSelf,
  isGameFinished,
  isWinner,
  onStatusPress,
  showRackCount,
}: {
  player: Player;
  isSelf: boolean;
  isGameFinished: boolean;
  isWinner: boolean;
  onStatusPress: () => void;
  showRackCount: boolean;
}) {
  const hasLeft = player.hasLeft === true;
  const isActive = !hasLeft && player.isCurrentTurn;
  const gotEmptyRackBonus = player.receivedEmptyRackBonus === true;

  return (
    <AnimatedPlayerSection
      isActive={isActive}
      isWinner={!hasLeft && isWinner}
      isGameFinished={isGameFinished}
      avatarColor={player.avatarColor}
    >
      <View style={[styles.chip, hasLeft && styles.chipLeft]}>
        <PlayerAvatar player={player} dimmed={hasLeft} />
        <View style={styles.playerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.playerName} numberOfLines={1}>
              {isSelf ? 'You' : player.username}
            </Text>
            {isGameFinished && !hasLeft && <ResultBadge won={isWinner} />}
          </View>
          <AnimatedScore
            score={player.score ?? 0}
            style={hasLeft ? styles.leftScore : undefined}
          />
          <View style={styles.metaRow}>
            {hasLeft && <Text style={styles.leftTag}>LEFT</Text>}
            {!hasLeft && showRackCount && (
              <Text style={styles.rackCount}>
                {player.rackCount ?? 0} tiles
              </Text>
            )}
            {!hasLeft && gotEmptyRackBonus && (
              <Text style={styles.finishBonus}>+25 finish</Text>
            )}
            {!hasLeft && !gotEmptyRackBonus && (
              <StatusDots
                hasFreeSwap={player.hasFreeSwap}
                hasReceivedBlank={player.hasReceivedBlank}
                onPress={onStatusPress}
              />
            )}
          </View>
        </View>
      </View>
    </AnimatedPlayerSection>
  );
}

/** Greyed-out chip for a seat with an outstanding invitation. */
function PendingSeatChip({
  invitation,
  onRevoke,
}: {
  invitation: NonNullable<Game['pendingInvitation']>;
  onRevoke?: (invitationUlid: string) => void;
}) {
  return (
    <View style={[styles.playerSection, styles.placeholderSection]}>
      <View style={styles.chip}>
        <Pressable
          style={({ pressed }) => [
            styles.pendingAvatarContainer,
            pressed && { opacity: 0.7 },
          ]}
          onPressOut={() => onRevoke?.(invitation.ulid)}
        >
          <SmartAvatar
            userUlid={invitation.invitee.ulid}
            uri={invitation.invitee.avatar}
            name={invitation.invitee.username}
            size={AVATAR_SIZE}
            disabled
            backgroundColor={invitation.invitee.avatarColor ?? undefined}
          />
          {onRevoke && (
            <View style={styles.revokeOverlay}>
              <Text style={styles.revokeIcon}>×</Text>
            </View>
          )}
        </Pressable>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName} numberOfLines={1}>
            {invitation.invitee.username}
          </Text>
          <Text style={styles.pendingTag}>PENDING</Text>
        </View>
      </View>
    </View>
  );
}

/** Dashed "Invite +" placeholder for an open seat. */
function InviteSeatChip({ onInvite }: { onInvite?: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.playerSection,
        styles.inviteSeat,
        pressed && { opacity: 0.6 },
      ]}
      onPressOut={onInvite}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <View style={styles.inviteButton}>
        <Text style={styles.inviteText}>+</Text>
      </View>
      <Text style={styles.invitePrompt} numberOfLines={1}>
        Invite
      </Text>
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
      style={({ pressed }) => [styles.footer, pressed && styles.footerPressed]}
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
  const [statusModalPlayerUlid, setStatusModalPlayerUlid] = useState<
    string | null
  >(null);
  const startGame = useStartGame();

  const isGameFinished = game.status === 'finished';
  const isPending = game.status === 'pending';
  const showRackCount = game.tilesRemaining === 0;

  // Original roster, ordered by turn order so the layout stays stable even when
  // a player leaves (a left player keeps their cell, never collapsing the row).
  const orderedPlayers = useMemo(
    () =>
      [...game.players].sort((a, b) => (a.turnOrder ?? 0) - (b.turnOrder ?? 0)),
    [game.players]
  );

  // Display order: the current user is always first ("You" on the left, like a
  // two-player game), then the remaining players in turn order.
  const displayPlayers = useMemo(() => {
    const mine = orderedPlayers.filter((p) => p.ulid === currentUserUlid);
    const others = orderedPlayers.filter((p) => p.ulid !== currentUserUlid);
    return [...mine, ...others];
  }, [orderedPlayers, currentUserUlid]);

  const myPlayer = game.players.find((p) => p.ulid === currentUserUlid);
  const isMyTurn = myPlayer?.isCurrentTurn ?? false;

  // The creator is the player with the lowest turn order (turn_order === 1).
  // Only they can manually start a pending game.
  const creator = orderedPlayers[0];
  const isCreator = creator?.ulid === currentUserUlid;
  const canStartNow = isPending && isCreator && game.players.length >= 2;

  // Open seats are the slots not yet filled and not awaiting a pending invite.
  const pendingInvitationCount = game.pendingInvitations.length;
  const openSeatCount = Math.max(
    0,
    game.maxPlayers - game.players.length - pendingInvitationCount
  );
  const openSeats = isPending ? openSeatCount : 0;

  const statusModalPlayer = game.players.find(
    (p) => p.ulid === statusModalPlayerUlid
  );

  const lastMoveText = isGameFinished
    ? 'Game finished'
    : formatLastMove(game.lastMove, currentUserUlid, game.players);

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
        {/* Equal-chip row keyed to the original roster size */}
        <View style={styles.mainContent} key={`roster-${game.maxPlayers}`}>
          {displayPlayers.map((player) => (
            <PlayerChip
              key={player.ulid}
              player={player}
              isSelf={player.ulid === currentUserUlid}
              isGameFinished={isGameFinished}
              isWinner={game.winnerUlid === player.ulid}
              showRackCount={showRackCount}
              onStatusPress={() => setStatusModalPlayerUlid(player.ulid)}
            />
          ))}

          {isPending &&
            game.pendingInvitations.map((invitation) => (
              <PendingSeatChip
                key={invitation.ulid}
                invitation={invitation}
                onRevoke={onRevokeInvitation}
              />
            ))}

          {Array.from({ length: openSeats }).map((_, index) => (
            <InviteSeatChip key={`invite-seat-${index}`} onInvite={onInvite} />
          ))}
        </View>

        {/* Info row: turn timer (left) / tiles in bag (centered) / start now (right) */}
        <View style={styles.infoRow}>
          <View style={styles.infoSide}>
            {game.status === 'active' && isMyTurn && game.turnExpiresAt && (
              <TurnTimer expiresAt={game.turnExpiresAt} isMyTurn={isMyTurn} />
            )}
          </View>
          {!isPending && (
            <View style={styles.infoCenter}>
              <TilesBadge count={game.tilesRemaining} />
            </View>
          )}
          <View style={[styles.infoSide, styles.infoSideRight]}>
            {canStartNow && (
              <Pressable
                style={({ pressed }) => [
                  styles.startButton,
                  startGame.isPending && styles.startButtonDisabled,
                  pressed && { opacity: 0.7 },
                ]}
                onPressOut={() => {
                  if (startGame.isPending) return;
                  startGame.mutate(game.ulid);
                }}
                disabled={startGame.isPending}
              >
                <MaterialCommunityIcons
                  name="play"
                  size={13}
                  color={colors.textPrimary}
                />
                <Text style={styles.startButtonText}>Start now</Text>
              </Pressable>
            )}
          </View>
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
        visible={statusModalPlayer !== undefined}
        onClose={() => setStatusModalPlayerUlid(null)}
        showBlankPending={statusModalPlayer?.hasReceivedBlank === false}
        showFreeSwap={statusModalPlayer?.hasFreeSwap === true}
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
    maxWidth: LAYOUT.gameControlsMaxWidth,
    width: '100%',
    alignSelf: 'center',
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
    minWidth: 0,
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
  },
  placeholderSection: {
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  chipLeft: {
    opacity: 0.55,
  },
  playerInfo: {
    flex: 1,
    minWidth: 0,
  },
  avatarWrapper: {
    width: AVATAR_CONTAINER_SIZE,
    height: AVATAR_CONTAINER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dimmedAvatar: {
    opacity: 0.6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  playerName: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
  },
  leftScore: {
    opacity: 0.6,
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
  rackCount: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 9,
  },
  finishBonus: {
    color: '#4CAF50',
    fontSize: 9,
    fontWeight: '500',
  },
  leftTag: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pendingTag: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 3,
    fontStyle: 'italic',
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 8,
    minHeight: 4,
    gap: 8,
  },
  infoSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  infoSideRight: {
    justifyContent: 'flex-end',
  },
  infoCenter: {
    alignItems: 'center',
    justifyContent: 'center',
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
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
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
  inviteSeat: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderStyle: 'dashed',
  },
  invitePrompt: {
    color: colors.textSecondary,
    fontSize: 11,
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
  pendingAvatarContainer: {
    position: 'relative',
  },
  revokeOverlay: {
    position: 'absolute',
    // Android clips children to the rounded `playerSection` (borderRadius),
    // so the badge must stay within the avatar's bounds. iOS doesn't clip,
    // so it can keep floating slightly outside the avatar.
    top: Platform.OS === 'android' ? 0 : -2,
    right: Platform.OS === 'android' ? 0 : -2,
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
