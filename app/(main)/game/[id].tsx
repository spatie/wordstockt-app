import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGame } from '../../../src/api/queries/useGame';
import { useValidation } from '../../../src/api/queries/useValidation';
import { useWordInfo } from '../../../src/api/queries/useWordInfo';
import { useRevokeInvitation } from '../../../src/api/queries/useInvitations';
import { useJoinGame } from '../../../src/api/queries/useGames';
import { useAuthStore } from '../../../src/stores/authStore';
import { useGameStore } from '../../../src/stores/gameStore';
import { useNavigationStore } from '../../../src/stores/navigationStore';
import { useWebSocket } from '../../../src/hooks/useWebSocket';
import { useGameInteractions } from '../../../src/hooks/useGameInteractions';
import { useConflictingTilesRecall } from '../../../src/hooks/useConflictingTilesRecall';
import { DragDropProvider } from '../../../src/context/DragDropContext';
import { GameBoard } from '../../../src/components/game/GameBoard';
import { TileRack } from '../../../src/components/game/TileRack';
import { ActionButtons } from '../../../src/components/game/ActionButtons';
import { ScoreBar } from '../../../src/components/game/ScoreBar';
import {
  SwapModeDarkOverlay,
  SwapModeButtons,
} from '../../../src/components/game/SwapModeOverlay';
import { InvitePlayerModal } from '../../../src/components/game/InvitePlayerModal';
import { BlankTileModal } from '../../../src/components/game/BlankTileModal';
import { WordInfoModal } from '../../../src/components/game/WordInfoModal';
import { LoadingView } from '../../../src/components/ui/LoadingView';
import { FeedbackModal } from '../../../src/components/ui/FeedbackModal';
import { Button } from '../../../src/components/ui/Button';
import { useSnackbar } from '../../../src/components/ui/SnackbarProvider';
import { showConfirm } from '../../../src/utils/alerts';
import { colors } from '../../../src/config/theme';
import { SPACING, RADIUS } from '../../../src/config/constants';
import { ROUTES } from '../../../src/config/routes';
import { mockGame } from '../../../src/config/mockData';

// Removed BACK_DESTINATION - let AppHeader use router.back() for correct animation

// Set to true to use mock data for UI testing
const USE_MOCK_DATA = false;

const BUTTON_FADE_DURATION = 200;

function GameScreenContent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const gameUlid = id ?? '';
  const userUlid = useAuthStore((s) => s.user?.ulid) ?? '';
  const setLastGameUlid = useNavigationStore((s) => s.setLastGameUlid);
  const clearLastGameUlid = useNavigationStore((s) => s.clearLastGameUlid);
  const setCurrentlyViewedGameUlid = useNavigationStore(
    (s) => s.setCurrentlyViewedGameUlid
  );
  const { showSnackbar } = useSnackbar();
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
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [lastMoveWarningShown, setLastMoveWarningShown] = useState(false);
  const [gameEndModalDismissed, setGameEndModalDismissed] = useState(false);
  const [isSwapExiting, setIsSwapExiting] = useState(false);
  const [wordInfoPosition, setWordInfoPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const wasFinishedOnLoadRef = useRef<boolean | null>(null);

  // Animation values for button crossfade
  const actionButtonsOpacity = useRef(new Animated.Value(1)).current;
  const swapButtonsOpacity = useRef(new Animated.Value(0)).current;

  const { data: apiGame, isLoading, error, refetch } = useGame(gameUlid);
  const setValidationResult = useGameStore((s) => s.setValidationResult);
  const revokeInvitation = useRevokeInvitation();
  const joinGame = useJoinGame();

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

  // Get all game interaction handlers from the hook
  const {
    pendingTiles,
    isMyTurn,
    canPlay,
    isGameActive,
    errorMessage,
    isSubmitting,
    isPassing,
    isSwapping,
    isResigning,
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

  const handleJoinGame = async () => {
    try {
      await joinGame.mutateAsync(gameUlid);
      refetch();
    } catch {
      // Error handled by mutation
    }
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

  if (!USE_MOCK_DATA && isLoading) return <LoadingView />;
  if (!USE_MOCK_DATA && (error || !game)) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load game</Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // At this point game is always defined (either from API or mock)
  const gameData = game!;

  // Get current player's free swap status
  const currentPlayer = gameData.players.find((p) => p.ulid === userUlid);
  const hasFreeSwap = currentPlayer?.hasFreeSwap ?? false;
  const canJoin = gameData.canJoin;

  // Track if game was already finished when first loaded
  if (wasFinishedOnLoadRef.current === null) {
    wasFinishedOnLoadRef.current = gameData.status === 'finished';
  }

  // Show warning when it's the last move (determined by backend)
  const showLastMoveWarning = gameData.isLastMove && !lastMoveWarningShown;

  // Game end detection - only show modal if game just ended (not already finished on load)
  const isGameFinished = gameData.status === 'finished';
  const didWin = isGameFinished && gameData.winnerUlid === userUlid;
  const gameJustEnded = isGameFinished && !wasFinishedOnLoadRef.current;
  const showGameEndModal = gameJustEnded && !gameEndModalDismissed;

  return (
    <View style={styles.container}>
      {/* Board area - wrapped so overlay can cover just this section */}
      <View style={styles.boardSection}>
        <ScoreBar
          game={gameData}
          currentUserUlid={userUlid}
          onInvite={() => setInviteModalVisible(true)}
          onRevokeInvitation={handleRevokeInvitation}
        />
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
          <Text style={styles.joinText}>Join this game to start playing!</Text>
          <Button
            label="Join Game"
            onPress={handleJoinGame}
            loading={joinGame.isPending}
            fullWidth
            rounded
          />
        </View>
      ) : (
        <>
          <TileRack
            tiles={gameData.myRack}
            disabled={!isGameActive}
            onTileDrop={handleRackTileDrop}
          />
          {/* Button area with crossfade animation */}
          <View style={styles.buttonArea}>
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
          </View>
        </>
      )}
      <FeedbackModal
        visible={errorMessage !== null}
        type="error"
        message={errorMessage ?? ''}
        onDismiss={clearError}
      />
      <FeedbackModal
        visible={showLastMoveWarning}
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
        onSuccess={() => showSnackbar('Invitation sent!', 'success')}
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
    backgroundColor: colors.background,
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
});
