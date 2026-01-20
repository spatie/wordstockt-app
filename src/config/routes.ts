export const ROUTES = {
  // Auth routes
  LOGIN: '/(auth)/login',
  REGISTER: '/(auth)/register',
  FORGOT_PASSWORD: '/(auth)/forgot-password',

  // Main routes
  HOME: '/(main)',
  PROFILE: '/(main)/profile',
  LEADERBOARD: '/(main)/leaderboard',
  FRIENDS: '/(main)/friends',
  ACHIEVEMENTS: '/(main)/achievements',
  RULES: '/(main)/rules',
  ABOUT: '/(main)/about',
  CHANGE_PASSWORD: '/(main)/change-password',
  DELETE_ACCOUNT: '/(main)/delete-account',
  CONVERT_ACCOUNT: '/(main)/convert-account',

  // Game routes
  GAME: (ulid: string) => `/(main)/game/${ulid}` as const,

  // User routes
  USER_PROFILE: (ulid: string) => `/(main)/user/${ulid}` as const,

  // Invite routes
  INVITE: (code: string) => `/(main)/invite/${code}` as const,
} as const;
