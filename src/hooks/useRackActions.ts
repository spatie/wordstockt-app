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
    const timestamp = Date.now();
    console.warn(
      `[useRackActions] [${timestamp}] handleRecall called, pendingTiles:`,
      pendingTiles.length,
      pendingTiles.map((t) => `${t.letter}@${t.x},${t.y}`)
    );
    if (pendingTiles.length > 0) {
      const tilesToRecall = pendingTiles.map((t) => ({
        ...t,
        visualSlot: rackPermutation.indexOf(t.rackIndex),
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
