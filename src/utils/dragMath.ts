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
 * Get the CENTER of a board cell (in screen coordinates).
 * This is where the visual center of a tile should be when placed on this cell.
 */
export function getBoardCellCenter(
  cellX: number,
  cellY: number,
  layout: BoardLayout
): { x: number; y: number } {
  return {
    x: layout.x + (cellX + 0.5) * layout.cellSize,
    y: layout.y + (cellY + 0.5) * layout.cellSize,
  };
}

/**
 * Get the CENTER of a rack slot (in screen coordinates).
 * This is where the visual center of a tile should be in this slot.
 */
export function getRackSlotCenter(
  slotIndex: number,
  layout: RackLayout
): { x: number; y: number } {
  // Slot width includes gap. Tile width within slot is (slotWidth - GAP).
  // Tile center within slot = slotWidth/2 - GAP/2 = (slotWidth - GAP) / 2
  const slotStartX = layout.x + slotIndex * layout.slotWidth;
  const tileCenterInSlot = (layout.slotWidth - GAP) / 2;
  return {
    x: slotStartX + tileCenterInSlot,
    y: layout.y + layout.height / 2,
  };
}

/**
 * @deprecated Use getBoardCellCenter instead
 */
export function getBoardCellPosition(
  cellX: number,
  cellY: number,
  layout: BoardLayout
): { x: number; y: number } {
  const center = getBoardCellCenter(cellX, cellY, layout);
  return {
    x: center.x - TILE_SIZE / 2,
    y: center.y - TILE_SIZE / 2,
  };
}

/**
 * @deprecated Use getRackSlotCenter instead
 */
export function getRackSlotPosition(
  slotIndex: number,
  layout: RackLayout
): { x: number; y: number } {
  const center = getRackSlotCenter(slotIndex, layout);
  return {
    x: center.x - TILE_SIZE / 2,
    y: center.y - TILE_SIZE / 2,
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
