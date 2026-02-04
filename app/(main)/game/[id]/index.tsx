import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGame } from '../../../../src/api/queries/useGame';
import { useValidation } from '../../../../src/api/queries/useValidation';
import { useWordInfo } from '../../../../src/api/queries/useWordInfo';
import {
  useRevokeInvitation,
  useAcceptInvitation,
  useDeclineInvitation,
} from '../../../../src/api/queries/useInvitations';
import { useJoinGame } from '../../../../src/api/queries/useGames';
import { useAuthStore } from '../../../../src/stores/authStore';
import { useGameStore } from '../../../../src/stores/gameStore';
import { useNavigationStore } from '../../../../src/stores/navigationStore';
import { useNotificationStore } from '../../../../src/stores/notificationStore';
import {
  useAchievementStore,
  useCurrentAchievement,
} from '../../../../src/stores/achievementStore';
import { useWebSocket } from '../../../../src/hooks/useWebSocket';
import { useGameInteractions } from '../../../../src/hooks/useGameInteractions';
import { useConflictingTilesRecall } from '../../../../src/hooks/useConflictingTilesRecall';
import { useRematch } from '../../../../src/hooks/useRematch';
import { DragDropProvider } from '../../../../src/context/DragDropContext';
import { GameBoard } from '../../../../src/components/game/GameBoard';
import { TileRack } from '../../../../src/components/game/TileRack';
import { ActionButtons } from '../../../../src/components/game/ActionButtons';
import { ScoreBar } from '../../../../src/components/game/ScoreBar';
import {
  SwapModeDarkOverlay,
  SwapModeButtons,
} from '../../../../src/components/game/SwapModeOverlay';
import { InvitePlayerModal } from '../../../../src/components/game/InvitePlayerModal';
import { BlankTileModal } from '../../../../src/components/game/BlankTileModal';
import { WordInfoModal } from '../../../../src/components/game/WordInfoModal';
import { LoadingView } from '../../../../src/components/ui/LoadingView';
import { FeedbackModal } from '../../../../src/components/ui/FeedbackModal';
import { AchievementModal } from '../../../../src/components/ui/AchievementModal';
import { RematchModal } from '../../../../src/components/ui/RematchModal';
import { Button } from '../../../../src/components/ui/Button';
import { showConfirm } from '../../../../src/utils/alerts';
import { colors } from '../../../../src/config/theme';
import { SPACING, RADIUS } from '../../../../src/config/constants';
import { ROUTES } from '../../../../src/config/routes';
import { mockGame } from '../../../../src/config/mockData';

// Removed BACK_DESTINATION - let AppHeader use router.back() for correct animation

// Set to true to use mock data for UI testing
const USE_MOCK_DATA = false;

const BUTTON_FADE_DURATION = 200;

