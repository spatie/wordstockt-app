/**
 * DragDropContext - Modern drag and drop using react-native-reanimated + Gesture API
 *
 * ARCHITECTURE:
 * - Uses Gesture.Pan() from react-native-gesture-handler v2+
 * - Uses react-native-reanimated for UI thread animations
 * - Gesture callbacks run on UI thread via worklets
 * - Only calls JS thread via runOnJS when needed (state updates)
 *
 * DRAG FLOW:
 * 1. User touches a draggable item
 * 2. Gesture.Pan().onStart() - identify item via hit testing, show floating tile
 * 3. Gesture.Pan().onUpdate() - update position on UI thread (instant, no bridge)
 * 4. Gesture.Pan().onEnd() - determine drop target, animate to destination
 * 5. Animation completes - update game state
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from 'react';
import { View, StyleSheet, Platform, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import {
  TILE_SIZE,
  GAP,
  SLOT_COUNT,
  ANIMATION_DURATION,
  SPRING_CONFIG,
} from '../config/constants';
import { useGameStore, useIsSwapMode } from '../stores/gameStore';
import {
  getBoardCellPosition,
  getRackSlotPosition,
  getBoardCellFromPosition,
  getRackSlotFromPosition,
  BoardLayout,
  RackLayout,
} from '../utils/dragMath';
import type { Tile, PendingTile } from '../types';

// ============================================================================
// Types
// ============================================================================

type DragSource =
  | { type: 'rack'; rackIndex: number }
  | { type: 'board'; x: number; y: number };

type DropTarget =
  | { type: 'board'; x: number; y: number }
  | { type: 'rack'; slotIndex: number }
  | null;

type DragStatus = 'idle' | 'dragging' | 'settling';

interface DraggableItem {
  id: string;
  hitArea: { x: number; y: number; width: number; height: number };
  tile: Tile | PendingTile;
  source: DragSource;
  onDragEnd?: (target: DropTarget, wasDragged: boolean) => boolean;
}

interface RackDropInfo {
  rackIndex: number;
  dropX: number;
}

interface RecallingTile {
  tile: Tile;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

// ============================================================================
// Context Interface
// ============================================================================

interface DragDropContextType {
  // State
  isDragging: boolean;
  isSettling: boolean;
  dragSource: DragSource | null;
  dragTile: Tile | null;
  settlingTarget: DropTarget;
  recallingRackIndices: number[];
  recallingBoardPositions: Array<{ x: number; y: number }>;
  boardLayout: BoardLayout | null;

  // Rack drop tracking (for spring animation)
  getLastRackDrop: () => RackDropInfo | null;
  clearLastRackDrop: () => void;

  // Layout setters
  setBoardLayout: (layout: BoardLayout) => void;
  setRackLayout: (layout: RackLayout) => void;

  // Tile data sync (for external components to update shared values)
  updateRackTiles: (tiles: Array<Tile | null>) => void;

  // Draggable registration (for hit testing)
  registerDraggable: (
    id: string,
    hitArea: { x: number; y: number; width: number; height: number },
    tile: Tile | PendingTile,
    source: DragSource,
    onDragEnd?: (target: DropTarget, wasDragged: boolean) => boolean
  ) => void;
  unregisterDraggable: (id: string) => void;

  // Web-only: direct drag control (pointer events)
  startDragFromRack: (
    tile: Tile,
    rackIndex: number,
    x: number,
    y: number
  ) => void;
  startDragFromBoard: (
    tile: PendingTile,
    boardX: number,
    boardY: number,
    x: number,
    y: number
  ) => void;
  updateDrag: (x: number, y: number) => void;
  endDrag: (onComplete?: (target: DropTarget) => void) => DropTarget;

  // Recall animation
  startRecallAnimation: (
    tiles: Array<
      Tile & { x: number; y: number; rackIndex: number; visualSlot: number }
    >,
    onComplete: () => void
  ) => void;

  // Utility
  getBoardCell: (x: number, y: number) => { x: number; y: number } | null;

  // Shared values for immediate UI updates (worklet access)
  draggingRackIndexShared: SharedValue<number>;
}

// ============================================================================
// Constants
// ============================================================================

const TILE_OFFSET = -TILE_SIZE / 2;
const DRAG_ACTIVATION_DISTANCE = 0;
const SETTLE_DURATION = 150;
const RECALL_DURATION = 400;
const DRAG_COOLDOWN_MS = 100;

// ============================================================================
// Floating Tile Component (Reanimated)
// ============================================================================

interface FloatingTileProps {
  dragTileShared: SharedValue<[string, number, boolean] | null>;
  positionX: SharedValue<number>;
  positionY: SharedValue<number>;
  scale: SharedValue<number>;
  opacity: SharedValue<number>;
}

function FloatingTile({
  dragTileShared,
  positionX,
  positionY,
  scale,
  opacity,
}: FloatingTileProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: positionX.value },
      { translateY: positionY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  // Extract tile data from shared value for rendering
  const tileData = dragTileShared.value;
  if (!tileData) return null;

  const [letter, points, isBlank] = tileData;
  const displayLetter = letter === '*' ? '' : letter;
  const TILE_INNER_SIZE = TILE_SIZE * 0.92;

  return (
    <Animated.View
      style={[styles.floatingTile, animatedStyle]}
      pointerEvents="none"
    >
      <View style={[styles.tileContent, isBlank && styles.blankTile]}>
        {letter !== '*' && (
          <>
            <Animated.Text style={styles.letterText}>
              {displayLetter}
            </Animated.Text>
            <Animated.Text style={styles.points}>{points}</Animated.Text>
          </>
        )}
      </View>
    </Animated.View>
  );
}

// ============================================================================
// Recalling Tiles Component (Reanimated)
// ============================================================================

interface RecallingTilesProps {
  tiles: RecallingTile[];
  progress: SharedValue<number>;
}

function RecallingTiles({ tiles, progress }: RecallingTilesProps) {
  return (
    <>
      {tiles.map((rt, index) => (
        <RecallingTileItem key={index} tile={rt} progress={progress} />
      ))}
    </>
  );
}

function RecallingTileItem({
  tile,
  progress,
}: {
  tile: RecallingTile;
  progress: SharedValue<number>;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      transform: [
        { translateX: tile.startX + (tile.endX - tile.startX) * p },
        { translateY: tile.startY + (tile.endY - tile.startY) * p },
      ],
    };
  });

  const TILE_INNER_SIZE = TILE_SIZE * 0.92;
  const displayLetter = tile.tile.letter === '*' ? '' : tile.tile.letter;

  return (
    <Animated.View
      style={[styles.floatingTile, animatedStyle]}
      pointerEvents="none"
    >
      <View style={[styles.tileContent, tile.tile.isBlank && styles.blankTile]}>
        {tile.tile.letter !== '*' && (
          <>
            <Animated.Text style={styles.letterText}>
              {displayLetter}
            </Animated.Text>
            <Animated.Text style={styles.points}>
              {tile.tile.points}
            </Animated.Text>
          </>
        )}
      </View>
    </Animated.View>
  );
}

// ============================================================================
// Context
// ============================================================================

const DragDropContext = createContext<DragDropContextType | null>(null);

export function DragDropProvider({ children }: { children: React.ReactNode }) {
  // -------------------------------------------------------------------------
  // React State (for re-renders)
  // -------------------------------------------------------------------------
  const [dragStatus, setDragStatus] = useState<DragStatus>('idle');
  const [dragTile, setDragTile] = useState<Tile | null>(null);
  const [dragSource, setDragSource] = useState<DragSource | null>(null);
  const [settlingTarget, setSettlingTarget] = useState<DropTarget>(null);
  const [recallingTiles, setRecallingTiles] = useState<RecallingTile[]>([]);
  const [recallingRackIndices, setRecallingRackIndices] = useState<number[]>(
    []
  );
  const [recallingBoardPositions, setRecallingBoardPositions] = useState<
    Array<{ x: number; y: number }>
  >([]);

  // -------------------------------------------------------------------------
  // Shared Values (UI thread, no bridge)
  // -------------------------------------------------------------------------
  const positionX = useSharedValue(0);
  const positionY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const recallProgress = useSharedValue(0);
  const isDraggingShared = useSharedValue(false); // For worklet access
  const isSwapModeShared = useSharedValue(false); // For worklet access

  // Shared values for drag state (to avoid JS thread during active drag)
  const dragTileShared = useSharedValue<[string, number, boolean] | null>(null); // [letter, points, isBlank]
  const dragSourceShared = useSharedValue<{
    type: 'rack' | 'board';
    rackIndex?: number;
    x?: number;
    y?: number;
  } | null>(null);
  const lastDragEndTimeShared = useSharedValue(0);

  // Shared value for immediate rack tile hiding (prevents visual glitch)
  const draggingRackIndexShared = useSharedValue(-1); // -1 means no rack tile is dragging

  // Shared values for rack layout (accessed in worklet for gesture decisions)
  const rackTopShared = useSharedValue(0);
  const rackBottomShared = useSharedValue(0);
  const rackLeftShared = useSharedValue(0);
  const rackWidthShared = useSharedValue(0);

  // Shared values for board layout (accessed in worklet for hit testing)
  const boardLeftShared = useSharedValue(0);
  const boardTopShared = useSharedValue(0);
  const boardCellSizeShared = useSharedValue(0);
  const boardSizeShared = useSharedValue(15); // 15x15 board

  // Shared values for rack permutation (accessed in worklet for hit testing)
  const rackPermutationShared = useSharedValue([0, 1, 2, 3, 4, 5, 6]);

  // Shared values for storing tile data (accessed in worklet for drag operations)
  // Format: [letter, points, isBlank] for each rack index
  const rackTilesShared = useSharedValue<
    Array<[string, number, boolean] | null>
  >(new Array(7).fill(null));

  // Shared values for board tiles (pending tiles only)
  // Format: Map-like structure using string keys "x,y" -> [letter, points, isBlank, rackIndex]
  const boardTilesShared = useSharedValue<
    Record<string, [string, number, boolean, number]>
  >({});

  // Sync swap mode state to shared value for worklet access
  const isSwapMode = useIsSwapMode();
  useEffect(() => {
    isSwapModeShared.value = isSwapMode;
  }, [isSwapMode, isSwapModeShared]);

  // Sync game state to shared values for worklet access
  useEffect(() => {
    const state = useGameStore.getState();
    const currentGameUlid = state.currentGameUlid;
    if (!currentGameUlid) return;

    const gameState = state.gameStates[currentGameUlid];
    if (!gameState) return;

    // Update rack permutation
    rackPermutationShared.value = gameState.rackPermutation || [
      0, 1, 2, 3, 4, 5, 6,
    ];

    // Update board tiles (pending tiles only)
    const newBoardTiles: Record<string, [string, number, boolean, number]> = {};
    gameState.pendingTiles.forEach((tile) => {
      const key = `${tile.x},${tile.y}`;
      newBoardTiles[key] = [
        tile.letter,
        tile.points,
        tile.isBlank,
        tile.rackIndex,
      ];
    });
    boardTilesShared.value = newBoardTiles;
  }, [rackPermutationShared, boardTilesShared]);

  // Subscribe to game store changes to keep shared values in sync
  useEffect(() => {
    const unsubscribe = useGameStore.subscribe((state, prevState) => {
      const currentGameUlid = state.currentGameUlid;
      if (!currentGameUlid) return;

      const gameState = state.gameStates[currentGameUlid];
      const prevGameState = prevState.gameStates[currentGameUlid];
      if (!gameState) return;

      // Update only if pending tiles changed or rack permutation changed
      if (
        gameState.pendingTiles !== prevGameState?.pendingTiles ||
        gameState.rackPermutation !== prevGameState?.rackPermutation
      ) {
        // Update rack permutation
        rackPermutationShared.value = gameState.rackPermutation || [
          0, 1, 2, 3, 4, 5, 6,
        ];

        // Update board tiles (pending tiles only)
        const newBoardTiles: Record<string, [string, number, boolean, number]> =
          {};
        gameState.pendingTiles.forEach((tile) => {
          const key = `${tile.x},${tile.y}`;
          newBoardTiles[key] = [
            tile.letter,
            tile.points,
            tile.isBlank,
            tile.rackIndex,
          ];
        });
        boardTilesShared.value = newBoardTiles;
      }
    });

    return unsubscribe;
  }, [rackPermutationShared, boardTilesShared]);

  // -------------------------------------------------------------------------
  // Refs (synchronous access, no re-renders)
  // -------------------------------------------------------------------------
  const draggablesRef = useRef<Map<string, DraggableItem>>(new Map());
  const boardLayoutRef = useRef<BoardLayout | null>(null);
  const rackLayoutRef = useRef<RackLayout | null>(null);
  const lastRackDropRef = useRef<RackDropInfo | null>(null);
  const lastDragEndTimeRef = useRef(0);
  const activeDragRef = useRef<{
    id: string;
    tile: Tile | PendingTile;
    source: DragSource;
    onDragEnd?: (target: DropTarget, wasDragged: boolean) => boolean;
  } | null>(null);
  const isDraggingRef = useRef(false);
  const currentPositionRef = useRef({ x: 0, y: 0 });

  // Container offset from screen (to convert absolute coordinates to container-relative)
  const containerRef = useRef<View>(null);
  const containerOffsetRef = useRef({ x: 0, y: 0 });

  // Handler refs for worklet callbacks (needed because runOnJS requires stable refs)
  const handleGestureStartRef = useRef<(x: number, y: number) => void>(
    () => {}
  );
  const handleGestureEndRef = useRef<() => void>(() => {});
  const updatePositionRefFn = useRef<(x: number, y: number) => void>(() => {});

  // Refs for animation completion callbacks (prevents GC on real devices)
  const pendingSettleRef = useRef<{
    target: DropTarget;
    source: DragSource;
    tile: Tile | PendingTile;
    onComplete?: (target: DropTarget) => void;
    dragCallback?: (target: DropTarget, wasDragged: boolean) => boolean;
  } | null>(null);
  const pendingRecallCompleteRef = useRef<(() => void) | null>(null);

  // -------------------------------------------------------------------------
  // Derived State
  // -------------------------------------------------------------------------
  const isDragging = dragStatus === 'dragging';
  const isSettling = dragStatus === 'settling';

  // Reset store drag state when drag completes
  useEffect(() => {
    if (dragStatus === 'idle') {
      useGameStore.getState().setRackDragging(false);
    }
  }, [dragStatus]);

  // -------------------------------------------------------------------------
  // Registration Functions
  // -------------------------------------------------------------------------
  const registerDraggable = useCallback(
    (
      id: string,
      hitArea: { x: number; y: number; width: number; height: number },
      tile: Tile | PendingTile,
      source: DragSource,
      onDragEnd?: (target: DropTarget, wasDragged: boolean) => boolean
    ) => {
      draggablesRef.current.set(id, { id, hitArea, tile, source, onDragEnd });
    },
    []
  );

  const unregisterDraggable = useCallback((id: string) => {
    draggablesRef.current.delete(id);
  }, []);

  // -------------------------------------------------------------------------
  // Layout Functions
  // -------------------------------------------------------------------------
  const setBoardLayout = useCallback(
    (layout: BoardLayout) => {
      boardLayoutRef.current = layout;
      // Sync to shared values for worklet access (hit testing)
      boardLeftShared.value = layout.x;
      boardTopShared.value = layout.y;
      boardCellSizeShared.value = layout.cellSize;
    },
    [boardLeftShared, boardTopShared, boardCellSizeShared]
  );

  const setRackLayout = useCallback(
    (layout: RackLayout) => {
      rackLayoutRef.current = layout;
      // Sync to shared values for worklet access (gesture decisions)
      rackTopShared.value = layout.y;
      rackBottomShared.value = layout.y + layout.height;
      rackLeftShared.value = layout.x;
      rackWidthShared.value = layout.width;
    },
    [rackTopShared, rackBottomShared, rackLeftShared, rackWidthShared]
  );

  const getBoardCell = useCallback((x: number, y: number) => {
    if (!boardLayoutRef.current) return null;
    return getBoardCellFromPosition(x, y, boardLayoutRef.current);
  }, []);

  // -------------------------------------------------------------------------
  // Rack Drop Tracking
  // -------------------------------------------------------------------------
  const getLastRackDrop = useCallback(() => lastRackDropRef.current, []);
  const clearLastRackDrop = useCallback(() => {
    lastRackDropRef.current = null;
  }, []);

  // Update rack tiles in shared values (called by external components)
  const updateRackTiles = useCallback(
    (tiles: Array<Tile | null>) => {
      const newRackTiles = new Array(7).fill(null) as Array<
        [string, number, boolean] | null
      >;
      tiles.forEach((tile, index) => {
        if (tile) {
          newRackTiles[index] = [tile.letter, tile.points, tile.isBlank];
        }
      });
      rackTilesShared.value = newRackTiles;
    },
    [rackTilesShared]
  );

  // Measure container offset from screen (for converting absolute coordinates)
  const measureContainerOffset = useCallback(() => {
    containerRef.current?.measureInWindow((x, y) => {
      containerOffsetRef.current = { x, y };
    });
  }, []);

  const handleContainerLayout = useCallback(
    (_event: LayoutChangeEvent) => {
      // Measure after a short delay to ensure layout is complete
      setTimeout(measureContainerOffset, 50);
    },
    [measureContainerOffset]
  );

  // -------------------------------------------------------------------------
  // Hit Testing (Worklet Versions for UI Thread)
  // -------------------------------------------------------------------------

  // Worklet version of rack hit testing - runs on UI thread for instant response
  const findRackTileAtPositionWorklet = useCallback(
    (x: number, y: number) => {
      'worklet';
      // Check if within rack bounds
      if (
        y < rackTopShared.value ||
        y > rackBottomShared.value ||
        x < rackLeftShared.value ||
        x > rackLeftShared.value + rackWidthShared.value
      ) {
        return null;
      }

      // Calculate visual slot from position
      const slotWidth = TILE_SIZE + GAP;
      const relativeX = x - rackLeftShared.value;
      const visualSlot = Math.floor(relativeX / slotWidth);

      // Check if within tile (not in gap)
      const posInSlot = relativeX - visualSlot * slotWidth;
      if (posInSlot > TILE_SIZE || visualSlot < 0 || visualSlot >= SLOT_COUNT) {
        return null;
      }

      // Get actual rack index from permutation
      const permutation = rackPermutationShared.value;
      const actualRackIndex = permutation[visualSlot];
      if (actualRackIndex === undefined) {
        return null;
      }

      // Get tile data from shared values
      const tileData = rackTilesShared.value[actualRackIndex];
      if (!tileData) return null;

      const [letter, points, isBlank] = tileData;

      return {
        type: 'rack' as const,
        rackIndex: actualRackIndex,
        visualSlot,
        tile: { letter, points, isBlank },
        hitArea: {
          x: rackLeftShared.value + visualSlot * slotWidth,
          y: rackTopShared.value,
          width: TILE_SIZE,
          height: TILE_SIZE,
        },
      };
    },
    [
      rackTopShared,
      rackBottomShared,
      rackLeftShared,
      rackWidthShared,
      rackPermutationShared,
      rackTilesShared,
    ]
  );

  // Worklet version of board hit testing - runs on UI thread
  const findBoardCellAtPositionWorklet = useCallback(
    (x: number, y: number) => {
      'worklet';
      const boardLeft = boardLeftShared.value;
      const boardTop = boardTopShared.value;
      const cellSize = boardCellSizeShared.value;
      const boardSize = boardSizeShared.value;

      if (cellSize <= 0) return null;

      // Check if within board bounds
      const boardWidth = boardSize * cellSize;
      const boardHeight = boardSize * cellSize;

      if (
        x < boardLeft ||
        x > boardLeft + boardWidth ||
        y < boardTop ||
        y > boardTop + boardHeight
      ) {
        return null;
      }

      // Calculate cell coordinates
      const cellX = Math.floor((x - boardLeft) / cellSize);
      const cellY = Math.floor((y - boardTop) / cellSize);

      // Ensure within valid range
      if (cellX < 0 || cellX >= boardSize || cellY < 0 || cellY >= boardSize) {
        return null;
      }

      // Check if there's a pending tile at this position
      const key = `${cellX},${cellY}`;
      const tileData = boardTilesShared.value[key];
      if (!tileData) return null;

      const [letter, points, isBlank, rackIndex] = tileData;

      return {
        type: 'board' as const,
        x: cellX,
        y: cellY,
        tile: { letter, points, isBlank, rackIndex },
        hitArea: {
          x: boardLeft + cellX * cellSize,
          y: boardTop + cellY * cellSize,
          width: cellSize,
          height: cellSize,
        },
      };
    },
    [
      boardLeftShared,
      boardTopShared,
      boardCellSizeShared,
      boardSizeShared,
      boardTilesShared,
    ]
  );

  // -------------------------------------------------------------------------
  // Hit Testing (JS Thread Versions - for compatibility)
  // -------------------------------------------------------------------------

  // Fast-path hit test for rack tiles - O(1) instead of O(n)
  const findRackTileAtPosition = useCallback(
    (x: number, y: number): DraggableItem | null => {
      const rackLayout = rackLayoutRef.current;
      if (!rackLayout) return null;

      // Check if within rack bounds
      if (
        y < rackLayout.y ||
        y > rackLayout.y + rackLayout.height ||
        x < rackLayout.x ||
        x > rackLayout.x + rackLayout.width
      ) {
        return null;
      }

      // Calculate visual slot from position
      const slotWidth = TILE_SIZE + GAP;
      const relativeX = x - rackLayout.x;
      const visualSlot = Math.floor(relativeX / slotWidth);

      // Check if within tile (not in gap)
      const posInSlot = relativeX - visualSlot * slotWidth;
      if (posInSlot > TILE_SIZE || visualSlot < 0 || visualSlot >= SLOT_COUNT) {
        return null;
      }

      // Get actual rack index from permutation
      const state = useGameStore.getState();
      const currentGameUlid = state.currentGameUlid;
      const permutation = (currentGameUlid &&
        state.gameStates[currentGameUlid]?.rackPermutation) || [
        0, 1, 2, 3, 4, 5, 6,
      ];
      const actualRackIndex = permutation[visualSlot];
      if (actualRackIndex === undefined) return null;

      // Look up the registered draggable
      const draggable = draggablesRef.current.get(`rack-${actualRackIndex}`);
      if (!draggable) return null;

      // Return with calculated hit area
      return {
        ...draggable,
        hitArea: {
          x: rackLayout.x + visualSlot * slotWidth,
          y: rackLayout.y,
          width: TILE_SIZE,
          height: TILE_SIZE,
        },
      };
    },
    []
  );

  // Fast-path hit test for board tiles - O(1) instead of O(n)
  const findBoardTileAtPosition = useCallback(
    (x: number, y: number): DraggableItem | null => {
      const boardLayout = boardLayoutRef.current;
      if (!boardLayout) return null;

      // Calculate cell from position
      const cell = getBoardCellFromPosition(x, y, boardLayout);
      if (!cell) return null;

      // Look up the registered draggable for this cell
      const draggable = draggablesRef.current.get(`board-${cell.x}-${cell.y}`);
      if (!draggable) return null;

      // Return with the registered hit area
      return draggable;
    },
    []
  );

  const findDraggableAtPosition = useCallback(
    (x: number, y: number): DraggableItem | null => {
      // Fast-path: try rack first (most common drag source)
      const rackItem = findRackTileAtPosition(x, y);
      if (rackItem) return rackItem;

      // Fast-path: try board tiles
      const boardItem = findBoardTileAtPosition(x, y);
      if (boardItem) return boardItem;

      // Fallback: iterate through all draggables (rarely needed)
      return null;
    },
    [findRackTileAtPosition, findBoardTileAtPosition]
  );

  // -------------------------------------------------------------------------
  // Drag Actions (called from JS thread)
  // -------------------------------------------------------------------------
  const startDragJS = useCallback(
    (
      tile: Tile | PendingTile,
      source: DragSource,
      x: number,
      y: number,
      dragId?: string,
      onDragEnd?: (target: DropTarget, wasDragged: boolean) => boolean
    ) => {
      isDraggingRef.current = true;
      isDraggingShared.value = true; // Sync shared value for worklet access
      currentPositionRef.current = { x, y };
      activeDragRef.current = { id: dragId || '', tile, source, onDragEnd };

      setDragTile(tile);
      setDragSource(source);
      setDragStatus('dragging');

      // Convert absolute screen coordinates to container-relative
      const offset = containerOffsetRef.current;
      const relativeX = x - offset.x;
      const relativeY = y - offset.y;

      // Position the floating tile (container-relative)
      positionX.value = relativeX + TILE_OFFSET;
      positionY.value = relativeY + TILE_OFFSET;
      scale.value = 1;
      opacity.value = 1;

      // Prevent rack shuffle during drag
      if (source.type === 'rack') {
        useGameStore.getState().setRackDragging(true);
      }
    },
    [positionX, positionY, scale, opacity, isDraggingShared]
  );

  const updateDragJS = useCallback(
    (x: number, y: number) => {
      currentPositionRef.current = { x, y };
      // Convert absolute screen coordinates to container-relative
      const offset = containerOffsetRef.current;
      positionX.value = x - offset.x + TILE_OFFSET;
      positionY.value = y - offset.y + TILE_OFFSET;
    },
    [positionX, positionY]
  );

  const endDragJS = useCallback(
    (onComplete?: (target: DropTarget) => void): DropTarget => {
      const pos = currentPositionRef.current;
      const source = activeDragRef.current?.source;
      const tile = activeDragRef.current?.tile;
      const dragCallback = activeDragRef.current?.onDragEnd;
      const offset = containerOffsetRef.current;

      // Helper to convert screen-absolute to container-relative
      const toRelative = (screenPos: { x: number; y: number }) => ({
        x: screenPos.x - offset.x,
        y: screenPos.y - offset.y,
      });

      const finishDrag = (target: DropTarget, animated: boolean = true) => {
        if (!animated) {
          opacity.value = 0;
          isDraggingRef.current = false;
          isDraggingShared.value = false; // Sync shared value
          const now = Date.now();
          lastDragEndTimeRef.current = now;
          lastDragEndTimeShared.value = now;
          setDragStatus('idle');
          setDragTile(null);
          setDragSource(null);
          activeDragRef.current = null;
          dragTileShared.value = null;
          dragSourceShared.value = null;
          draggingRackIndexShared.value = -1;
          onComplete?.(target);
          dragCallback?.(target, true);
          return;
        }

        setDragStatus('settling');
        setSettlingTarget(target);
      };

      // Check board target
      if (boardLayoutRef.current) {
        const cell = getBoardCellFromPosition(
          pos.x,
          pos.y,
          boardLayoutRef.current
        );
        if (cell) {
          const target: DropTarget = { type: 'board', ...cell };
          const targetPos = toRelative(
            getBoardCellPosition(cell.x, cell.y, boardLayoutRef.current)
          );
          const targetScale = (boardLayoutRef.current.cellSize - 2) / TILE_SIZE;

          // Store callback data in ref before animation (prevents GC on real devices)
          pendingSettleRef.current = {
            target,
            source: source!,
            tile: tile!,
            onComplete,
            dragCallback,
          };

          // Animate to board cell (container-relative)
          positionX.value = withTiming(targetPos.x, {
            duration: SETTLE_DURATION,
          });
          positionY.value = withTiming(targetPos.y, {
            duration: SETTLE_DURATION,
          });
          scale.value = withTiming(
            targetScale,
            { duration: SETTLE_DURATION },
            () => {
              runOnJS(onSettleComplete)();
            }
          );

          finishDrag(target, true);
          return target;
        }
      }

      // Check rack target
      if (rackLayoutRef.current) {
        const slotIndex = getRackSlotFromPosition(
          pos.x,
          pos.y,
          rackLayoutRef.current
        );
        if (slotIndex !== null) {
          const target: DropTarget = { type: 'rack', slotIndex };

          if (source?.type === 'rack') {
            // Rack-to-rack: hide immediately, let rack tiles animate via spring
            const dropX = pos.x - TILE_SIZE / 2 - rackLayoutRef.current.x;
            lastRackDropRef.current = { rackIndex: source.rackIndex, dropX };
            finishDrag(target, false);
            return target;
          } else if (source?.type === 'board' && tile && 'rackIndex' in tile) {
            // Board-to-rack: animate to rack slot
            const tileRackIndex = (tile as PendingTile).rackIndex;
            const state = useGameStore.getState();
            const currentGameUlid = state.currentGameUlid;
            const permutation = (currentGameUlid &&
              state.gameStates[currentGameUlid]?.rackPermutation) || [
              0, 1, 2, 3, 4, 5, 6,
            ];
            const visualSlot = permutation.indexOf(tileRackIndex);

            if (visualSlot !== -1) {
              const targetPos = toRelative(
                getRackSlotPosition(visualSlot, rackLayoutRef.current)
              );

              // Store callback data in ref before animation (prevents GC on real devices)
              pendingSettleRef.current = {
                target,
                source: source!,
                tile: tile!,
                onComplete,
                dragCallback,
              };

              positionX.value = withTiming(targetPos.x, {
                duration: SETTLE_DURATION,
              });
              positionY.value = withTiming(
                targetPos.y,
                { duration: SETTLE_DURATION },
                () => {
                  runOnJS(onSettleComplete)();
                }
              );
              finishDrag(target, true);
              return target;
            }
          }

          finishDrag(target, false);
          return target;
        }
      }

      // No valid target - return to source
      if (source && rackLayoutRef.current) {
        let rackIndex: number | undefined;
        if (source.type === 'rack') {
          rackIndex = source.rackIndex;
        } else if (tile && 'rackIndex' in tile) {
          rackIndex = (tile as PendingTile).rackIndex;
        }

        if (rackIndex !== undefined) {
          const state = useGameStore.getState();
          const currentGameUlid = state.currentGameUlid;
          const permutation = (currentGameUlid &&
            state.gameStates[currentGameUlid]?.rackPermutation) || [
            0, 1, 2, 3, 4, 5, 6,
          ];
          const visualSlot = permutation.indexOf(rackIndex);

          if (visualSlot !== -1) {
            const targetPos = toRelative(
              getRackSlotPosition(visualSlot, rackLayoutRef.current)
            );

            // Store callback data in ref before animation (prevents GC on real devices)
            pendingSettleRef.current = {
              target: null,
              source: source!,
              tile: tile!,
              onComplete,
              dragCallback,
            };

            positionX.value = withTiming(targetPos.x, {
              duration: SETTLE_DURATION,
            });
            positionY.value = withTiming(
              targetPos.y,
              { duration: SETTLE_DURATION },
              () => {
                runOnJS(onSettleComplete)();
              }
            );
            finishDrag(null, true);
            return null;
          }
        }
      }

      // Fallback: just hide
      finishDrag(null, false);
      return null;
    },
    [positionX, positionY, scale, opacity]
  );

  // Ref to hold completeSettleFromRef for stable worklet access
  const completeSettleRef = useRef<() => void>(() => {});

  // Helper to animate tile back to rack slot
  const animateBackToRack = useCallback(
    (rackIndex: number, onComplete: () => void) => {
      const rackLayout = rackLayoutRef.current;
      const offset = containerOffsetRef.current;

      if (!rackLayout) {
        onComplete();
        return;
      }

      const state = useGameStore.getState();
      const currentGameUlid = state.currentGameUlid;
      const permutation = (currentGameUlid &&
        state.gameStates[currentGameUlid]?.rackPermutation) || [
        0, 1, 2, 3, 4, 5, 6,
      ];
      const visualSlot = permutation.indexOf(rackIndex);

      if (visualSlot === -1) {
        onComplete();
        return;
      }

      // Use getRackSlotPosition for consistent positioning with rest of codebase
      const targetPos = getRackSlotPosition(visualSlot, rackLayout);
      const targetX = targetPos.x - offset.x;
      const targetY = targetPos.y - offset.y;

      // Animate back to rack
      positionX.value = withTiming(targetX, { duration: SETTLE_DURATION });
      scale.value = withTiming(1, { duration: SETTLE_DURATION });
      positionY.value = withTiming(
        targetY,
        { duration: SETTLE_DURATION },
        () => {
          runOnJS(onComplete)();
        }
      );
    },
    [positionX, positionY, scale]
  );

  // Stable settle completion handler that reads from ref (prevents GC issues on real devices)
  const completeSettleFromRef = useCallback(() => {
    const pending = pendingSettleRef.current;
    pendingSettleRef.current = null;

    if (!pending) {
      // No pending settle, just reset
      isDraggingRef.current = false;
      isDraggingShared.value = false;
      const now = Date.now();
      lastDragEndTimeRef.current = now;
      lastDragEndTimeShared.value = now;
      setDragStatus('idle');
      setDragTile(null);
      setDragSource(null);
      setSettlingTarget(null);
      activeDragRef.current = null;
      dragTileShared.value = null;
      dragSourceShared.value = null;
      draggingRackIndexShared.value = -1;
      requestAnimationFrame(() => {
        opacity.value = 0;
        scale.value = 1;
      });
      return;
    }

    // Call the drag callback to see if placement succeeded
    pending.onComplete?.(pending.target);
    const success = pending.dragCallback?.(pending.target, true) ?? true;

    if (!success && pending.source?.type === 'rack') {
      // Placement failed - animate back to rack
      // Keep settlingTarget during animation so rack tile stays hidden (isFloatingTileAnimating = true)

      animateBackToRack(pending.source.rackIndex, () => {
        // Reset ALL drag state after return animation completes
        isDraggingRef.current = false;
        isDraggingShared.value = false;
        const now = Date.now();
        lastDragEndTimeRef.current = now;
        lastDragEndTimeShared.value = now;
        setDragStatus('idle');
        setDragTile(null);
        setDragSource(null);
        setSettlingTarget(null);
        activeDragRef.current = null;
        dragTileShared.value = null;
        dragSourceShared.value = null;

        requestAnimationFrame(() => {
          opacity.value = 0;
          scale.value = 1;
        });
      });
      return;
    }

    // Placement succeeded - reset drag state immediately
    isDraggingRef.current = false;
    isDraggingShared.value = false;
    const now = Date.now();
    lastDragEndTimeRef.current = now;
    lastDragEndTimeShared.value = now;
    setDragStatus('idle');
    setDragTile(null);
    setDragSource(null);
    setSettlingTarget(null);
    activeDragRef.current = null;
    dragTileShared.value = null;
    dragSourceShared.value = null;

    // Hide floating tile after a micro-delay to let React render the rack tile first
    // This prevents the brief flash where neither tile is visible
    requestAnimationFrame(() => {
      opacity.value = 0;
      scale.value = 1;
    });
  }, [opacity, scale, isDraggingShared, animateBackToRack]);

  // Keep ref in sync
  useEffect(() => {
    completeSettleRef.current = completeSettleFromRef;
  }, [completeSettleFromRef]);

  // Stable wrapper for worklet callbacks (never changes reference)
  const onSettleComplete = useCallback(() => {
    completeSettleRef.current();
  }, []);

  // -------------------------------------------------------------------------
  // Web API (for pointer events)
  // -------------------------------------------------------------------------
  const startDragFromRack = useCallback(
    (tile: Tile, rackIndex: number, x: number, y: number) => {
      startDragJS(tile, { type: 'rack', rackIndex }, x, y);
    },
    [startDragJS]
  );

  const startDragFromBoard = useCallback(
    (
      tile: PendingTile,
      boardX: number,
      boardY: number,
      x: number,
      y: number
    ) => {
      startDragJS(tile, { type: 'board', x: boardX, y: boardY }, x, y);
    },
    [startDragJS]
  );

  const updateDrag = useCallback(
    (x: number, y: number) => {
      updateDragJS(x, y);
    },
    [updateDragJS]
  );

  const endDrag = useCallback(
    (onComplete?: (target: DropTarget) => void): DropTarget => {
      return endDragJS(onComplete);
    },
    [endDragJS]
  );

  // -------------------------------------------------------------------------
  // Recall Animation
  // -------------------------------------------------------------------------

  // Stable recall completion handler that reads from ref (prevents GC on real devices)
  const finishRecallFromRef = useCallback(() => {
    const onComplete = pendingRecallCompleteRef.current;
    pendingRecallCompleteRef.current = null;

    setRecallingTiles([]);
    setRecallingRackIndices([]);
    setRecallingBoardPositions([]);
    onComplete?.();
  }, []);

  // Ref to hold finishRecallFromRef for stable worklet access
  const finishRecallRef = useRef<() => void>(() => {});

  useEffect(() => {
    finishRecallRef.current = finishRecallFromRef;
  }, [finishRecallFromRef]);

  // Stable wrapper for worklet callbacks (never changes reference)
  const onRecallComplete = useCallback(() => {
    finishRecallRef.current();
  }, []);

  const startRecallAnimation = useCallback(
    (
      tiles: Array<
        Tile & { x: number; y: number; rackIndex: number; visualSlot: number }
      >,
      onComplete: () => void
    ) => {
      const boardLayout = boardLayoutRef.current;
      const rackLayout = rackLayoutRef.current;
      const offset = containerOffsetRef.current;

      if (tiles.length === 0 || !boardLayout || !rackLayout) {
        onComplete();
        return;
      }

      // Helper to convert screen-absolute to container-relative
      const toRelative = (screenPos: { x: number; y: number }) => ({
        x: screenPos.x - offset.x,
        y: screenPos.y - offset.y,
      });

      // Set recalling state to hide tiles
      setRecallingRackIndices(tiles.map((t) => t.rackIndex));
      setRecallingBoardPositions(tiles.map((t) => ({ x: t.x, y: t.y })));

      // Create animation data
      const recallData: RecallingTile[] = tiles.map((t) => {
        const registrationId = `board-${t.x}-${t.y}`;
        const registration = draggablesRef.current.get(registrationId);

        let startPos: { x: number; y: number };
        if (registration) {
          // Registration hitArea is in screen coordinates, convert to relative
          startPos = toRelative({
            x:
              registration.hitArea.x +
              registration.hitArea.width / 2 -
              TILE_SIZE / 2,
            y:
              registration.hitArea.y +
              registration.hitArea.height / 2 -
              TILE_SIZE / 2,
          });
        } else {
          startPos = toRelative(getBoardCellPosition(t.x, t.y, boardLayout));
        }

        const endPos = toRelative(
          getRackSlotPosition(t.visualSlot, rackLayout)
        );

        return {
          tile: { letter: t.letter, points: t.points, isBlank: t.isBlank },
          startX: startPos.x,
          startY: startPos.y,
          endX: endPos.x,
          endY: endPos.y,
        };
      });

      setRecallingTiles(recallData);

      // Store callback in ref before animation (prevents GC on real devices)
      pendingRecallCompleteRef.current = onComplete;

      recallProgress.value = 0;
      recallProgress.value = withTiming(
        1,
        {
          duration: RECALL_DURATION,
          easing: Easing.out(Easing.cubic),
        },
        () => {
          runOnJS(onRecallComplete)();
        }
      );
    },
    [recallProgress, onRecallComplete]
  );

  // -------------------------------------------------------------------------
  // Gesture Handler Callbacks
  // -------------------------------------------------------------------------
  const handleGestureStart = useCallback(
    (x: number, y: number) => {
      // Check cooldown on JS thread
      const now = Date.now();
      if (now - lastDragEndTimeRef.current < DRAG_COOLDOWN_MS) {
        return;
      }

      const draggable = findDraggableAtPosition(x, y);
      if (draggable) {
        startDragJS(
          draggable.tile,
          draggable.source,
          x,
          y,
          draggable.id,
          draggable.onDragEnd
        );
      }
    },
    [findDraggableAtPosition, startDragJS]
  );

  const updatePositionRefCallback = useCallback((x: number, y: number) => {
    currentPositionRef.current = { x, y };
  }, []);

  const handleGestureEnd = useCallback(() => {
    endDragJS();
  }, [endDragJS]);

  // Worklet drag start callback - updates JS state asynchronously (non-blocking)
  const onWorkletDragStart = useCallback(
    (
      source: DragSource,
      tile: Tile | (Tile & { x: number; y: number; rackIndex: number })
    ) => {
      // Update React state for UI re-renders, but this doesn't block the worklet
      setDragTile(tile);
      setDragSource(source);
      setDragStatus('dragging');

      // Update refs for JS-side operations
      currentPositionRef.current = { x: 0, y: 0 }; // Will be updated in onUpdate
      isDraggingRef.current = true;
      activeDragRef.current = {
        id:
          source.type === 'rack'
            ? `rack-${source.rackIndex}`
            : `board-${source.x}-${source.y}`,
        tile,
        source,
        onDragEnd: (target: DropTarget, wasDragged: boolean): boolean => {
          const callback = draggablesRef.current.get(
            source.type === 'rack'
              ? `rack-${source.rackIndex}`
              : `board-${source.x}-${source.y}`
          )?.onDragEnd;
          return callback?.(target, wasDragged) ?? true;
        },
      };

      // Prevent rack shuffle during drag
      if (source.type === 'rack') {
        useGameStore.getState().setRackDragging(true);
      }
    },
    [setDragTile, setDragSource, setDragStatus]
  );

  // Sync handler refs for worklet access
  useEffect(() => {
    handleGestureStartRef.current = handleGestureStart;
  }, [handleGestureStart]);

  useEffect(() => {
    handleGestureEndRef.current = handleGestureEnd;
  }, [handleGestureEnd]);

  useEffect(() => {
    updatePositionRefFn.current = updatePositionRefCallback;
  }, [updatePositionRefCallback]);

  // Stable wrapper functions for runOnJS (refs don't work directly)
  const onGestureStart = useCallback((x: number, y: number) => {
    handleGestureStartRef.current(x, y);
  }, []);

  const onGestureEnd = useCallback(() => {
    handleGestureEndRef.current();
  }, []);

  const onGestureEndWithPosition = useCallback((x: number, y: number) => {
    // Update position ref for drop target calculation
    currentPositionRef.current = { x, y };
    // Call the normal end drag logic
    handleGestureEndRef.current();
  }, []);

  const onPositionUpdate = useCallback((x: number, y: number) => {
    updatePositionRefFn.current(x, y);
  }, []);

  // -------------------------------------------------------------------------
  // Native Gesture Handler (Gesture API)
  // -------------------------------------------------------------------------

  // Shared values for container offset (accessed in worklet)
  const containerOffsetX = useSharedValue(0);
  const containerOffsetY = useSharedValue(0);

  // Sync container offset to shared values
  useEffect(() => {
    const syncValues = () => {
      containerOffsetX.value = containerOffsetRef.current.x;
      containerOffsetY.value = containerOffsetRef.current.y;
    };
    // Sync immediately and also set up a small interval for the initial layout
    syncValues();
    const timer = setInterval(syncValues, 100);
    // Clear after a short time - we just need to catch the initial measurement
    setTimeout(() => clearInterval(timer), 500);
    return () => clearInterval(timer);
  }, [containerOffsetX, containerOffsetY]);

  // Edge threshold for iOS swipe-back gesture (in pixels from left edge)
  const EDGE_THRESHOLD = 20;
  // Track if touch started near edge (to fail gesture on first move)
  const touchStartedNearEdge = useSharedValue(false);
  // Track if touch started on rack (to activate immediately)
  const touchStartedOnRack = useSharedValue(false);

  // Track if touch started below rack (in button area) - should fail gesture
  const touchStartedBelowRack = useSharedValue(false);
  // Track if gesture was activated immediately in onTouchesDown
  const activatedImmediately = useSharedValue(false);

  const panGesture = Gesture.Pan()
    .minDistance(DRAG_ACTIVATION_DISTANCE)
    .maxPointers(1)
    .manualActivation(true)
    .onTouchesDown((event, stateManager) => {
      'worklet';
      const touch = event.allTouches[0];
      if (!touch) return;

      // Use relative touch coordinates + container offset for consistent behavior across platforms
      // On Android, absoluteY and measureInWindow may use different coordinate systems (status bar handling)
      const touchY = touch.y + containerOffsetY.value;
      const touchX = touch.x + containerOffsetX.value;

      // Check if touch is on the rack area (only if layout is measured)
      const rackLayoutMeasured = rackBottomShared.value > rackTopShared.value;
      const isOnRack =
        rackLayoutMeasured &&
        touchY >= rackTopShared.value &&
        touchY <= rackBottomShared.value;
      touchStartedOnRack.value = isOnRack;

      // Check if touch is below the rack (button area)
      const isBelowRack = rackLayoutMeasured && touchY > rackBottomShared.value;
      touchStartedBelowRack.value = isBelowRack;

      // Check if touch starts near left edge (for iOS swipe-back)
      // But NOT if on the rack - rack touches are always for tile dragging
      touchStartedNearEdge.value = !isOnRack && touchX < EDGE_THRESHOLD;

      // Fail immediately for touches below rack (button area) to allow button presses
      if (isBelowRack) {
        stateManager.fail();
        return;
      }

      // In swap mode, fail immediately for rack touches to allow tap handling
      if (isOnRack && isSwapModeShared.value) {
        stateManager.fail();
        return;
      }

      // Activate immediately only for rack touches (not in swap mode)
      // Board area touches (score bar, game board) should only activate on move
      // This allows taps on score bar avatars to work
      const shouldActivateImmediately = isOnRack;

      activatedImmediately.value = shouldActivateImmediately;
      if (shouldActivateImmediately) {
        stateManager.activate();
      }
    })
    .onTouchesMove((event, stateManager) => {
      'worklet';
      // If already activated in onTouchesDown, do nothing
      if (activatedImmediately.value) return;

      // If touch started below rack (button area), fail to allow button presses
      if (touchStartedBelowRack.value) {
        stateManager.fail();
        return;
      }

      // If in swap mode and touch started on rack, fail to allow tap handling
      if (isSwapModeShared.value && touchStartedOnRack.value) {
        stateManager.fail();
        return;
      }

      // If touch started near edge, fail to allow iOS swipe-back
      if (touchStartedNearEdge.value) {
        stateManager.fail();
        return;
      }
      // Otherwise activate the pan gesture on first move
      stateManager.activate();
    })
    .onStart((event) => {
      'worklet';
      // Check cooldown on UI thread
      const now = Date.now();
      if (now - lastDragEndTimeShared.value < DRAG_COOLDOWN_MS) {
        return;
      }

      // Use relative coordinates + container offset for consistent behavior across platforms
      const screenX = event.x + containerOffsetX.value;
      const screenY = event.y + containerOffsetY.value;

      // Try rack hit testing first (most common)
      const rackHit = findRackTileAtPositionWorklet(screenX, screenY);
      if (rackHit) {
        // Start rack drag on UI thread
        isDraggingShared.value = true;
        dragTileShared.value = [
          rackHit.tile.letter,
          rackHit.tile.points,
          rackHit.tile.isBlank,
        ];
        dragSourceShared.value = { type: 'rack', rackIndex: rackHit.rackIndex };
        draggingRackIndexShared.value = rackHit.rackIndex; // Hide rack tile immediately

        // Position floating tile (container-relative coordinates)
        positionX.value = event.x + TILE_OFFSET;
        positionY.value = event.y + TILE_OFFSET;
        scale.value = 1;
        opacity.value = 1;

        // Update JS state asynchronously (non-blocking)
        runOnJS(onWorkletDragStart)(
          { type: 'rack', rackIndex: rackHit.rackIndex },
          rackHit.tile
        );
        return;
      }

      // Try board hit testing
      const boardHit = findBoardCellAtPositionWorklet(screenX, screenY);
      if (boardHit) {
        // Start board drag on UI thread
        isDraggingShared.value = true;
        dragTileShared.value = [
          boardHit.tile.letter,
          boardHit.tile.points,
          boardHit.tile.isBlank,
        ];
        dragSourceShared.value = {
          type: 'board',
          x: boardHit.x,
          y: boardHit.y,
        };

        // Position floating tile (container-relative coordinates)
        positionX.value = event.x + TILE_OFFSET;
        positionY.value = event.y + TILE_OFFSET;
        scale.value = 1;
        opacity.value = 1;

        // Update JS state asynchronously (non-blocking)
        runOnJS(onWorkletDragStart)(
          { type: 'board', x: boardHit.x, y: boardHit.y },
          { ...boardHit.tile, x: boardHit.x, y: boardHit.y }
        );
        return;
      }

      // Fallback to JS hit testing if worklets don't find anything
      runOnJS(onGestureStart)(screenX, screenY);
    })
    .onUpdate((event) => {
      'worklet';
      if (!isDraggingShared.value) return;

      // Update position directly on UI thread - no bridge!
      positionX.value = event.x + TILE_OFFSET;
      positionY.value = event.y + TILE_OFFSET;

      // No need for runOnJS here - position updates are handled entirely on UI thread
      // JS thread position tracking is only needed for final drop calculations
    })
    .onEnd((event) => {
      'worklet';
      if (!isDraggingShared.value) return;

      // Update shared drag end time for cooldown
      lastDragEndTimeShared.value = Date.now();

      // Convert to screen coordinates for drop target calculation
      const screenX = event.x + containerOffsetX.value;
      const screenY = event.y + containerOffsetY.value;

      // Call JS for final drop handling (this is needed for game state updates)
      runOnJS(onGestureEndWithPosition)(screenX, screenY);
    })
    .onFinalize((event) => {
      'worklet';
      // Handle cancelled gestures
      if (isDraggingShared.value) {
        lastDragEndTimeShared.value = Date.now();
        const screenX = event.x + containerOffsetX.value;
        const screenY = event.y + containerOffsetY.value;
        runOnJS(onGestureEndWithPosition)(screenX, screenY);
      }
    });

  // -------------------------------------------------------------------------
  // Context Value
  // -------------------------------------------------------------------------
  const contextValue = useMemo<DragDropContextType>(
    () => ({
      isDragging,
      isSettling,
      dragSource,
      dragTile,
      settlingTarget,
      recallingRackIndices,
      recallingBoardPositions,
      boardLayout: boardLayoutRef.current,
      getLastRackDrop,
      clearLastRackDrop,
      setBoardLayout,
      setRackLayout,
      updateRackTiles,
      registerDraggable,
      unregisterDraggable,
      startDragFromRack,
      startDragFromBoard,
      updateDrag,
      endDrag,
      startRecallAnimation,
      getBoardCell,
      draggingRackIndexShared,
    }),
    [
      isDragging,
      isSettling,
      dragSource,
      dragTile,
      settlingTarget,
      recallingRackIndices,
      recallingBoardPositions,
      getLastRackDrop,
      clearLastRackDrop,
      setBoardLayout,
      setRackLayout,
      updateRackTiles,
      registerDraggable,
      unregisterDraggable,
      startDragFromRack,
      startDragFromBoard,
      updateDrag,
      endDrag,
      startRecallAnimation,
      getBoardCell,
      draggingRackIndexShared,
    ]
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  const floatingTiles = (
    <View style={styles.floatingContainer} pointerEvents="none">
      <FloatingTile
        dragTileShared={dragTileShared}
        positionX={positionX}
        positionY={positionY}
        scale={scale}
        opacity={opacity}
      />
      <RecallingTiles tiles={recallingTiles} progress={recallProgress} />
    </View>
  );

  return (
    <DragDropContext.Provider value={contextValue}>
      {Platform.OS === 'web' ? (
        <>
          {children}
          {floatingTiles}
        </>
      ) : (
        <View
          ref={containerRef}
          style={styles.container}
          onLayout={handleContainerLayout}
        >
          <GestureDetector gesture={panGesture}>
            <Animated.View style={styles.container}>{children}</Animated.View>
          </GestureDetector>
          {floatingTiles}
        </View>
      )}
    </DragDropContext.Provider>
  );
}

// ============================================================================
// Styles
// ============================================================================

const TILE_INNER_SIZE = TILE_SIZE * 0.92;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  floatingTile: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: TILE_SIZE,
    height: TILE_SIZE,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileContent: {
    width: TILE_INNER_SIZE,
    height: TILE_INNER_SIZE,
    backgroundColor: '#E8E4DC',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    // 3D embossed effect - light top/left, dark bottom/right
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderTopColor: '#F5F3EF',
    borderLeftColor: '#F5F3EF',
    borderBottomColor: '#B8B4AA',
    borderRightColor: '#B8B4AA',
    // Enhanced shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  letterText: {
    fontSize: 37,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    // Ensure proper centering on Android
    ...Platform.select({
      android: {
        includeFontPadding: false,
        textAlignVertical: 'center',
      },
      default: {},
    }),
  },
  points: {
    position: 'absolute',
    bottom: '4%',
    right: '5%',
    fontSize: 10,
    fontWeight: '800',
    color: '#1A1A1A',
    // Ensure proper centering on Android
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
      default: {},
    }),
  },
  blankTile: {
    borderWidth: 2,
    borderColor: '#555555',
    borderStyle: 'dashed',
  },
});

// ============================================================================
// Hook
// ============================================================================

export function useDragDrop() {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
}

// ============================================================================
// Exports
// ============================================================================

export type { DragSource, DropTarget, BoardLayout, RackLayout };
