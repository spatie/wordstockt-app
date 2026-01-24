import { useState, useCallback } from 'react';
import { useCreateGame } from '../api/queries/useGames';
import type { Game } from '../types';

interface UseRematchReturn {
  createRematch: () => Promise<string | null>;
  isCreating: boolean;
  error: string | null;
  clearError: () => void;
}

interface UseRematchParams {
  game: Game | undefined;
  opponentUsername: string | undefined;
}

/**
 * Hook for creating a rematch game with the same opponent and board layout.
 */
export function useRematch({
  game,
  opponentUsername,
}: UseRematchParams): UseRematchReturn {
  const [error, setError] = useState<string | null>(null);
  const createGame = useCreateGame();

  const createRematch = useCallback(async (): Promise<string | null> => {
    if (!game || !opponentUsername) {
      setError('Unable to create rematch');
      return null;
    }

    setError(null);

    try {
      const result = await createGame.mutateAsync({
        language: game.language as 'nl' | 'en',
        opponent_username: opponentUsername,
        board_type: 'custom',
        board_template: game.boardTemplate,
        is_public: false,
      });

      return result.ulid;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create rematch';
      setError(message);
      return null;
    }
  }, [game, opponentUsername, createGame]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createRematch,
    isCreating: createGame.isPending,
    error,
    clearError,
  };
}
