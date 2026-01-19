import React, {
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  useMemo,
} from 'react';
import { View, StyleSheet, LayoutChangeEvent, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from 'react-native-reanimated';
import { DraggableTile } from './DraggableTile';
import { SelectableTile } from './SelectableTile';
import {
  useRackTileUsed,
  useRackPermutation,
  useIsSwapMode,
  useIsSwapSelected,
  useSwapCompleted,
  useIsSwappedTile,
  useGameStore,
} from '../../stores/gameStore';

// Track current game to detect game switches
const useCurrentGameUlid = () => useGameStore((state) => state.currentGameUlid);
import { useDragDrop } from '../../context/DragDropContext';
import {
  TILE_SIZE,
  SLOT_COUNT,
  GAP,
  SPRING_CONFIG,
} from '../../config/constants';
import { colors } from '../../config/theme';
import type { Tile as TileType } from '../../types';
import type { DropTarget, RackLayout } from '../../context/DragDropContext';

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
  visualSlot: number;
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
  visualSlot,
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
    isSettling,
    settlingTarget,
    recallingRackIndices,
    recallingRackIndicesShared,
    dragSource,
    getLastRackDrop,
    clearLastRackDrop,
  } = useDragDrop();
  const currentGameUlid = useCurrentGameUlid();
  const animatedX = useSharedValue(visualSlot * (SLOT_WIDTH + GAP));
  const exitLiftY = useSharedValue(0); // For animating tiles down when exiting swap mode
  const prevVisualSlot = useRef(visualSlot);
  const prevIsUsed = useRef(isUsed);
  const prevIsSwapMode = useRef(isSwapMode);
  const prevWasLifted = useRef(false);
  const prevGameUlid = useRef(currentGameUlid); // Track game changes to skip animation

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

  // Check if this rack tile's floating version is currently animating
  const isThisRackTileAnimating =
    dragSource?.type === 'rack' && dragSource.rackIndex === actualRackIndex;

  // Only show empty slot for board placements, not rack swaps
  // For rack-to-rack drops, we swap positions - no empty slot needed
  const isSettlingToThis =
    isSettling && settlingTarget?.type === 'board' && isThisRackTileAnimating;

  // Hide tile while floating version is settling (to board or rack)
  // For rack-to-rack drops, keep the tile visible so the spring animation can run
  // (the floating tile will briefly overlap, then disappear when settling completes)
  const isSettlingToBoard = isSettling && settlingTarget?.type === 'board';
  const isSettlingToRack = isSettling && settlingTarget?.type === 'rack';
  const isFloatingTileAnimating =
    isThisRackTileAnimating && (isSettlingToBoard || isSettlingToRack);

  const isBeingRecalled = recallingRackIndices.includes(actualRackIndex);

  // Animate when visual slot changes OR when tile returns to rack from board/empty area
  // If this tile was just dropped, start animation from drop position instead of current position
  // Use useLayoutEffect to set position synchronously before paint (prevents flash at old position)
  useLayoutEffect(() => {
    const targetX = visualSlot * (SLOT_WIDTH + GAP);
    const lastRackDrop = getLastRackDrop();
    const justBecameVisible = prevIsUsed.current && !isUsed;

    // On game change, snap to position without animation
    // This prevents the "shuffle animation" when entering or switching games
    if (prevGameUlid.current !== currentGameUlid) {
      prevGameUlid.current = currentGameUlid;
      animatedX.value = targetX;
      prevVisualSlot.current = visualSlot;
      prevIsUsed.current = isUsed;
      return;
    }

    // Check if this tile was just dropped/returned (matches our rackIndex)
    // This handles: rack-to-rack drops, board-to-rack drops, and drops in empty area
    if (lastRackDrop?.rackIndex === actualRackIndex) {
      clearLastRackDrop();
      // Set to drop position, then spring animate to target
      animatedX.value = lastRackDrop.dropX;
      animatedX.value = withSpring(targetX, SPRING_CONFIG);
      prevVisualSlot.current = visualSlot;
    } else if (prevVisualSlot.current !== visualSlot) {
      // Visual slot changed (e.g., shuffle/swap) - animate to new position
      animatedX.value = withSpring(targetX, SPRING_CONFIG);
      prevVisualSlot.current = visualSlot;
    } else if (justBecameVisible) {
      // Tile just returned to rack but no drop position recorded - snap to correct position
      animatedX.value = targetX;
    }

    prevIsUsed.current = isUsed;
  }, [
    visualSlot,
    animatedX,
    actualRackIndex,
    getLastRackDrop,
    clearLastRackDrop,
    isUsed,
    currentGameUlid,
  ]);

  const handleDragEnd = useCallback(
    (rackIdx: number, target: DropTarget): boolean => {
      return onDragEnd(visualSlot, actualRackIndex, target);
    },
    [visualSlot, actualRackIndex, onDragEnd]
  );

  const handleToggleSwap = useCallback(() => {
    toggleSwapTile(actualRackIndex);
  }, [actualRackIndex, toggleSwapTile]);

  // Check if this tile is being recalled (shared value for immediate UI update)
  const isBeingRecalledShared = useDerivedValue(() => {
    'worklet';
    return recallingRackIndicesShared.value.includes(actualRackIndex);
  }, [actualRackIndex]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: animatedX.value }],
    // Hide immediately via shared value (prevents flash during recall)
    opacity: isBeingRecalledShared.value ? 0 : 1,
  }));

  // Style with exit lift animation (for DraggableTile after exiting swap mode)
  const animatedStyleWithLift = useAnimatedStyle(() => ({
    transform: [
      { translateX: animatedX.value },
      { translateY: exitLiftY.value },
    ],
    // Hide immediately via shared value (prevents flash during recall)
    opacity: isBeingRecalledShared.value ? 0 : 1,
  }));

  // Don't render if:
  // - No tile data
  // - Tile is placed on board (isUsed)
  // - Tile is animating back from board (isBeingRecalled)
  // - This tile's floating version is currently being dragged/settling (isFloatingTileAnimating)
  if (!tile || isUsed || isBeingRecalled || isFloatingTileAnimating) {
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
        visualSlot={visualSlot}
        rackLayout={rackLayout}
        isUsed={isSettlingToThis}
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
  const rackPermutation = useRackPermutation();
  const [rackLayout, setLocalRackLayout] = useState<RackLayout | null>(null);

  // Pre-compute reverse permutation map for O(1) lookup instead of indexOf O(n)
  const actualToVisualMap = useMemo(() => {
    const map = new Map<number, number>();
    rackPermutation.forEach((actualIdx, visualSlot) => {
      map.set(actualIdx, visualSlot);
    });
    return map;
  }, [rackPermutation]);

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
      const tileY = y + (height - TILE_SIZE) / 2;
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
      setTimeout(measureRack, 100);
    },
    [measureRack]
  );

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
            visualSlot={
              actualToVisualMap.get(actualRackIndex) ?? actualRackIndex
            }
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
