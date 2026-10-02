import type { ThemeColors } from '../../config/theme';
import { useThemedStyles } from '../../hooks/useThemeColors';
import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { SmartAvatar } from '../ui/SmartAvatar';
import { SPACING } from '../../config/constants';
import type { Friend } from '../../types';

interface FriendCardProps {
  friend: Friend;
  onPress: (friendUlid: string) => void;
}

export const FriendCard = memo(function FriendCard({
  friend,
  onPress,
}: FriendCardProps) {
  const styles = useThemedStyles(createStyles);
  const handlePress = useCallback(() => {
    onPress(friend.friendUlid);
  }, [onPress, friend.friendUlid]);

  return (
    <Card
      onPress={handlePress}
      padding="md"
      borderRadius="lg"
      marginBottom="sm"
      style={styles.card}
    >
      <SmartAvatar
        userUlid={friend.friendUlid}
        uri={friend.avatar}
        name={friend.username}
        size={48}
        backgroundColor={friend.avatarColor ?? undefined}
      />
      <View style={styles.info}>
        <Text style={styles.username}>{friend.username}</Text>
        <Text style={styles.rating}>ELO: {friend.eloRating}</Text>
      </View>
    </Card>
  );
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
    },
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
