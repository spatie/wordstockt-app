import type { ThemeColors } from '../../config/theme';
import { useThemedStyles } from '../../hooks/useThemeColors';
import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GroupedRow } from '../ui/GroupedRow';
import { SmartAvatar } from '../ui/SmartAvatar';
import { SPACING } from '../../config/constants';
import type { Friend } from '../../types';

const AVATAR_SIZE = 44;

interface FriendRowProps {
  friend: Friend;
  isFirst: boolean;
  isLast: boolean;
  onPress: (friendUlid: string) => void;
}

export const FriendRow = memo(function FriendRow({
  friend,
  isFirst,
  isLast,
  onPress,
}: FriendRowProps) {
  const styles = useThemedStyles(createStyles);
  const handlePress = useCallback(() => {
    onPress(friend.friendUlid);
  }, [onPress, friend.friendUlid]);

  return (
    <GroupedRow
      isFirst={isFirst}
      isLast={isLast}
      onPress={handlePress}
      separatorInset={16 + AVATAR_SIZE + SPACING.md}
    >
      <SmartAvatar
        userUlid={friend.friendUlid}
        uri={friend.avatar}
        name={friend.username}
        size={AVATAR_SIZE}
        backgroundColor={friend.avatarColor ?? undefined}
      />
      <View style={styles.info}>
        <Text style={styles.username}>{friend.username}</Text>
        <Text style={styles.rating}>{friend.eloRating} ELO</Text>
      </View>
    </GroupedRow>
  );
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    info: {
      flex: 1,
      marginLeft: SPACING.md,
    },
    username: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    rating: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });
