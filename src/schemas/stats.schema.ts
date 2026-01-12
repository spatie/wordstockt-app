import { z } from 'zod';

const WordRecordSchema = z.object({
  word: z.string(),
  score: z.number(),
});

export const UserStatsSchema = z.object({
  ulid: z.string(),
  username: z.string(),
  avatar: z.string().nullable(),

  eloRating: z.number(),
  gamesPlayed: z.number(),
  gamesWon: z.number(),
  gamesLost: z.number(),
  gamesDraw: z.number(),
  winRate: z.number(),

  highestScoringWord: WordRecordSchema.nullable(),
  highestScoringMove: z.number(),
  bingosCount: z.number(),
  totalWordsPlayed: z.number(),
  totalPointsScored: z.number(),

  highestGameScore: z.number(),
  averageGameScore: z.number(),
  currentWinStreak: z.number(),
  bestWinStreak: z.number(),
  biggestComeback: z.number(),
  closestVictory: z.number().nullable(),

  tripleWordTilesUsed: z.number(),
  doubleWordTilesUsed: z.number(),
  blankTilesPlayed: z.number(),

  firstMoveWinRate: z.number(),

  highestEloEver: z.number(),
  lowestEloEver: z.number(),
});

export const UserStatsResponseSchema = z.object({
  data: UserStatsSchema,
});

export const EloHistoryEntrySchema = z.object({
  gameUlid: z.string().nullable(),
  eloBefore: z.number(),
  eloAfter: z.number(),
  eloChange: z.number(),
  timestamp: z.string(),
});

export const EloHistoryResponseSchema = z.object({
  data: z.array(EloHistoryEntrySchema),
});

export const HeadToHeadRecordSchema = z.object({
  opponentUlid: z.string(),
  opponentUsername: z.string(),
  opponentAvatar: z.string().nullable(),
  opponentAvatarColor: z.string().nullish(),
  wins: z.number(),
  losses: z.number(),
  draws: z.number(),
  totalGames: z.number(),
  winRate: z.number(),
  averageScoreDifference: z.number(),
  bestWord: WordRecordSchema.nullable(),
});

export const HeadToHeadResponseSchema = z.object({
  data: z.array(HeadToHeadRecordSchema),
});

export type HeadToHeadRecordResponse = z.infer<typeof HeadToHeadRecordSchema>;

export function transformHeadToHeadRecord(
  data: HeadToHeadRecordResponse
): import('../types').HeadToHeadRecord {
  return {
    opponentUlid: data.opponentUlid,
    opponentUsername: data.opponentUsername,
    opponentAvatar: data.opponentAvatar,
    opponentAvatarColor: data.opponentAvatarColor ?? null,
    wins: data.wins,
    losses: data.losses,
    draws: data.draws,
    totalGames: data.totalGames,
    winRate: data.winRate,
    averageScoreDifference: data.averageScoreDifference,
    bestWord: data.bestWord,
  };
}
