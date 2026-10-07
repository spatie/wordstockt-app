import type { ThemeColors } from '../../config/theme';
import {
  useThemeBlurTint,
  useThemeColors,
  useThemedStyles,
} from '../../hooks/useThemeColors';
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
import { BlurView } from 'expo-blur';
import { BoardCell } from './BoardCell';
import { BoardGrid } from './BoardGrid';
import { useStableCallback } from '../../hooks/useStableCallback';
import { ScoreBubble } from './ScoreBubble';
import { useDragDrop } from '../../context/DragDropContext';
import { usePendingTiles, useGameStore } from '../../stores/gameStore';
import { BOARD_SIZE } from '../../config/constants';
import type { Game } from '../../types';
import type { DropTarget } from '../../context/DragDropContext';

const BOARD_PADDING = 0; // no padding - use full width
const SPINNER_DELAY = 1500; // ms before showing spinner
const FADE_IN_DURATION = 150; // ms for board fade-in
const BOARD_BORDER = 1;
const GRID_PADDING = 8;
const BOARD_INSET = BOARD_BORDER + GRID_PADDING; // board edge to grid edge

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
  const blurTint = useThemeBlurTint();
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const gridRef = useRef<View>(null);
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
    gridRef.current?.measureInWindow((x, y, width) => {
      setBoardLayout({
        x,
        y,
        width,
        height: width, // Board is square
        cellSize: width / BOARD_SIZE,
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
  const cellSize = (boardSize - BOARD_INSET * 2) / BOARD_SIZE;

  // The game screen recreates these handlers whenever placed tiles change.
  // Stable wrappers keep the 225 memoized cells from all re-rendering.
  const handleCellPress = useStableCallback(onCellPress);
  const handlePendingTileDrag = useStableCallback(onPendingTileDrag);
  const handleBlankTileTap = useStableCallback((x: number, y: number) =>
    onBlankTileTap?.(x, y)
  );
  const handlePlacedTileTap = useStableCallback((x: number, y: number) =>
    onPlacedTileTap?.(x, y)
  );

  const renderCell = useCallback(
    (x: number, y: number) => (
      <BoardCell
        key={`${x}-${y}`}
        x={x}
        y={y}
        placedTile={game.board[y]?.[x] ?? null}
        squareType={game.boardTemplate[y]?.[x] ?? null}
        onCellPress={handleCellPress}
        onPendingTileDrag={handlePendingTileDrag}
        onBlankTileTap={onBlankTileTap ? handleBlankTileTap : undefined}
        onPlacedTileTap={onPlacedTileTap ? handlePlacedTileTap : undefined}
        disabled={!isGameActive}
        isLastMove={isLastMoveTile(x, y, lastMoveTiles)}
        cellSize={cellSize}
      />
    ),
    [
      game.board,
      game.boardTemplate,
      handleCellPress,
      handlePendingTileDrag,
      handleBlankTileTap,
      handlePlacedTileTap,
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

  const occupiedTiles = useMemo(() => {
    const tiles = pendingTiles.map(({ x, y }) => ({ x, y }));
    game.board.forEach((row, y) =>
      row.forEach((tile, x) => {
        if (tile) tiles.push({ x, y });
      })
    );
    return tiles;
  }, [game.board, pendingTiles]);

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
            <BlurView intensity={80} tint={blurTint} style={styles.boardBlur}>
              <View style={styles.board}>
                <View ref={gridRef} style={styles.grid}>
                  {Array.from({ length: BOARD_SIZE }, (_, y) => (
                    <View key={y} style={styles.row}>
                      {Array.from({ length: BOARD_SIZE }, (_, x) =>
                        renderCell(x, y)
                      )}
                    </View>
                  ))}
                  <BoardGrid />
                </View>
                {/* Position the score bubble near the first pending tile */}
                {/* Always render if we have a position so fade-out animation can complete */}
                {lastScoreBubblePosition.current && (
                  <ScoreBubble
                    score={potentialScore}
                    x={lastScoreBubblePosition.current.x}
                    y={lastScoreBubblePosition.current.y}
                    cellSize={cellSize}
                    boardSize={boardSize}
                    occupiedTiles={occupiedTiles}
                    pendingTiles={pendingTiles}
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    boardContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    boardWrapper: {
      borderRadius: 16,
      shadowColor: colors.boardShadow,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 8,
    },
    boardClip: {
      flex: 1,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: BOARD_BORDER,
      borderColor: colors.boardOutline,
    },
    boardBlur: {
      flex: 1,
      backgroundColor: colors.boardBackground,
    },
    board: {
      flex: 1,
      padding: GRID_PADDING,
    },
    grid: {
      flex: 1,
    },
    row: {
      flex: 1,
      flexDirection: 'row',
    },
  });
