import { useEffect, useRef } from 'react';
import {
  useGameStore,
  usePendingTiles,
  useRackPermutation,
} from '../stores/gameStore';
import { useDragDrop } from '../context/DragDropContext';
import type { Game } from '../types';

/** Recall pending tiles whenever the current board already occupies their cells. */
export function useConflictingTilesRecall(game: Game | undefined) {
  const currentGameUlid = useGameStore((state) => state.currentGameUlid);
  const removePendingTiles = useGameStore((state) => state.removePendingTiles);
  const pendingTiles = usePendingTiles();
  const rackPermutation = useRackPermutation();
  const { startRecallAnimation } = useDragDrop();
  const inFlight = useRef(new Set<string>());
  const board = game?.board;
  const gameUlid = game?.ulid;

  useEffect(() => {
    if (!board || !gameUlid || currentGameUlid !== gameUlid) return;

    const conflictingTiles = pendingTiles.filter((tile) => {
      const key = `${gameUlid}:${tile.x},${tile.y},${tile.rackIndex}`;
      return Boolean(board[tile.y]?.[tile.x]) && !inFlight.current.has(key);
    });
    if (conflictingTiles.length === 0) return;

    const keys = conflictingTiles.map(
      (tile) => `${gameUlid}:${tile.x},${tile.y},${tile.rackIndex}`
    );
    keys.forEach((key) => inFlight.current.add(key));

    startRecallAnimation(
      conflictingTiles.map((tile) => ({
        ...tile,
        visualSlot: rackPermutation.indexOf(tile.rackIndex),
      })),
      () => removePendingTiles(gameUlid, conflictingTiles),
      () => keys.forEach((key) => inFlight.current.delete(key))
    );
  }, [
    board,
    gameUlid,
    currentGameUlid,
    pendingTiles,
    rackPermutation,
    startRecallAnimation,
    removePendingTiles,
  ]);
}
