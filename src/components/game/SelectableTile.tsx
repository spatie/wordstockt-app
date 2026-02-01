import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Animated, Pressable, Platform } from 'react-native';
import { Tile } from './Tile';
import {
  TILE_SIZE,
  SPRING_CONFIG,
  ANIMATION_DURATION,
} from '../../config/constants';
import type { Tile as TileType } from '../../types';

interface SelectableTileProps {
  tile: TileType;
  isSelected: boolean;
  isSwapped: boolean; // True if this tile was just swapped (for fade-in animation)
  swapCompleted: boolean; // True if swap is complete and showing result
  onToggle: () => void;
}

const LIFT_AMOUNT = -8; // pixels to lift when selected

export function SelectableTile({
  tile,
  isSelected,
  isSwapped,
  swapCompleted,
  onToggle,
}: SelectableTileProps) {
  const liftAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const prevSwapCompletedRef = useRef(swapCompleted);

  // Store the old tile when selected (before swap happens)
  const selectedTileRef = useRef<TileType | null>(null);
  const [displayTile, setDisplayTile] = useState(tile);
  const [isAnimatingSwap, setIsAnimatingSwap] = useState(false);

  // Capture tile when it becomes selected (this is the "old" tile before swap)
  useEffect(() => {
    if (isSelected) {
      selectedTileRef.current = tile;
    }
  }, [isSelected, tile]);

  // Tile should be lifted when selected OR when it's a swapped tile showing results
  const shouldLift = isSelected || (isSwapped && swapCompleted);

  // Animate lift when selected or showing swap result
  useEffect(() => {
    Animated.spring(liftAnim, {
      toValue: shouldLift ? LIFT_AMOUNT : 0,
      useNativeDriver: Platform.OS !== 'web',
      ...SPRING_CONFIG,
    }).start();
  }, [shouldLift, liftAnim]);

  // Handle swap completion: fade out old tile, then fade in new tile
  useEffect(() => {
    // Detect when swap completes for this tile
    if (swapCompleted && !prevSwapCompletedRef.current && isSwapped) {
      const oldTile = selectedTileRef.current;

      if (oldTile) {
        setIsAnimatingSwap(true);
        // Show old tile while fading out
        setDisplayTile(oldTile);

        // Fade out old tile
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: Platform.OS !== 'web',
        }).start(() => {
          // Switch to new tile and fade in
          setDisplayTile(tile);

          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: ANIMATION_DURATION,
            useNativeDriver: Platform.OS !== 'web',
          }).start(() => {
            setIsAnimatingSwap(false);
            selectedTileRef.current = null;
          });
        });
      }
    }

    prevSwapCompletedRef.current = swapCompleted;
  }, [swapCompleted, isSwapped, fadeAnim, tile]);

  // Keep displayTile in sync when not animating
  useEffect(() => {
    if (!isAnimatingSwap && !swapCompleted) {
      setDisplayTile(tile);
    }
  }, [tile, isAnimatingSwap, swapCompleted]);

  // When swap completes, tiles are not interactive until dismissed
  const isInteractive = !swapCompleted;

  return (
    <Pressable
      onPress={isInteractive ? onToggle : undefined}
      style={({ pressed }) => ({
        opacity: pressed && isInteractive ? 0.8 : 1,
      })}
      disabled={!isInteractive}
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: liftAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        <Tile
          letter={displayTile.letter}
          points={displayTile.points}
          isSelected={isSelected || (isSwapped && swapCompleted)}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
