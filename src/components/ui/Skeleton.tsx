import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { ThemeColors } from '../../config/theme';
import { useThemedStyles } from '../../hooks/useThemeColors';
import { GroupedRow } from './GroupedRow';

// Placeholders in the shape of the content that's loading, so the screen
// doesn't jump when the data arrives

function usePulse() {
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    opacity.set(
      withRepeat(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, [opacity]);

  return useAnimatedStyle(() => ({ opacity: opacity.get() }));
}

export function Skeleton({
  width,
  height,
  radius = 6,
  style,
}: {
  width: DimensionValue;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useThemedStyles(createStyles);
  const pulse = usePulse();

  return (
    <Animated.View
      style={[
        styles.block,
        { width, height, borderRadius: radius },
        pulse,
        style,
      ]}
    />
  );
}

export function GameCardSkeleton() {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Skeleton width={48} height={48} radius={24} />
        <View style={styles.lines}>
          <Skeleton width="55%" height={16} />
          <Skeleton width="75%" height={13} />
        </View>
        <Skeleton width={60} height={18} />
      </View>
      <View style={[styles.row, styles.footer]}>
        <Skeleton width="45%" height={12} />
        <Skeleton width={72} height={32} radius={16} />
      </View>
    </View>
  );
}

export function ListRowSkeletons({ count = 6 }: { count?: number }) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.list}>
      {Array.from({ length: count }, (_, index) => (
        <GroupedRow
          key={index}
          isFirst={index === 0}
          isLast={index === count - 1}
        >
          <Skeleton width={44} height={44} radius={22} />
          <View style={styles.lines}>
            <Skeleton width="40%" height={15} />
            <Skeleton width="25%" height={12} />
          </View>
        </GroupedRow>
      ))}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    block: {
      backgroundColor: colors.border,
    },
    card: {
      backgroundColor: colors.cardSurface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    footer: {
      marginTop: 16,
      justifyContent: 'space-between',
    },
    lines: {
      flex: 1,
      gap: 8,
      marginLeft: 12,
    },
    list: {
      padding: 16,
    },
  });
