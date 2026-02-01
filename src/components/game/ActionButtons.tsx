import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../config/theme';

interface ActionButtonsProps {
  onRecall: () => void;
  onPass: () => void;
  onPlay: () => void;
  onMix?: () => void;
  onSwap?: () => void;
  onResign?: () => void;
  canPlay: boolean;
  isLoading: boolean;
  disabled: boolean;
  isMyTurn?: boolean;
  pendingScore?: number;
  hasPendingTiles?: boolean;
}

function SmallActionButton({
  iconName,
  label,
  onPress,
  disabled,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.smallActionButton,
        { opacity: pressed && !disabled ? 0.7 : disabled ? 0.5 : 1 },
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons
        name={iconName}
        size={18}
        color={disabled ? colors.textMuted : colors.textPrimary}
      />
      <Text
        style={[styles.smallActionLabel, disabled && styles.actionTextDisabled]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ActionButtons({
  onRecall,
  onPass,
  onPlay,
  onMix,
  onSwap,
  onResign,
  canPlay,
  isLoading,
  disabled,
  isMyTurn = true,
  pendingScore = 0,
  hasPendingTiles = false,
}: ActionButtonsProps) {
  // Mix is always available when game is active
  // Recall only available when there are tiles on the board
  // Swap/Pass require it to be your turn
  // Play requires canPlay (which already includes isMyTurn check)
  const turnDisabled = disabled || !isMyTurn;
  const recallDisabled = disabled || !hasPendingTiles;

  return (
    <View style={styles.container}>
      {/* Left side action buttons - now separate */}
      <View style={styles.leftActions}>
        <SmallActionButton
          iconName="arrow-undo-outline"
          label="Recall"
          onPress={onRecall}
          disabled={recallDisabled}
        />
        <SmallActionButton
          iconName="shuffle-outline"
          label="Mix"
          onPress={onMix ?? (() => {})}
          disabled={disabled}
        />
        <SmallActionButton
          iconName="swap-horizontal-outline"
          label="Swap"
          onPress={onSwap ?? (() => {})}
          disabled={turnDisabled}
        />
        <SmallActionButton
          iconName="play-skip-forward-outline"
          label="Pass"
          onPress={onPass}
          disabled={turnDisabled}
        />
        <SmallActionButton
          iconName="flag-outline"
          label="Resign"
          onPress={onResign ?? (() => {})}
          disabled={disabled}
        />
      </View>

      {/* Play button */}
      <Pressable
        style={({ pressed }) => [
          styles.playButton,
          (!canPlay || disabled) && styles.playButtonDisabled,
          {
            opacity:
              pressed && canPlay && !disabled
                ? 0.7
                : !canPlay || disabled
                  ? 0.6
                  : 1,
          },
        ]}
        onPress={onPlay}
        disabled={!canPlay || disabled}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <>
            <Text
              style={[
                styles.playText,
                (!canPlay || disabled) && styles.playTextDisabled,
              ]}
            >
              PLAY
            </Text>
            {pendingScore > 0 && (
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsText}>{pendingScore}pts</Text>
              </View>
            )}
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 8,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smallActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: colors.backgroundLight,
    borderRadius: 10,
    minWidth: 48,
  },
  smallActionLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  actionTextDisabled: {
    color: colors.textMuted,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    gap: 6,
  },
  playButtonDisabled: {
    backgroundColor: colors.buttonSecondary,
  },
  playText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  playTextDisabled: {
    color: colors.textMuted,
  },
  pointsBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pointsText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
});
