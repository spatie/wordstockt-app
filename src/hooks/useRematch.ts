import { useState, useCallback } from 'react';
import { useCreateGame } from '../api/queries/useGames';
import { useInvitePlayer } from '../api/queries/useInvites';
import type { Game, Player } from '../types';

interface UseRematchReturn {
  createRematch: () => Promise<string | null>;
  isCreating: boolean;
  error: string | null;
  clearError: () => void;
}

interface UseRematchParams {
  game: Game | undefined;
  opponentUsername: string | undefined;
  currentUserUlid?: string;
}

function otherPlayersInRoster(game: Game, currentUserUlid?: string): Player[] {
  return game.players.filter((player) => {
    if (player.hasLeft) {
      return false;
    }

    if (currentUserUlid) {
      return player.ulid !== currentUserUlid;
    }

    return true;
  });
}

/**
 * Hook for creating a rematch game with the same roster and board layout.
 *
 * For a 2-player game the single opponent is invited directly via the create
 * call. For 3-4 player games the original roster size is preserved through
 * `max_players` and the other players are invited after the game is created.
 */
export function useRematch({
  game,
  opponentUsername,
  currentUserUlid,
}: UseRematchParams): UseRematchReturn {
  const [error, setError] = useState<string | null>(null);
  const createGame = useCreateGame();
  const invitePlayer = useInvitePlayer();

  const createRematch = useCallback(async (): Promise<string | null> => {
    if (!game) {
      setError('Unable to create rematch');
      return null;
    }

    const otherPlayers = otherPlayersInRoster(game, currentUserUlid);

    if (otherPlayers.length === 0 && !opponentUsername) {
      setError('Unable to create rematch');
      return null;
    }

    setError(null);

    const rosterSize = otherPlayers.length + 1;
    const maxPlayers = Math.max(rosterSize, 2);
    const isTwoPlayerRematch = maxPlayers <= 2;

    try {
      const created = await createGame.mutateAsync({
        language: game.language as 'nl' | 'en',
        max_players: maxPlayers,
        board_type: 'custom',
        board_template: game.boardTemplate,
        is_public: false,
        ...(isTwoPlayerRematch
          ? { opponent_username: otherPlayers[0]?.username ?? opponentUsername }
          : {}),
      });

      if (!isTwoPlayerRematch) {
        await Promise.all(
          otherPlayers.map((player) =>
            invitePlayer.mutateAsync({
              gameUlid: created.ulid,
              userUlid: player.ulid,
            })
          )
        );
      }

      return created.ulid;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create rematch';
      setError(message);
      return null;
    }
  }, [game, opponentUsername, currentUserUlid, createGame, invitePlayer]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createRematch,
    isCreating: createGame.isPending || invitePlayer.isPending,
    error,
    clearError,
  };
}
