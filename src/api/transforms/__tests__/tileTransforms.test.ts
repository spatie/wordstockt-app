import {
  tileToApi,
  placedTileToApi,
  tilesToApi,
  placedTilesToApi,
} from '../tileTransforms';
import {
  mockTile,
  mockPlacedTile,
  mockPendingTile,
} from '../../../__tests__/utils';

describe('tileTransforms', () => {
  describe('tileToApi', () => {
    it('should convert tile to API format', () => {
      const tile = mockTile({ letter: 'A', points: 1, isBlank: false });

      const result = tileToApi(tile);

      expect(result).toEqual({
        letter: 'A',
        points: 1,
        is_blank: false,
      });
    });

    it('should handle blank tiles correctly', () => {
      const tile = mockTile({ letter: '', points: 0, isBlank: true });

      const result = tileToApi(tile);

      expect(result.is_blank).toBe(true);
      expect(result.letter).toBe('');
      expect(result.points).toBe(0);
    });

    it('should default isBlank to false when undefined', () => {
      const tile = { letter: 'A', points: 1 } as {
        letter: string;
        points: number;
        isBlank?: boolean;
      };

      const result = tileToApi(tile as any);

      expect(result.is_blank).toBe(false);
    });
  });

  describe('placedTileToApi', () => {
    it('should convert placed tile with coordinates', () => {
      const tile = mockPlacedTile({ letter: 'B', points: 3, x: 7, y: 8 });

      const result = placedTileToApi(tile);

      expect(result).toEqual({
        letter: 'B',
        points: 3,
        is_blank: false,
        x: 7,
        y: 8,
      });
    });

    it('should preserve coordinates at boundaries', () => {
      const tile = mockPlacedTile({ x: 0, y: 0 });
      const result = placedTileToApi(tile);
      expect(result).toMatchObject({ x: 0, y: 0 });

      const tile2 = mockPlacedTile({ x: 14, y: 14 });
      const result2 = placedTileToApi(tile2);
      expect(result2).toMatchObject({ x: 14, y: 14 });
    });

    it('should handle pending tiles (with rackIndex)', () => {
      const pendingTile = mockPendingTile({
        letter: 'C',
        x: 5,
        y: 5,
        rackIndex: 2,
      });

      const result = placedTileToApi(pendingTile);

      expect(result).toEqual({
        letter: 'C',
        points: 1,
        is_blank: false,
        x: 5,
        y: 5,
      });
      // rackIndex should not be in API format
      expect(result).not.toHaveProperty('rackIndex');
    });
  });

  describe('tilesToApi', () => {
    it('should convert array of tiles', () => {
      const tiles = [
        mockTile({ letter: 'A', points: 1 }),
        mockTile({ letter: 'B', points: 3 }),
        mockTile({ letter: 'C', points: 3 }),
      ];

      const result = tilesToApi(tiles);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ letter: 'A', points: 1, is_blank: false });
      expect(result[1]).toEqual({ letter: 'B', points: 3, is_blank: false });
      expect(result[2]).toEqual({ letter: 'C', points: 3, is_blank: false });
    });

    it('should handle empty array', () => {
      const result = tilesToApi([]);

      expect(result).toEqual([]);
    });
  });

  describe('placedTilesToApi', () => {
    it('should convert array of placed tiles', () => {
      const tiles = [
        mockPlacedTile({ letter: 'A', x: 7, y: 7 }),
        mockPlacedTile({ letter: 'B', x: 8, y: 7 }),
      ];

      const result = placedTilesToApi(tiles);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ letter: 'A', x: 7, y: 7 });
      expect(result[1]).toMatchObject({ letter: 'B', x: 8, y: 7 });
    });

    it('should handle mixed placed and pending tiles', () => {
      const tiles = [
        mockPlacedTile({ letter: 'A', x: 7, y: 7 }),
        mockPendingTile({ letter: 'B', x: 8, y: 7, rackIndex: 1 }),
      ];

      const result = placedTilesToApi(tiles);

      expect(result).toHaveLength(2);
      // Both should be converted without rackIndex
      result.forEach((tile) => {
        expect(tile).not.toHaveProperty('rackIndex');
      });
    });

    it('should handle empty array', () => {
      const result = placedTilesToApi([]);

      expect(result).toEqual([]);
    });
  });
});
