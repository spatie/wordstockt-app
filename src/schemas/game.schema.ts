import { z } from 'zod';
import type {
  Game,
  GameListItem,
  Player,
  Move,
  Tile,
  MoveHistoryItem,
  ScoreBreakdown,
} from '../types';

const TileSchema = z
  .object({
    letter: z.string(),
    points: z.number(),
    is_blank: z.boolean(),
  })
  .passthrough();

const PlayerSchema = z
  .object({
    ulid: z.string(),
    username: z.string(),
    avatar: z.string().nullable(),
    avatar_color: z.string().nullish(),
    score: z.number(),
    rack_count: z.number(),
    is_current_turn: z.boolean(),
    turn_order: z.number().optional(),
    has_left: z.boolean().optional(),
    left_reason: z.string().nullish(),
    has_free_swap: z.boolean().optional(),
    has_received_blank: z.boolean().optional(),
    received_empty_rack_bonus: z.boolean().optional(),
  })
  .passthrough();

const MoveTileSchema = z
  .object({
    letter: z.string(),
    points: z.number(),
    x: z.number().optional(),
    y: z.number().optional(),
    is_blank: z.boolean().optional(),
  })
  .passthrough();

const MoveSchema = z
  .object({
    ulid: z.string(),
    user_ulid: z.string(),
    type: z.enum(['play', 'pass', 'swap', 'resign']),
    words: z.array(z.string()).nullable(),
    score: z.number(),
    tiles: z.array(MoveTileSchema).nullable(),
    created_at: z.string(),
  })
  .passthrough();

const SquareTypeSchema = z.enum(['3W', '2W', '3L', '2L', 'STAR']).nullable();

// Board cells don't include x/y coordinates (position is implicit in array indices)
const BoardTileSchema = TileSchema;

const PendingInvitationSchema = z
  .object({
    ulid: z.string(),
    invitee: z.object({
      ulid: z.string(),
      username: z.string(),
      avatar: z.string().nullable(),
      avatar_color: z.string().nullish(),
    }),
  })
  .passthrough();

export const GameSchema = z
  .object({
    ulid: z.string(),
    language: z.string(),
    status: z.enum(['pending', 'active', 'finished']),
    max_players: z.number(),
    board: z.array(z.array(BoardTileSchema.nullable())),
    board_template: z.array(z.array(SquareTypeSchema)),
    players: z.array(PlayerSchema),
    my_rack: z.array(TileSchema),
    tiles_remaining: z.number(),
    current_turn_user_ulid: z.string().nullable(),
    winner_ulid: z.string().nullable(),
    is_last_move: z.boolean(),
    last_move: MoveSchema.nullable(),
    turn_expires_at: z.string().nullable().optional(),
    pending_invitation: PendingInvitationSchema.nullable().optional(),
    is_public: z.boolean(),
    can_join: z.boolean(),
  })
  .passthrough();

export type GameResponse = z.infer<typeof GameSchema>;

function transformTile(data: z.infer<typeof TileSchema>): Tile {
  return {
    letter: data.letter,
    points: data.points,
    isBlank: data.is_blank,
  };
}

function transformPlayer(data: z.infer<typeof PlayerSchema>): Player {
  return {
    ulid: data.ulid,
    username: data.username,
    avatar: data.avatar,
    avatarColor: data.avatar_color ?? null,
    score: data.score,
    rackCount: data.rack_count,
    isCurrentTurn: data.is_current_turn,
    turnOrder: data.turn_order,
    hasLeft: data.has_left,
    leftReason: data.left_reason ?? null,
    hasFreeSwap: data.has_free_swap,
    hasReceivedBlank: data.has_received_blank,
    receivedEmptyRackBonus: data.received_empty_rack_bonus,
  };
}

function transformMove(data: z.infer<typeof MoveSchema>): Move {
  // Only include tile positions for play moves (swap moves don't have x/y)
  const tilesWithPositions = data.tiles
    ?.filter((t) => t.x !== undefined && t.y !== undefined)
    .map((t) => ({ x: t.x!, y: t.y! }));

  return {
    ulid: data.ulid,
    userUlid: data.user_ulid,
    type: data.type,
    words: data.words,
    score: data.score,
    tiles: tilesWithPositions?.length ? tilesWithPositions : null,
    createdAt: data.created_at,
  };
}

