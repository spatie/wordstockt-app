import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import type { ThemeColors } from '../../config/theme';
import { useThemedStyles } from '../../hooks/useThemeColors';

export interface Celebration {
  id: number;
  title: string;
  score: number;
}

// A move is worth celebrating when it uses the whole rack or scores big
export const BIG_MOVE_SCORE = 50;

export function celebrationFor(
  tilesPlayed: number,
  score: number | undefined,
  id: number
): Celebration | null {
  if (score === undefined) {
    return null;
  }

  if (tilesPlayed >= 7) {
    return { id, title: 'BINGO!', score };
  }

  if (score >= BIG_MOVE_SCORE) {
    return { id, title: 'Great move!', score };
  }

  return null;
}

const PARTICLE_COLORS = ['#E74C3C', '#4A90D9', '#F5A623', '#27AE60', '#9B59B6'];
const PARTICLE_COUNT = 14;
const VISIBLE_MS = 1500;

function Particle({ index }: { index: number }) {
  const progress = useSharedValue(0);
  const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
  const distance = 110 + (index % 3) * 30;

  useEffect(() => {
    progress.set(
      withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) })
    );
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.get(),
    transform: [
      { translateX: Math.cos(angle) * distance * progress.get() },
      { translateY: Math.sin(angle) * distance * progress.get() },
      { rotate: `${progress.get() * 180}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        particleStyles.particle,
        { backgroundColor: PARTICLE_COLORS[index % PARTICLE_COLORS.length] },
        style,
      ]}
    />
  );
}

/**
 * A short, non-blocking celebration for bingos and big scores: the title
 * pops in with the score, small tiles burst outward, and it fades away.
 */
export function MoveCelebration({
  celebration,
  onDone,
}: {
  celebration: Celebration | null;
  onDone: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!celebration) {
      return;
    }

    scale.set(0.6);
    scale.set(withSpring(1, { damping: 9, stiffness: 160 }));
    opacity.set(
      withSequence(
        withTiming(1, { duration: 150 }),
        withDelay(
          VISIBLE_MS,
          withTiming(0, { duration: 300 }, (finished) => {
            if (finished) {
              scheduleOnRN(onDone);
            }
          })
        )
      )
    );
  }, [celebration, scale, opacity, onDone]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ scale: scale.get() }],
  }));

  if (!celebration) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View style={[styles.content, contentStyle]}>
        {Array.from({ length: PARTICLE_COUNT }, (_, index) => (
          <Particle key={`${celebration.id}-${index}`} index={index} />
        ))}
        <Text style={styles.title}>{celebration.title}</Text>
        <Text style={styles.score}>+{celebration.score}</Text>
      </Animated.View>
    </View>
  );
}

const particleStyles = StyleSheet.create({
  particle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 3,
  },
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      paddingVertical: 20,
      borderRadius: 24,
      backgroundColor: colors.backgroundLight,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 12,
    },
    title: {
      fontSize: 34,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 1,
    },
    score: {
      marginTop: 4,
      fontSize: 22,
      fontWeight: '700',
      color: colors.textPrimary,
      fontVariant: ['tabular-nums'],
    },
  });
