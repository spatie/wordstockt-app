// Utility exports
export { timeAgo } from './timeAgo';
export { isWeb, isIOS, isAndroid } from './platform';
export { showAlert, showConfirm } from './alerts';
export {
  getBoardCellPosition,
  getRackSlotPosition,
  getBoardCellFromPosition,
  getRackSlotFromPosition,
  type BoardLayout,
  type RackLayout,
} from './dragMath';
export {
  isEmailVerified,
  isInGracePeriod,
  isGracePeriodExpired,
  getDaysRemainingInGracePeriod,
} from './emailVerification';
