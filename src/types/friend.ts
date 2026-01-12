export interface Friend {
  ulid: string;
  friendUlid: string;
  username: string;
  avatar: string | null;
  avatarColor: string | null;
  eloRating: number;
  createdAt: string;
}

export interface FriendCheckResponse {
  isFriend: boolean;
}