export function transformGame(data: GameResponse): Game {
  return {
    ulid: data.ulid,
    language: data.language,
    status: data.status,
    maxPlayers: data.max_players,
    board: data.board.map((row, y) =>
      row.map((cell, x) => (cell ? { ...transformTile(cell), x, y } : null))
    ),
    boardTemplate: data.board_template,
    players: data.players.map(transformPlayer),
    myRack: data.my_rack.map(transformTile),
    tilesRemaining: data.tiles_remaining,
    currentTurnUserUlid: data.current_turn_user_ulid,
    winnerUlid: data.winner_ulid,
    isLastMove: data.is_last_move,
    lastMove: data.last_move ? transformMove(data.last_move) : null,
    turnExpiresAt: data.turn_expires_at ?? null,
    pendingInvitation: data.pending_invitation
      ? {
          ulid: data.pending_invitation.ulid,
          invitee: {
            ulid: data.pending_invitation.invitee.ulid,
            username: data.pending_invitation.invitee.username,
            avatar: data.pending_invitation.invitee.avatar,
            avatarColor: data.pending_invitation.invitee.avatar_color ?? null,
          },
        }
      : null,
    isPublic: data.is_public,
    canJoin: data.can_join,
  };
}

export const GameListItemSchema = z
  .object({
    ulid: z.string(),
    language: z.string(),
    status: z.enum(['pending', 'active', 'finished']),
    max_players: z.number(),
    players: z.array(
      z
        .object({
          ulid: z.string(),
          username: z.string(),
          avatar: z.string().nullable(),
          avatar_color: z.string().nullish(),
          score: z.number(),
          is_current_turn: z.boolean(),
          is_me: z.boolean(),
          has_left: z.boolean(),
        })
        .passthrough()
    ),
    my_score: z.number(),
    is_my_turn: z.boolean(),
    winner_ulid: z.string().nullable(),
    updated_at: z.string(),
    last_move_description: z.string().nullable().optional(),
    turn_expires_at: z.string().nullable().optional(),
    pending_invitation: PendingInvitationSchema.nullable().optional(),
    is_public: z.boolean().optional().default(false),
  })
  .passthrough();

export type GameListItemResponse = z.infer<typeof GameListItemSchema>;

export function transformGameListItem(
  data: GameListItemResponse
): GameListItem {
  return {
    ulid: data.ulid,
    language: data.language,
    status: data.status,
    maxPlayers: data.max_players,
    players: data.players.map((p) => ({
      ulid: p.ulid,
      username: p.username,
      avatar: p.avatar,
      avatarColor: p.avatar_color ?? null,
      score: p.score,
      isCurrentTurn: p.is_current_turn,
      isMe: p.is_me,
      hasLeft: p.has_left,
    })),
    myScore: data.my_score,
    isMyTurn: data.is_my_turn,
    winnerUlid: data.winner_ulid,
    updatedAt: data.updated_at,
    lastMoveDescription: data.last_move_description ?? null,
    turnExpiresAt: data.turn_expires_at ?? null,
    pendingInvitation: data.pending_invitation
      ? {
          ulid: data.pending_invitation.ulid,
          invitee: {
            ulid: data.pending_invitation.invitee.ulid,
            username: data.pending_invitation.invitee.username,
            avatar: data.pending_invitation.invitee.avatar,
            avatarColor: data.pending_invitation.invitee.avatar_color ?? null,
          },
        }
      : null,
    isPublic: data.is_public,
  };
}

const AchievementSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    icon: z.string(),
    category: z.string(),
    context: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export const MoveResponseSchema = z
  .object({
    move: z
      .object({
        ulid: z.string(),
        score: z.number().optional(),
        words: z.array(z.string()).nullable().optional(),
      })
      .passthrough(),
    data: GameSchema,
    achievements: z.array(AchievementSchema).optional().default([]),
  })
  .passthrough();

// Schema for pending games (games waiting for an opponent)
export const PendingGameSchema = z
  .object({
    ulid: z.string(),
    language: z.string(),
    creator: z.string(),
    created_at: z.string(),
    max_players: z.number().optional().default(2),
    players_joined: z.number().optional().default(1),
  })
  .passthrough();

