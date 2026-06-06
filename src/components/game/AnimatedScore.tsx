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

const DIGIT_HEIGHT = 22;
const ANIMATION_DURATION = 500;
const ANIMATION_START_DELAY = 400;
const STAGGER_DELAY = 50;

interface AnimatedScoreProps {
  score: number;
  fontSize?: number;
  style?: object;
}

const AnimatedDigit = memo(function AnimatedDigit({
  digit,
  digitIndex,
  totalDigits,
  scoreChanged,
  digitHeight,
  fontSize,
}: {
  digit: string;
  digitIndex: number;
  totalDigits: number;
  scoreChanged: number;
  digitHeight: number;
  fontSize: number;
}) {
  const translateY = useSharedValue(0);
  const prevDigit = useRef(digit);
  const isFirstRender = useRef(true);
  const currentDigitValue = digit === '-' ? 10 : parseInt(digit, 10);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      translateY.set(-currentDigitValue * digitHeight);
      return;
    }

    if (prevDigit.current !== digit) {
      const staggerIndex = totalDigits - 1 - digitIndex;
      const delay = ANIMATION_START_DELAY + staggerIndex * STAGGER_DELAY;

      translateY.set(
        withDelay(
          delay,
          withTiming(-currentDigitValue * digitHeight, {
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
    scoreChanged,
    digitHeight,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={[styles.digitContainer, { height: digitHeight }]}>
      <Animated.View style={[styles.digitStrip, animatedStyle]}>
        {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-'].map((d) => (
          <View key={d} style={[styles.digitWrapper, { height: digitHeight }]}>
            <Text
              style={[
                styles.digit,
                { fontSize, lineHeight: digitHeight, minWidth: fontSize * 0.7 },
              ]}
            >
              {d}
            </Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
});

export function AnimatedScore({
  score,
  fontSize = 16,
  style,
}: AnimatedScoreProps) {
  const scale = useSharedValue(1);
  const prevScore = useRef(score);
  const isFirstRender = useRef(true);
  const changeCounter = useRef(0);

  const scoreString = score.toString();
  const digits = scoreString.split('');
  const digitHeight = fontSize * 1.4;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevScore.current = score;
      return;
    }

    if (prevScore.current !== score) {
      prevScore.current = score;
      changeCounter.current += 1;

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
  }, [score, scale]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.container, style, containerStyle]}>
      {digits.map((digit, index) => (
        // Key by place value (position from the RIGHT) so a given column keeps a
        // stable key across digit-count boundaries (e.g. 9 -> 10, 99 -> 100).
        <AnimatedDigit
          key={`pos-${digits.length - 1 - index}`}
          digit={digit}
          digitIndex={index}
          totalDigits={digits.length}
          scoreChanged={changeCounter.current}
          digitHeight={digitHeight}
          fontSize={fontSize}
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
    fontSize: 16,
    lineHeight: DIGIT_HEIGHT,
    textAlign: 'center',
    minWidth: 11,
  },
});
