import React, { useCallback, useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { Tile } from './Tile';
import {
  usePendingTileAt,
  useTileValidationState,
  useBoardTileHighlight,
} from '../../stores/gameStore';
import { useDragDrop } from '../../context/DragDropContext';
import { usePointerDrag } from '../../hooks/usePointerDrag';
import {
  MULTIPLIER_COLORS,
  MULTIPLIER_LABELS,
  HIGHLIGHT_COLORS,
  colors,
} from '../../config/theme';
import type { SquareType, PlacedTile } from '../../types';
import type { DropTarget } from '../../context/DragDropContext';

interface BoardCellProps {
  x: number;
  y: number;
  placedTile: PlacedTile | null;
  squareType: SquareType;
  onPress: () => void;
  onPendingTileDrag: (fromX: number, fromY: number, target: DropTarget) => void;
  onBlankTileTap?: (x: number, y: number) => void;
  disabled: boolean;
  isLastMove?: boolean;
  cellSize: number;
}

export function BoardCell({
  x,
  y,
  placedTile,
  squareType,
  onPress,
  onPendingTileDrag,
  onBlankTileTap,
  disabled,
  isLastMove = false,
  cellSize,
}: BoardCellProps) {
  const pendingTile = usePendingTileAt(x, y);
  const {
    startDragFromBoard,
    updateDrag,
    endDrag,
    isDragging,
    dragSource,
    isSettling,
    settlingTarget,
    registerDraggable,
    unregisterDraggable,
    recallingBoardPositions,
  } = useDragDrop();

  const viewRef = useRef<View>(null);
  const registrationId = `board-${x}-${y}`;

  const isThisDragging =
    isDragging &&
    dragSource?.type === 'board' &&
    dragSource.x === x &&
    dragSource.y === y;

  // Hide tile when FloatingTile is settling TO this cell
  const isSettlingToThis =
    isSettling &&
    settlingTarget?.type === 'board' &&
    settlingTarget.x === x &&
    settlingTarget.y === y;

  // Hide tile when FloatingTile is settling FROM this cell (to rack or elsewhere)
  const isSettlingFromThis =
    isSettling &&
    dragSource?.type === 'board' &&
    dragSource.x === x &&
    dragSource.y === y;

  // Hide tile when it's being recalled (animated back to rack)
  const isBeingRecalled = recallingBoardPositions.some(
    (pos) => pos.x === x && pos.y === y
  );

  // Log when this cell has a pending tile and recall state
  if (pendingTile && recallingBoardPositions.length > 0) {
    console.log('[BoardCell] recall check', {
      x,
      y,
      isBeingRecalled,
      recallingBoardPositions,
      pendingTile: pendingTile.letter,
    });
  }

  // Callback for when drag ends (called from DragDropContext on native)
  const handleNativeDragEnd = useCallback(
    (target: DropTarget, wasDragged: boolean) => {
      if (!wasDragged) {
        // If this is a pending blank tile, open the letter selection modal
        if (pendingTile?.isBlank && onBlankTileTap) {
          onBlankTileTap(x, y);
        } else {
          onPress();
        }
        return;
      }
      onPendingTileDrag(x, y, target);
    },
    [x, y, onPress, onPendingTileDrag, pendingTile, onBlankTileTap]
  );

  // Measure and register hit area - extracted for reuse in onLayout
  // Expand hit area by this amount on each side to make small cells easier to tap
  const HIT_AREA_PADDING = 8;

  const measureAndRegister = useCallback(() => {
    if (Platform.OS === 'web' || !pendingTile || disabled) return;
    if (viewRef.current) {
      viewRef.current.measureInWindow((px, py, width, height) => {
        if (width > 0 && height > 0) {
          // Expand hit area for easier tapping on small board cells
          const expandedHitArea = {
            x: px - HIT_AREA_PADDING,
            y: py - HIT_AREA_PADDING,
            width: width + HIT_AREA_PADDING * 2,
            height: height + HIT_AREA_PADDING * 2,
          };
          registerDraggable(
            registrationId,
            expandedHitArea,
            pendingTile,
            { type: 'board', x, y },
            handleNativeDragEnd
          );
        }
      });
    }
  }, [
    pendingTile,
    x,
    y,
    disabled,
    registerDraggable,
    registrationId,
    handleNativeDragEnd,
  ]);

  // Register draggable hit area for native hit-testing
  useEffect(() => {
    if (Platform.OS === 'web' || !pendingTile || disabled) {
      unregisterDraggable(registrationId);
      return;
    }

    // Short delay to ensure layout is complete
    const timeoutId = setTimeout(measureAndRegister, 50);

    return () => {
      clearTimeout(timeoutId);
      unregisterDraggable(registrationId);
    };
  }, [
    pendingTile,
    disabled,
    unregisterDraggable,
    registrationId,
    measureAndRegister,
  ]);

  // Handle layout changes by re-measuring hit area
  const handleCellLayout = useCallback(() => {
    if (Platform.OS !== 'web' && pendingTile && !disabled) {
      // Re-measure after layout settles
      setTimeout(measureAndRegister, 50);
    }
  }, [pendingTile, disabled, measureAndRegister]);

  const handleDragStart = useCallback(
    (pageX: number, pageY: number) => {
      if (pendingTile) {
        startDragFromBoard(pendingTile, x, y, pageX, pageY);
      }
    },
    [pendingTile, x, y, startDragFromBoard]
  );

  const handleDragEnd = useCallback(
    (wasDragged: boolean) => {
      if (!wasDragged) {
        endDrag();
        // If this is a pending blank tile, open the letter selection modal
        if (pendingTile?.isBlank && onBlankTileTap) {
          onBlankTileTap(x, y);
        } else {
          onPress();
        }
        return;
      }
      const target = endDrag();
      onPendingTileDrag(x, y, target);
    },
    [x, y, endDrag, onPress, onPendingTileDrag, pendingTile, onBlankTileTap]
  );

  // Web still uses pointer events
  const { handlePointerDown } = usePointerDrag({
    onDragStart: handleDragStart,
    onDragMove: updateDrag,
    onDragEnd: handleDragEnd,
    isActive: isThisDragging,
    disabled: disabled || !pendingTile,
  });

  // Determine what tile to show
  // Hide pending tile when dragging/settling from this cell, settling to this cell, or being recalled
  const tile =
    placedTile ??
    (isThisDragging || isSettlingToThis || isSettlingFromThis || isBeingRecalled
      ? null
      : pendingTile);
  const isPending =
    pendingTile != null &&
    !isThisDragging &&
    !isSettlingToThis &&
    !isSettlingFromThis &&
    !isBeingRecalled;

  // Log what tile is being shown during recall
  if (pendingTile && isBeingRecalled) {
    console.log('[BoardCell] tile visibility during recall', {
      x,
      y,
      tile: tile?.letter ?? 'null',
      isBeingRecalled,
    });
  }
  const isStar = squareType === 'STAR';
  const backgroundColor = placedTile
    ? colors.cellBackground
    : squareType
      ? MULTIPLIER_COLORS[squareType]
      : colors.cellBackground;

  // Web: use pointer events for dragging pending tiles
  if (pendingTile && !disabled && Platform.OS === 'web') {
    return (
      <View style={styles.cellWrapper}>
        <View
          // @ts-expect-error cursor is web-only CSS property
          style={[styles.cell, { backgroundColor, cursor: 'grab' }]}
          onPointerDown={handlePointerDown}
        >
          <CellContent
            x={x}
            y={y}
            tile={tile ?? null}
            isPending={isPending}
            squareType={squareType}
            isStar={isStar}
            isPlaced={!!placedTile}
            isLastMove={isLastMove}
            cellSize={cellSize}
          />
        </View>
      </View>
    );
  }

  // Native: just render, hit-testing is handled by global PanGestureHandler
  if (pendingTile && !disabled && Platform.OS !== 'web') {
    return (
      <View style={styles.cellWrapper}>
        <View
          ref={viewRef}
          style={[styles.cell, { backgroundColor }]}
          onLayout={handleCellLayout}
        >
          <CellContent
            x={x}
            y={y}
            tile={tile ?? null}
            isPending={isPending}
            squareType={squareType}
            isStar={isStar}
            isPlaced={!!placedTile}
            isLastMove={isLastMove}
            cellSize={cellSize}
          />
        </View>
      </View>
    );
  }

  // Default: TouchableOpacity for empty cells and placed tiles
  return (
    <View style={styles.cellWrapper}>
      <TouchableOpacity
        style={[styles.cell, { backgroundColor }]}
        onPress={onPress}
        disabled={disabled || placedTile != null}
        activeOpacity={1}
      >
        <CellContent
          x={x}
          y={y}
          tile={tile ?? null}
          isPending={isPending}
          squareType={squareType}
          isStar={isStar}
          isPlaced={!!placedTile}
          isLastMove={isLastMove}
          cellSize={cellSize}
        />
      </TouchableOpacity>
    </View>
  );
}

// Extracted cell content rendering
interface CellContentProps {
  x: number;
  y: number;
  tile: PlacedTile | null;
  isPending: boolean;
  squareType: SquareType;
  isStar: boolean;
  isPlaced: boolean;
  isLastMove: boolean;
  cellSize: number;
}

function CellContent({
  x,
  y,
  tile,
  isPending,
  squareType,
  isStar,
  isPlaced,
  isLastMove,
  cellSize,
}: CellContentProps) {
  const validationState = useTileValidationState(x, y);
  const wordHighlight = useBoardTileHighlight(x, y);

  // Determine validation state for the tile:
  // - Pending tiles: use validationState from the pending tile validation
  // - Placed tiles that are part of a formed word: use wordHighlight (valid/invalid)
  const tileValidationState = isPending ? validationState : wordHighlight;

  // Calculate dynamic font size based on cell size (approximately 45% of cell size)
  const multiplierFontSize = Math.max(8, Math.round(cellSize * 0.45));
  const starFontSize = Math.max(8, Math.round(cellSize * 0.4));

  if (tile) {
    return (
      <View style={styles.tileContainer}>
        <Tile
          letter={tile.letter}
          points={tile.points}
          isPending={isPending}
          isPlaced={isPlaced}
          isBlank={tile.isBlank}
          validationState={tileValidationState}
          size="board"
          cellSize={cellSize}
        />
        {/* Last move highlight overlay - rendered after Tile so it appears on top */}
        {isPlaced && isLastMove && !wordHighlight && (
          <View style={styles.lastMoveHighlight} pointerEvents="none" />
        )}
        {/* Word highlight overlay for placed tiles */}
        {isPlaced && wordHighlight && (
          <View
            style={[
              styles.wordHighlight,
              { backgroundColor: HIGHLIGHT_COLORS[wordHighlight] },
            ]}
            pointerEvents="none"
          />
        )}
      </View>
    );
  }

  // Show star for STAR multiplier (center cell)
  if (isStar) {
    return (
      <View style={styles.centerStar}>
        <Text style={[styles.starText, { fontSize: starFontSize }]}>★</Text>
      </View>
    );
  }

  if (squareType) {
    return (
      <Text style={[styles.multiplierText, { fontSize: multiplierFontSize }]}>
        {MULTIPLIER_LABELS[squareType]}
      </Text>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  cellWrapper: {
    flex: 1,
    aspectRatio: 1,
    padding: 1,
  },
  cell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  tileContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordHighlight: {
    position: 'absolute',
    width: '92%',
    height: '92%',
    borderRadius: 4,
  },
  lastMoveHighlight: {
    position: 'absolute',
    width: '92%',
    height: '92%',
    borderRadius: 4,
    backgroundColor: colors.warningOverlay,
  },
  multiplierText: {
    fontWeight: '600',
    color: '#FFF',
  },
  centerStar: {
    width: '60%',
    height: '60%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starText: {
    color: '#FFFFFF',
  },
});
