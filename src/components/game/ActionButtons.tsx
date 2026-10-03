import type { ThemeColors } from '../../config/theme';
import { useThemeColors, useThemedStyles } from '../../hooks/useThemeColors';
import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuView } from '@react-native-menu/menu';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { LAYOUT } from '../../config/constants';

interface ActionButtonsProps {
  onRecall: () => void;
  onPass: () => void;
  onPlay: () => void;
  onMix?: () => void;
  onSwap?: () => void;
  onResign?: () => void;
  onDictionary?: () => void;
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
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const opacity = useSharedValue(disabled ? 0.72 : 1);

  useEffect(() => {
    opacity.value = withTiming(disabled ? 0.72 : 1, { duration: 200 });
  }, [disabled, opacity]);

  const wrapperStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.smallActionButtonWrapper, wrapperStyle]}>
      <Pressable
        style={({ pressed }) => [
          styles.smallActionButton,
          pressed && !disabled && { opacity: 0.7 },
        ]}
        onPress={onPress}
        disabled={disabled}
      >
        <Ionicons
          name={iconName}
          size={20}
          color={disabled ? colors.textMuted : colors.textPrimary}
        />
        <Text
          style={[
            styles.smallActionLabel,
            disabled && styles.actionTextDisabled,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ActionButtons({
  onRecall,
  onPass,
  onPlay,
  onMix,
  onSwap,
  onResign,
  onDictionary,
  canPlay,
  isLoading,
  disabled,
  isMyTurn = true,
  pendingScore = 0,
  hasPendingTiles = false,
}: ActionButtonsProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const turnDisabled = disabled || !isMyTurn;
  const recallDisabled = disabled || !hasPendingTiles;
  const playActive = canPlay && !disabled && isMyTurn;

  // PLAY button animations
  // progress: 0 = disabled, 1 = active
  const playProgress = useSharedValue(playActive ? 1 : 0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (playActive) {
      playProgress.value = withTiming(1, { duration: 250 });
      pulseScale.value = withRepeat(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      playProgress.value = withTiming(0, { duration: 250 });
      pulseScale.value = withSpring(1, { damping: 15, stiffness: 120 });
    }
  }, [playActive, playProgress, pulseScale]);

  const playAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    backgroundColor: interpolateColor(
      playProgress.value,
      [0, 1],
      [colors.buttonSecondary, colors.primary]
    ),
    shadowOpacity: playProgress.value * 0.4,
  }));

  return (
    <View style={styles.container}>
      {/* Everyday actions up front; rarer ones in the More menu */}
      <View style={styles.actionsRow}>
        {hasPendingTiles ? (
          <SmallActionButton
            iconName="arrow-undo-outline"
            label="Recall"
            onPress={onRecall}
            disabled={recallDisabled}
          />
        ) : (
          <SmallActionButton
            iconName="shuffle-outline"
            label="Shuffle"
            onPress={onMix ?? (() => {})}
            disabled={disabled}
          />
        )}
        <SmallActionButton
          iconName="swap-horizontal-outline"
          label="Swap"
          onPress={onSwap ?? (() => {})}
          disabled={turnDisabled}
        />
        <MenuView
          testID="more-actions"
          style={styles.smallActionButtonWrapper}
          shouldOpenOnLongPress={false}
          actions={[
            {
              id: 'pass',
              title: 'Pass',
              image: 'forward.end',
              attributes: { disabled: turnDisabled },
            },
            { id: 'dictionary', title: 'Dictionary', image: 'book' },
            {
              id: 'resign',
              title: 'Resign',
              image: 'flag',
              attributes: { destructive: true, disabled },
            },
          ]}
          onPressAction={({ nativeEvent }) => {
            if (nativeEvent.event === 'pass') onPass();
            if (nativeEvent.event === 'dictionary') onDictionary?.();
            if (nativeEvent.event === 'resign') onResign?.();
          }}
        >
          <View style={styles.smallActionButton}>
            <Ionicons
              name="ellipsis-horizontal"
              size={20}
              color={colors.textPrimary}
            />
            <Text style={styles.smallActionLabel}>More</Text>
          </View>
        </MenuView>
      </View>

      {/* Round PLAY button */}
      <AnimatedPressable
        style={[styles.playButton, playAnimatedStyle]}
        onPress={onPlay}
        disabled={!canPlay || disabled}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <View style={styles.playContent}>
            <Text
              style={[
                styles.playText,
                (!canPlay || disabled) && styles.playTextDisabled,
              ]}
            >
              PLAY
            </Text>
            {pendingScore > 0 && (
              <Text
                style={[
                  styles.playScore,
                  (!canPlay || disabled) && styles.playTextDisabled,
                ]}
              >
                {pendingScore}
              </Text>
            )}
          </View>
        )}
      </AnimatedPressable>
    </View>
  );
}

const PLAY_SIZE = 72;

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
      paddingBottom: 16,
      gap: 10,
      maxWidth: LAYOUT.gameControlsMaxWidth,
      width: '100%',
      alignSelf: 'center',
    },
    actionsRow: {
      flex: 1,
      flexDirection: 'row',
      gap: 8,
    },
    smallActionButtonWrapper: {
      flex: 1,
    },
    smallActionButton: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 56,
      backgroundColor: colors.backgroundLight,
      borderRadius: 14,
    },
    smallActionLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 3,
    },
    actionTextDisabled: {
      color: colors.textMuted,
    },
    playButton: {
      width: PLAY_SIZE,
      height: PLAY_SIZE,
      borderRadius: PLAY_SIZE / 2,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
    },
    playContent: {
      alignItems: 'center',
    },
    playText: {
      color: colors.onPrimary,
      fontSize: 13,
      fontWeight: 'bold',
      letterSpacing: 1,
    },
    playTextDisabled: {
      color: colors.textSecondary,
    },
    playScore: {
      color: colors.onPrimary,
      opacity: 0.75,
      fontSize: 11,
      fontWeight: '600',
      marginTop: 1,
    },
  });
