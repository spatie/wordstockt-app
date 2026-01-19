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

  // FIX (Jan 2026): Added tolerance for edge cases on real devices.
  //
  // PROBLEM: On real devices, drops very close to board edges would sometimes
  // fail to detect a valid cell due to floating point precision issues and
  // slight timing differences in layout measurements between simulator and device.
  //
  // SOLUTION: Allow a small 2px tolerance outside the strict bounds, then clamp
  // coordinates to valid range before calculating the cell.
  const tolerance = 2;
  if (
    relX < -tolerance ||
    relY < -tolerance ||
    relX > layout.width + tolerance ||
    relY > layout.height + tolerance
  ) {
    return null;
  }

  // Clamp to valid range before calculating cell
  const clampedX = Math.max(0, Math.min(relX, layout.width - 0.001));
  const clampedY = Math.max(0, Math.min(relY, layout.height - 0.001));

  const cellX = Math.floor(clampedX / layout.cellSize);
  const cellY = Math.floor(clampedY / layout.cellSize);

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
