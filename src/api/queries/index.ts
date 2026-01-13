// Query keys
export * from './queryKeys';

// Auth queries
export {
  useCurrentUser,
  useLogin,
  useRegister,
  useLogout,
  useRegisterPushToken,
} from './useAuth';

// Game queries
export {
  useGames,
  usePendingGames,
  useCreateGame,
  useJoinGame,
} from './useGames';
export {
  useGame,
  useSubmitMove,
  usePassTurn,
  useSwapTiles,
  useResignGame,
} from './useGame';

// User queries
export { useSearchUsers, useUserProfile, useLeaderboard } from './useUsers';

// Friend queries
export {
  useFriends,
  useIsFriend,
  useAddFriend,
  useRemoveFriend,
} from './useFriends';

// Invite queries
export { useInvitePlayer } from './useInvites';

// Validation queries
export { useValidation } from './useValidation';

// Word info queries
export { useWordInfo } from './useWordInfo';
