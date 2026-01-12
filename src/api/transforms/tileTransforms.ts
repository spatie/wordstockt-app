import type { Tile, PlacedTile, PendingTile } from '../../types';

/**
 * API tile format uses snake_case (is_blank).
 * App tile format uses camelCase (isBlank).
 */
export interface ApiTile {
  letter: string;
  points: number;
  is_blank: boolean;
}

export interface ApiPlacedTile extends ApiTile {
  x: number;
  y: number;
}

/**
 * Convert a single tile to API format.
 */
export function tileToApi(tile: Tile): ApiTile {
  return {
    letter: tile.letter,
    points: tile.points,
    is_blank: tile.isBlank ?? false,
  };
}

/**
 * Convert a placed tile (with x,y coordinates) to API format.
 */
export function placedTileToApi(tile: PlacedTile | PendingTile): ApiPlacedTile {
  return {
    letter: tile.letter,
    points: tile.points,
    is_blank: tile.isBlank ?? false,
    x: tile.x,
    y: tile.y,
  };
}

/**
 * Convert an array of tiles to API format.
 */
export function tilesToApi(tiles: Tile[]): ApiTile[] {
  return tiles.map(tileToApi);
}

/**
 * Convert an array of placed tiles to API format.
 */
export function placedTilesToApi(
  tiles: (PlacedTile | PendingTile)[]
): ApiPlacedTile[] {
  return tiles.map(placedTileToApi);
}
