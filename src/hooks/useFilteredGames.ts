import { useMemo } from 'react';
import type { GameListItem } from '../types';

interface FilteredGames {
  activeGames: GameListItem[];
  completedGames: GameListItem[];
  yourTurnGames: GameListItem[];
  opponentTurnGames: GameListItem[];
  awaitingOpponentGames: GameListItem[];
}

export function useFilteredGames(
  games: GameListItem[] | undefined
): FilteredGames {
  return useMemo(() => {
    if (!games) {
      return {
        activeGames: [],
        completedGames: [],
        yourTurnGames: [],
        opponentTurnGames: [],
        awaitingOpponentGames: [],
      };
    }

    const activeGames = games.filter(
      (g) => g.status === 'active' || g.status === 'pending'
    );
    const completedGames = games.filter((g) => g.status === 'finished');

    // Games awaiting opponent: pending status with no opponent
    const awaitingOpponentGames = activeGames.filter(
      (g) => g.status === 'pending' && !g.opponent
    );

    // Games with opponents
    const gamesWithOpponent = activeGames.filter((g) => g.opponent);
    const yourTurnGames = gamesWithOpponent.filter((g) => g.isMyTurn);
    const opponentTurnGames = gamesWithOpponent.filter((g) => !g.isMyTurn);

    return {
      activeGames,
      completedGames,
      yourTurnGames,
      opponentTurnGames,
      awaitingOpponentGames,
    };
  }, [games]);
}