function GameScreenContent() {
  const { id, invitation: invitationUlid } = useLocalSearchParams<{
    id: string;
    invitation?: string;
  }>();
  const router = useRouter();
  const gameUlid = id ?? '';
  const userUlid = useAuthStore((s) => s.user?.ulid) ?? '';
  const setLastGameUlid = useNavigationStore((s) => s.setLastGameUlid);
  const clearLastGameUlid = useNavigationStore((s) => s.clearLastGameUlid);
  const setCurrentlyViewedGameUlid = useNavigationStore(
    (s) => s.setCurrentlyViewedGameUlid
  );
  const setCurrentGame = useGameStore((s) => s.setCurrentGame);

  // Set current game context for per-game state (pending tiles, etc.)
  useEffect(() => {
    if (gameUlid) {
      setCurrentGame(gameUlid);
    }
  }, [gameUlid, setCurrentGame]);

  // Track this game as the last visited screen for app resume
  useEffect(() => {
    if (gameUlid) {
      setLastGameUlid(gameUlid);
    }
  }, [gameUlid, setLastGameUlid]);

  // Track currently viewed game for notification suppression
  useEffect(() => {
    if (gameUlid) {
      setCurrentlyViewedGameUlid(gameUlid);
    }
    return () => {
      setCurrentlyViewedGameUlid(null);
    };
  }, [gameUlid, setCurrentlyViewedGameUlid]);

  // Dismiss notifications for this game when viewing it
  useEffect(() => {
    if (!gameUlid || Platform.OS === 'web') {
      return;
    }

    const store = useNotificationStore.getState();
    const identifiers = store.getIdentifiersForGame(gameUlid);

    identifiers.forEach((id) => {
      Notifications.dismissNotificationAsync(id);
    });
    store.clearForGame(gameUlid);
  }, [gameUlid]);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [lastMoveWarningShown, setLastMoveWarningShown] = useState(false);
  const [gameEndModalDismissed, setGameEndModalDismissed] = useState(false);
  const [rematchDismissed, setRematchDismissed] = useState(false);
  const [isSwapExiting, setIsSwapExiting] = useState(false);

  // Achievement state
  const currentAchievement = useCurrentAchievement();
  const dismissAchievement = useAchievementStore((s) => s.dismissNext);
  const [wordInfoPosition, setWordInfoPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const wasFinishedOnLoadRef = useRef<boolean | null>(null);

  // Animation values for button crossfade
  const actionButtonsOpacity = useRef(new Animated.Value(1)).current;
  const swapButtonsOpacity = useRef(new Animated.Value(0)).current;

  // Animation values for UI entry
  const uiEntryOpacity = useRef(new Animated.Value(0)).current;
  const uiEntryTranslate = useRef(new Animated.Value(20)).current;
  const hasAnimatedEntry = useRef(false);

  // Loading transition state - keep spinner visible until we're ready to show content
  const [isTransitioning, setIsTransitioning] = useState(true);

  const { data: apiGame, isLoading, error, refetch } = useGame(gameUlid);
  const setValidationResult = useGameStore((s) => s.setValidationResult);
  const revokeInvitation = useRevokeInvitation();
  const joinGame = useJoinGame();
  const acceptInvitation = useAcceptInvitation();
  const declineInvitation = useDeclineInvitation();

  // Redirect to game list if game can't be loaded
  useEffect(() => {
    if (!USE_MOCK_DATA && !isLoading && error) {
      clearLastGameUlid();
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    }
  }, [isLoading, error, clearLastGameUlid, router]);

  // Use mock data for UI testing
  const game = USE_MOCK_DATA ? { ...mockGame, ulid: gameUlid } : apiGame;

  // Connect to WebSocket for real-time updates (skip in mock mode)
  useWebSocket(USE_MOCK_DATA ? null : gameUlid);

  // Detect and recall tiles that conflict with opponent's played tiles
  useConflictingTilesRecall(game);

  // When game loads, trigger spinner fade out (which will then trigger content fade in)
  useEffect(() => {
    if (game && !hasAnimatedEntry.current) {
      hasAnimatedEntry.current = true;
      // Spinner will fade out, then onSpinnerFadeComplete triggers content fade in
      setIsTransitioning(false);
    }
  }, [game]);

  // Called when spinner fade out completes - now fade in the content
  const onSpinnerFadeComplete = useCallback(() => {
    Animated.parallel([
      Animated.timing(uiEntryOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(uiEntryTranslate, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [uiEntryOpacity, uiEntryTranslate]);

  // Get all game interaction handlers from the hook
  const {
    pendingTiles,
    isMyTurn,
    canPlay,
    isGameActive,
    errorMessage,
    isSubmitting,
    isSwapping,
    isSwapMode,
    selectedSwapIndices,
    swapCompleted,
    canSwap,
    handleRackTileDrop,
    handlePendingTileDrag,
    handleCellPress,
    handleRecall,
    handleMix,
    handlePlay,
    handlePass,
    handleSwap,
    handleResign,
    clearError,
    enterSwapMode,
    exitSwapMode,
    clearSwapSelection,
    dismissSwapResult,
    // Blank tile
    blankTileSelection,
    handleBlankTileDismiss,
    handleBlankTileLetterSelect,
    handleBlankTileTap,
  } = useGameInteractions({ game, gameUlid, userUlid });

  const confirmPass = () => {
    showConfirm(
      'Pass Turn',
      'Are you sure you want to pass your turn?',
      handlePass,
      'Pass',
      'destructive'
    );
  };

  const confirmResign = () => {
    showConfirm(
      'Resign Game',
      'Are you sure you want to resign? Your opponent will win the game.',
      handleResign,
      'Resign',
      'destructive'
    );
  };

  const handleRevokeInvitation = (invitationUlid: string) => {
    showConfirm(
      'Remove Invitation?',
      'You can invite someone else afterward.',
      () => {
        revokeInvitation.mutate(invitationUlid);
      },
      'Remove',
      'destructive'
    );
  };

  const [isJoining, setIsJoining] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  const handleJoinGame = async () => {
    setIsJoining(true);
    try {
      if (invitationUlid) {
        await acceptInvitation.mutateAsync(invitationUlid);
      } else {
        await joinGame.mutateAsync(gameUlid);
      }
      await refetch();
    } catch {
      // Error handled by mutation
      setIsJoining(false);
    }
  };

  const handleDeclineInvitation = async () => {
    if (!invitationUlid) return;
    setIsDeclining(true);
    try {
      await declineInvitation.mutateAsync(invitationUlid);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    } catch {
      // Error handled by mutation
      setIsDeclining(false);
    }
  };

  const confirmJoin = () => {
    showConfirm(
      'Join Game',
      'Are you sure you want to join this game?',
      handleJoinGame,
      'Join'
    );
  };

  const confirmDecline = () => {
    showConfirm(
      'Decline Invitation',
      'Are you sure you want to decline this invitation?',
      handleDeclineInvitation,
      'Decline',
      'destructive'
    );
  };

  const confirmPlay = () => {
    const words = validationResult?.words;
    const score = validationResult?.potential_score;
    if (!words?.length || !score) return;

    const wordList = words.map((w) => w.word.toUpperCase()).join(', ');
    showConfirm(
      'Play Word',
      `Are you sure you want to play ${wordList} for ${score} points?`,
      handlePlay,
      'Play'
    );
  };

  // Tile animation duration (spring animation takes roughly 250ms)
  const TILE_ANIMATION_DELAY = 250;

  // Start the exit animation for swap mode
  // First clears selected tiles (so they animate down), then fades out overlay
  const startSwapExit = () => {
    // If there are selected tiles (and not already completed), animate them down first
    if (selectedSwapIndices.length > 0 && !swapCompleted) {
      // Clear selections - this triggers the lift-down animation
      clearSwapSelection();
      // Wait for tile animation to complete, then fade out overlay
      setTimeout(() => {
        setIsSwapExiting(true);
      }, TILE_ANIMATION_DELAY);
    } else {
      // No tiles to animate or swap already completed, just fade out overlay
      setIsSwapExiting(true);
    }
  };

  // Called when exit animation completes
  const onSwapExitComplete = () => {
    setIsSwapExiting(false);
    if (swapCompleted) {
      dismissSwapResult();
    } else {
      exitSwapMode();
    }
  };

  // Animate button crossfade when entering/exiting swap mode
  useEffect(() => {
    if (isSwapMode && !isSwapExiting) {
      // Entering swap mode: fade out action buttons, fade in swap buttons
      Animated.parallel([
        Animated.timing(actionButtonsOpacity, {
          toValue: 0,
          duration: BUTTON_FADE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(swapButtonsOpacity, {
          toValue: 1,
          duration: BUTTON_FADE_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (isSwapExiting) {
      // Exiting swap mode: fade out swap buttons, fade in action buttons
      Animated.parallel([
        Animated.timing(swapButtonsOpacity, {
          toValue: 0,
          duration: BUTTON_FADE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(actionButtonsOpacity, {
          toValue: 1,
          duration: BUTTON_FADE_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (!isSwapMode) {
      // Reset to default state when not in swap mode
      actionButtonsOpacity.setValue(1);
      swapButtonsOpacity.setValue(0);
    }
  }, [isSwapMode, isSwapExiting, actionButtonsOpacity, swapButtonsOpacity]);

  // Track tile positions to detect when they change
  const tilePositionsKey = pendingTiles
    .map((t) => `${t.x},${t.y}`)
    .sort()
    .join('|');
  const prevTilePositionsRef = useRef(tilePositionsKey);

  // Clear validation immediately when tile positions change (before new validation arrives)
  // This prevents stale highlights from flashing on tiles that are no longer adjacent
  useEffect(() => {
    if (tilePositionsKey !== prevTilePositionsRef.current) {
      prevTilePositionsRef.current = tilePositionsKey;
      setValidationResult(null);
    }
  }, [tilePositionsKey, setValidationResult]);

  // Validate pending tiles on every change
  const { data: validationResult } = useValidation({
    gameUlid,
    tiles: pendingTiles,
  });

  // Fetch word info when a placed tile is tapped
  const { data: wordInfo, isLoading: isWordInfoLoading } = useWordInfo(
    {
      gameUlid,
      x: wordInfoPosition?.x ?? 0,
      y: wordInfoPosition?.y ?? 0,
    },
    wordInfoPosition !== null
  );

  // Handler for placed tile taps - don't show for pending tiles
  const handlePlacedTileTap = useCallback(
    (x: number, y: number) => {
      // Don't show for pending tiles (tiles being placed this turn)
      const isPendingTile = pendingTiles.some((t) => t.x === x && t.y === y);
      if (!isPendingTile) {
        setWordInfoPosition({ x, y });
      }
    },
    [pendingTiles]
  );

  // Update store with validation result
  // Only update when we have actual data (not during loading)
  // Clear validation only when all tiles are removed
  useEffect(() => {
    if (pendingTiles.length === 0) {
      setValidationResult(null);
    } else if (validationResult !== undefined) {
      setValidationResult(validationResult);
    }
  }, [validationResult, pendingTiles.length, setValidationResult]);

  // Get opponent info for rematch (needs to be before early returns)
  const opponent = apiGame?.players.find((p) => p.ulid !== userUlid);

  // Rematch functionality (must be called before conditional returns)
  const {
    createRematch,
    isCreating: isCreatingRematch,
    error: rematchError,
    clearError: clearRematchError,
  } = useRematch({
    game: apiGame,
    opponentUsername: opponent?.username,
  });

  // Show loading spinner while loading or transitioning
  const showSpinner = !USE_MOCK_DATA && (isLoading || isTransitioning);

  // Show error state
  if (!USE_MOCK_DATA && error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load game</Text>
          <Pressable
            onPress={() => refetch()}
            style={({ pressed }) => [
              styles.retryButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // At this point game might still be loading - we'll render content conditionally
  const gameData = game;

  // Get current player's free swap status (only if game is loaded)
  const currentPlayer = gameData?.players.find((p) => p.ulid === userUlid);
  const hasFreeSwap = currentPlayer?.hasFreeSwap ?? false;
  const canJoin = gameData?.canJoin ?? false;

  // Track if game was already finished when first loaded
  if (gameData && wasFinishedOnLoadRef.current === null) {
    wasFinishedOnLoadRef.current = gameData.status === 'finished';
  }

  // Game end detection - only show modal if game just ended (not already finished on load)
  const isGameFinished = gameData?.status === 'finished';

  // Show warning when it's the last move (determined by backend)
  // Don't show for already completed games
  const showLastMoveWarning =
    gameData?.isLastMove && !lastMoveWarningShown && !isGameFinished;
  const didWin = isGameFinished && gameData?.winnerUlid === userUlid;
  const gameJustEnded = isGameFinished && !wasFinishedOnLoadRef.current;
  const showGameEndModal = gameJustEnded && !gameEndModalDismissed;

  // Calculate final scores for game end modal
  // Unused?
  // const myScore = currentPlayer?.score ?? 0;
  // const opponentScore = opponent?.score ?? 0;

  // Show rematch modal after game end modal and achievements are dismissed
  const showRematchModal =
    gameJustEnded &&
    gameEndModalDismissed &&
    currentAchievement === null &&
    !rematchDismissed &&
    opponent !== undefined;

  // Debug: Log rematch conditions when game is finished
  if (isGameFinished) {
    console.log('[RematchDebug]', {
      isGameFinished,
      gameJustEnded,
      wasFinishedOnLoadRef: wasFinishedOnLoadRef.current,
      gameEndModalDismissed,
      currentAchievement: currentAchievement?.name ?? null,
      rematchDismissed,
      opponentDefined: opponent !== undefined,
      showRematchModal,
    });
  }

  const handleRematch = async () => {
    const newGameUlid = await createRematch();
    if (newGameUlid) {
      router.replace(ROUTES.GAME(newGameUlid));
    }
  };

  const handleRematchDismiss = () => {
    clearRematchError();
    setRematchDismissed(true);
  };

  return (
    <View style={styles.container}>
      {/* Game content - only render when game data is loaded */}
      {gameData && (
        <>
          {/* Board area - wrapped so overlay can cover just this section */}
          <View style={styles.boardSection}>
            <Animated.View
              style={{
                opacity: uiEntryOpacity,
                transform: [{ translateY: uiEntryTranslate }],
              }}
            >
              <ScoreBar
                game={gameData}
                currentUserUlid={userUlid}
                onInvite={() => setInviteModalVisible(true)}
                onRevokeInvitation={handleRevokeInvitation}
                tilesPlayed={pendingTiles.length}
              />
            </Animated.View>
            <View style={styles.boardWrapper}>
              <GameBoard
                game={gameData}
                onCellPress={handleCellPress}
                onPendingTileDrag={handlePendingTileDrag}
                onBlankTileTap={handleBlankTileTap}
                onPlacedTileTap={handlePlacedTileTap}
                isMyTurn={isMyTurn}
                potentialScore={validationResult?.potential_score}
              />
            </View>
            {/* Dark overlay for swap mode - only covers board section */}
            <SwapModeDarkOverlay
              visible={isSwapMode}
              isExiting={isSwapExiting}
              swapCompleted={swapCompleted}
              onExitComplete={onSwapExitComplete}
              hasFreeSwap={hasFreeSwap}
            />
          </View>
          {canJoin ? (
            <View style={styles.joinContainer}>
              <Text style={styles.joinText}>
                {invitationUlid
                  ? 'You have been invited to this game!'
                  : 'Join this game to start playing!'}
              </Text>
              <View style={styles.joinButtons}>
                {invitationUlid && (
                  <Button
                    label="Decline"
                    onPress={confirmDecline}
                    variant="outline"
                    loading={isDeclining}
                    disabled={isJoining}
                    rounded
                    style={styles.declineButton}
                  />
                )}
                <Button
                  label="Join Game"
                  onPress={confirmJoin}
                  loading={isJoining}
                  disabled={isDeclining}
                  rounded
                  style={styles.joinButton}
                />
              </View>
            </View>
          ) : (
            <>
              <Animated.View
                style={{
                  opacity: uiEntryOpacity,
                  transform: [{ translateY: uiEntryTranslate }],
                }}
              >
                <TileRack
                  tiles={gameData.myRack}
                  disabled={!isGameActive}
                  onTileDrop={handleRackTileDrop}
                />
              </Animated.View>
              {/* Button area with crossfade animation */}
              <Animated.View
                style={[
                  styles.buttonArea,
                  {
                    opacity: uiEntryOpacity,
                    transform: [{ translateY: uiEntryTranslate }],
                  },
                ]}
              >
                {/* Action buttons - always rendered, animated opacity */}
                <Animated.View
                  style={[
                    styles.buttonContainer,
                    { opacity: actionButtonsOpacity },
                  ]}
                  pointerEvents={isSwapMode ? 'none' : 'auto'}
                >
                  <ActionButtons
                    onRecall={handleRecall}
                    onMix={handleMix}
                    onPass={confirmPass}
                    onPlay={confirmPlay}
                    onSwap={canSwap ? enterSwapMode : undefined}
                    onResign={confirmResign}
                    canPlay={canPlay}
                    isLoading={isSubmitting}
                    disabled={!isGameActive}
                    isMyTurn={isMyTurn}
                    hasPendingTiles={pendingTiles.length > 0}
                  />
                </Animated.View>
                {/* Swap buttons - only rendered during swap mode, animated opacity */}
                {(isSwapMode || isSwapExiting) && (
                  <Animated.View
                    style={[
                      styles.buttonContainer,
                      styles.swapButtonContainer,
                      { opacity: swapButtonsOpacity },
                    ]}
                    pointerEvents={isSwapMode && !isSwapExiting ? 'auto' : 'none'}
                  >
                    <SwapModeButtons
                      selectedCount={selectedSwapIndices.length}
                      swapCompleted={swapCompleted}
                      onSwap={handleSwap}
                      onCancel={startSwapExit}
                      onDismiss={startSwapExit}
                      isLoading={isSwapping}
                    />
                  </Animated.View>
                )}
              </Animated.View>
            </>
          )}
          <FeedbackModal
            visible={errorMessage !== null}
            type="error"
            message={errorMessage ?? ''}
            onDismiss={clearError}
          />
          <FeedbackModal
            visible={showLastMoveWarning ?? false}
            type="warning"
            title="Last Move"
            message="This is your final move. The game will end after you play or pass."
            onDismiss={() => setLastMoveWarningShown(true)}
          />
          <FeedbackModal
            visible={showGameEndModal}
            type={didWin ? 'success' : 'lost'}
            title={didWin ? 'You Won!' : 'You Lost'}
            message={
              didWin
                ? 'Congratulations! You played a great game.'
                : 'Better luck next time!'
            }
            onDismiss={() => setGameEndModalDismissed(true)}
          />
          <InvitePlayerModal
            visible={inviteModalVisible}
            onClose={() => setInviteModalVisible(false)}
            gameUlid={gameUlid}
            onSuccess={() => {}}
          />
          <BlankTileModal
            visible={blankTileSelection !== null}
            onSelectLetter={handleBlankTileLetterSelect}
            onDismiss={handleBlankTileDismiss}
          />
          <WordInfoModal
            visible={wordInfoPosition !== null}
            onClose={() => setWordInfoPosition(null)}
            words={wordInfo}
            isLoading={isWordInfoLoading}
            language={gameData.language}
          />
          <AchievementModal
            visible={
              currentAchievement !== null &&
              !showGameEndModal &&
              !showLastMoveWarning
            }
            achievement={currentAchievement}
            onDismiss={dismissAchievement}
          />
          <RematchModal
            visible={showRematchModal}
            opponent={
              opponent
                ? {
                    username: opponent.username,
                    avatar: opponent.avatar,
                    avatarColor: opponent.avatarColor,
                  }
                : null
            }
            onRematch={handleRematch}
            onDismiss={handleRematchDismiss}
            isLoading={isCreatingRematch}
            error={rematchError}
          />
        </>
      )}
      {/* Loading spinner overlay - fades out when content is ready */}
      <LoadingView
        visible={showSpinner}
        onFadeOutComplete={onSpinnerFadeComplete}
      />
    </View>
  );
}

export default function GameScreen() {
  return (
    <DragDropProvider>
      <GameScreenContent />
    </DragDropProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: '100%',
    overflow: 'hidden',
  },
  boardSection: {
    flex: 1,
    position: 'relative',
  },
  boardWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: SPACING.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  retryText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  buttonArea: {
    position: 'relative',
  },
  buttonContainer: {
    width: '100%',
  },
  swapButtonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  joinContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.lg,
  },
  joinText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  joinButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  },
  declineButton: {
    flex: 1,
  },
  joinButton: {
    flex: 1,
  },
});
