import { useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
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
  const recallAllTiles = useGameStore((s) => s.recallAllTiles);
  const { startRecallAnimation, rackPermutationShared, setRackPermutation } =
    useDragDrop();

  // Recall all pending tiles back to rack with animation
  const handleRecall = useCallback(() => {
    if (pendingTiles.length > 0) {
      const currentPerm = rackPermutationShared.value;
      const tilesToRecall = pendingTiles.map((t) => ({
        ...t,
        visualSlot: currentPerm.indexOf(t.rackIndex),
      }));
      // Start animation - onStart clears game state after shared values hide tiles
      startRecallAnimation(
        tilesToRecall,
        () => {
          // Called immediately after shared values hide tiles on UI thread
          // Clear game state so score bubble and tile colors update immediately
          recallAllTiles();
        },
        () => {
          // Animation complete - nothing else to do, state already cleared
        }
      );
    }
  }, [
    pendingTiles,
    rackPermutationShared,
    recallAllTiles,
    startRecallAnimation,
  ]);

  // Shuffle available tiles in rack
  // Updates shared value for instant animation, syncs to Zustand for persistence
  const handleMix = useCallback(() => {
    if (!game) return;

    // Get current permutation from shared value
    const currentPerm = [...rackPermutationShared.value];

    // Determine which indices have tiles in rack (not on board)
    const filledIndices = game.myRack
      .map((tile, index) =>
        tile && tile.letter && !pendingTiles.some((p) => p.rackIndex === index)
          ? index
          : -1
      )
      .filter((idx) => idx !== -1);

    if (filledIndices.length <= 1) return; // Nothing to shuffle

    // Fisher-Yates shuffle only the filled positions
    const shuffled = [...filledIndices];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }

    // Build new permutation: shuffled filled indices first, then empty positions
    const emptyIndices = currentPerm.filter(
      (idx) => !filledIndices.includes(idx)
    );
    const newPerm = [...shuffled, ...emptyIndices];

    // Update shared value for instant animation, sync to Zustand for persistence
    setRackPermutation(newPerm);
  }, [game, pendingTiles, rackPermutationShared, setRackPermutation]);

  return {
    handleRecall,
    handleMix,
  };
}
