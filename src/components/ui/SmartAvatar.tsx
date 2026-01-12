import React from 'react';
import { TouchableOpacity, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from './Avatar';
import { ROUTES } from '../../config/routes';
import { useAuthStore } from '../../stores/authStore';

interface SmartAvatarProps {
  /** User ULID - if provided, makes avatar touchable and navigates to profile */
  userUlid?: string;
  uri?: string | null;
  name: string;
  size?: number;
  showOnlineIndicator?: boolean;
  backgroundColor?: string;
  /** Explicit override to disable touch behavior */
  disabled?: boolean;
  /** Custom press handler (overrides default navigation) */
  onPress?: () => void;
  /** Wrapper style (useful for adding indicators) */
  wrapperStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Smart avatar that automatically determines if it should be touchable.
 *
 * - If `userUlid` is provided, clicking navigates to the user's profile
 * - If `onPress` is provided, it overrides the default navigation
 * - If `disabled` is true, touch behavior is disabled
 * - Otherwise renders a static Avatar
 *
 * This consolidates the repeated Avatar/TouchableAvatar conditional pattern
 * found in GameCard, ScoreBar, and InvitePlayerModal.
 */
export function SmartAvatar({
  userUlid,
  uri,
  name,
  size = 48,
  showOnlineIndicator = false,
  backgroundColor,
  disabled = false,
  onPress,
  wrapperStyle,
  testID,
}: SmartAvatarProps) {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const currentUserUlid = currentUser?.ulid;

  // Use current user's avatar info from auth store for freshness
  const isCurrentUser = userUlid && userUlid === currentUserUlid;
  const resolvedBackgroundColor = isCurrentUser
    ? (currentUser?.avatarColor ?? backgroundColor)
    : backgroundColor;

  const isTouchable = !disabled && (!!userUlid || !!onPress);

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    if (!userUlid) return;

    if (userUlid === currentUserUlid) {
      router.push(ROUTES.PROFILE);
    } else {
      router.push(ROUTES.USER_PROFILE(userUlid));
    }
  };

  const avatarElement = (
    <Avatar
      uri={uri}
      name={name}
      size={size}
      showOnlineIndicator={showOnlineIndicator}
      backgroundColor={resolvedBackgroundColor}
    />
  );

  if (!isTouchable) {
    return avatarElement;
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={wrapperStyle}
      testID={testID}
    >
      {avatarElement}
    </TouchableOpacity>
  );
}
