import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  SharedValue,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../config/theme';

type LogoTileSize = 'small' | 'medium' | 'large';

interface AnimatedLogoTileProps {
  letter: string;
  size?: LogoTileSize;
  animationTrigger: SharedValue<number>;
  delay?: number;
}

const SIZES = {
  small: { tile: 24, font: 14 },
  medium: { tile: 28, font: 16 },
  large: { tile: 100, font: 48 },
} as const;

export function AnimatedLogoTile({
  letter,
  size = 'medium',
  animationTrigger,
  delay = 0,
}: AnimatedLogoTileProps) {
  const dimensions = SIZES[size];

  const animatedStyle = useAnimatedStyle(() => {
    const trigger = animationTrigger.value;

    if (trigger === 0) {
      return {
        transform: [{ scale: 1 }, { rotate: '0deg' }, { translateY: 0 }],
      };
    }

    // Whimsical bounce and wiggle animation with easing
    return {
      transform: [
        {
          scale: withDelay(
            delay,
            withSequence(
              withTiming(1.35, {
                duration: 120,
                easing: Easing.out(Easing.back(3)),
              }),
              withTiming(0.9, {
                duration: 100,
                easing: Easing.inOut(Easing.quad),
              }),
              withTiming(1.1, {
                duration: 80,
                easing: Easing.out(Easing.quad),
              }),
              withTiming(1, {
                duration: 150,
                easing: Easing.out(Easing.elastic(1.5)),
              })
            )
          ),
        },
        {
          rotate: withDelay(
            delay,
            withSequence(
              withTiming('-15deg', {
                duration: 70,
                easing: Easing.out(Easing.quad),
              }),
              withTiming('15deg', {
                duration: 90,
                easing: Easing.inOut(Easing.sin),
              }),
              withTiming('-10deg', {
                duration: 80,
                easing: Easing.inOut(Easing.sin),
              }),
              withTiming('8deg', {
                duration: 70,
                easing: Easing.inOut(Easing.sin),
              }),
              withTiming('0deg', {
                duration: 120,
                easing: Easing.out(Easing.back(2)),
              })
            )
          ),
        },
        {
          translateY: withDelay(
            delay,
            withSequence(
              withTiming(-10, {
                duration: 100,
                easing: Easing.out(Easing.back(2)),
              }),
              withTiming(2, {
                duration: 120,
                easing: Easing.inOut(Easing.quad),
              }),
              withTiming(0, {
                duration: 150,
                easing: Easing.out(Easing.elastic(1.2)),
              })
            )
          ),
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.tile,
        {
          width: dimensions.tile,
          height: dimensions.tile,
          borderRadius: size === 'large' ? 16 : 4,
        },
        animatedStyle,
      ]}
    >
      <Animated.Text style={[styles.letter, { fontSize: dimensions.font }]}>
        {letter}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  letter: {
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
  },
});
