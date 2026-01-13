import React, {
  useCallback,
  useRef,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  View,
  StyleSheet,
  LayoutChangeEvent,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { BoardCell } from './BoardCell';
import { ScoreBubble } from './ScoreBubble';
import { useDragDrop } from '../../context/DragDropContext';
import { usePendingTiles } from '../../stores/gameStore';
import { BOARD_SIZE } from '../../config/constants';
import { colors } from '../../config/theme';
import type { Game } from '../../types';
import type { DropTarget } from '../../context/DragDropContext';

const BOARD_PADDING = 0; // no padding - use full width
const SPINNER_DELAY = 1500; // ms before showing spinner
const FADE_IN_DURATION = 150; // ms for board fade-in

interface GameBoardProps {
  game: Game;
  onCellPress: (x: number, y: number) => void;
  onPendingTileDrag: (fromX: number, fromY: number, target: DropTarget) => void;
  onBlankTileTap?: (x: number, y: number) => void;
  onPlacedTileTap?: (x: number, y: number) => void;
  isMyTurn: boolean;
  potentialScore?: number | null;
}

function isLastMoveTile(
  x: number,
  y: number,
  lastMoveTiles: { x: number; y: number }[] | null | undefined
): boolean {
  if (!lastMoveTiles) return false;
  return lastMoveTiles.some((t) => t.x === x && t.y === y);
}

export function GameBoard({
  game,
  onCellPress,
  onPendingTileDrag,
  onBlankTileTap,
  onPlacedTileTap,
  potentialScore,
}: GameBoardProps) {
  const boardRef = useRef<View>(null);
  const { setBoardLayout, isDragging } = useDragDrop();
  const pendingTiles = usePendingTiles();
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [showSpinner, setShowSpinner] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Calculate board size from container dimensions (use smaller of width/height to ensure it fits)
  const boardSize = containerSize
    ? Math.min(
        containerSize.width - BOARD_PADDING * 2,
        containerSize.height - BOARD_PADDING * 2
      )
    : 0;

  // Show spinner only after delay (avoids flash for fast loads)
  useEffect(() => {
    if (boardSize > 0) {
      setShowSpinner(false);
      return;
    }
    const timer = setTimeout(() => setShowSpinner(true), SPINNER_DELAY);
    return () => clearTimeout(timer);
  }, [boardSize]);

  // Fade in board when ready
  useEffect(() => {
    if (boardSize > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: FADE_IN_DURATION,
        useNativeDriver: true,
      }).start();
    }
  }, [boardSize, fadeAnim]);

  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
  }, []);

  const measureBoard = useCallback(() => {
    boardRef.current?.measureInWindow((x, y, width, height) => {
      // Board has 8px padding, so cells start 8px inside and the cell area is 16px smaller
      const boardPadding = 8;
      const innerWidth = width - boardPadding * 2;
      const cellSize = innerWidth / BOARD_SIZE;
      console.log('[GameBoard] measureInWindow raw:', { x, y, width, height });
      console.log('[GameBoard] setting boardLayout:', {
        x: x + boardPadding,
        y: y + boardPadding,
        innerWidth,
        cellSize,
      });
      setBoardLayout({
        x: x + boardPadding,
        y: y + boardPadding,
        width: innerWidth,
        height: innerWidth, // Board is square
        cellSize,
      });
    });
  }, [setBoardLayout]);

  // Measure board position after layout settles
  useEffect(() => {
    const timer = setTimeout(measureBoard, 100);
    return () => clearTimeout(timer);
  }, [measureBoard, boardSize]);

  // Re-measure when drag starts to ensure accurate positioning
  useEffect(() => {
    if (isDragging) measureBoard();
  }, [isDragging, measureBoard]);

  const isGameActive = game.status === 'active';
  const lastMoveTiles = game.lastMove?.tiles;

  // Calculate cell size for score bubble positioning and cell text sizing
  const cellSize = (boardSize - 16) / BOARD_SIZE; // subtract padding (8*2)

  const renderCell = useCallback(
    (x: number, y: number) => (
      <BoardCell
        key={`${x}-${y}`}
        x={x}
        y={y}
        placedTile={game.board[y]?.[x] ?? null}
        squareType={game.boardTemplate[y]?.[x] ?? null}
        onPress={() => onCellPress(x, y)}
        onPendingTileDrag={onPendingTileDrag}
        onBlankTileTap={onBlankTileTap}
        onPlacedTileTap={onPlacedTileTap}
        disabled={!isGameActive}
        isLastMove={isLastMoveTile(x, y, lastMoveTiles)}
        cellSize={cellSize}
      />
    ),
    [
      game.board,
      game.boardTemplate,
      onCellPress,
      onPendingTileDrag,
      onBlankTileTap,
      onPlacedTileTap,
      isGameActive,
      lastMoveTiles,
      cellSize,
    ]
  );

  // Find the top-left pending tile for score bubble positioning (memoized)
  const topLeftTile = useMemo(() => {
    if (pendingTiles.length === 0) return null;
    return pendingTiles.reduce((topLeft, tile) => {
      if (tile.y < topLeft.y || (tile.y === topLeft.y && tile.x < topLeft.x)) {
        return tile;
      }
      return topLeft;
    });
  }, [pendingTiles]);

  return (
    <View style={styles.boardContainer} onLayout={handleContainerLayout}>
      {boardSize > 0 ? (
        <Animated.View
          ref={boardRef}
          style={[
            styles.board,
            { width: boardSize, height: boardSize, opacity: fadeAnim },
          ]}
        >
          {Array.from({ length: BOARD_SIZE }, (_, y) => (
            <View key={y} style={styles.row}>
              {Array.from({ length: BOARD_SIZE }, (_, x) => renderCell(x, y))}
            </View>
          ))}
          {/* Score bubble positioned at top-left of the top-left pending tile */}
          {topLeftTile && (
            <ScoreBubble
              score={potentialScore}
              x={topLeftTile.x}
              y={topLeftTile.y}
              cellSize={cellSize}
            />
          )}
        </Animated.View>
      ) : showSpinner ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  board: {
    backgroundColor: colors.boardBackground,
    borderRadius: 16,
    padding: 8,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
});
