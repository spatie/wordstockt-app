import type { Tile, PlacedTile } from './tile';

export type GameStatus = 'pending' | 'active' | 'finished';
export type MoveType = 'play' | 'pass' | 'swap' | 'resign';
export type SquareType = '3W' | '2W' | '3L' | '2L' | 'STAR' | null;

export interface Player {
  ulid: string;
  username: string;
  avatar: string | null;
  avatarColor: string | null;
  score: number;
  rackCount: number;
  isCurrentTurn: boolean;
  hasFreeSwap?: boolean;
  hasReceivedBlank?: boolean;
  receivedEmptyRackBonus?: boolean;
}

export interface MoveTilePosition {
  x: number;
  y: number;
}

export interface Move {
  ulid: string;
  userUlid: string;
  type: MoveType;
  words: string[] | null;
  score: number;
  tiles: MoveTilePosition[] | null;
  createdAt: string;
}

export interface WordScore {
  word: string;
  baseScore: number;
  multipliedScore: number;
  multipliers: Array<{
    type: 'letter' | 'word';
    value: number;
    position: [number, number];
  }>;
}

export interface Bonus {
  rule: string;
  points: number;
  description: string;
}

export interface ScoreBreakdown {
  total: number;
  wordsTotal: number;
  bonusTotal: number;
  words: WordScore[];
  bonuses: Bonus[];
}

export interface MoveHistoryUser {
  ulid: string;
  username: string;
  avatar: string | null;
  avatarColor: string | null;
}

export interface MoveHistoryItem {
  ulid: string;
  type: MoveType;
  user: MoveHistoryUser;
  words: string[] | null;
  score: number;
  scoreBreakdown: ScoreBreakdown | null;
  tilesCount: number;
  createdAt: string;
}

export interface PendingInvitation {
  ulid: string;
  invitee: {
    ulid: string;
    username: string;
    avatar: string | null;
    avatarColor: string | null;
  };
}

export interface Game {
  ulid: string;
  language: string;
  status: GameStatus;
  board: (PlacedTile | null)[][];
  boardTemplate: SquareType[][];
  players: Player[];
  myRack: Tile[];
  tilesRemaining: number;
  currentTurnUserUlid: string | null;
  winnerUlid: string | null;
  isLastMove: boolean;
  lastMove: Move | null;
  turnExpiresAt: string | null;
  pendingInvitation: PendingInvitation | null;
  isPublic: boolean;
  canJoin: boolean;
}

export interface GameListPendingInvitation {
  ulid: string;
  invitee: {
    ulid: string;
    username: string;
    avatar: string | null;
    avatarColor: string | null;
  };
}

export interface GameListItem {
  ulid: string;
  language: string;
  status: GameStatus;
  opponent: {
    ulid: string;
    username: string;
    avatar: string | null;
    avatarColor: string | null;
  } | null;
  myScore: number;
  opponentScore: number;
  isMyTurn: boolean;
  winnerUlid: string | null;
  updatedAt: string;
  lastMoveDescription: string | null;
  turnExpiresAt: string | null;
  pendingInvitation: GameListPendingInvitation | null;
  isPublic: boolean;
}

export interface PublicGame {
  ulid: string;
  language: string;
  boardTemplate: SquareType[][];
  creator: string;
  createdAt: string;
}
