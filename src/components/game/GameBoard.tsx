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
  Platform,
  StatusBar,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { BoardCell } from './BoardCell';
import { ScoreBubble } from './ScoreBubble';
import { useDragDrop } from '../../context/DragDropContext';
import { usePendingTiles, useGameStore } from '../../stores/gameStore';
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
  const currentGameUlid = useGameStore((state) => state.currentGameUlid);
  const prevGameUlid = useRef(currentGameUlid);
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

  // Reset fade when game changes
  useEffect(() => {
    if (
      prevGameUlid.current !== null &&
      prevGameUlid.current !== currentGameUlid
    ) {
      fadeAnim.setValue(0);
    }
    prevGameUlid.current = currentGameUlid;
  }, [currentGameUlid, fadeAnim]);

  // Fade in board when ready
  useEffect(() => {
    if (boardSize > 0) {
      // Small delay to ensure any reset from game change takes effect
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: FADE_IN_DURATION,
          useNativeDriver: true,
        }).start();
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [boardSize, fadeAnim, currentGameUlid]);

  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
  }, []);

  const measureBoard = useCallback(() => {
    boardRef.current?.measureInWindow((x, y, width, height) => {
      // Board has 8px padding AND 2px border, so cells start (8+2)px inside
      // and the cell area is (8+2)*2 = 20px smaller
      const boardPadding = 8;
      const boardBorder = 2;
      const inset = boardPadding + boardBorder;
      const innerWidth = width - inset * 2;
      const cellSize = innerWidth / BOARD_SIZE;
      // On Android, measureInWindow may not include status bar height, but touch events do
      const statusBarOffset =
        Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
      setBoardLayout({
        x: x + inset,
        y: y + statusBarOffset + inset,
        width: innerWidth,
        height: innerWidth, // Board is square
        cellSize,
      });
    });
  }, [setBoardLayout]);

  // Measure board position after layout settles
  // Re-measure when game changes (navigation may have moved the board)
  useEffect(() => {
    if (boardSize > 0) {
      // Multiple measurements to catch navigation animations
      measureBoard();
      const timer1 = setTimeout(measureBoard, 100);
      const timer2 = setTimeout(measureBoard, 300);
      const timer3 = setTimeout(measureBoard, 500);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [measureBoard, boardSize, currentGameUlid]);

  // Re-measure when drag starts to ensure accurate positioning
  useEffect(() => {
    if (isDragging) measureBoard();
  }, [isDragging, measureBoard]);

  const isGameActive = game.status === 'active';
  const lastMoveTiles = game.lastMove?.tiles;

  // Calculate cell size for score bubble positioning and cell text sizing
  // Board has 8px padding + 2px border = 10px inset on each side
  const cellSize = (boardSize - 20) / BOARD_SIZE;

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

  // Track last known position for score bubble so it can animate out
  const lastScoreBubblePosition = useRef<{ x: number; y: number } | null>(null);
  if (topLeftTile) {
    lastScoreBubblePosition.current = { x: topLeftTile.x, y: topLeftTile.y };
  }

  return (
    <View style={styles.boardContainer} onLayout={handleContainerLayout}>
      {boardSize > 0 ? (
        <Animated.View
          style={[
            styles.boardWrapper,
            { width: boardSize, height: boardSize, opacity: fadeAnim },
          ]}
        >
          <View style={styles.boardClip}>
            <BlurView intensity={80} tint="dark" style={styles.boardBlur}>
              <View ref={boardRef} style={styles.board}>
                {Array.from({ length: BOARD_SIZE }, (_, y) => (
                  <View key={y} style={styles.row}>
                    {Array.from({ length: BOARD_SIZE }, (_, x) =>
                      renderCell(x, y)
                    )}
                  </View>
                ))}
                {/* Score bubble positioned at top-left of the top-left pending tile */}
                {/* Always render if we have a position so fade-out animation can complete */}
                {lastScoreBubblePosition.current && (
                  <ScoreBubble
                    score={potentialScore}
                    x={lastScoreBubblePosition.current.x}
                    y={lastScoreBubblePosition.current.y}
                    cellSize={cellSize}
                  />
                )}
              </View>
            </BlurView>
          </View>
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
  boardWrapper: {
    borderRadius: 16,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  boardClip: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 217, 0.5)',
  },
  boardBlur: {
    flex: 1,
    backgroundColor: 'rgba(27, 40, 56, 0.1)',
  },
  board: {
    flex: 1,
    padding: 8,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
});
