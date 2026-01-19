import { useEffect, useRef, useCallback } from 'react';
import {
  useGameStore,
  usePendingTiles,
  useRackPermutation,
} from '../stores/gameStore';
import { useDragDrop } from '../context/DragDropContext';
import type { Game, PlacedTile } from '../types';

type BoardState = (PlacedTile | null)[][];

/**
 * Hook that detects when opponent plays tiles on positions where
 * the user has pending tiles, and animates those tiles back to the rack.
 */
export function useConflictingTilesRecall(game: Game | undefined) {
  const pendingTiles = usePendingTiles();
  const rackPermutation = useRackPermutation();
  const { startRecallAnimation } = useDragDrop();

  // Store previous board state to detect changes
  const prevBoardRef = useRef<BoardState | null>(null);

  // Remove specific tiles from pending (by their positions)
  const removeConflictingTiles = useCallback(
    (positions: { x: number; y: number }[]) => {
      const state = useGameStore.getState();
      const currentGameUlid = state.currentGameUlid;
      if (!currentGameUlid) return;

      const currentGameState = state.gameStates[currentGameUlid];
      if (!currentGameState) return;

      useGameStore.setState({
        gameStates: {
          ...state.gameStates,
          [currentGameUlid]: {
            ...currentGameState,
            pendingTiles: currentGameState.pendingTiles.filter(
              (t) => !positions.some((pos) => pos.x === t.x && pos.y === t.y)
            ),
          },
        },
      });
    },
    []
  );

  useEffect(() => {
    if (!game) return;

    const currentBoard = game.board;
    const prevBoard = prevBoardRef.current;

    // Skip on first render
    if (prevBoard === null) {
      prevBoardRef.current = currentBoard;
      return;
    }

    // Find positions that were empty before but now have tiles (opponent played)
    const newlyOccupiedPositions: { x: number; y: number }[] = [];

    for (let y = 0; y < currentBoard.length; y++) {
      const currentRow = currentBoard[y];
      const prevRow = prevBoard[y];
      if (!currentRow) continue;

      for (let x = 0; x < 15; x++) {
        const currentCell = currentRow[x];
        const prevCell = prevRow?.[x];

        // Position is now occupied but wasn't before
        if (currentCell && !prevCell) {
          newlyOccupiedPositions.push({ x, y });
        }
      }
    }

    // Find pending tiles that conflict with newly occupied positions
    const conflictingTiles = pendingTiles.filter((pending) =>
      newlyOccupiedPositions.some(
        (pos) => pos.x === pending.x && pos.y === pending.y
      )
    );

    if (conflictingTiles.length > 0) {
      // Prepare tiles for animation (need visualSlot for rack position)
      const tilesToRecall = conflictingTiles.map((t) => ({
        ...t,
        visualSlot: rackPermutation.indexOf(t.rackIndex),
      }));

      // Capture positions to remove for the callback closure
      const positionsToRemove = conflictingTiles.map((t) => ({
        x: t.x,
        y: t.y,
      }));

      // Animate tiles back to rack
      // onStart: Remove from state immediately after tiles hidden, so score/validation updates
      // onComplete: Animation done, nothing else to do
      startRecallAnimation(
        tilesToRecall,
        () => {
          removeConflictingTiles(positionsToRemove);
        },
        () => {
          // Animation complete
        }
      );
    }

    // Update ref with current board
    prevBoardRef.current = currentBoard;
  }, [
    game,
    pendingTiles,
    rackPermutation,
    startRecallAnimation,
    removeConflictingTiles,
  ]);
}
