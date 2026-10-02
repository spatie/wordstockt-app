import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import { placedTilesToApi } from '../transforms/tileTransforms';
import { validationKeys } from './queryKeys';
import type { ValidationResponse, PendingTile } from '../../types';
import { getValidationDraftKey } from '../../utils/validationKey';

// Re-export for backwards compatibility
export { validationKeys };

interface ValidateParams {
  gameUlid: string;
  tiles: PendingTile[];
  boardKey: string;
}

export function useValidation({ gameUlid, tiles, boardKey }: ValidateParams) {
  const draftKey = getValidationDraftKey(tiles);

  return useQuery({
    queryKey: validationKeys.validate(
      gameUlid,
      JSON.stringify([draftKey, boardKey])
    ),
    queryFn: async (): Promise<ValidationResponse> => {
      const { data } = await apiClient.post(`/games/${gameUlid}/validate`, {
        tiles: placedTilesToApi(tiles),
      });
      return data as ValidationResponse;
    },
    enabled: tiles.length > 0 && gameUlid.length > 0 && boardKey.length > 0,
    staleTime: 0, // Always refetch when tiles change
    gcTime: 0, // Don't cache old results
    // Note: removed keepPreviousData to prevent stale highlights flashing on old tile neighbors
  });
}
