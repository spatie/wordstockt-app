import React, { useEffect, useRef, memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../config/theme';

const DIGIT_HEIGHT = 18;
const ANIMATION_DURATION = 500;
const ANIMATION_START_DELAY = 400;
const STAGGER_DELAY = 50;

interface AnimatedTilesCountProps {
  count: number;
}

const AnimatedDigit = memo(function AnimatedDigit({
  digit,
  digitIndex,
  totalDigits,
  countChanged,
}: {
  digit: string;
  digitIndex: number;
  totalDigits: number;
  countChanged: number;
}) {
  const translateY = useSharedValue(0);
  const prevDigit = useRef(digit);
  const isFirstRender = useRef(true);
  const currentDigitValue = parseInt(digit, 10);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      translateY.set(-currentDigitValue * DIGIT_HEIGHT);
      return;
    }

    if (prevDigit.current !== digit) {
      // Calculate the stagger delay - rightmost digits animate first (like a real counter)
      const staggerIndex = totalDigits - 1 - digitIndex;
      const delay = ANIMATION_START_DELAY + staggerIndex * STAGGER_DELAY;

      translateY.set(
        withDelay(
          delay,
          withTiming(-currentDigitValue * DIGIT_HEIGHT, {
            duration: ANIMATION_DURATION,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          })
        )
      );

      prevDigit.current = digit;
    }
  }, [
    digit,
    currentDigitValue,
    digitIndex,
    totalDigits,
    translateY,
    countChanged,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.digitContainer}>
      <Animated.View style={[styles.digitStrip, animatedStyle]}>
        {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <View key={d} style={styles.digitWrapper}>
            <Text style={styles.digit}>{d}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
});

export function AnimatedTilesCount({ count }: AnimatedTilesCountProps) {
  const scale = useSharedValue(1);
  const prevCount = useRef(count);
  const isFirstRender = useRef(true);
  const changeCounter = useRef(0);

  const countString = count.toString();
  const digits = countString.split('');

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevCount.current = count;
      return;
    }

    if (prevCount.current !== count) {
      prevCount.current = count;
      changeCounter.current += 1;

      // Scale pop animation with delay - snappy spring
      scale.set(
        withDelay(
          ANIMATION_START_DELAY,
          withSequence(
            withSpring(1.12, {
              damping: 6,
              stiffness: 500,
              mass: 0.5,
            }),
            withSpring(1, {
              damping: 8,
              stiffness: 300,
              mass: 0.5,
            })
          )
        )
      );
    }
  }, [count, scale]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {digits.map((digit, index) => (
        <AnimatedDigit
          key={`pos-${index}`}
          digit={digit}
          digitIndex={index}
          totalDigits={digits.length}
          countChanged={changeCounter.current}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  digitContainer: {
    height: DIGIT_HEIGHT,
    overflow: 'hidden',
  },
  digitStrip: {
    flexDirection: 'column',
  },
  digitWrapper: {
    height: DIGIT_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digit: {
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: DIGIT_HEIGHT,
    textAlign: 'center',
    minWidth: 9,
  },
});
