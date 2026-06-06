import { useCallback } from 'react';
import {
  useGameStore,
  usePendingTiles,
  useValidationResult,
} from '../stores/gameStore';
import { useTilePlacement } from './useTilePlacement';
import { useRackActions } from './useRackActions';
import { useGameActions } from './useGameActions';
import type { Game } from '../types';

interface UseGameInteractionsOptions {
  game: Game | undefined;
  gameUlid: string;
  userUlid: string;
}

/**
 * Orchestrator hook that composes tile placement, rack actions, and game actions.
 * Provides a unified interface for all game board interactions.
 */
export function useGameInteractions({
  game,
  gameUlid,
  userUlid,
}: UseGameInteractionsOptions) {
  const pendingTiles = usePendingTiles();
  const validationResult = useValidationResult();
  const isSwapMode = useGameStore((s) => s.isSwapMode);
  const selectedSwapIndices = useGameStore((s) => s.selectedSwapIndices);
  const swapCompleted = useGameStore((s) => s.swapCompleted);
  const enterSwapMode = useGameStore((s) => s.enterSwapMode);
  const exitSwapMode = useGameStore((s) => s.exitSwapMode);
  const clearSwapSelection = useGameStore((s) => s.clearSwapSelection);
  const dismissSwapResult = useGameStore((s) => s.dismissSwapResult);
  // Blank tile state
  const blankTileSelection = useGameStore((s) => s.blankTileSelection);
  const startBlankTileSelection = useGameStore(
    (s) => s.startBlankTileSelection
  );
  const cancelBlankTileSelection = useGameStore(
    (s) => s.cancelBlankTileSelection
  );
  const confirmBlankTileLetter = useGameStore((s) => s.confirmBlankTileLetter);
  const removeTile = useGameStore((s) => s.removeTile);

  // Derived state
  const isMyTurn = game?.currentTurnUserUlid === userUlid;
  const allWordsValid = validationResult?.words?.every((w) => w.valid) ?? false;
  const canPlay =
    isMyTurn &&
    pendingTiles.length > 0 &&
    game?.status === 'active' &&
    validationResult?.placement_valid === true &&
    allWordsValid;
  const isGameActive = game?.status === 'active';
  // Can swap when it's your turn and there are enough tiles in the bag
  const canSwap = isMyTurn && isGameActive && (game?.tilesRemaining ?? 0) >= 7;

  // Compose focused hooks
  const tilePlacement = useTilePlacement({ game, pendingTiles });
  const rackActions = useRackActions({ game, pendingTiles });
  const gameActions = useGameActions({
    gameUlid,
    pendingTiles,
    canPlay,
    myRack: game?.myRack ?? [],
  });

  // Handle blank tile modal dismiss - remove the tile from the board
  const handleBlankTileDismiss = useCallback(() => {
    if (blankTileSelection) {
      removeTile(blankTileSelection.x, blankTileSelection.y);
    }
    cancelBlankTileSelection();
  }, [blankTileSelection, removeTile, cancelBlankTileSelection]);

  // Handle blank tile letter selection
  const handleBlankTileLetterSelect = useCallback(
    (letter: string) => {
      confirmBlankTileLetter(letter);
    },
    [confirmBlankTileLetter]
  );

  // Handle tap on pending blank tile to change its letter
  const handleBlankTileTap = useCallback(
    (x: number, y: number) => {
      const pendingTile = pendingTiles.find((t) => t.x === x && t.y === y);
      if (pendingTile?.isBlank) {
        startBlankTileSelection(pendingTile.rackIndex, x, y);
      }
    },
    [pendingTiles, startBlankTileSelection]
  );

  return {
    // State
    pendingTiles,
    isMyTurn,
    canPlay,
    isGameActive,
    errorMessage: gameActions.errorMessage,
    isSubmitting: gameActions.isSubmitting,
    isPassing: gameActions.isPassing,
    isSwapping: gameActions.isSwapping,
    isResigning: gameActions.isResigning,

    // Swap mode state
    isSwapMode,
    selectedSwapIndices,
    swapCompleted,
    canSwap,

    // Tile placement actions
    handleRackTileDrop: tilePlacement.handleRackTileDrop,
    handlePendingTileDrag: tilePlacement.handlePendingTileDrag,
    handleCellPress: tilePlacement.handleCellPress,

    // Rack actions
    handleRecall: rackActions.handleRecall,
    handleMix: rackActions.handleMix,

    // Game actions
    handlePlay: gameActions.handlePlay,
    handlePass: gameActions.handlePass,
    handleSwap: gameActions.handleSwap,
    handleResign: gameActions.handleResign,
    clearError: gameActions.clearError,

    // Swap mode actions
    enterSwapMode,
    exitSwapMode,
    clearSwapSelection,
    dismissSwapResult,

    // Blank tile actions
    blankTileSelection,
    handleBlankTileDismiss,
    handleBlankTileLetterSelect,
    handleBlankTileTap,
  };
}
