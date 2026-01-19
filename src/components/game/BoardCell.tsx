import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useDerivedValue,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ScaledTile } from './Tile';
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
  onPlacedTileTap?: (x: number, y: number) => void;
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
  onPlacedTileTap,
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
    recallingBoardPositionsShared,
    draggingBoardPositionShared,
    settlingTargetShared,
    boardLayout,
  } = useDragDrop();

  // Immediate hiding based on shared values (prevents visual glitch during fast drags/settles)
  // Uses shared values instead of React state for frame-perfect synchronization
  const immediateHideStyle = useAnimatedStyle(() => {
    'worklet';
    // Hide when being dragged FROM this cell
    const draggingPos = draggingBoardPositionShared.value;
    if (draggingPos && draggingPos.x === x && draggingPos.y === y) {
      return { opacity: 0 };
    }
    // Hide when floating tile is settling TO this cell
    const settlingPos = settlingTargetShared.value;
    if (settlingPos && settlingPos.x === x && settlingPos.y === y) {
      return { opacity: 0 };
    }
    // Hide when being recalled (animated back to rack)
    const recallingPositions = recallingBoardPositionsShared.value;
    for (let i = 0; i < recallingPositions.length; i++) {
      const pos = recallingPositions[i];
      if (pos && pos.x === x && pos.y === y) {
        return { opacity: 0 };
      }
    }
    return { opacity: 1 };
  }, [x, y]);

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
  // On native, use false here - the worklet immediateHideStyle handles hiding via shared value
  // This prevents re-render cascades when recallingBoardPositions changes
  const isBeingRecalled =
    Platform.OS === 'web'
      ? recallingBoardPositions.some((pos) => pos.x === x && pos.y === y)
      : false;

  // Callback for when drag ends (called from DragDropContext on native)
  const handleNativeDragEnd = useCallback(
    (target: DropTarget, wasDragged: boolean): boolean => {
      if (!wasDragged) {
        // If this is a pending blank tile, open the letter selection modal
        if (pendingTile?.isBlank && onBlankTileTap) {
          onBlankTileTap(x, y);
        } else {
          onPress();
        }
        return false;
      }
      onPendingTileDrag(x, y, target);
      return true;
    },
    [x, y, onPress, onPendingTileDrag, pendingTile, onBlankTileTap]
  );

  // Expand hit area by this amount on each side to make small cells easier to tap
  const HIT_AREA_PADDING = 8;

  // Register draggable hit area for native hit-testing
  // Use calculated position from boardLayout (like DraggableTile does with rackLayout)
  // This avoids the async measureInWindow call which caused timing issues
  useEffect(() => {
    if (Platform.OS === 'web' || !pendingTile || disabled || !boardLayout) {
      unregisterDraggable(registrationId);
      return;
    }

    // Calculate hit area from board layout and cell position
    const cellX = boardLayout.x + x * boardLayout.cellSize;
    const cellY = boardLayout.y + y * boardLayout.cellSize;
    const cellSize = boardLayout.cellSize;

    // Expand hit area for easier tapping on small board cells
    const expandedHitArea = {
      x: cellX - HIT_AREA_PADDING,
      y: cellY - HIT_AREA_PADDING,
      width: cellSize + HIT_AREA_PADDING * 2,
      height: cellSize + HIT_AREA_PADDING * 2,
    };

    registerDraggable(
      registrationId,
      expandedHitArea,
      pendingTile,
      { type: 'board', x, y },
      handleNativeDragEnd
    );

    return () => {
      unregisterDraggable(registrationId);
    };
  }, [
    pendingTile,
    x,
    y,
    disabled,
    boardLayout,
    registerDraggable,
    unregisterDraggable,
    registrationId,
    handleNativeDragEnd,
  ]);

  const handleDragStart = useCallback(
    (_pageX: number, _pageY: number) => {
      if (pendingTile) {
        // Calculate cell's center position for seamless drag start
        // startDragJS centers the floating tile on the passed point (using TILE_OFFSET)
        // So we pass the cell's center, not its corner
        if (boardLayout) {
          const cellCenterX =
            boardLayout.x + x * boardLayout.cellSize + boardLayout.cellSize / 2;
          const cellCenterY =
            boardLayout.y + y * boardLayout.cellSize + boardLayout.cellSize / 2;
          startDragFromBoard(pendingTile, x, y, cellCenterX, cellCenterY);
        } else {
          // Fallback to pointer position if boardLayout not available
          startDragFromBoard(pendingTile, x, y, _pageX, _pageY);
        }
      }
    },
    [pendingTile, x, y, boardLayout, startDragFromBoard]
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
  // For native: always render pending tile content, visibility controlled by immediateHideStyle (shared value)
  // For web: hide via React state since we don't use immediateHideStyle
  const shouldHideViaReactState =
    Platform.OS === 'web'
      ? isThisDragging || isSettlingToThis || isSettlingFromThis || isBeingRecalled
      : isThisDragging || isSettlingFromThis || isBeingRecalled; // Note: no isSettlingToThis for native
  const tile = placedTile ?? (shouldHideViaReactState ? null : pendingTile);
  const isPending =
    pendingTile != null &&
    !isThisDragging &&
    !isSettlingFromThis &&
    !isBeingRecalled;

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
        <View style={[styles.cell, { backgroundColor }]}>
          {/* Background layer: bonus text (always visible, never hidden) */}
          <BonusText
            squareType={squareType}
            isStar={isStar}
            cellSize={cellSize}
          />
          {/* Foreground layer: tile (hidden during drag via immediateHideStyle) */}
          {tile && (
            <Animated.View style={[styles.tileOverlay, immediateHideStyle]}>
              <TileContent
                x={x}
                y={y}
                tile={tile}
                isPending={isPending}
                isPlaced={!!placedTile}
                isLastMove={isLastMove}
                cellSize={cellSize}
              />
            </Animated.View>
          )}
        </View>
      </View>
    );
  }

  // Default: TouchableOpacity for empty cells and placed tiles
  const handleCellPress = () => {
    if (placedTile && onPlacedTileTap) {
      onPlacedTileTap(x, y);
      return;
    }
    onPress();
  };

  return (
    <View style={styles.cellWrapper}>
      <TouchableOpacity
        style={[styles.cell, { backgroundColor }]}
        onPress={handleCellPress}
        disabled={disabled && !placedTile}
        activeOpacity={placedTile ? 0.7 : 1}
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

// Bonus text component - always visible, never hidden during drag
interface BonusTextProps {
  squareType: SquareType;
  isStar: boolean;
  cellSize: number;
}

function BonusText({ squareType, isStar, cellSize }: BonusTextProps) {
  const fontMultiplier = Platform.OS === 'android' ? 0.38 : 0.45;
  const multiplierFontSize = Math.max(8, Math.round(cellSize * fontMultiplier));
  const starFontSize = Math.max(8, Math.round(cellSize * 0.4));

  if (isStar) {
    return (
      <View style={styles.bonusTextContainer}>
        <Ionicons name="star" size={starFontSize} color="#FFFFFF" />
      </View>
    );
  }

  if (squareType) {
    return (
      <View style={styles.bonusTextContainer}>
        <Text style={[styles.multiplierText, { fontSize: multiplierFontSize }]}>
          {MULTIPLIER_LABELS[squareType]}
        </Text>
      </View>
    );
  }

  return null;
}

// Animation timing for word highlight on placed tiles
const HIGHLIGHT_ANIMATION_DELAY = 0;
const HIGHLIGHT_ANIMATION_DURATION = 500;

// Animated word highlight overlay - fades in with delay to sync with tile color animation
interface AnimatedWordHighlightProps {
  highlight: 'valid' | 'invalid' | null;
}

function AnimatedWordHighlight({ highlight }: AnimatedWordHighlightProps) {
  // Don't render at all during delay period, then fade in
  const [shouldRender, setShouldRender] = useState(false);
  const opacity = useSharedValue(0);
  const prevHighlight = useRef<'valid' | 'invalid' | null>(null);

  useEffect(() => {
    const wasVisible = prevHighlight.current === 'valid' || prevHighlight.current === 'invalid';
    const isNowVisible = highlight === 'valid' || highlight === 'invalid';

    if (isNowVisible && !wasVisible) {
      // Appearing for first time - delay, then fade in
      prevHighlight.current = highlight;
      const timer = setTimeout(() => {
        setShouldRender(true);
        opacity.value = withTiming(1, { duration: HIGHLIGHT_ANIMATION_DURATION });
      }, HIGHLIGHT_ANIMATION_DELAY);
      return () => clearTimeout(timer);
    }

    if (isNowVisible && wasVisible && highlight !== prevHighlight.current) {
      // Changing between valid/invalid - keep visible, just update color
      prevHighlight.current = highlight;
      setShouldRender(true);
      opacity.value = 1;
    }

    if (!isNowVisible && wasVisible) {
      // Disappearing - fade out, then stop rendering
      prevHighlight.current = highlight;
      opacity.value = withTiming(0, { duration: HIGHLIGHT_ANIMATION_DURATION });
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, HIGHLIGHT_ANIMATION_DURATION);
      return () => clearTimeout(timer);
    }
  }, [highlight, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!shouldRender || !highlight) return null;

  return (
    <Animated.View
      style={[
        styles.wordHighlight,
        { backgroundColor: HIGHLIGHT_COLORS[highlight] },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
}

// Tile content component - can be hidden during drag
interface TileContentProps {
  x: number;
  y: number;
  tile: PlacedTile;
  isPending: boolean;
  isPlaced: boolean;
  isLastMove: boolean;
  cellSize: number;
}

function TileContent({
  x,
  y,
  tile,
  isPending,
  isPlaced,
  isLastMove,
  cellSize,
}: TileContentProps) {
  const validationState = useTileValidationState(x, y);
  const wordHighlight = useBoardTileHighlight(x, y);
  const tileValidationState = isPending ? validationState : wordHighlight;

  return (
    <>
      <ScaledTile
        letter={tile.letter}
        points={tile.points}
        isPending={isPending}
        isPlaced={isPlaced}
        isBlank={tile.isBlank}
        validationState={tileValidationState}
        displaySize={cellSize}
      />
      {isPlaced && isLastMove && !wordHighlight && (
        <View style={styles.lastMoveHighlight} pointerEvents="none" />
      )}
      {isPlaced && <AnimatedWordHighlight highlight={wordHighlight} />}
    </>
  );
}

// Extracted cell content rendering (used for web and default paths)
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

  // Calculate dynamic font size based on cell size
  // Android renders fonts larger, so use a smaller multiplier
  const fontMultiplier = Platform.OS === 'android' ? 0.38 : 0.45;
  const multiplierFontSize = Math.max(8, Math.round(cellSize * fontMultiplier));
  const starFontSize = Math.max(8, Math.round(cellSize * 0.4));

  // Always render bonus text/star underneath - tile renders on top
  // This prevents delay when tile is removed since bonus text is already mounted
  return (
    <View style={styles.tileContainer}>
      {/* Background layer: bonus text or star (always rendered if applicable) */}
      {isStar && (
        <View style={styles.bonusTextContainer}>
          <Ionicons name="star" size={starFontSize} color="#FFFFFF" />
        </View>
      )}
      {!isStar && squareType && (
        <View style={styles.bonusTextContainer}>
          <Text
            style={[styles.multiplierText, { fontSize: multiplierFontSize }]}
          >
            {MULTIPLIER_LABELS[squareType]}
          </Text>
        </View>
      )}

      {/* Foreground layer: tile (covers bonus text when present) */}
      {tile && (
        <>
          <ScaledTile
            letter={tile.letter}
            points={tile.points}
            isPending={isPending}
            isPlaced={isPlaced}
            isBlank={tile.isBlank}
            validationState={tileValidationState}
            displaySize={cellSize}
          />
          {/* Last move highlight overlay */}
          {isPlaced && isLastMove && !wordHighlight && (
            <View style={styles.lastMoveHighlight} pointerEvents="none" />
          )}
          {/* Word highlight overlay for placed tiles */}
          {isPlaced && <AnimatedWordHighlight highlight={wordHighlight} />}
        </>
      )}
    </View>
  );
}

// Android renders hairline borders with artifacts at intersections, so use 1px instead
const gridLineWidth = Platform.OS === 'android' ? 1 : StyleSheet.hairlineWidth;

const styles = StyleSheet.create({
  cellWrapper: {
    flex: 1,
    aspectRatio: 1,
    borderRightWidth: gridLineWidth,
    borderBottomWidth: gridLineWidth,
    borderColor: '#0D1520',
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
  bonusTextContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordHighlight: {
    position: 'absolute',
    width: '99%',
    height: '99%',
    borderRadius: 4,
  },
  lastMoveHighlight: {
    position: 'absolute',
    width: '99%',
    height: '99%',
    borderRadius: 4,
    backgroundColor: colors.warningOverlay,
  },
  multiplierText: {
    fontWeight: '600',
    color: '#FFF',
  },
});
