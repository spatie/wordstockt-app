import { useCallback, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import type { Game, PendingTile } from '../types';
import type { DropTarget } from '../context/DragDropContext';

// Global placement counter for debugging
let placementCounter = 0;

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
      const placementId = ++placementCounter;
      const timestamp = Date.now();

      // Debug logging for placement failures
      const debugFail = (reason: string) => {
        console.warn(
          `[TilePlacement #${placementId}] [${timestamp}] FAILED:`,
          reason,
          {
            visualSlot,
            actualRackIndex,
            target,
            gameStatus: game?.status,
            rackTile: game?.myRack[actualRackIndex],
            pendingTilesCount: pendingTiles.length,
            pendingTilePositions: pendingTiles.map(
              (t) => `${t.letter}@${t.x},${t.y}`
            ),
          }
        );
        return false;
      };

      console.warn(
        `[TilePlacement #${placementId}] [${timestamp}] handleRackTileDrop START`,
        {
          visualSlot,
          actualRackIndex,
          target,
          gameStatus: game?.status,
          pendingTilesBefore: pendingTiles.map(
            (t) => `${t.letter}@${t.x},${t.y}`
          ),
        }
      );

      if (!game || game.status !== 'active') {
        return debugFail(`game inactive: ${game?.status}`);
      }
      if (!target) {
        return debugFail('no target');
      }

      if (target.type === 'board') {
        const boardCell = game.board[target.y]?.[target.x];
        const pendingAtCell = pendingTiles.find(
          (t) => t.x === target.x && t.y === target.y
        );
        if (!isBoardPositionAvailable(target.x, target.y)) {
          return debugFail(
            `position occupied: boardCell=${!!boardCell}, pendingAtCell=${!!pendingAtCell}`
          );
        }

        const tile = game.myRack[actualRackIndex];
        if (tile) {
          console.warn(
            `[TilePlacement #${placementId}] [${Date.now()}] About to call placeTile`,
            {
              letter: tile.letter,
              x: target.x,
              y: target.y,
              rackIndex: actualRackIndex,
            }
          );

          // Place the tile first
          placeTile(tile, target.x, target.y, actualRackIndex);

          // Verify the placement by checking store immediately
          const storeState = useGameStore.getState();
          const gameState = storeState.currentGameUlid
            ? storeState.gameStates[storeState.currentGameUlid]
            : null;
          console.warn(
            `[TilePlacement #${placementId}] [${Date.now()}] After placeTile, store state:`,
            {
              pendingTilesCount: gameState?.pendingTiles.length,
              pendingTiles: gameState?.pendingTiles.map(
                (t) => `${t.letter}@${t.x},${t.y}`
              ),
              hasOurTile: gameState?.pendingTiles.some(
                (t) => t.x === target.x && t.y === target.y
              ),
            }
          );

          // If it's a blank tile (letter is '*'), open the letter selection modal
          if (tile.isBlank && tile.letter === '*') {
            startBlankTileSelection(actualRackIndex, target.x, target.y);
          }
          console.warn(
            `[TilePlacement #${placementId}] [${Date.now()}] SUCCESS - returning true`,
            {
              cell: `${target.x},${target.y}`,
              tile: tile.letter,
              rackIndex: actualRackIndex,
            }
          );
          return true;
        }
        return debugFail(`no tile at rackIndex ${actualRackIndex}`);
      } else if (target.type === 'rack') {
        // Use actualRackIndex (stable) to swap with target visual slot
        // This is more reliable than using visualSlot which can become stale
        console.warn(
          `[TilePlacement #${placementId}] [${Date.now()}] Rack-to-rack swap`
        );
        swapByActualIndex(actualRackIndex, target.slotIndex);
        return true;
      }
      return debugFail('unknown target type');
    },
    [
      game,
      pendingTiles,
      isBoardPositionAvailable,
      placeTile,
      swapByActualIndex,
      startBlankTileSelection,
    ]
  );

  // Handle drag from board (pending tile) ending
  const handlePendingTileDrag = useCallback(
    (fromX: number, fromY: number, target: DropTarget) => {
      const timestamp = Date.now();
      console.warn(
        `[TilePlacement] [${timestamp}] handlePendingTileDrag called`,
        {
          fromX,
          fromY,
          target,
          gameStatus: game?.status,
        }
      );

      if (!game || game.status !== 'active') {
        console.warn(
          `[TilePlacement] [${timestamp}] handlePendingTileDrag - game inactive, ignoring`
        );
        return;
      }

      // No target (dropped in empty area) or rack target = return tile to rack
      if (!target || target.type === 'rack') {
        console.warn(
          `[TilePlacement] [${timestamp}] handlePendingTileDrag - returning to rack (no target or rack target)`
        );
        removeTile(fromX, fromY);
        return;
      }

      if (target.type === 'board') {
        if (target.x === fromX && target.y === fromY) {
          console.warn(
            `[TilePlacement] [${timestamp}] handlePendingTileDrag - same position, ignoring`
          );
          return;
        }
        if (!isBoardPositionAvailable(target.x, target.y)) {
          console.warn(
            `[TilePlacement] [${timestamp}] handlePendingTileDrag - target occupied, ignoring`
          );
          return;
        }

        console.warn(
          `[TilePlacement] [${timestamp}] handlePendingTileDrag - moving tile`
        );
        moveTile(fromX, fromY, target.x, target.y);
      }
    },
    [game, isBoardPositionAvailable, moveTile, removeTile]
  );

  // Handle clicking on a cell (removes pending tile if present)
  const handleCellPress = useCallback(
    (x: number, y: number) => {
      const timestamp = Date.now();
      console.warn(`[TilePlacement] [${timestamp}] handleCellPress called`, {
        x,
        y,
        gameStatus: game?.status,
      });

      if (!game || game.status !== 'active') {
        console.warn(
          `[TilePlacement] [${timestamp}] handleCellPress - game inactive, ignoring`
        );
        return;
      }

      const existing = pendingTiles.find((t) => t.x === x && t.y === y);
      if (existing) {
        console.warn(
          `[TilePlacement] [${timestamp}] handleCellPress - removing tile at ${x},${y}`
        );
        removeTile(x, y);
      } else {
        console.warn(
          `[TilePlacement] [${timestamp}] handleCellPress - no pending tile at ${x},${y}`
        );
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
