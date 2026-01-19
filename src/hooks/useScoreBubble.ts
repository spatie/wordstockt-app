import { useRef, useState, useEffect } from 'react';
import { Animated, Platform } from 'react-native';

interface UseScoreBubbleOptions {
  score: number | null | undefined;
}

interface UseScoreBubbleResult {
  isVisible: boolean;
  opacity: Animated.Value;
  displayScore: number | null;
}

/**
 * Hook to manage score bubble visibility and fade animations.
 * - Fades in when score appears (> 0)
 * - Fades out when score disappears
 * - Pulses when score changes
 * - Hides when score is 0 or null
 */
export function useScoreBubble({
  score,
}: UseScoreBubbleOptions): UseScoreBubbleResult {
  const opacity = useRef(new Animated.Value(0)).current;
  const prevScoreRef = useRef<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Treat 0 or null as "no score"
  const displayScore = score && score > 0 ? score : null;
  const prevDisplayScore =
    prevScoreRef.current && prevScoreRef.current > 0
      ? prevScoreRef.current
      : null;

  useEffect(() => {
    const useNativeDriver = Platform.OS !== 'web';

    if (displayScore !== null && prevDisplayScore === null) {
      // Score appeared - show and fade in
      setIsVisible(true);
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver,
      }).start();
    } else if (displayScore === null && prevDisplayScore !== null) {
      // Score disappeared - fade out then hide
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver,
      }).start(() => {
        setIsVisible(false);
      });
    } else if (
      displayScore !== null &&
      prevDisplayScore !== null &&
      displayScore !== prevDisplayScore
    ) {
      // Score changed - pulse animation
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 150,
          useNativeDriver,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver,
        }),
      ]).start();
    }

    prevScoreRef.current = score ?? null;
  }, [displayScore, prevDisplayScore, opacity, score]);

  // Return the display score, or the previous score during fade-out
  const scoreToShow = displayScore ?? prevScoreRef.current;

  return {
    isVisible,
    opacity,
    displayScore: scoreToShow,
  };
}
