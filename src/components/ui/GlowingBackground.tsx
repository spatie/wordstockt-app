import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StaticOrbProps {
  size: number;
  color: string;
  opacity: number;
  gradientId: string;
}

function StaticOrb({ size, color, opacity, gradientId }: StaticOrbProps) {
  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id={gradientId} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <Stop offset="30%" stopColor={color} stopOpacity={opacity * 0.5} />
          <Stop offset="60%" stopColor={color} stopOpacity={opacity * 0.15} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse
        cx={size / 2}
        cy={size / 2}
        rx={size / 2}
        ry={size / 2}
        fill={`url(#${gradientId})`}
      />
    </Svg>
  );
}

interface OrbProps {
  size: number;
  colors: string[];
  opacity: number;
  initialX: number;
  initialY: number;
  moveRangeX: number;
  moveRangeY: number;
  moveDuration: number;
  minScale: number;
  maxScale: number;
  scaleDuration: number;
  colorDuration: number;
  gradientIdPrefix: string;
  initialDelay?: number;
  startProgress?: number;
}

function GlowOrb({
  size,
  colors,
  opacity,
  initialX,
  initialY,
  moveRangeX,
  moveRangeY,
  moveDuration,
  minScale,
  maxScale,
  scaleDuration,
  colorDuration,
  gradientIdPrefix,
  initialDelay = 0,
  startProgress = 0,
}: OrbProps) {
  const moveProgress = useSharedValue(startProgress);
  const scaleProgress = useSharedValue(startProgress);
  const colorProgress = useSharedValue(startProgress);

  useEffect(() => {
    const startAnimation = () => {
      moveProgress.value = withRepeat(
        withTiming(1, {
          duration: moveDuration,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );

      scaleProgress.value = withRepeat(
        withTiming(1, {
          duration: scaleDuration,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );

      colorProgress.value = withRepeat(
        withTiming(1, {
          duration: colorDuration,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    };

    if (initialDelay > 0) {
      const timeout = setTimeout(startAnimation, initialDelay);
      return () => clearTimeout(timeout);
    }

    startAnimation();
  }, [
    moveDuration,
    scaleDuration,
    colorDuration,
    moveProgress,
    scaleProgress,
    colorProgress,
    initialDelay,
  ]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scaleProgress.value,
      [0, 0.5, 1],
      [minScale, maxScale, minScale]
    );

    return {
      transform: [
        {
          translateX: interpolate(
            moveProgress.value,
            [0, 0.2, 0.4, 0.6, 0.8, 1],
            [
              0,
              moveRangeX * 0.6,
              moveRangeX,
              moveRangeX * 0.4,
              -moveRangeX * 0.2,
              0,
            ]
          ),
        },
        {
          translateY: interpolate(
            moveProgress.value,
            [0, 0.2, 0.4, 0.6, 0.8, 1],
            [
              0,
              moveRangeY * 0.4,
              moveRangeY,
              moveRangeY * 0.7,
              moveRangeY * 0.3,
              0,
            ]
          ),
        },
        { scale },
      ],
    };
  });

  const secondColorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(colorProgress.value, [0, 0.5, 1], [0, 1, 0]),
  }));

  return (
    <Animated.View
      style={[
        styles.orbContainer,
        {
          width: size,
          height: size,
          left: initialX,
          top: initialY,
        },
        animatedStyle,
      ]}
    >
      <StaticOrb
        size={size}
        color={colors[0]}
        opacity={opacity}
        gradientId={`${gradientIdPrefix}-1`}
      />
      <Animated.View style={[StyleSheet.absoluteFill, secondColorStyle]}>
        <StaticOrb
          size={size}
          color={colors[1]}
          opacity={opacity}
          gradientId={`${gradientIdPrefix}-2`}
        />
      </Animated.View>
    </Animated.View>
  );
}

// Color palettes for randomization
const COLOR_PAIRS = [
  ['#4A90D9', '#7C3AED'], // Blue/Purple
  ['#22C55E', '#14B8A6'], // Green/Teal
  ['#EF4444', '#EC4899'], // Red/Pink
  ['#06B6D4', '#3B82F6'], // Cyan/Blue
  ['#F97316', '#FBBF24'], // Orange/Yellow
  ['#8B5CF6', '#EC4899'], // Purple/Pink
];

// Shuffle array helper
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function GlowingBackground() {
  // Randomize on mount - useMemo ensures values persist during component lifetime
  const randomValues = useMemo(() => {
    const shuffledColors = shuffleArray(COLOR_PAIRS);
    return {
      colors: shuffledColors.slice(0, 4),
      startProgress: [
        Math.random(),
        Math.random(),
        Math.random(),
        Math.random(),
      ],
      positionOffsets: [
        { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 },
        { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 },
        { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 },
        { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 },
      ],
    };
  }, []);

  const orbSize1 = Math.min(SCREEN_WIDTH * 1.6, 620);
  const orbSize2 = Math.min(SCREEN_WIDTH * 1.2, 460);
  const orbSize3 = Math.min(SCREEN_WIDTH * 1.4, 540);
  const orbSize4 = Math.min(SCREEN_WIDTH * 1.0, 380);

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Orb 1 - top right area */}
      <GlowOrb
        size={orbSize1}
        colors={randomValues.colors[0]}
        opacity={0.4}
        initialX={
          SCREEN_WIDTH - orbSize1 * 0.3 + randomValues.positionOffsets[0].x
        }
        initialY={-orbSize1 * 0.4 + randomValues.positionOffsets[0].y}
        moveRangeX={-80}
        moveRangeY={100}
        moveDuration={32000}
        minScale={0.8}
        maxScale={1.2}
        scaleDuration={24000}
        colorDuration={16000}
        gradientIdPrefix="orb1"
        startProgress={randomValues.startProgress[0]}
      />

      {/* Orb 2 - left side */}
      <GlowOrb
        size={orbSize2}
        colors={randomValues.colors[1]}
        opacity={0.35}
        initialX={-orbSize2 * 0.35 + randomValues.positionOffsets[1].x}
        initialY={SCREEN_HEIGHT * 0.18 + randomValues.positionOffsets[1].y}
        moveRangeX={90}
        moveRangeY={-60}
        moveDuration={38000}
        minScale={0.85}
        maxScale={1.25}
        scaleDuration={28000}
        colorDuration={20000}
        gradientIdPrefix="orb2"
        startProgress={randomValues.startProgress[1]}
      />

      {/* Orb 3 - bottom area */}
      <GlowOrb
        size={orbSize3}
        colors={randomValues.colors[2]}
        opacity={0.3}
        initialX={SCREEN_WIDTH * 0.2 + randomValues.positionOffsets[2].x}
        initialY={
          SCREEN_HEIGHT - orbSize3 * 0.15 + randomValues.positionOffsets[2].y
        }
        moveRangeX={70}
        moveRangeY={-90}
        moveDuration={35000}
        minScale={0.82}
        maxScale={1.18}
        scaleDuration={22000}
        colorDuration={14000}
        gradientIdPrefix="orb3"
        startProgress={randomValues.startProgress[2]}
      />

      {/* Orb 4 - center */}
      <GlowOrb
        size={orbSize4}
        colors={randomValues.colors[3]}
        opacity={0.25}
        initialX={SCREEN_WIDTH * 0.4 + randomValues.positionOffsets[3].x}
        initialY={SCREEN_HEIGHT * 0.4 + randomValues.positionOffsets[3].y}
        moveRangeX={-60}
        moveRangeY={80}
        moveDuration={42000}
        minScale={0.88}
        maxScale={1.15}
        scaleDuration={30000}
        colorDuration={18000}
        gradientIdPrefix="orb4"
        startProgress={randomValues.startProgress[3]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orbContainer: {
    position: 'absolute',
  },
});