export type PendingGameResponse = z.infer<typeof PendingGameSchema>;

export interface PendingGame {
  ulid: string;
  language: string;
  creator: string;
  createdAt: string;
  maxPlayers: number;
  playersJoined: number;
}

export function transformPendingGame(data: PendingGameResponse): PendingGame {
  return {
    ulid: data.ulid,
    language: data.language,
    creator: data.creator,
    createdAt: data.created_at,
    maxPlayers: data.max_players,
    playersJoined: data.players_joined,
  };
}

// Schema for public games (joinable games in public list)
export const PublicGameSchema = z
  .object({
    ulid: z.string(),
    language: z.string(),
    board_template: z.array(z.array(SquareTypeSchema)),
    creator: z.string(),
    created_at: z.string(),
  })
  .passthrough();

export type PublicGameResponse = z.infer<typeof PublicGameSchema>;

export function transformPublicGame(
  data: PublicGameResponse
): import('../types').PublicGame {
  return {
    ulid: data.ulid,
    language: data.language,
    boardTemplate: data.board_template,
    creator: data.creator,
    createdAt: data.created_at,
  };
}

// Move History schemas
const WordScoreSchema = z
  .object({
    word: z.string(),
    baseScore: z.number(),
    multipliedScore: z.number(),
    multipliers: z.array(
      z.object({
        type: z.enum(['letter', 'word']),
        value: z.number(),
        position: z.tuple([z.number(), z.number()]),
      })
    ),
  })
  .passthrough();

const BonusSchema = z
  .object({
    rule: z.string(),
    points: z.number(),
    description: z.string(),
  })
  .passthrough();

const ScoreBreakdownSchema = z
  .object({
    total: z.number(),
    words_total: z.number(),
    bonus_total: z.number(),
    words: z.array(WordScoreSchema),
    bonuses: z.array(BonusSchema),
  })
  .passthrough();

export const MoveHistoryItemSchema = z
  .object({
    ulid: z.string(),
    type: z.enum(['play', 'pass', 'swap', 'resign']),
    user: z.object({
      ulid: z.string(),
      username: z.string(),
      avatar: z.string().nullable(),
      avatar_color: z.string().nullish(),
    }),
    words: z.array(z.string()).nullable(),
    score: z.number(),
    score_breakdown: ScoreBreakdownSchema.nullable(),
    tiles_count: z.number(),
    tiles: z.array(MoveTileSchema).nullable().optional(),
    created_at: z.string(),
  })
  .passthrough();

export type MoveHistoryItemResponse = z.infer<typeof MoveHistoryItemSchema>;

function transformScoreBreakdown(
  data: z.infer<typeof ScoreBreakdownSchema>
): ScoreBreakdown {
  return {
    total: data.total,
    wordsTotal: data.words_total,
    bonusTotal: data.bonus_total,
    words: data.words.map((w) => ({
      word: w.word,
      baseScore: w.baseScore,
      multipliedScore: w.multipliedScore,
      multipliers: w.multipliers,
    })),
    bonuses: data.bonuses,
  };
}

export function transformMoveHistoryItem(
  data: MoveHistoryItemResponse
): MoveHistoryItem {
  return {
    ulid: data.ulid,
    type: data.type,
    user: {
      ulid: data.user.ulid,
      username: data.user.username,
      avatar: data.user.avatar,
      avatarColor: data.user.avatar_color ?? null,
    },
    words: data.words,
    score: data.score,
    scoreBreakdown: data.score_breakdown
      ? transformScoreBreakdown(data.score_breakdown)
      : null,
    tilesCount: data.tiles_count,
    // Only include tiles with coordinates (swap moves don't have x/y);
    // drop coordinate-less tiles rather than placing a phantom tile at (0,0).
    tiles:
      data.tiles
        ?.filter((t) => t.x !== undefined && t.y !== undefined)
        .map((t) => ({
          letter: t.letter,
          points: t.points,
          x: t.x!,
          y: t.y!,
          isBlank: t.is_blank ?? false,
        })) ?? null,
    createdAt: data.created_at,
  };
}
