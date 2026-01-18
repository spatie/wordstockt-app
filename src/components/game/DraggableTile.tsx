import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Tile } from './Tile';
import { useDragDrop } from '../../context/DragDropContext';
import { usePointerDrag } from '../../hooks/usePointerDrag';
import { TILE_SIZE, GAP } from '../../config/constants';
import { colors } from '../../config/theme';
import type { Tile as TileType } from '../../types';
import type { DropTarget, RackLayout } from '../../context/DragDropContext';

interface DraggableTileProps {
  tile: TileType;
  rackIndex: number;
  visualSlot: number;
  rackLayout: RackLayout | null;
  isUsed: boolean;
  disabled: boolean;
  onDragEnd: (rackIndex: number, target: DropTarget) => boolean;
}

export function DraggableTile({
  tile,
  rackIndex,
  visualSlot,
  rackLayout,
  isUsed,
  disabled,
  onDragEnd,
}: DraggableTileProps) {
  const {
    startDragFromRack,
    updateDrag,
    endDrag,
    isDragging,
    dragSource,
    registerDraggable,
    unregisterDraggable,
    draggingRackIndexShared,
  } = useDragDrop();

  const registrationId = `rack-${rackIndex}`;

  const isThisDragging =
    isDragging &&
    dragSource?.type === 'rack' &&
    dragSource.rackIndex === rackIndex;

  // Immediate hiding based on shared value (prevents visual glitch during fast drags)
  // Only apply minimal opacity change to prevent brief double-tile visual glitch
  const immediateHideStyle = useAnimatedStyle(() => {
    'worklet';
    const draggingIndex = draggingRackIndexShared.value;

    // Only hide this specific tile when it's actively being dragged
    if (
      draggingIndex === rackIndex &&
      draggingIndex >= 0 &&
      draggingIndex < 7
    ) {
      return { opacity: 0 };
    }

    // Default: fully visible
    return { opacity: 1 };
  }, [rackIndex]);

  // Callback for when drag ends (called from DragDropContext on native)
  // Returns true if placement succeeded, false if it failed (e.g., cell occupied)
  const handleNativeDragEnd = useCallback(
    (target: DropTarget, _wasDragged: boolean): boolean => {
      return onDragEnd(rackIndex, target);
    },
    [rackIndex, onDragEnd]
  );

  // Register draggable hit area for native hit-testing
  // IMPORTANT: We calculate position from rackLayout + visualSlot instead of using
  // measureInWindow because native driver animations don't update measureInWindow.
  // This means the hit area is at the TARGET position (where tile will be), not the
  // current animated position. This is correct because:
  // 1. Users typically wait for shuffle animation to complete before dragging
  // 2. If they tap during animation, they hit the destination position (intuitive)
  // The hit area re-registers whenever visualSlot changes (after shuffle/swap).
  useEffect(() => {
    if (Platform.OS === 'web' || isUsed || disabled || !rackLayout) {
      unregisterDraggable(registrationId);
      return;
    }

    // Calculate hit area from rack layout and visual slot
    // rackLayout.x is the start of the rack slots area
    // Each slot is TILE_SIZE wide with GAP between them
    const slotWidth = TILE_SIZE + GAP;
    const x = rackLayout.x + visualSlot * slotWidth;
    const y = rackLayout.y;

    registerDraggable(
      registrationId,
      { x, y, width: TILE_SIZE, height: TILE_SIZE },
      tile,
      { type: 'rack', rackIndex },
      handleNativeDragEnd
    );

    return () => {
      unregisterDraggable(registrationId);
    };
  }, [
    tile,
    rackIndex,
    visualSlot,
    rackLayout,
    isUsed,
    disabled,
    registerDraggable,
    unregisterDraggable,
    registrationId,
    handleNativeDragEnd,
  ]);

  const handleDragStart = useCallback(
    (pageX: number, pageY: number) => {
      startDragFromRack(tile, rackIndex, pageX, pageY);
    },
    [tile, rackIndex, startDragFromRack]
  );

  const handleDragEnd = useCallback(
    (_wasDragged: boolean) => {
      // Use callback-based endDrag to ensure proper timing for rack swaps
      endDrag((target) => {
        onDragEnd(rackIndex, target);
      });
    },
    [rackIndex, endDrag, onDragEnd]
  );

  // Web still uses pointer events
  const { handlePointerDown } = usePointerDrag({
    onDragStart: handleDragStart,
    onDragMove: updateDrag,
    onDragEnd: handleDragEnd,
    isActive: isThisDragging,
    disabled: disabled || isUsed,
  });

  // Show empty slot when tile is used (placed on board) or being dragged
  if (isUsed || isThisDragging) {
    return <View style={styles.emptySlot} />;
  }

  // Web: use pointer events
  if (Platform.OS === 'web') {
    return (
      <Animated.View
        onPointerDown={handlePointerDown}
        // @ts-expect-error cursor is web-only CSS property
        style={[
          styles.container,
          !disabled && { cursor: 'grab' },
          immediateHideStyle,
        ]}
      >
        <Tile
          letter={tile.letter}
          points={tile.points}
          isBlank={tile.isBlank}
          disabled={disabled}
          size="board"
          cellSize={TILE_SIZE}
        />
      </Animated.View>
    );
  }

  // Native: just render, hit-testing is handled by global PanGestureHandler
  return (
    <Animated.View style={[styles.container, immediateHideStyle]}>
      <Tile
        letter={tile.letter}
        points={tile.points}
        isBlank={tile.isBlank}
        disabled={disabled}
        size="board"
        cellSize={TILE_SIZE}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 6,
    ...Platform.select({
      web: {
        userSelect: 'none',
        touchAction: 'none',
      },
      default: {},
    }),
  },
  emptySlot: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: colors.emptySlot,
    borderRadius: 6,
  },
});
