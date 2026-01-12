import { useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import type { Game, PendingTile } from '../types';
import type { DropTarget } from '../context/DragDropContext';

interface UseTilePlacementOptions {
  game: Game | undefined;
  pendingTiles: PendingTile[];
}

/**
 * Hook for tile placement and movement logic on the game board.
 * Handles dropping tiles from rack to board, moving tiles between cells,
 * and removing tiles from the board.
 */
export function useTilePlacement({
  game,
  pendingTiles,
}: UseTilePlacementOptions) {
  const placeTile = useGameStore((s) => s.placeTile);
  const moveTile = useGameStore((s) => s.moveTile);
  const removeTile = useGameStore((s) => s.removeTile);
  const swapByActualIndex = useGameStore((s) => s.swapByActualIndex);
  const startBlankTileSelection = useGameStore(
    (s) => s.startBlankTileSelection
  );

  // Check if a board position is available (not occupied by placed or pending tile)
  const isBoardPositionAvailable = useCallback(
    (x: number, y: number) => {
      if (!game) return false;
      const row = game.board[y];
      if (row?.[x]) return false;
      return !pendingTiles.some((t) => t.x === x && t.y === y);
    },
    [game, pendingTiles]
  );

  // Handle drag from rack ending - returns true if placement succeeded
  const handleRackTileDrop = useCallback(
    (
      visualSlot: number,
      actualRackIndex: number,
      target: DropTarget
    ): boolean => {
      if (!game || game.status !== 'active') return false;
      if (!target) return false;

      if (target.type === 'board') {
        if (!isBoardPositionAvailable(target.x, target.y)) return false;

        const tile = game.myRack[actualRackIndex];
        if (tile) {
          // Place the tile first
          placeTile(tile, target.x, target.y, actualRackIndex);

          // If it's a blank tile (letter is '*'), open the letter selection modal
          if (tile.isBlank && tile.letter === '*') {
            startBlankTileSelection(actualRackIndex, target.x, target.y);
          }
          return true;
        }
        return false;
      } else if (target.type === 'rack') {
        // Use actualRackIndex (stable) to swap with target visual slot
        // This is more reliable than using visualSlot which can become stale
        swapByActualIndex(actualRackIndex, target.slotIndex);
        return true;
      }
      return false;
    },
    [
      game,
      isBoardPositionAvailable,
      placeTile,
      swapByActualIndex,
      startBlankTileSelection,
    ]
  );

  // Handle drag from board (pending tile) ending
  const handlePendingTileDrag = useCallback(
    (fromX: number, fromY: number, target: DropTarget) => {
      if (!game || game.status !== 'active') return;

      // No target (dropped in empty area) or rack target = return tile to rack
      if (!target || target.type === 'rack') {
        removeTile(fromX, fromY);
        return;
      }

      if (target.type === 'board') {
        if (target.x === fromX && target.y === fromY) return;
        if (!isBoardPositionAvailable(target.x, target.y)) return;

        moveTile(fromX, fromY, target.x, target.y);
      }
    },
    [game, isBoardPositionAvailable, moveTile, removeTile]
  );

  // Handle clicking on a cell (removes pending tile if present)
  const handleCellPress = useCallback(
    (x: number, y: number) => {
      if (!game || game.status !== 'active') return;

      const existing = pendingTiles.find((t) => t.x === x && t.y === y);
      if (existing) {
        removeTile(x, y);
      }
    },
    [game, pendingTiles, removeTile]
  );

  return {
    isBoardPositionAvailable,
    handleRackTileDrop,
    handlePendingTileDrag,
    handleCellPress,
  };
}
