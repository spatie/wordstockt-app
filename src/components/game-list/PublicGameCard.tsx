import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { timeAgo } from '../../utils/timeAgo';
import { colors } from '../../config/theme';
import { SPACING } from '../../config/constants';
import type { PublicGame } from '../../types';

interface PublicGameCardProps {
  game: PublicGame;
  onPress: () => void;
}

export function PublicGameCard({ game, onPress }: PublicGameCardProps) {
  const hasCustomBoard = game.boardTemplate.some((row) =>
    row.some((cell) => cell !== null)
  );

  return (
    <Card onPress={onPress}>
      <View style={styles.cardTop}>
        <View style={styles.iconContainer}>
          <Ionicons name="globe-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.creatorName}>{game.creator}</Text>
          <Text style={styles.subtitle}>
            {hasCustomBoard ? 'Custom board' : 'Standard board'}
          </Text>
        </View>
      </View>
      <View style={styles.cardDivider} />
      <View style={styles.cardBottom}>
        <View style={styles.timeContainer}>
          <Text style={styles.languageBadge}>
            {game.language.toUpperCase()}
          </Text>
          <Text style={styles.timeSeparator}>•</Text>
          <Text style={styles.timeText}>{timeAgo(game.createdAt)}</Text>
        </View>
        <Button
          label="See Game →"
          onPress={onPress}
          size="sm"
          rounded
          style={styles.seeButton}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  creatorName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
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
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageBadge: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  timeSeparator: {
    color: colors.textMuted,
    marginHorizontal: 6,
    fontSize: 13,
  },
  timeText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  seeButton: {
    paddingHorizontal: SPACING.xl,
  },
});
