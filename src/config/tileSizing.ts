import { TILE_SIZE } from './constants';

// Tile sizing multipliers (relative to effective cell size)
const LETTER_SIZE_RATIO = 0.65;
const POINTS_SIZE_RATIO = 0.38;

// Border overhead for board cells with hairline borders
const BOARD_BORDER_OVERHEAD = 0.5;

// Tile uses 99% of its container
export const TILE_CONTENT_RATIO = 0.99;

/**
 * Calculate font sizes for tiles based on the cell size.
 * Accounts for border overhead on smaller board cells.
 */
export function calculateTileFontSizes(cellSize: number) {
  // For small board cells (< 50px), subtract hairline border overhead
  // Rack tiles (TILE_SIZE = 52) don't have this overhead
  const effectiveCellSize =
    cellSize < 50 ? cellSize - BOARD_BORDER_OVERHEAD : cellSize;

  return {
    letterSize: Math.round(effectiveCellSize * LETTER_SIZE_RATIO),
    pointsSize: Math.round(effectiveCellSize * POINTS_SIZE_RATIO),
  };
}

/**
 * Calculate the inner tile size (after 99% scaling)
 */
export function calculateTileInnerSize(cellSize: number) {
  return cellSize * TILE_CONTENT_RATIO;
}

// Pre-calculated sizes for floating tiles (using TILE_SIZE)
export const FLOATING_TILE_SIZES = calculateTileFontSizes(TILE_SIZE);
export const FLOATING_TILE_INNER_SIZE = calculateTileInnerSize(TILE_SIZE);
