import { useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import {
  useSubmitMove,
  usePassTurn,
  useSwapTiles,
  useResignGame,
} from '../api/queries/useGame';
import { useApiError } from './useApiError';
import { isTimeoutError } from '../api/client';
import type { PendingTile, Tile } from '../types';
import { haptics } from '../utils/haptics';
import { getValidationDraftKey } from '../utils/validationKey';

interface UseGameActionsOptions {
  gameUlid: string;
  pendingTiles: PendingTile[];
  canPlay: boolean;
  myRack: Tile[];
}

interface PlayResult {
  success: boolean;
  score?: number;
  words?: string;
}

const EMPTY_INDICES: number[] = [];

/**
 * Hook for game actions like submitting moves and passing turns.
 * Includes centralized error handling.
 */
export function useGameActions({
  gameUlid,
  pendingTiles,
  canPlay,
  myRack,
}: UseGameActionsOptions) {
  const clearPendingTiles = useGameStore((s) => s.clearPendingTiles);
  const swapPhase = useGameStore((s) => s.swapPhase);
  const selectedSwapIndices =
    swapPhase.kind === 'selecting' ? swapPhase.indices : EMPTY_INDICES;
  const completeSwap = useGameStore((s) => s.completeSwap);
  const submitMove = useSubmitMove();
  const passTurn = usePassTurn();
  const swapTiles = useSwapTiles();
  const resignGame = useResignGame();
  const { errorMessage, setError, setErrorMessage, clearError } = useApiError();

  // Submit the current move
  const handlePlay = useCallback(async (): Promise<PlayResult> => {
    if (!canPlay) return { success: false };

    try {
      const result = await submitMove.mutateAsync({
        gameUlid,
        tiles: pendingTiles,
      });
      clearPendingTiles(gameUlid, getValidationDraftKey(pendingTiles));
      haptics.success();
      const words = result.move.words?.join(', ') ?? '';
      return {
        success: true,
        score: result.move.score,
        words,
      };
    } catch (err) {
      haptics.error();
      if (isTimeoutError(err)) {
        setErrorMessage(
          "Your move couldn't be submitted right now. Please check your connection and try again."
        );
      } else {
        setError(err);
      }
      return { success: false };
    }
  }, [
    gameUlid,
    pendingTiles,
    canPlay,
    submitMove,
    clearPendingTiles,
    setError,
    setErrorMessage,
  ]);

  // Pass the current turn
  const handlePass = useCallback(async () => {
    try {
      await passTurn.mutateAsync(gameUlid);
      clearPendingTiles(gameUlid, getValidationDraftKey(pendingTiles));
    } catch (err) {
      setError(err);
    }
  }, [gameUlid, pendingTiles, passTurn, clearPendingTiles, setError]);

  // Swap selected tiles
  const handleSwap = useCallback(async () => {
    if (selectedSwapIndices.length === 0) return;

    try {
      // Get the tiles to swap from the rack
      const tilesToSwap = selectedSwapIndices
        .map((idx) => myRack[idx])
        .filter((t): t is Tile => t !== undefined)
        .map((t) => ({ letter: t.letter, points: t.points }));

      await swapTiles.mutateAsync({
        gameUlid,
        tiles: tilesToSwap,
      });

      // Mark swap as completed (will show "Ok" button and trigger animations)
      completeSwap(gameUlid, selectedSwapIndices);
      haptics.success();
      clearPendingTiles(gameUlid, getValidationDraftKey(pendingTiles));
    } catch (err) {
      setError(err);
    }
  }, [
    gameUlid,
    selectedSwapIndices,
    pendingTiles,
    myRack,
    swapTiles,
    completeSwap,
    clearPendingTiles,
    setError,
  ]);

  // Resign from the game
  const handleResign = useCallback(async () => {
    try {
      await resignGame.mutateAsync(gameUlid);
      clearPendingTiles(gameUlid, getValidationDraftKey(pendingTiles));
    } catch (err) {
      setError(err);
    }
  }, [gameUlid, pendingTiles, resignGame, clearPendingTiles, setError]);

  return {
    handlePlay,
    handlePass,
    handleSwap,
    handleResign,
    errorMessage,
    clearError,
    isSubmitting: submitMove.isPending,
    isPassing: passTurn.isPending,
    isSwapping: swapTiles.isPending,
    isResigning: resignGame.isPending,
  };
}
