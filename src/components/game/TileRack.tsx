import React, {
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import {
  View,
  StyleSheet,
  LayoutChangeEvent,
  Platform,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useAnimatedReaction,
  withSpring,
} from 'react-native-reanimated';
import { DraggableTile } from './DraggableTile';
import { SelectableTile } from './SelectableTile';
import {
  useRackTileUsed,
  useIsSwapMode,
  useIsSwapSelected,
  useSwapCompleted,
  useIsSwappedTile,
  useGameStore,
} from '../../stores/gameStore';
import { useDragDrop } from '../../context/DragDropContext';
import {
  TILE_SIZE,
  SLOT_COUNT,
  GAP,
  SPRING_CONFIG,
  SPRING_CONFIG_FAST,
  LAYOUT,
} from '../../config/constants';
import { colors } from '../../config/theme';
import type { Tile as TileType } from '../../types';
import type { DropTarget, RackLayout } from '../../context/DragDropContext';

// Track current game to detect game switches
const useCurrentGameUlid = () => useGameStore((state) => state.currentGameUlid);

const SLOT_WIDTH = TILE_SIZE;
const TOTAL_SLOTS_WIDTH = SLOT_COUNT * SLOT_WIDTH + (SLOT_COUNT - 1) * GAP;

/**
 * TileRack - Visual rack with draggable tiles
 *
 * PERMUTATION SYSTEM:
 * - tiles[] is indexed by actualRackIndex (0-6), which is STABLE
 * - rackPermutation maps visualSlot → actualRackIndex
 * - Example: rackPermutation = [2, 0, 1, ...] means:
 *   - Visual slot 0 shows tiles[2]
 *   - Visual slot 1 shows tiles[0]
 *   - Visual slot 2 shows tiles[1]
 *
 * RENDERING:
 * - Static background slots are rendered at fixed positions
 * - AnimatedTileSlot renders each tile, animated to its visualSlot position
 * - When visualSlot changes (shuffle/swap), tile animates to new position
 *
 * SWAP BEHAVIOR:
 * - Dragging tile A onto slot B triggers swapByActualIndex(actualRackIndex, targetVisualSlot)
 * - This finds A's current visual slot and swaps with B's visual slot in the permutation
 * - Only the permutation changes; actual tile data stays in place
 */

interface AnimatedTileSlotProps {
  tile: TileType | undefined;
  actualRackIndex: number;
  rackLayout: RackLayout | null;
  disabled: boolean;
  onDragEnd: (
    visualSlot: number,
    actualRackIndex: number,
    target: DropTarget
  ) => boolean;
}

const LIFT_AMOUNT = -8; // pixels to lift when selected (must match SelectableTile)

function AnimatedTileSlot({
  tile,
  actualRackIndex,
  rackLayout,
  disabled,
  onDragEnd,
}: AnimatedTileSlotProps) {
  const isUsed = useRackTileUsed(actualRackIndex);
  const isSwapMode = useIsSwapMode();
  const isSwapSelected = useIsSwapSelected(actualRackIndex);
  const swapCompleted = useSwapCompleted();
  const isSwappedTile = useIsSwappedTile(actualRackIndex);
  const toggleSwapTile = useGameStore((s) => s.toggleSwapTile);
  const {
    recallingRackIndicesShared,
    draggingRackIndexShared,
    getLastRackDrop,
    clearLastRackDrop,
    rackPermutationShared,
  } = useDragDrop();
  const currentGameUlid = useCurrentGameUlid();

  // Animated X position (UI-thread controlled)
  // Initialize at actualRackIndex position - useAnimatedReaction will correct if permutation differs
  const animatedX = useSharedValue(actualRackIndex * (SLOT_WIDTH + GAP));
  const exitLiftY = useSharedValue(0); // For animating tiles down when exiting swap mode
  const prevIsSwapMode = useRef(isSwapMode);
  const prevWasLifted = useRef(false);

  // Derive visualSlot from shared permutation (UI-thread source of truth)
  const visualSlotDerived = useDerivedValue(() => {
    'worklet';
    const idx = rackPermutationShared.value.indexOf(actualRackIndex);
    return idx === -1 ? actualRackIndex : idx;
  }, [actualRackIndex]);

  // React to visualSlot changes - trigger spring animation on UI thread
  // This is the key to instant animations: when permutation changes, animation starts immediately
  useAnimatedReaction(
    () => visualSlotDerived.value,
    (currentSlot, previousSlot) => {
      'worklet';
      const targetX = currentSlot * (SLOT_WIDTH + GAP);
      if (previousSlot === null) {
        // Initial sync - snap to correct position without animation
        animatedX.value = targetX;
      } else if (currentSlot !== previousSlot) {
        // Visual slot changed - animate to new position with fast spring
        animatedX.value = withSpring(targetX, SPRING_CONFIG_FAST);
      }
    },
    [actualRackIndex]
  );

  // Track if tile was lifted (selected or swapped) when in swap mode
  const isLifted =
    isSwapMode && (isSwapSelected || (isSwappedTile && swapCompleted));

  // Animate down when exiting swap mode while tile was lifted
  useLayoutEffect(() => {
    if (prevIsSwapMode.current && !isSwapMode && prevWasLifted.current) {
      // Was in swap mode and lifted, now exiting - animate down
      exitLiftY.value = LIFT_AMOUNT;
      exitLiftY.value = withSpring(0, SPRING_CONFIG);
    }
    prevIsSwapMode.current = isSwapMode;
    prevWasLifted.current = isLifted;
  }, [isSwapMode, isLifted, exitLiftY]);

  // Check if this rack tile's floating version is currently visible (shared value for atomic UI updates)
  const isDraggingThisShared = useDerivedValue(() => {
    'worklet';
    return draggingRackIndexShared.value === actualRackIndex;
  }, [actualRackIndex]);

  // NOTE: We use isBeingRecalledShared (worklet) for hiding instead of React state
  const isBeingRecalledForRender = false;

  // Handle drop position animations
  useLayoutEffect(() => {
    const lastRackDrop = getLastRackDrop();

    // Check if this tile was just dropped/returned (matches our rackIndex)
    if (lastRackDrop?.rackIndex === actualRackIndex) {
      clearLastRackDrop();
      // Set to drop position, then animate to target via useAnimatedReaction
      animatedX.value = lastRackDrop.dropX;
    }
  }, [actualRackIndex, getLastRackDrop, clearLastRackDrop, animatedX]);

  // Handle game changes - snap to correct position
  useAnimatedReaction(
    () => ({ slot: visualSlotDerived.value, gameUlid: currentGameUlid }),
    (current, previous) => {
      'worklet';
      // On game change, snap to position without animation
      if (previous !== null && current.gameUlid !== previous.gameUlid) {
        animatedX.value = current.slot * (SLOT_WIDTH + GAP);
      }
    },
    [currentGameUlid]
  );

  const handleDragEnd = useCallback(
    (_rackIdx: number, target: DropTarget): boolean => {
      // Read visual slot at call time (not during render)
      const visualSlot = rackPermutationShared.value.indexOf(actualRackIndex);
      return onDragEnd(visualSlot, actualRackIndex, target);
    },
    [rackPermutationShared, actualRackIndex, onDragEnd]
  );

  const handleToggleSwap = useCallback(() => {
    toggleSwapTile(actualRackIndex);
  }, [actualRackIndex, toggleSwapTile]);

  // Check if this tile is being recalled (shared value for immediate UI update)
  const isBeingRecalledShared = useDerivedValue(() => {
    'worklet';
    return recallingRackIndicesShared.value.includes(actualRackIndex);
  }, [actualRackIndex]);

  // Main animated style - uses animatedX which is controlled by useAnimatedReaction
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: animatedX.value }],
    opacity: isBeingRecalledShared.value || isDraggingThisShared.value ? 0 : 1,
  }));

  // Style with exit lift animation (for DraggableTile after exiting swap mode)
  const animatedStyleWithLift = useAnimatedStyle(() => ({
    transform: [
      { translateX: animatedX.value },
      { translateY: exitLiftY.value },
    ],
    opacity: isBeingRecalledShared.value || isDraggingThisShared.value ? 0 : 1,
  }));

  // Don't render if:
  // - No tile data
  // - Tile is placed on board (isUsed)
  // - Tile is animating back from board (handled by opacity via isBeingRecalledShared)
  // NOTE: Dragging visibility is handled via opacity in animatedStyle (isDraggingThisShared),
  //       NOT by returning null - this ensures atomic visibility changes on UI thread
  const shouldHide = !tile || isUsed || isBeingRecalledForRender;
  if (shouldHide) {
    return null;
  }

  // Render SelectableTile in swap mode, DraggableTile otherwise
  if (isSwapMode) {
    return (
      <Animated.View style={[styles.absoluteSlot, animatedStyle]}>
        <SelectableTile
          tile={tile}
          isSelected={isSwapSelected}
          isSwapped={isSwappedTile}
          swapCompleted={swapCompleted}
          onToggle={handleToggleSwap}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.absoluteSlot, animatedStyleWithLift]}>
      <DraggableTile
        tile={tile}
        rackIndex={actualRackIndex}
        rackLayout={rackLayout}
        isUsed={false}
        disabled={disabled}
        onDragEnd={handleDragEnd}
      />
    </Animated.View>
  );
}

