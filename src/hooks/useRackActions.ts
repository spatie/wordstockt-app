import { useCallback } from 'react';
import { useGameStore, useRackPermutation } from '../stores/gameStore';
import { useDragDrop } from '../context/DragDropContext';
import type { Game, PendingTile } from '../types';

interface UseRackActionsOptions {
  game: Game | undefined;
  pendingTiles: PendingTile[];
}

/**
 * Hook for rack-related actions like recall and shuffle.
 */
export function useRackActions({ game, pendingTiles }: UseRackActionsOptions) {
  const rackPermutation = useRackPermutation();
  const recallAllTiles = useGameStore((s) => s.recallAllTiles);
  const shuffleRack = useGameStore((s) => s.shuffleRack);
  const { startRecallAnimation } = useDragDrop();

  // Recall all pending tiles back to rack with animation
  const handleRecall = useCallback(() => {
    console.log(
      '[useRackActions] handleRecall called, pendingTiles:',
      pendingTiles.length
    );
    if (pendingTiles.length > 0) {
      const tilesToRecall = pendingTiles.map((t) => ({
        ...t,
        visualSlot: rackPermutation.indexOf(t.rackIndex),
      }));
      // Start animation first - it will hide tiles via recallingBoardPositions/recallingRackIndices
      // Clear state only when animation completes
      startRecallAnimation(tilesToRecall, () => {
        console.log('[useRackActions] onComplete callback fired');
        recallAllTiles();
      });
    }
  }, [pendingTiles, rackPermutation, recallAllTiles, startRecallAnimation]);

  // Shuffle available tiles in rack
  const handleMix = useCallback(() => {
    if (!game) return;
    const filledIndices = game.myRack
      .map((tile, index) =>
        tile && tile.letter && !pendingTiles.some((p) => p.rackIndex === index)
          ? index
          : -1
      )
      .filter((idx) => idx !== -1);
    shuffleRack(filledIndices);
  }, [game, pendingTiles, shuffleRack]);

  return {
    handleRecall,
    handleMix,
  };
}
