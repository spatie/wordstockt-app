import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../../config/theme';
import { SPACING, RADIUS } from '../../config/constants';

// Animated version of BlurView for native
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface SwapModeOverlayProps {
  visible: boolean;
  selectedCount: number;
  onSwap: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

/**
 * Dark overlay that covers the board area during swap mode.
 * Shows instruction text and swap/cancel buttons.
 * The rack remains visible below this overlay.
 */
export function SwapModeOverlay({
  visible,
  selectedCount,
  onSwap,
  onCancel,
  isLoading,
}: SwapModeOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in overlay, then fade in text
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Fade out both simultaneously
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(textFadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, textFadeAnim]);

  if (!visible) return null;

  const canSwap = selectedCount > 0;

  const overlayTextContent = (
    <Animated.View style={[styles.textContainer, { opacity: textFadeAnim }]}>
      <Text style={styles.instruction}>
        Tap tiles to select them for swapping
      </Text>
      <Text style={styles.hint}>
        Selected tiles will be replaced with new ones from the bag
      </Text>
    </Animated.View>
  );

  return (
    <>
      {/* Dark overlay covering the board area - rendered as sibling to position correctly */}
      {Platform.OS !== 'web' ? (
        <AnimatedBlurView
          intensity={50}
          tint="dark"
          style={[styles.darkOverlayNative, { opacity: fadeAnim }]}
          pointerEvents="none"
        >
          {overlayTextContent}
        </AnimatedBlurView>
      ) : (
        <Animated.View
          style={[styles.darkOverlay, { opacity: fadeAnim }]}
          pointerEvents="none"
        >
          {overlayTextContent}
        </Animated.View>
      )}

      {/* Button area - replaces ActionButtons when in swap mode */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isLoading}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.swapButton, !canSwap && styles.swapButtonDisabled]}
          onPress={onSwap}
          disabled={!canSwap || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text
              style={[styles.swapText, !canSwap && styles.swapTextDisabled]}
            >
              Swap {selectedCount} {selectedCount === 1 ? 'tile' : 'tiles'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}

/**
 * Just the dark overlay portion - for use when needing to position
 * the overlay separately from the buttons.
 */
export function SwapModeDarkOverlay({
  visible,
  isExiting,
  swapCompleted,
  onExitComplete,
  hasFreeSwap,
}: {
  visible: boolean;
  isExiting: boolean;
  swapCompleted: boolean;
  onExitComplete: () => void;
  hasFreeSwap: boolean;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const hasAnimatedIn = useRef(false);
  const hasStartedExit = useRef(false);

  // Handle enter animation
  useEffect(() => {
    if (visible && !isExiting && !hasAnimatedIn.current) {
      hasAnimatedIn.current = true;
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, isExiting, fadeAnim, textFadeAnim]);

  // Handle exit animation
  useEffect(() => {
    if (isExiting && !hasStartedExit.current) {
      hasStartedExit.current = true;
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(textFadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          onExitComplete();
        }
      });
    }
  }, [isExiting, fadeAnim, textFadeAnim, onExitComplete]);

  // Reset refs when swap mode ends
  useEffect(() => {
    if (!visible) {
      hasAnimatedIn.current = false;
      hasStartedExit.current = false;
      fadeAnim.setValue(0);
      textFadeAnim.setValue(0);
    }
  }, [visible, fadeAnim, textFadeAnim]);

  // Don't render if not visible and not exiting
  if (!visible && !isExiting) return null;

  // Show different message when swap is completed
  const instructionText = swapCompleted
    ? 'Tiles swapped successfully!'
    : 'Tap tiles to select them for swapping';

  let hintText: string;
  let subHintText: string | null = null;
  if (swapCompleted) {
    hintText = 'Your new tiles are ready';
  } else if (hasFreeSwap) {
    hintText = 'This is a free swap — it will still be your turn';
    subHintText = 'You get one free swap per game';
  } else {
    hintText = 'This swap will cost your turn';
  }

  const overlayContent = (
    <Animated.View style={[styles.textContainer, { opacity: textFadeAnim }]}>
      <Text style={styles.instruction}>{instructionText}</Text>
      <Text style={styles.hint}>{hintText}</Text>
      {subHintText && <Text style={styles.subHint}>{subHintText}</Text>}
    </Animated.View>
  );

  // Native: use BlurView for blur effect
  if (Platform.OS !== 'web') {
    return (
      <AnimatedBlurView
        intensity={50}
        tint="dark"
        style={[styles.darkOverlayNative, { opacity: fadeAnim }]}
        pointerEvents="none"
      >
        {overlayContent}
      </AnimatedBlurView>
    );
  }

  // Web: use CSS backdrop-filter
  return (
    <Animated.View
      style={[styles.darkOverlay, { opacity: fadeAnim }]}
      pointerEvents="none"
    >
      {overlayContent}
    </Animated.View>
  );
}

/**
 * Just the buttons portion - for use when needing to position
 * buttons separately from the overlay.
 */
export function SwapModeButtons({
  selectedCount,
  swapCompleted,
  onSwap,
  onCancel,
  onDismiss,
  isLoading,
}: {
  selectedCount: number;
  swapCompleted: boolean;
  onSwap: () => void;
  onCancel: () => void;
  onDismiss: () => void;
  isLoading: boolean;
}) {
  const canSwap = selectedCount > 0;

  // Show "Ok" button after swap completes
  if (swapCompleted) {
    return (
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.okButton} onPress={onDismiss}>
          <Text style={styles.okText}>Ok</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={onCancel}
        disabled={isLoading}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.swapButton, !canSwap && styles.swapButtonDisabled]}
        onPress={onSwap}
        disabled={!canSwap || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <Text style={[styles.swapText, !canSwap && styles.swapTextDisabled]}>
            Swap {selectedCount} {selectedCount === 1 ? 'tile' : 'tiles'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
    zIndex: 50,
    // @ts-ignore - backdropFilter works on web
    backdropFilter: 'blur(8px)',
  },
  darkOverlayNative: {
    ...StyleSheet.absoluteFillObject,
    // iOS: lighter bg since BlurView provides real blur
    // Android: darker bg since BlurView doesn't support blur
    backgroundColor:
      Platform.OS === 'ios' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
    zIndex: 50,
  },
  textContainer: {
    alignItems: 'center',
  },
  instruction: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  subHint: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
    minHeight: 70,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: RADIUS.round,
    backgroundColor: colors.backgroundLight,
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  swapButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: RADIUS.round,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  swapButtonDisabled: {
    backgroundColor: colors.buttonSecondary,
    opacity: 0.6,
  },
  swapText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  swapTextDisabled: {
    color: colors.textMuted,
  },
  okButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: RADIUS.round,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  okText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