interface TileRackProps {
  tiles: TileType[];
  disabled: boolean;
  onTileDrop: (
    visualSlot: number,
    actualRackIndex: number,
    target: DropTarget
  ) => boolean;
}

export function TileRack({ tiles, disabled, onTileDrop }: TileRackProps) {
  const rackRef = useRef<View>(null);
  const { setRackLayout, isDragging, updateRackTiles } = useDragDrop();
  const [rackLayout, setLocalRackLayout] = useState<RackLayout | null>(null);
  const measureTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync tiles to shared values for worklet-based hit testing
  // Use useLayoutEffect to ensure tiles are synced before paint
  useLayoutEffect(() => {
    updateRackTiles(tiles);
  }, [tiles, updateRackTiles]);

  const measureRack = useCallback(() => {
    rackRef.current?.measureInWindow((x, y, width, height) => {
      const startX = x + (width - TOTAL_SLOTS_WIDTH) / 2;
      // Tiles are vertically centered within the rack container
      // Calculate the Y offset to get the actual tile position
      // On Android, measureInWindow may not include status bar height, but touch events do
      const statusBarOffset =
        Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
      const tileY = y + statusBarOffset + (height - TILE_SIZE) / 2;
      const layout: RackLayout = {
        x: startX,
        y: tileY,
        width: TOTAL_SLOTS_WIDTH,
        height: TILE_SIZE,
        slotWidth: SLOT_WIDTH + GAP,
        slotCount: SLOT_COUNT,
      };
      setRackLayout(layout);
      setLocalRackLayout(layout);
    });
  }, [setRackLayout]);

  const handleLayout = useCallback(
    (_event: LayoutChangeEvent) => {
      if (measureTimeoutRef.current !== null) {
        clearTimeout(measureTimeoutRef.current);
      }
      measureTimeoutRef.current = setTimeout(() => {
        measureTimeoutRef.current = null;
        measureRack();
      }, 100);
    },
    [measureRack]
  );

  // Clear any pending measure timeout on unmount
  useEffect(() => {
    return () => {
      if (measureTimeoutRef.current !== null) {
        clearTimeout(measureTimeoutRef.current);
      }
    };
  }, []);

  // Re-measure when drag starts
  useEffect(() => {
    if (isDragging) measureRack();
  }, [isDragging, measureRack]);

  // Handle tile drop - returns true if placement succeeded, false if failed
  const handleTileDrop = useCallback(
    (
      visualSlot: number,
      actualRackIndex: number,
      target: DropTarget
    ): boolean => {
      return onTileDrop(visualSlot, actualRackIndex, target);
    },
    [onTileDrop]
  );

  return (
    <View ref={rackRef} style={styles.rack} onLayout={handleLayout}>
      <View style={[styles.slotsContainer, { width: TOTAL_SLOTS_WIDTH }]}>
        {/* Static background slots */}
        {Array.from({ length: SLOT_COUNT }, (_, i) => (
          <View
            key={`bg-${i}`}
            style={[styles.staticSlot, { left: i * (SLOT_WIDTH + GAP) }]}
          >
            <View style={styles.emptySlot} />
          </View>
        ))}
        {/* Animated tiles on top */}
        {tiles.map((tile, actualRackIndex) => (
          <AnimatedTileSlot
            key={actualRackIndex}
            tile={tile}
            actualRackIndex={actualRackIndex}
            rackLayout={rackLayout}
            disabled={disabled}
            onDragEnd={handleTileDrop}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rack: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 24,
    marginTop: 12,
    backgroundColor: 'transparent',
    borderRadius: 12,
    maxWidth: LAYOUT.gameControlsMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  slotsContainer: {
    height: SLOT_WIDTH,
    position: 'relative',
  },
  absoluteSlot: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SLOT_WIDTH,
    height: SLOT_WIDTH,
  },
  staticSlot: {
    position: 'absolute',
    top: 0,
    width: SLOT_WIDTH,
    height: SLOT_WIDTH,
  },
  emptySlot: {
    width: SLOT_WIDTH,
    height: SLOT_WIDTH,
    backgroundColor: colors.emptySlot,
    borderRadius: 6,
  },
});
