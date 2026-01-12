import { TILE_SIZE, BOARD_SIZE, GAP } from '../config/constants';

export interface BoardLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  cellSize: number;
}

export interface RackLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  slotWidth: number;
  slotCount: number;
}

/**
 * Calculate top-left position for a tile centered in a board cell
 * Board cells have 1px padding, so content area is (cellSize - 2)
 * We position the floating tile so its center aligns with the cell content center
 */
export function getBoardCellPosition(
  cellX: number,
  cellY: number,
  layout: BoardLayout
): { x: number; y: number } {
  // Cell content starts at 1px offset due to padding
  // Content center is at: cellStart + 1 + (cellSize - 2) / 2 = cellStart + cellSize/2
  // Which equals: layout.x + (cellX + 0.5) * cellSize (padding cancels out)
  // For the floating tile center to be at cell center:
  // translateX + TILE_SIZE/2 = cellCenterX
  // translateX = cellCenterX - TILE_SIZE/2
  const cellCenterX = layout.x + (cellX + 0.5) * layout.cellSize;
  const cellCenterY = layout.y + (cellY + 0.5) * layout.cellSize;
  return {
    x: cellCenterX - TILE_SIZE / 2,
    y: cellCenterY - TILE_SIZE / 2,
  };
}

/**
 * Calculate top-left position for a tile centered in a rack slot
 */
export function getRackSlotPosition(
  slotIndex: number,
  layout: RackLayout
): { x: number; y: number } {
  return {
    x:
      layout.x +
      slotIndex * layout.slotWidth +
      (layout.slotWidth - GAP) / 2 -
      TILE_SIZE / 2,
    y: layout.y + (layout.height - TILE_SIZE) / 2,
  };
}

/**
 * Get board cell coordinates from page position
 */
export function getBoardCellFromPosition(
  pageX: number,
  pageY: number,
  layout: BoardLayout
): { x: number; y: number } | null {
  const relX = pageX - layout.x;
  const relY = pageY - layout.y;

  if (relX < 0 || relY < 0 || relX > layout.width || relY > layout.height) {
    return null;
  }

  const cellX = Math.floor(relX / layout.cellSize);
  const cellY = Math.floor(relY / layout.cellSize);

  if (cellX < 0 || cellX >= BOARD_SIZE || cellY < 0 || cellY >= BOARD_SIZE) {
    return null;
  }

  return { x: cellX, y: cellY };
}

/**
 * Get rack slot index from page position
 */
export function getRackSlotFromPosition(
  pageX: number,
  pageY: number,
  layout: RackLayout
): number | null {
  const relX = pageX - layout.x;
  const relY = pageY - layout.y;

  if (relX < 0 || relY < 0 || relX > layout.width || relY > layout.height) {
    return null;
  }

  const slotIndex = Math.floor(relX / layout.slotWidth);

  if (slotIndex < 0 || slotIndex >= layout.slotCount) {
    return null;
  }

  return slotIndex;
}
