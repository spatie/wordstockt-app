import { useMemo } from 'react';
import type { GameListItem } from '../types';

interface FilteredGames {
  activeGames: GameListItem[];
  completedGames: GameListItem[];
  yourTurnGames: GameListItem[];
  opponentTurnGames: GameListItem[];
  awaitingOpponentGames: GameListItem[];
}

function hasOtherPlayers(game: GameListItem): boolean {
  return game.players.filter((player) => !player.isMe).length > 0;
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

    // Games awaiting players: pending with no other players joined yet
    const awaitingOpponentGames = activeGames.filter(
      (g) => g.status === 'pending' && !hasOtherPlayers(g)
    );

    // Games that have at least one other player joined
    const gamesWithPlayers = activeGames.filter(hasOtherPlayers);
    const yourTurnGames = gamesWithPlayers.filter((g) => g.isMyTurn);
    const opponentTurnGames = gamesWithPlayers.filter((g) => !g.isMyTurn);

    return {
      activeGames,
      completedGames,
      yourTurnGames,
      opponentTurnGames,
      awaitingOpponentGames,
    };
  }, [games]);
}
