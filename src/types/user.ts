export interface User {
  ulid: string;
  username: string;
  email?: string;
  avatar: string | null;
  avatarColor: string | null;
  eloRating: number;
  gamesPlayed: number;
  gamesWon: number;
  isGuest: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  ulid: string;
  username: string;
  avatar: string | null;
  avatarColor: string | null;
  eloRating: number;
  gamesPlayed: number;
  gamesWon: number;
  winsInPeriod?: number;
}

export type LeaderboardType = 'elo' | 'monthly' | 'yearly';

export interface CurrentUserLeaderboardEntry {
  rank: number | null;
  message?: string;
  ulid?: string;
  username?: string;
  avatar?: string | null;
  avatarColor?: string | null;
  eloRating?: number;
  gamesPlayed?: number;
  gamesWon?: number;
  winsInPeriod?: number;
}

export interface LeaderboardMeta {
  type: LeaderboardType;
  label: string;
  currentUser: CurrentUserLeaderboardEntry | null;
}

export interface LeaderboardResponse {
  data: LeaderboardEntry[];
  meta: LeaderboardMeta;
}
