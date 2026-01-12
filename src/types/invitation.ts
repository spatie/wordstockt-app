export type InvitationStatus = 'pending' | 'accepted' | 'declined';

export interface GameInvitation {
  ulid: string;
  status: InvitationStatus;
  game: {
    ulid: string;
    language: string;
  };
  inviter: {
    ulid: string;
    username: string;
    avatar: string | null;
    avatarColor: string | null;
  };
  invitee: {
    ulid: string;
    username: string;
    avatar: string | null;
    avatarColor: string | null;
  };
  createdAt: string;
}

export interface GameInviteLink {
  ulid: string;
  code: string;
  url: string;
  game: {
    ulid: string;
    language: string;
  };
  inviter: {
    ulid: string;
    username: string;
    avatar: string | null;
    avatarColor: string | null;
  };
  isUsed: boolean;
  createdAt: string;
}
