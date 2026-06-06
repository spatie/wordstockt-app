import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import { placedTilesToApi } from '../transforms/tileTransforms';
import { validationKeys } from './queryKeys';
import type { ValidationResponse, PendingTile } from '../../types';

// Re-export for backwards compatibility
export { validationKeys };

interface ValidateParams {
  gameUlid: string;
  tiles: PendingTile[];
}

export function useValidation({ gameUlid, tiles }: ValidateParams) {
  // Create a stable key from tile positions and letters. The letter (and blank
  // flag) must be part of the key so that two placements at the same
  // coordinates with different letters don't share a cache entry.
  const tilePositions = tiles
    .map((t) => `${t.x},${t.y},${t.letter},${t.isBlank ? 'blank' : ''}`)
    .sort()
    .join('|');

  return useQuery({
    queryKey: validationKeys.validate(gameUlid, tilePositions),
    queryFn: async (): Promise<ValidationResponse> => {
      const { data } = await apiClient.post(`/games/${gameUlid}/validate`, {
        tiles: placedTilesToApi(tiles),
      });
      return data as ValidationResponse;
    },
    enabled: tiles.length > 0 && gameUlid.length > 0,
    staleTime: 0, // Always refetch when tiles change
    gcTime: 0, // Don't cache old results
    // Note: removed keepPreviousData to prevent stale highlights flashing on old tile neighbors
  });
}
