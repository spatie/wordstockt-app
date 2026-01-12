export interface Tile {
  letter: string;
  points: number;
  isBlank: boolean;
}

export interface PlacedTile extends Tile {
  x: number;
  y: number;
}

export interface PendingTile extends PlacedTile {
  rackIndex: number;
}
