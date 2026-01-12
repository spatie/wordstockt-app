import { z } from 'zod';
import type {
  Game,
  GameListItem,
  Player,
  Move,
  Tile,
  PlacedTile,
} from '../types';

const TileSchema = z
  .object({
    letter: z.string(),
    points: z.number(),
    is_blank: z.boolean(),
  })
  .passthrough();

const PlacedTileSchema = TileSchema.extend({
  x: z.number(),
  y: z.number(),
}).passthrough();

const PlayerSchema = z
  .object({
    ulid: z.string(),
    username: z.string(),
    avatar: z.string().nullable(),
    avatar_color: z.string().nullish(),
    score: z.number(),
    rack_count: z.number(),
    is_current_turn: z.boolean(),
    has_free_swap: z.boolean().optional(),
    has_received_blank: z.boolean().optional(),
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

function transformPlacedTile(
  data: z.infer<typeof PlacedTileSchema>
): PlacedTile {
  return {
    letter: data.letter,
    points: data.points,
    isBlank: data.is_blank,
    x: data.x,
    y: data.y,
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
    hasFreeSwap: data.has_free_swap,
    hasReceivedBlank: data.has_received_blank,
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
  };
}

export const GameListItemSchema = z
  .object({
    ulid: z.string(),
    language: z.string(),
    status: z.enum(['pending', 'active', 'finished']),
    opponent: z
      .object({
        ulid: z.string(),
        username: z.string(),
        avatar: z.string().nullable(),
        avatar_color: z.string().nullish(),
      })
      .passthrough()
      .nullable(),
    my_score: z.number(),
    opponent_score: z.number(),
    is_my_turn: z.boolean(),
    winner_ulid: z.string().nullable(),
    updated_at: z.string(),
    last_move_description: z.string().nullable().optional(),
    turn_expires_at: z.string().nullable().optional(),
    pending_invitation: PendingInvitationSchema.nullable().optional(),
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
    opponent: data.opponent
      ? {
          ulid: data.opponent.ulid,
          username: data.opponent.username,
          avatar: data.opponent.avatar,
          avatarColor: data.opponent.avatar_color ?? null,
        }
      : null,
    myScore: data.my_score,
    opponentScore: data.opponent_score,
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
  };
}

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
  })
  .passthrough();

// Schema for pending games (games waiting for an opponent)
export const PendingGameSchema = z
  .object({
    ulid: z.string(),
    language: z.string(),
    creator: z.string(),
    created_at: z.string(),
  })
  .passthrough();

export type PendingGameResponse = z.infer<typeof PendingGameSchema>;

export interface PendingGame {
  ulid: string;
  language: string;
  creator: string;
  createdAt: string;
}

export function transformPendingGame(data: PendingGameResponse): PendingGame {
  return {
    ulid: data.ulid,
    language: data.language,
    creator: data.creator,
    createdAt: data.created_at,
  };
}
