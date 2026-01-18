import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { SmartAvatar } from '../ui/SmartAvatar';
import { Button } from '../ui/Button';
import { timeAgo } from '../../utils/timeAgo';
import { colors } from '../../config/theme';
import { RADIUS, SPACING } from '../../config/constants';
import type { GameInvitation } from '../../types/invitation';

interface InvitationCardProps {
  invitation: GameInvitation;
  onPress: () => void;
  onDecline: () => void;
  isDeclining?: boolean;
}

export function InvitationCard({
  invitation,
  onPress,
  onDecline,
  isDeclining = false,
}: InvitationCardProps) {
  const { inviter, game, createdAt } = invitation;

  return (
    <Card accentColor={colors.secondary} showAccent onPress={onPress}>
      <View style={styles.cardTop}>
        <SmartAvatar
          userUlid={inviter.ulid}
          uri={inviter.avatar}
          name={inviter.username}
          size={32}
          backgroundColor={inviter.avatarColor ?? undefined}
        />
        <View style={styles.cardInfo}>
          <Text style={styles.inviterName}>{inviter.username}</Text>
          <Text style={styles.inviteText}>invites you to play</Text>
        </View>
        <View style={styles.languageContainer}>
          <Text style={styles.languageLabel}>LANGUAGE</Text>
          <View style={styles.languageBox}>
            <Text style={styles.languageText}>
              {game.language.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.cardDivider} />
      <View style={styles.cardBottom}>
        <Text style={styles.timeText}>{timeAgo(createdAt)}</Text>
        <View style={styles.buttonContainer}>
          <Button
            label="Decline"
            onPress={onDecline}
            variant="outline"
            size="sm"
            rounded
            disabled={isDeclining}
            loading={isDeclining}
          />
          <Button
            label="View"
            onPress={onPress}
            size="sm"
            rounded
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  inviterName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  inviteText: {
    fontSize: 14,
    color: colors.secondary,
  },
  languageContainer: {
    alignItems: 'flex-end',
  },
  languageLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  languageBox: {
    backgroundColor: colors.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: SPACING.md,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
});
