export interface WordRecord {
  word: string;
  score: number;
}

export interface UserStats {
  ulid: string;
  username: string;
  avatar: string | null;

  // Basic stats
  eloRating: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDraw: number;
  winRate: number;

  // Word/Move stats
  highestScoringWord: WordRecord | null;
  highestScoringMove: number;
  bingosCount: number;
  totalWordsPlayed: number;
  totalPointsScored: number;

  // Game performance
  highestGameScore: number;
  averageGameScore: number;
  currentWinStreak: number;
  bestWinStreak: number;
  biggestComeback: number;
  closestVictory: number | null;

  // Special tiles
  tripleWordTilesUsed: number;
  doubleWordTilesUsed: number;
  blankTilesPlayed: number;

  // First move
  firstMoveWinRate: number;

  // ELO
  highestEloEver: number;
  lowestEloEver: number;
}

export interface EloHistoryEntry {
  gameUlid: string | null;
  eloBefore: number;
  eloAfter: number;
  eloChange: number;
  timestamp: string;
}

export interface HeadToHeadRecord {
  opponentUlid: string;
  opponentUsername: string;
  opponentAvatar: string | null;
  opponentAvatarColor: string | null;
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
  winRate: number;
  averageScoreDifference: number;
  bestWord: WordRecord | null;
}
