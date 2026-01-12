export interface TilePosition {
  x: number;
  y: number;
}

export interface WordValidationResult {
  word: string;
  valid: boolean;
  tiles: TilePosition[];
}

export interface TileValidationStatus {
  x: number;
  y: number;
  valid: boolean;
}

export interface ValidationResponse {
  placement_valid: boolean;
  placement_errors: string[];
  words: WordValidationResult[];
  tile_status: TileValidationStatus[];
  potential_score: number | null;
}

export type TileValidationState =
  | 'valid'
  | 'invalid'
  | 'placement_error'
  | null;
