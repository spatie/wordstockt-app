import type { Game, PendingTile } from '../types';

// Include every tile property sent to validation, plus its rack identity so a
// different local tile cannot inherit an earlier tile's validation.
export function getValidationDraftKey(tiles: PendingTile[]): string {
  return JSON.stringify(
    tiles
      .map((tile) => [
        tile.x,
        tile.y,
        tile.letter,
        tile.points,
        tile.isBlank,
        tile.rackIndex,
      ])
      .sort(
        (a, b) => Number(a[1]) - Number(b[1]) || Number(a[0]) - Number(b[0])
      )
  );
}

export function getValidationBoardKey(
  board: Game['board'] | undefined
): string {
  return board ? JSON.stringify(board) : '';
}
