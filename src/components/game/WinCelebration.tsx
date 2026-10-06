import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { haptics } from '../../utils/haptics';
import {
  useIsLightAppearance,
  useThemeColors,
} from '../../hooks/useThemeColors';

const CONFETTI_COLORS = [
  '#F8D477',
  '#F0A968',
  '#58D6A7',
  '#7AB8EF',
  '#E78499',
  '#F5F1DF',
];
const CONFETTI_COUNT = 54;

interface ConfettiPieceData {
  x: number;
  width: number;
  height: number;
  drift: number;
  turns: number;
  delay: number;
  color: string;
}

function ConfettiPiece({
  piece,
  fallDistance,
  progress,
}: {
  piece: ConfettiPieceData;
  fallDistance: number;
  progress: SharedValue<number>;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const t = Math.max(
      0,
      Math.min(1, (progress.value - piece.delay) / (1 - piece.delay))
    );
    return {
      opacity: Math.min(1, t * 16, (1 - t) * 8),
      transform: [
        { translateX: Math.sin(t * Math.PI * 2) * piece.drift },
        { translateY: t * fallDistance },
        { rotate: `${t * piece.turns}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          left: piece.x,
          width: piece.width,
          height: piece.height,
          backgroundColor: piece.color,
        },
        animatedStyle,
      ]}
    />
  );
}

export function WinCelebration({
  visible,
  score,
  onDismiss,
}: {
  visible: boolean;
  score: number;
  onDismiss: () => void;
}) {
  const colors = useThemeColors();
  const isLight = useIsLightAppearance();
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const closingRef = useRef(false);
  const backdrop = useSharedValue(0);
  const hero = useSharedValue(0);
  const headline = useSharedValue(0);
  const footer = useSharedValue(0);
  const confetti = useSharedValue(0);

  const pieces = useMemo<ConfettiPieceData[]>(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, index) => ({
        x: ((index * 79) % 101) * (width / 101),
        width: index % 4 === 0 ? 7 : 10,
        height: index % 4 === 0 ? 16 : 9,
        drift: ((index * 37) % 95) - 47,
        turns: index % 2 === 0 ? 540 : -540,
        delay: ((index * 17) % 29) / 100,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length]!,
      })),
    [width]
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    closingRef.current = false;
    haptics.success();
    backdrop.value = reducedMotion ? 1 : 0;
    hero.value = reducedMotion ? 1 : 0;
    headline.value = reducedMotion ? 1 : 0;
    footer.value = reducedMotion ? 1 : 0;
    confetti.value = 0;

    if (reducedMotion) {
      return;
    }

    backdrop.value = withTiming(1, { duration: 350 });
    hero.value = withDelay(
      140,
      withSpring(1, { damping: 10, stiffness: 145, mass: 0.8 })
    );
    headline.value = withDelay(
      340,
      withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) })
    );
    footer.value = withDelay(
      650,
      withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) })
    );
    confetti.value = withTiming(1, {
      duration: 3600,
      easing: Easing.linear,
    });
  }, [visible, reducedMotion, backdrop, hero, headline, footer, confetti]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }));
  const heroStyle = useAnimatedStyle(() => ({
    opacity: hero.value,
    transform: [{ scale: 0.55 + hero.value * 0.45 }],
  }));
  const headlineStyle = useAnimatedStyle(() => ({
    opacity: headline.value,
    transform: [{ translateY: (1 - headline.value) * 22 }],
  }));
  const footerStyle = useAnimatedStyle(() => ({
    opacity: footer.value,
    transform: [{ translateY: (1 - footer.value) * 18 }],
  }));

  const handleDismiss = useCallback(() => {
    if (closingRef.current) {
      return;
    }
    closingRef.current = true;

    if (reducedMotion) {
      onDismiss();
      return;
    }

    backdrop.value = withTiming(0, { duration: 180 }, (finished) => {
      if (finished) {
        scheduleOnRN(onDismiss);
      }
    });
  }, [backdrop, onDismiss, reducedMotion]);

  return (
    <Modal
      visible={visible}
      animationType="none"
      onRequestClose={handleDismiss}
      statusBarTranslucent
      navigationBarTranslucent
      testID="win-celebration"
    >
      <StatusBar
        barStyle={isLight ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />
      <Animated.View
        style={[
          styles.screen,
          { backgroundColor: colors.background },
          backdropStyle,
        ]}
      >
        <LinearGradient
          colors={[
            colors.backgroundLight,
            colors.background,
            colors.boardBackground,
          ]}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[styles.glowTop, { backgroundColor: `${colors.primary}12` }]}
          pointerEvents="none"
        />
        <View
          style={[
            styles.glowBottom,
            { backgroundColor: `${colors.primary}0D` },
          ]}
          pointerEvents="none"
        />

        {!reducedMotion && (
          <View
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
            accessible={false}
          >
            {pieces.map((piece, index) => (
              <ConfettiPiece
                key={index}
                piece={piece}
                fallDistance={height + 100}
                progress={confetti}
              />
            ))}
          </View>
        )}

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.center}>
            <Animated.View style={[styles.hero, heroStyle]}>
              <View style={styles.heroHalo} />
              <View style={styles.heroRing}>
                <LinearGradient
                  colors={['#FCE6A2', '#EAB558', '#B97734']}
                  style={styles.heroDisc}
                >
                  <Ionicons name="trophy" size={68} color="#173A2D" />
                </LinearGradient>
              </View>
              <Text style={[styles.sparkle, styles.sparkleLeft]}>✦</Text>
              <Text style={[styles.sparkle, styles.sparkleRight]}>✦</Text>
            </Animated.View>

            <Animated.View style={[styles.headlineBlock, headlineStyle]}>
              <Text style={[styles.eyebrow, { color: colors.primary }]}>
                VICTORY
              </Text>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                You won!
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                What a game.
              </Text>
              <View
                style={[
                  styles.scoreCard,
                  {
                    borderColor: `${colors.primary}40`,
                    backgroundColor: `${colors.primary}12`,
                  },
                ]}
              >
                <Text style={[styles.scoreLabel, { color: colors.primary }]}>
                  FINAL SCORE
                </Text>
                <Text style={[styles.score, { color: colors.textPrimary }]}>
                  {score}
                </Text>
              </View>
            </Animated.View>
          </View>

          <Animated.View style={[styles.footer, footerStyle]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue after winning"
              onPress={handleDismiss}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: colors.primary },
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
                Continue
              </Text>
              <Ionicons
                name="arrow-forward"
                size={21}
                color={colors.onPrimary}
              />
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#081C1A',
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 28,
  },
  glowTop: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(253, 208, 113, 0.07)',
    top: -135,
    right: -120,
  },
  glowBottom: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(59, 198, 144, 0.08)',
    bottom: -165,
    left: -165,
  },
  confetti: {
    position: 'absolute',
    top: -22,
    borderRadius: 2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    width: 196,
    height: 196,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHalo: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
    borderColor: 'rgba(248, 212, 119, 0.3)',
  },
  heroRing: {
    width: 146,
    height: 146,
    borderRadius: 73,
    padding: 6,
    backgroundColor: 'rgba(250, 223, 150, 0.18)',
    shadowColor: '#F8D477',
    shadowOpacity: 0.46,
    shadowRadius: 35,
    elevation: 16,
  },
  heroDisc: {
    flex: 1,
    borderRadius: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
    color: '#FCE6A2',
    fontSize: 30,
  },
  sparkleLeft: {
    left: 1,
    top: 28,
  },
  sparkleRight: {
    right: 1,
    bottom: 23,
    fontSize: 23,
  },
  headlineBlock: {
    alignItems: 'center',
    marginTop: 24,
    width: '100%',
  },
  eyebrow: {
    color: '#F8D477',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 4,
    marginBottom: 7,
  },
  title: {
    color: '#F7F6EA',
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -2,
    textAlign: 'center',
  },
  subtitle: {
    color: '#A8C5B6',
    fontSize: 18,
    marginTop: 6,
  },
  scoreCard: {
    alignItems: 'center',
    marginTop: 34,
    paddingHorizontal: 42,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(248, 212, 119, 0.25)',
    backgroundColor: 'rgba(248, 212, 119, 0.07)',
    minWidth: 160,
  },
  scoreLabel: {
    color: '#D3BE88',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  score: {
    color: '#FFF3CF',
    fontSize: 40,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginTop: 1,
  },
  footer: {
    paddingBottom: 24,
  },
  button: {
    minHeight: 58,
    borderRadius: 29,
    backgroundColor: '#F8D477',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
  buttonText: {
    color: '#173A2D',
    fontSize: 18,
    fontWeight: '800',
  },
});
