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
  useLayoutEffect,
} from 'react';
import {
  View,
  StyleSheet,
  Platform,
  LayoutChangeEvent,
  Text,
  ScrollView,
  TouchableOpacity,
  Clipboard,
  StatusBar,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useAnimatedReaction,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
  SharedValue,
  interpolateColor,
} from 'react-native-reanimated';
import {
  TILE_SIZE,
  GAP,
  SLOT_COUNT,
  ANIMATION_DURATION,
  SPRING_CONFIG,
} from '../config/constants';
import { Tile } from '../components/game/Tile';
import { useGameStore, useIsSwapMode } from '../stores/gameStore';
import {
  getBoardCellCenter,
  getRackSlotCenter,
  getBoardCellFromPosition,
  getRackSlotFromPosition,
  BoardLayout,
  RackLayout,
} from '../utils/dragMath';
import type { Tile as TileType, PendingTile } from '../types';

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
  tile: TileType | PendingTile;
  source: DragSource;
  onDragEnd?: (target: DropTarget, wasDragged: boolean) => boolean;
}

interface RackDropInfo {
  rackIndex: number;
  dropX: number;
}

interface RecallingTile {
  tile: TileType;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  startScale: number; // Scale at board size (cellSize / TILE_SIZE)
}

// ============================================================================
// Context Interface
// ============================================================================

interface DragDropContextType {
  // State
  isDragging: boolean;
  isSettling: boolean;
  dragSource: DragSource | null;
  dragTile: TileType | null;
  settlingTarget: DropTarget;
  recallingRackIndices: number[];
  recallingRackIndicesShared: SharedValue<number[]>;
  recallingBoardPositions: Array<{ x: number; y: number }>;
  recallingBoardPositionsShared: SharedValue<Array<{ x: number; y: number }>>;
  boardLayout: BoardLayout | null;

  // Rack drop tracking (for spring animation)
  getLastRackDrop: () => RackDropInfo | null;
  clearLastRackDrop: () => void;

  // Layout setters
  setBoardLayout: (layout: BoardLayout) => void;
  setRackLayout: (layout: RackLayout) => void;

  // Tile data sync (for external components to update shared values)
  updateRackTiles: (tiles: Array<TileType | null>) => void;

  // Draggable registration (for hit testing)
  registerDraggable: (
    id: string,
    hitArea: { x: number; y: number; width: number; height: number },
    tile: TileType | PendingTile,
    source: DragSource,
    onDragEnd?: (target: DropTarget, wasDragged: boolean) => boolean
  ) => void;
  unregisterDraggable: (id: string) => void;

  // Web-only: direct drag control (pointer events)
  startDragFromRack: (
    tile: TileType,
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
      TileType & { x: number; y: number; rackIndex: number; visualSlot: number }
    >,
    onStart: () => void,
    onComplete: () => void
  ) => void;

  // Utility
  getBoardCell: (x: number, y: number) => { x: number; y: number } | null;

  // Shared values for immediate UI updates (worklet access)
  draggingRackIndexShared: SharedValue<number>;
  draggingBoardPositionShared: SharedValue<{ x: number; y: number } | null>;
  settlingTargetShared: SharedValue<{ x: number; y: number } | null>;
}

// ============================================================================
// Debug Logging (set to true to diagnose coordinate issues)
// ============================================================================

const DEBUG_DRAG = false;
const SHOW_DEBUG_OVERLAY = false; // Set to true to show on-screen debug info

interface DebugInfo {
  timestamp: string;
  dropPosition: { x: number; y: number } | null;
  boardLayout: BoardLayout | null;
  containerOffset: { x: number; y: number } | null;
  cellResult: { x: number; y: number } | null;
  rackLayout: RackLayout | null;
  sharedValues: {
    boardLeft: number;
    boardTop: number;
    cellSize: number;
  } | null;
  placementResult?: 'pending' | 'success' | 'failed';
  failReason?: string;
}

function debugLog(...args: unknown[]) {
  'worklet';
  if (DEBUG_DRAG) {
    console.log('[DragDrop]', ...args);
  }
}

// ============================================================================
// Constants
// ============================================================================

const DRAG_ACTIVATION_DISTANCE = 0;
const SETTLE_DURATION = 110;
const RECALL_DURATION = 500;
// Reduced cooldown for Android due to touch event handling differences
const DRAG_COOLDOWN_MS = Platform.OS === 'android' ? 25 : 50;
// Android needs larger touch tolerance due to measureInWindow() variance
const TOUCH_TOLERANCE_PX = Platform.OS === 'android' ? 10 : 2;

// ============================================================================
// Position System (SIMPLIFIED)
// ============================================================================
//
// ALL positions are stored as the CENTER of where the visual tile should appear.
// The animated style converts center → top-left for the transform.
//
// This makes calculations intuitive:
// - Drag position = touch point (center of tile follows finger)
// - Board drop = cell center
// - Rack slot = slot center
//
// The TILE_SIZE container holds a tile that scales. After scaling, the visual
// tile is smaller but still centered in the container. React Native scales
// from the center, so the visual center stays at the same point.

// ============================================================================
// Floating Tile Components (Reanimated)
// ============================================================================

// Per-rack-slot floating tile - no sync needed, each knows its content!
// Visibility is controlled by worklet checking if this rackIndex is being dragged.
interface RackFloatingTileProps {
  tile: TileType | null;
  rackIndex: number;
  positionX: SharedValue<number>;
  positionY: SharedValue<number>;
  scale: SharedValue<number>;
  draggingRackIndex: SharedValue<number>;
}

function RackFloatingTile({
  tile,
  rackIndex,
  positionX,
  positionY,
  scale,
  draggingRackIndex,
}: RackFloatingTileProps) {
  // Track whether this tile is currently being dragged (via React state for re-render)
  const [isDraggingThis, setIsDraggingThis] = useState(false);

  // Keep a ref with the last valid tile (so we can show it even after prop becomes null)
  // Initialize with current tile to handle immediate drag after mount
  const lastValidTileRef = useRef<TileType | null>(tile);
  useEffect(() => {
    if (tile) {
      lastValidTileRef.current = tile;
    }
  }, [tile]);

  // Derive visibility based on whether this rackIndex is being dragged
  const isVisible = useDerivedValue(() => {
    'worklet';
    return draggingRackIndex.value === rackIndex ? 1 : 0;
  }, [rackIndex]);

  // Track drag state changes - when dragging starts/ends, update React state
  useAnimatedReaction(
    () => draggingRackIndex.value === rackIndex,
    (isThisDragging, wasThisDragging) => {
      if (isThisDragging && !wasThisDragging) {
        runOnJS(setIsDraggingThis)(true);
      } else if (!isThisDragging && wasThisDragging) {
        runOnJS(setIsDraggingThis)(false);
      }
    },
    [rackIndex]
  );

  // During drag, use the last valid tile (from ref) to prevent disappearing
  // After drag ends, use the current tile prop
  const displayTile = isDraggingThis ? lastValidTileRef.current : tile;

  // Use CSS scale for smooth animation without React state delay
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { translateX: positionX.value - TILE_SIZE / 2 },
        { translateY: positionY.value - TILE_SIZE / 2 },
        { scale: scale.value },
      ],
      opacity: isVisible.value,
    };
  });

  return (
    <Animated.View
      style={[styles.floatingTile, animatedStyle]}
      pointerEvents="none"
    >
      {displayTile && (
        <Tile
          letter={displayTile.letter}
          points={displayTile.points}
          isBlank={displayTile.isBlank}
        />
      )}
    </Animated.View>
  );
}

// Board floating tile - for dragging pending tiles from board
// We delay hiding the board tile until this component is ready to show
interface BoardFloatingTileProps {
  tile: TileType | null;
  positionX: SharedValue<number>;
  positionY: SharedValue<number>;
  scale: SharedValue<number>;
  opacity: SharedValue<number>;
  shouldShow: boolean;
  draggingBoardPosition: SharedValue<{ x: number; y: number } | null>;
  pendingBoardPosition: { x: number; y: number } | null; // Position to hide when ready
}

function BoardFloatingTile({
  tile,
  positionX,
  positionY,
  scale,
  opacity,
  shouldShow,
  draggingBoardPosition,
  pendingBoardPosition,
}: BoardFloatingTileProps) {
  // When tile is ready and shouldShow is true:
  // 1. Show the floating tile (opacity = 1)
  // 2. Hide the board tile (draggingBoardPosition = pendingBoardPosition)
  // This ensures no gap where both tiles are invisible
  useLayoutEffect(() => {
    if (shouldShow && tile && pendingBoardPosition) {
      // Show floating tile and hide board tile simultaneously
      opacity.value = 1;
      draggingBoardPosition.value = pendingBoardPosition;
    }
  }, [shouldShow, tile, pendingBoardPosition, opacity, draggingBoardPosition]);

  // Use CSS scale for smooth animation without React state delay
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { translateX: positionX.value - TILE_SIZE / 2 },
        { translateY: positionY.value - TILE_SIZE / 2 },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[styles.floatingTile, animatedStyle]}
      pointerEvents="none"
    >
      {tile && (
        <Tile
          letter={tile.letter}
          points={tile.points}
          isBlank={tile.isBlank}
        />
      )}
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

// Color constants for recall animation
const PENDING_TILE_BG = '#FFFFF0'; // Bright ivory (pending tiles on board)
const RACK_TILE_BG = '#E8E4DC'; // Classic beige (rack tiles)
const PENDING_BORDER_LIGHT = '#FFFFF8';
const PENDING_BORDER_DARK = '#E0E0D0';
const RACK_BORDER_LIGHT = '#F5F3EF';
const RACK_BORDER_DARK = '#B8B4AA';

// Lightweight tile for recall animation - avoids full Tile component overhead
const RecallingTileItem = React.memo(function RecallingTileItem({
  tile,
  progress,
}: {
  tile: RecallingTile;
  progress: SharedValue<number>;
}) {
  // Animated position, scale, and fade-in
  const animatedContainerStyle = useAnimatedStyle(() => {
    'worklet';
    const p = progress.value;
    const centerX = tile.startX + (tile.endX - tile.startX) * p;
    const centerY = tile.startY + (tile.endY - tile.startY) * p;
    // Animate scale from board size to rack size
    const currentScale = tile.startScale + (1 - tile.startScale) * p;
    return {
      transform: [
        { translateX: centerX - TILE_SIZE / 2 },
        { translateY: centerY - TILE_SIZE / 2 },
        { scale: currentScale },
      ],
      // Only visible once animation has started
      opacity: p > 0 ? 1 : 0,
    };
  });

  // Animated colors - transition from pending (board) to rack colors
  const animatedTileStyle = useAnimatedStyle(() => {
    'worklet';
    const p = progress.value;
    return {
      backgroundColor: interpolateColor(p, [0, 1], [PENDING_TILE_BG, RACK_TILE_BG]),
      borderTopColor: interpolateColor(p, [0, 1], [PENDING_BORDER_LIGHT, RACK_BORDER_LIGHT]),
      borderLeftColor: interpolateColor(p, [0, 1], [PENDING_BORDER_LIGHT, RACK_BORDER_LIGHT]),
      borderBottomColor: interpolateColor(p, [0, 1], [PENDING_BORDER_DARK, RACK_BORDER_DARK]),
      borderRightColor: interpolateColor(p, [0, 1], [PENDING_BORDER_DARK, RACK_BORDER_DARK]),
    };
  });

  // Simple tile rendering without full Tile component hooks
  const displayLetter = tile.tile.letter === '*' ? '' : tile.tile.letter;
  const points = tile.tile.points;

  return (
    <Animated.View
      style={[styles.floatingTile, animatedContainerStyle]}
      pointerEvents="none"
    >
      <Animated.View style={[styles.simpleTile, animatedTileStyle]}>
        <Text style={styles.simpleTileLetter}>{displayLetter}</Text>
        <Text style={styles.simpleTilePoints}>{points}</Text>
      </Animated.View>
    </Animated.View>
  );
});

// ============================================================================
// Context
// ============================================================================

const DragDropContext = createContext<DragDropContextType | null>(null);

export function DragDropProvider({ children }: { children: React.ReactNode }) {
  // -------------------------------------------------------------------------
  // React State (for re-renders)
  // -------------------------------------------------------------------------
  const [dragStatus, setDragStatus] = useState<DragStatus>('idle');
  const [dragTile, setDragTile] = useState<TileType | null>(null);
  const [dragSource, setDragSource] = useState<DragSource | null>(null);
  const [settlingTarget, setSettlingTarget] = useState<DropTarget>(null);
  const [recallingTiles, setRecallingTiles] = useState<RecallingTile[]>([]);
  const [recallingRackIndices, setRecallingRackIndices] = useState<number[]>(
    []
  );
  const [recallingBoardPositions, setRecallingBoardPositions] = useState<
    Array<{ x: number; y: number }>
  >([]);

  // Track rack tiles for per-tile floating tiles (no sync issues!)
  const [rackTiles, setRackTiles] = useState<Array<TileType | null>>(
    new Array(7).fill(null)
  );

  // Track board floating tile separately (for pending tiles dragged from board)
  const [boardFloatingTile, setBoardFloatingTile] = useState<TileType | null>(
    null
  );

  // Debug overlay state
  const [debugInfo, setDebugInfo] = useState<DebugInfo[]>([]);
  const [boardFloatingShouldShow, setBoardFloatingShouldShow] = useState(false);
  const [pendingBoardPosition, setPendingBoardPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const boardFloatingOpacity = useSharedValue(0);

  // -------------------------------------------------------------------------
  // Shared Values (UI thread, no bridge)
  // -------------------------------------------------------------------------
  const positionX = useSharedValue(0);
  const positionY = useSharedValue(0);
  const scale = useSharedValue(1);
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

  // Shared values for immediate tile hiding (prevents visual glitch)
  const draggingRackIndexShared = useSharedValue(-1); // -1 means no rack tile is dragging
  const draggingBoardPositionShared = useSharedValue<{
    x: number;
    y: number;
  } | null>(null);
  // Board position being settled to - hides target cell until floating tile settles
  const settlingTargetShared = useSharedValue<{
    x: number;
    y: number;
  } | null>(null);
  // Rack indices being recalled - updates immediately on UI thread (no React state delay)
  const recallingRackIndicesShared = useSharedValue<number[]>([]);
  // Board positions being recalled - updates immediately on UI thread (no React state delay)
  const recallingBoardPositionsShared = useSharedValue<
    Array<{ x: number; y: number }>
  >([]);

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

  // Reset React state when game changes
  const currentGameUlid = useGameStore((state) => state.currentGameUlid);
  const prevGameUlidRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      prevGameUlidRef.current !== null &&
      prevGameUlidRef.current !== currentGameUlid
    ) {
      // Game changed - reset React state
      setDragStatus('idle');
      setDragTile(null);
      setDragSource(null);
      setSettlingTarget(null);
      setRecallingTiles([]);
      setRecallingRackIndices([]);
      setRecallingBoardPositions([]);
      setBoardFloatingTile(null);
      setBoardFloatingShouldShow(false);
      setPendingBoardPosition(null);
      boardFloatingOpacity.value = 0;
      scale.value = 1;
      recallProgress.value = 0;
      recallingBoardPositionsShared.value = [];
    }
    prevGameUlidRef.current = currentGameUlid;
  }, [currentGameUlid, boardFloatingOpacity, scale, recallProgress, recallingBoardPositionsShared]);

  // Sync game state to shared values for worklet access
  // Re-runs when currentGameUlid changes (including after Zustand hydration)
  useEffect(() => {
    if (!currentGameUlid) return;

    const state = useGameStore.getState();
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
  }, [currentGameUlid, rackPermutationShared, boardTilesShared]);

  // Subscribe to game store changes to keep shared values in sync
  useEffect(() => {
    // Initialize with current game to avoid false "game change" detection on first callback
    let lastGameUlid: string | null = useGameStore.getState().currentGameUlid;

    const unsubscribe = useGameStore.subscribe((state, prevState) => {
      const currentGameUlid = state.currentGameUlid;
      if (!currentGameUlid) return;

      const gameState = state.gameStates[currentGameUlid];
      if (!gameState) return;

      // Detect actual game switch (switching between two different games, not initial load)
      const isGameSwitch =
        lastGameUlid !== null && currentGameUlid !== lastGameUlid;

      // Always track the current game
      if (currentGameUlid !== lastGameUlid) {
        lastGameUlid = currentGameUlid;
      }

      // Only reset drag state when actually switching between games
      if (isGameSwitch) {
        // Reset drag state on game switch
        isDraggingShared.value = false;
        draggingRackIndexShared.value = -1;
        draggingBoardPositionShared.value = null;
        dragTileShared.value = null;
        dragSourceShared.value = null;

        // Clear draggables map - new game will re-register its tiles
        draggablesRef.current.clear();

        // Reset refs
        isDraggingRef.current = false;
        activeDragRef.current = null;
        currentPositionRef.current = { x: 0, y: 0 };
      }

      const prevGameState = prevState.gameStates[currentGameUlid];

      // Update if game switched OR pending tiles changed OR rack permutation changed
      if (
        isGameSwitch ||
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
  }, [
    rackPermutationShared,
    boardTilesShared,
    isDraggingShared,
    draggingRackIndexShared,
    draggingBoardPositionShared,
    dragTileShared,
    dragSourceShared,
  ]);

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
    tile: TileType | PendingTile;
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
    tile: TileType | PendingTile;
    onComplete?: (target: DropTarget) => void;
    dragCallback?: (target: DropTarget, wasDragged: boolean) => boolean;
    placementSuccess?: boolean; // Set by deferred placement callback
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
      tile: TileType | PendingTile,
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

  // Update rack tiles in shared values AND React state (called by external components)
  const updateRackTiles = useCallback(
    (tiles: Array<TileType | null>) => {
      // Update shared values for worklet hit testing
      const newRackTilesShared = new Array(7).fill(null) as Array<
        [string, number, boolean] | null
      >;
      tiles.forEach((tile, index) => {
        if (tile) {
          newRackTilesShared[index] = [tile.letter, tile.points, tile.isBlank];
        }
      });
      rackTilesShared.value = newRackTilesShared;

      // Update React state for per-tile floating tiles (no sync needed!)
      // Clone the array to ensure React sees a new reference and re-renders
      setRackTiles([...tiles]);
    },
    [rackTilesShared]
  );

  // Measure container offset from screen (for converting absolute coordinates)
  const measureContainerOffset = useCallback(() => {
    containerRef.current?.measureInWindow((x, y) => {
      // On Android, measureInWindow may not include status bar height, but touch events do
      const statusBarOffset =
        Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
      containerOffsetRef.current = { x, y: y + statusBarOffset };
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
      // Check if within rack bounds (with touch tolerance)
      if (
        y < rackTopShared.value - TOUCH_TOLERANCE_PX ||
        y > rackBottomShared.value + TOUCH_TOLERANCE_PX ||
        x < rackLeftShared.value - TOUCH_TOLERANCE_PX ||
        x > rackLeftShared.value + rackWidthShared.value + TOUCH_TOLERANCE_PX
      ) {
        return null;
      }

      // Calculate visual slot from position
      const slotWidth = TILE_SIZE + GAP;
      const relativeX = x - rackLeftShared.value;
      const visualSlot = Math.floor(relativeX / slotWidth);

      // Check if within tile (with touch tolerance for gaps)
      const posInSlot = relativeX - visualSlot * slotWidth;
      if (
        posInSlot > TILE_SIZE + TOUCH_TOLERANCE_PX ||
        visualSlot < 0 ||
        visualSlot >= SLOT_COUNT
      ) {
        // If we're close to a slot boundary, try the adjacent slot
        if (
          visualSlot >= 0 &&
          visualSlot < SLOT_COUNT - 1 &&
          posInSlot > TILE_SIZE - TOUCH_TOLERANCE_PX &&
          posInSlot <= TILE_SIZE + GAP + TOUCH_TOLERANCE_PX
        ) {
          // Touch is in the gap, try next slot
          const nextSlot = visualSlot + 1;
          if (nextSlot < SLOT_COUNT) {
            const nextActualRackIndex = rackPermutationShared.value[nextSlot];
            if (nextActualRackIndex !== undefined) {
              const nextTileData = rackTilesShared.value[nextActualRackIndex];
              if (nextTileData) {
                const [letter, points, isBlank] = nextTileData;
                return {
                  type: 'rack' as const,
                  rackIndex: nextActualRackIndex,
                  visualSlot: nextSlot,
                  tile: { letter, points, isBlank },
                  hitArea: {
                    x: rackLeftShared.value + nextSlot * slotWidth,
                    y: rackTopShared.value,
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                  },
                };
              }
            }
          }
        }
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

      // Check if within board bounds (with small tolerance for edge cases)
      const boardWidth = boardSize * cellSize;
      const boardHeight = boardSize * cellSize;
      const tolerance = 2;

      if (
        x < boardLeft - tolerance ||
        x > boardLeft + boardWidth + tolerance ||
        y < boardTop - tolerance ||
        y > boardTop + boardHeight + tolerance
      ) {
        return null;
      }

      // Calculate cell coordinates (clamp to valid range)
      const relX = Math.max(0, Math.min(x - boardLeft, boardWidth - 0.001));
      const relY = Math.max(0, Math.min(y - boardTop, boardHeight - 0.001));
      const cellX = Math.floor(relX / cellSize);
      const cellY = Math.floor(relY / cellSize);

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

      // Check if within rack bounds (with touch tolerance)
      if (
        y < rackLayout.y - TOUCH_TOLERANCE_PX ||
        y > rackLayout.y + rackLayout.height + TOUCH_TOLERANCE_PX ||
        x < rackLayout.x - TOUCH_TOLERANCE_PX ||
        x > rackLayout.x + rackLayout.width + TOUCH_TOLERANCE_PX
      ) {
        return null;
      }

      // Calculate visual slot from position
      const slotWidth = TILE_SIZE + GAP;
      const relativeX = x - rackLayout.x;
      const visualSlot = Math.floor(relativeX / slotWidth);

      // Check if within tile (with touch tolerance for gaps)
      const posInSlot = relativeX - visualSlot * slotWidth;
      if (
        posInSlot > TILE_SIZE + TOUCH_TOLERANCE_PX ||
        visualSlot < 0 ||
        visualSlot >= SLOT_COUNT
      ) {
        // If we're close to a slot boundary, try the adjacent slot
        if (
          visualSlot >= 0 &&
          visualSlot < SLOT_COUNT - 1 &&
          posInSlot > TILE_SIZE - TOUCH_TOLERANCE_PX &&
          posInSlot <= TILE_SIZE + GAP + TOUCH_TOLERANCE_PX
        ) {
          // Touch is in the gap, try next slot
          const nextSlot = visualSlot + 1;
          const state = useGameStore.getState();
          const currentGameUlid = state.currentGameUlid;
          const permutation = (currentGameUlid &&
            state.gameStates[currentGameUlid]?.rackPermutation) || [
            0, 1, 2, 3, 4, 5, 6,
          ];
          const nextActualRackIndex = permutation[nextSlot];
          if (nextActualRackIndex !== undefined) {
            // Look up the registered draggable for next slot
            const nextDraggable = draggablesRef.current.get(
              `rack-${nextActualRackIndex}`
            );
            if (nextDraggable) {
              return {
                ...nextDraggable,
                hitArea: {
                  x: rackLayout.x + nextSlot * slotWidth,
                  y: rackLayout.y,
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                },
              };
            }
          }
        }
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
      tile: TileType | PendingTile,
      source: DragSource,
      x: number,
      y: number,
      dragId?: string,
      onDragEnd?: (target: DropTarget, wasDragged: boolean) => boolean
    ) => {
      isDraggingRef.current = true;
      isDraggingShared.value = true;
      currentPositionRef.current = { x, y };
      activeDragRef.current = { id: dragId || '', tile, source, onDragEnd };

      setDragTile(tile);
      setDragSource(source);
      setDragStatus('dragging');

      // Position = CENTER of visual tile (container-relative)
      // x, y are screen coordinates of where the tile center should be
      const offset = containerOffsetRef.current;
      positionX.value = x - offset.x;
      positionY.value = y - offset.y;
      scale.value = 1;

      // Show floating tile based on source type
      if (source.type === 'rack') {
        draggingRackIndexShared.value = source.rackIndex;
        useGameStore.getState().setRackDragging(true);
      } else {
        // Board tile: set state, position to hide, and signal to show
        // BoardFloatingTile will hide board tile + show floating tile in useLayoutEffect
        setBoardFloatingTile(tile);
        setPendingBoardPosition({ x: source.x, y: source.y });
        setBoardFloatingShouldShow(true);
      }
    },
    [
      positionX,
      positionY,
      scale,
      isDraggingShared,
      draggingRackIndexShared,
      setBoardFloatingTile,
      setPendingBoardPosition,
      setBoardFloatingShouldShow,
    ]
  );

  const updateDragJS = useCallback(
    (x: number, y: number) => {
      currentPositionRef.current = { x, y };
      // Position = CENTER of visual tile = touch point (container-relative)
      const offset = containerOffsetRef.current;
      positionX.value = x - offset.x;
      positionY.value = y - offset.y;
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

      // Capture debug info for on-screen overlay
      const captureDebugInfo = (cellResult: { x: number; y: number } | null) => {
        if (SHOW_DEBUG_OVERLAY) {
          const info: DebugInfo = {
            timestamp: new Date().toISOString().substr(11, 12),
            dropPosition: { ...pos },
            boardLayout: boardLayoutRef.current
              ? { ...boardLayoutRef.current }
              : null,
            containerOffset: { ...offset },
            cellResult,
            rackLayout: rackLayoutRef.current
              ? { ...rackLayoutRef.current }
              : null,
            sharedValues: {
              boardLeft: boardLeftShared.value,
              boardTop: boardTopShared.value,
              cellSize: boardCellSizeShared.value,
            },
          };
          setDebugInfo((prev) => [info, ...prev].slice(0, 5)); // Keep last 5
        }
      };

      // Helper to convert screen-absolute to container-relative
      const toRelative = (screenPos: { x: number; y: number }) => ({
        x: screenPos.x - offset.x,
        y: screenPos.y - offset.y,
      });

      const finishDrag = (target: DropTarget, animated: boolean = true) => {
        if (!animated) {
          // Show rack tile immediately (rack tile will be marked as 'used' or swap positions)
          draggingRackIndexShared.value = -1;

          isDraggingRef.current = false;
          isDraggingShared.value = false;
          const now = Date.now();
          lastDragEndTimeRef.current = now;
          lastDragEndTimeShared.value = now;
          setDragStatus('idle');
          setDragTile(null);
          setDragSource(null);
          activeDragRef.current = null;
          onComplete?.(target);
          dragCallback?.(target, true);

          // Delay hiding floating tile to allow React to process state updates
          setTimeout(() => {
            boardFloatingOpacity.value = 0;
            scale.value = 1;
            dragSourceShared.value = null;
            setBoardFloatingTile(null);
            setPendingBoardPosition(null);
            setBoardFloatingShouldShow(false);
          }, 50);

          // Delay resetting board position to allow React to update pendingTiles first
          setTimeout(() => {
            draggingBoardPositionShared.value = null;
          }, 150);
          return;
        }

        setDragStatus('settling');
        setSettlingTarget(target);
        // Also set shared value for immediate UI thread hiding (no React delay)
        if (target?.type === 'board') {
          settlingTargetShared.value = { x: target.x, y: target.y };
        }
      };

      // Check board target
      if (boardLayoutRef.current) {
        const cell = getBoardCellFromPosition(
          pos.x,
          pos.y,
          boardLayoutRef.current
        );
        // Always capture debug info for board drop attempts
        captureDebugInfo(cell);
        if (cell) {
          const target: DropTarget = { type: 'board', ...cell };
          const cellSize = boardLayoutRef.current.cellSize;

          // Target = CENTER of the cell (simple!)
          const cellCenter = getBoardCellCenter(
            cell.x,
            cell.y,
            boardLayoutRef.current
          );
          const targetPos = toRelative(cellCenter);

          // FIX (Jan 2026): Call placement logic SYNCHRONOUSLY to ensure it happens before animation completes.
          //
          // PROBLEM: On real devices (not simulator), tiles would visually snap back to the rack
          // even though placement appeared successful. The issue was that deferring placement
          // via setTimeout caused race conditions where the animation completion callback
          // would run before the tile was added to pendingTiles, or stale closures would
          // capture outdated state.
          //
          // SOLUTION: Call placement synchronously here, before starting the settle animation.
          // This ensures the tile is in pendingTiles before any callbacks fire. React will
          // batch the state updates naturally.
          onComplete?.(target);
          const placementSuccess = dragCallback?.(target, true) ?? true;

          // If placement failed, animate back to rack immediately
          if (!placementSuccess && source?.type === 'rack') {
            animateBackToRack(source.rackIndex, () => {
              isDraggingRef.current = false;
              isDraggingShared.value = false;
              const now = Date.now();
              lastDragEndTimeRef.current = now;
              lastDragEndTimeShared.value = now;
              setDragStatus('idle');
              setDragTile(null);
              setDragSource(null);
              activeDragRef.current = null;
              setTimeout(() => {
                draggingRackIndexShared.value = -1;
                boardFloatingOpacity.value = 0;
                scale.value = 1;
                dragSourceShared.value = null;
                setBoardFloatingTile(null);
                setPendingBoardPosition(null);
                setBoardFloatingShouldShow(false);
              }, 50);
            });
            return null;
          }

          // Set up animation to cell center
          pendingSettleRef.current = {
            target,
            source: source!,
            tile: tile!,
            onComplete: undefined, // Already called above
            dragCallback: undefined, // Already called above
            placementSuccess: placementSuccess, // Already determined
          };

          // Animate scale and position together
          scale.value = withTiming(cellSize / TILE_SIZE, {
            duration: SETTLE_DURATION,
          });
          positionX.value = withTiming(targetPos.x, {
            duration: SETTLE_DURATION,
          });
          positionY.value = withTiming(
            targetPos.y,
            { duration: SETTLE_DURATION },
            () => {
              'worklet';
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
            // dropX is the LEFT EDGE of the tile relative to rack start
            // (pos.x is center, so subtract TILE_SIZE/2 to get left edge)
            const dropX = pos.x - TILE_SIZE / 2 - rackLayoutRef.current.x;
            lastRackDropRef.current = { rackIndex: source.rackIndex, dropX };
            finishDrag(target, false);
            return target;
          } else if (source?.type === 'board' && tile && 'rackIndex' in tile) {
            // Board-to-rack: animate to rack slot center
            const tileRackIndex = (tile as PendingTile).rackIndex;
            const state = useGameStore.getState();
            const currentGameUlid = state.currentGameUlid;
            const permutation = (currentGameUlid &&
              state.gameStates[currentGameUlid]?.rackPermutation) || [
              0, 1, 2, 3, 4, 5, 6,
            ];
            const visualSlot = permutation.indexOf(tileRackIndex);

            if (visualSlot !== -1) {
              const slotCenter = getRackSlotCenter(
                visualSlot,
                rackLayoutRef.current
              );
              const targetPos = toRelative(slotCenter);

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
                (finished) => {
                  'worklet';
                  if (finished) {
                    draggingRackIndexShared.value = -1;
                  }
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

      // No valid target - return to source rack slot
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
            const slotCenter = getRackSlotCenter(
              visualSlot,
              rackLayoutRef.current
            );
            const targetPos = toRelative(slotCenter);

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
              (finished) => {
                'worklet';
                if (finished) {
                  draggingRackIndexShared.value = -1;
                }
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
    [
      positionX,
      positionY,
      scale,
      boardFloatingOpacity,
      draggingRackIndexShared,
      draggingBoardPositionShared,
      setBoardFloatingTile,
      setPendingBoardPosition,
      setBoardFloatingShouldShow,
    ]
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

      // Target = CENTER of the rack slot
      const slotCenter = getRackSlotCenter(visualSlot, rackLayout);
      const targetX = slotCenter.x - offset.x;
      const targetY = slotCenter.y - offset.y;

      // Animate back to rack
      // NOTE: Don't set draggingRackIndexShared = -1 here!
      // resetState's setTimeout will do it AFTER React updates the rack tile visibility.
      // This prevents a flash where neither floating tile nor rack tile is visible.
      positionX.value = withTiming(targetX, { duration: SETTLE_DURATION });
      scale.value = withTiming(1, { duration: SETTLE_DURATION });
      positionY.value = withTiming(
        targetY,
        { duration: SETTLE_DURATION },
        () => {
          'worklet';
          runOnJS(onComplete)();
        }
      );
    },
    [positionX, positionY, scale, draggingRackIndexShared]
  );

  // Stable settle completion handler that reads from ref (prevents GC issues on real devices)
  // Note: UI thread work (draggingRackIndexShared) is done in worklets before this is called
  const completeSettleFromRef = useCallback(() => {
    const pending = pendingSettleRef.current;
    pendingSettleRef.current = null;

    // Helper to reset all JS state
    const resetState = () => {
      isDraggingRef.current = false;
      isDraggingShared.value = false;
      const now = Date.now();
      lastDragEndTimeRef.current = now;
      lastDragEndTimeShared.value = now;

      // Hide floating tile AND show board tile in the SAME FRAME
      // Both are shared value updates, so they happen on UI thread simultaneously
      // This prevents any flash (double-tile or no-tile)
      settlingTargetShared.value = null; // Shows board tile
      boardFloatingOpacity.value = 0; // Hides floating tile
      draggingRackIndexShared.value = -1;
      scale.value = 1;

      setDragStatus('idle');
      // Note: Keep dragTile populated until setTimeout - see below
      setDragSource(null);
      setSettlingTarget(null);
      activeDragRef.current = null;

      // Delay clearing tile data to allow React to process state updates
      setTimeout(() => {
        dragSourceShared.value = null;
        setDragTile(null);
        setBoardFloatingTile(null);
        setPendingBoardPosition(null);
        setBoardFloatingShouldShow(false);
      }, 16);

      // Delay resetting board position to allow React to update pendingTiles first
      // This prevents a flash where the tile briefly shows on the board before being removed
      setTimeout(() => {
        draggingBoardPositionShared.value = null;
      }, 50);
    };

    if (!pending) {
      resetState();
      return;
    }

    // Check placement result
    // For board targets, callbacks were called via setTimeout in endDragJS
    // For other targets, we call them here
    const hasCallbacks = pending.onComplete || pending.dragCallback;
    let success = pending.placementSuccess ?? true; // Default to true if not set

    if (hasCallbacks) {
      // Non-board target - call callbacks now
      pending.onComplete?.(pending.target);
      success = pending.dragCallback?.(pending.target, true) ?? true;
    }

    // Update debug info with placement result
    if (SHOW_DEBUG_OVERLAY) {
      setDebugInfo((prev) => {
        if (prev.length === 0) return prev;
        const first = prev[0];
        if (!first) return prev;
        const updated: DebugInfo[] = [
          {
            timestamp: first.timestamp,
            dropPosition: first.dropPosition,
            boardLayout: first.boardLayout,
            containerOffset: first.containerOffset,
            cellResult: first.cellResult,
            rackLayout: first.rackLayout,
            sharedValues: first.sharedValues,
            placementResult: success ? 'success' : 'failed',
            failReason: success ? undefined : 'placement callback returned false',
          },
          ...prev.slice(1),
        ];
        return updated;
      });
    }

    if (!success && pending.source?.type === 'rack') {
      // Placement failed - animate back to rack
      animateBackToRack(pending.source.rackIndex, resetState);
      return;
    }

    // Placement succeeded - reset state
    resetState();
  }, [
    boardFloatingOpacity,
    scale,
    isDraggingShared,
    draggingBoardPositionShared,
    draggingRackIndexShared,
    animateBackToRack,
    setBoardFloatingTile,
    setPendingBoardPosition,
    setBoardFloatingShouldShow,
  ]);

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
    (tile: TileType, rackIndex: number, x: number, y: number) => {
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

    // IMPORTANT: Call onComplete FIRST to update game state (clears pendingTiles)
    // This ensures isUsed becomes false before we hide the recalling tiles
    onComplete?.();

    // Reset dragging rack index so tiles show via immediateHideStyle
    draggingRackIndexShared.value = -1;

    // Delay clearing recalling state to allow React to update isUsed first
    // Otherwise tiles briefly disappear because isBeingRecalled is false but isUsed is still true
    setTimeout(() => {
      setRecallingTiles([]);
      setRecallingRackIndices([]);
      setRecallingBoardPositions([]);
      // Clear shared values after React state is cleared
      recallingRackIndicesShared.value = [];
      recallingBoardPositionsShared.value = [];
    }, 50);
  }, [recallingRackIndicesShared, recallingBoardPositionsShared]);

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
        TileType & {
          x: number;
          y: number;
          rackIndex: number;
          visualSlot: number;
        }
      >,
      onStart: () => void,
      onComplete: () => void
    ) => {
      const boardLayout = boardLayoutRef.current;
      const rackLayout = rackLayoutRef.current;
      const offset = containerOffsetRef.current;

      if (tiles.length === 0 || !boardLayout || !rackLayout) {
        onStart();
        onComplete();
        return;
      }

      // Helper to convert screen-absolute to container-relative
      const toRelative = (screenPos: { x: number; y: number }) => ({
        x: screenPos.x - offset.x,
        y: screenPos.y - offset.y,
      });

      // Set shared values FIRST for immediate UI thread update (prevents flash)
      // This hides the tiles instantly on the UI thread without waiting for React
      recallingRackIndicesShared.value = tiles.map((t) => t.rackIndex);
      recallingBoardPositionsShared.value = tiles.map((t) => ({
        x: t.x,
        y: t.y,
      }));

      // Create animation data (all positions are CENTER-based)
      const startScale = boardLayout.cellSize / TILE_SIZE;
      const recallData: RecallingTile[] = tiles.map((t) => {
        const registrationId = `board-${t.x}-${t.y}`;
        const registration = draggablesRef.current.get(registrationId);

        let startCenter: { x: number; y: number };
        if (registration) {
          // Registration hitArea is in screen coordinates - get center
          startCenter = toRelative({
            x: registration.hitArea.x + registration.hitArea.width / 2,
            y: registration.hitArea.y + registration.hitArea.height / 2,
          });
        } else {
          startCenter = toRelative(getBoardCellCenter(t.x, t.y, boardLayout));
        }

        const endCenter = toRelative(
          getRackSlotCenter(t.visualSlot, rackLayout)
        );

        return {
          tile: { letter: t.letter, points: t.points, isBlank: t.isBlank },
          startX: startCenter.x,
          startY: startCenter.y,
          endX: endCenter.x,
          endY: endCenter.y,
          startScale,
        };
      });

      // Store callback in ref before animation (prevents GC on real devices)
      pendingRecallCompleteRef.current = onComplete;

      // Render the animated tiles FIRST (before any heavy state updates)
      setRecallingTiles(recallData);

      // Start animation on UI thread
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

      // Defer onStart and other state updates to next frame
      // This lets React render the animated tiles first, then update game state
      // (which triggers score bubble fade-out and tile color changes)
      requestAnimationFrame(() => {
        onStart();
        setRecallingRackIndices(tiles.map((t) => t.rackIndex));
        setRecallingBoardPositions(tiles.map((t) => ({ x: t.x, y: t.y })));
      });
    },
    [recallProgress, onRecallComplete, recallingRackIndicesShared, recallingBoardPositionsShared]
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
      tile: TileType | (TileType & { x: number; y: number; rackIndex: number })
    ) => {
      // Update React state for UI re-renders
      setDragTile(tile);
      setDragSource(source);
      setDragStatus('dragging');

      // For board drags, set the tile content, position to hide, and signal to show
      // BoardFloatingTile will hide board tile + show floating tile in useLayoutEffect
      if (source.type === 'board') {
        setBoardFloatingTile(tile);
        setPendingBoardPosition({ x: source.x, y: source.y });
        setBoardFloatingShouldShow(true);
      }

      // Update refs for JS-side operations
      currentPositionRef.current = { x: 0, y: 0 };
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
    [
      setDragTile,
      setDragSource,
      setDragStatus,
      setBoardFloatingTile,
      setPendingBoardPosition,
      setBoardFloatingShouldShow,
    ]
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
  //
  // IMPORTANT: We use event.absoluteX/absoluteY instead of calculating coordinates
  // from event.x + containerOffset. On real iOS devices with New Architecture (Fabric),
  // measureInWindow returns coordinates in a different system than relative gesture
  // coordinates, causing tiles to snap back when dropped. absoluteX/absoluteY gives
  // reliable window-relative coordinates that match measureInWindow on all devices.
  // See: https://github.com/facebook/react-native/issues/48425

  // Shared values for container offset (accessed in worklet)
  const containerOffsetX = useSharedValue(0);
  const containerOffsetY = useSharedValue(0);

  // Sync container offset to shared values
  // Re-run when currentGameUlid changes (navigation may have changed container position)
  useEffect(() => {
    const syncValues = () => {
      containerOffsetX.value = containerOffsetRef.current.x;
      containerOffsetY.value = containerOffsetRef.current.y;
    };

    // Re-measure the container when game changes
    // Use multiple delays to catch position after navigation animations
    if (currentGameUlid) {
      measureContainerOffset();
      setTimeout(measureContainerOffset, 100);
      setTimeout(measureContainerOffset, 300);
      setTimeout(measureContainerOffset, 500);
    }

    // Sync immediately and keep syncing for longer to catch navigation animations
    syncValues();
    const timer = setInterval(syncValues, 50);
    // Sync for 1 second to ensure we catch all layout changes
    setTimeout(() => clearInterval(timer), 1000);
    return () => clearInterval(timer);
  }, [
    containerOffsetX,
    containerOffsetY,
    currentGameUlid,
    measureContainerOffset,
  ]);

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

      // Use absoluteX/absoluteY for reliable screen coordinates on real devices
      // This bypasses measureInWindow issues with New Architecture (Fabric)
      const touchX = touch.absoluteX;
      const touchY = touch.absoluteY;

      debugLog('onTouchesDown', {
        absoluteX: touchX,
        absoluteY: touchY,
        relativeX: touch.x,
        relativeY: touch.y,
        rackBounds: {
          top: rackTopShared.value,
          bottom: rackBottomShared.value,
          left: rackLeftShared.value,
          width: rackWidthShared.value,
        },
      });

      // Check if touch is on the rack area (with tolerance for better hit detection)
      const rackLayoutMeasured = rackBottomShared.value > rackTopShared.value;
      const isOnRack =
        rackLayoutMeasured &&
        touchY >= rackTopShared.value - TOUCH_TOLERANCE_PX &&
        touchY <= rackBottomShared.value + TOUCH_TOLERANCE_PX &&
        touchX >= rackLeftShared.value - TOUCH_TOLERANCE_PX &&
        touchX <=
          rackLeftShared.value + rackWidthShared.value + TOUCH_TOLERANCE_PX;
      touchStartedOnRack.value = isOnRack;

      // Check if touch is below the rack (button area) - use original bounds for buttons
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

      // Activate immediately for rack touches only
      // Board touches will activate on first move (onTouchesMove) to allow taps on ScoreBar
      activatedImmediately.value = isOnRack;
      if (isOnRack) {
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

      // Use absoluteX/absoluteY for reliable screen coordinates on real devices
      // This bypasses measureInWindow issues with New Architecture (Fabric)
      const screenX = event.absoluteX;
      const screenY = event.absoluteY;

      debugLog('onStart', {
        absoluteX: screenX,
        absoluteY: screenY,
        relativeX: event.x,
        relativeY: event.y,
        boardBounds: {
          left: boardLeftShared.value,
          top: boardTopShared.value,
          cellSize: boardCellSizeShared.value,
        },
      });

      // Try rack hit testing first (most common)
      let rackHit = findRackTileAtPositionWorklet(screenX, screenY);

      // If no direct rack hit, try with expanded search area for better reliability
      if (!rackHit) {
        // Try slightly offset positions around the touch point
        const searchOffsets = [
          [-TOUCH_TOLERANCE_PX, 0],
          [TOUCH_TOLERANCE_PX, 0],
          [0, -TOUCH_TOLERANCE_PX],
          [0, TOUCH_TOLERANCE_PX],
          [-TOUCH_TOLERANCE_PX, -TOUCH_TOLERANCE_PX],
          [TOUCH_TOLERANCE_PX, TOUCH_TOLERANCE_PX],
        ];

        for (const [dx, dy] of searchOffsets) {
          if (dx !== undefined && dy !== undefined) {
            rackHit = findRackTileAtPositionWorklet(screenX + dx, screenY + dy);
            if (rackHit) break;
          }
        }
      }

      if (rackHit) {
        debugLog('rackHit found', {
          rackIndex: rackHit.rackIndex,
          tile: rackHit.tile.letter,
          hitArea: rackHit.hitArea,
        });

        // Start rack drag on UI thread
        isDraggingShared.value = true;
        dragTileShared.value = [
          rackHit.tile.letter,
          rackHit.tile.points,
          rackHit.tile.isBlank,
        ];
        dragSourceShared.value = { type: 'rack', rackIndex: rackHit.rackIndex };

        // Position = CENTER of tile (hitArea is top-left, add half tile size)
        // Use container-relative coords (event.x/y) with offset from touch to tile center
        const tileCenterX = rackHit.hitArea.x + TILE_SIZE / 2;
        const tileCenterY = rackHit.hitArea.y + TILE_SIZE / 2;
        const offsetX = tileCenterX - screenX;
        const offsetY = tileCenterY - screenY;
        positionX.value = event.x + offsetX;
        positionY.value = event.y + offsetY;
        scale.value = 1;

        // Hide rack tile immediately AND show floating tile
        draggingRackIndexShared.value = rackHit.rackIndex;

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

        // Position = CENTER of cell (hitArea is top-left, add half cell size)
        const cellSize = boardCellSizeShared.value;
        const cellCenterX = boardHit.hitArea.x + cellSize / 2;
        const cellCenterY = boardHit.hitArea.y + cellSize / 2;
        const offsetX = cellCenterX - screenX;
        const offsetY = cellCenterY - screenY;
        positionX.value = event.x + offsetX;
        positionY.value = event.y + offsetY;
        scale.value = 1;

        // NOTE: Don't hide board tile here! We pass the position to JS,
        // and BoardFloatingTile will hide it in useLayoutEffect AFTER
        // the floating tile is ready. This prevents flash of invisible tile.

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

      // Position = touch point (center of tile follows finger)
      positionX.value = event.x;
      positionY.value = event.y;
    })
    .onEnd((event) => {
      'worklet';
      if (!isDraggingShared.value) return;

      // Mark as not dragging FIRST to prevent onFinalize from also firing
      isDraggingShared.value = false;

      // Update shared drag end time for cooldown
      lastDragEndTimeShared.value = Date.now();

      // Use absoluteX/absoluteY for reliable screen coordinates on real devices
      const screenX = event.absoluteX;
      const screenY = event.absoluteY;

      debugLog('onEnd', {
        absoluteX: screenX,
        absoluteY: screenY,
        relativeX: event.x,
        relativeY: event.y,
      });

      // Let JS handle the animation - this avoids mismatch between worklet's
      // shared values and JS's ref values that was causing a "snap" effect.
      // The JS animation uses boardLayoutRef which is the source of truth.
      runOnJS(onGestureEndWithPosition)(screenX, screenY);
    })
    .onFinalize((event) => {
      'worklet';
      // Handle cancelled gestures (only if onEnd didn't already handle it)
      if (isDraggingShared.value) {
        isDraggingShared.value = false;
        lastDragEndTimeShared.value = Date.now();
        // Use absoluteX/absoluteY for reliable screen coordinates on real devices
        const screenX = event.absoluteX;
        const screenY = event.absoluteY;
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
      recallingRackIndicesShared,
      recallingBoardPositions,
      recallingBoardPositionsShared,
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
      draggingBoardPositionShared,
      settlingTargetShared,
    }),
    // NOTE: recallingRackIndices and recallingBoardPositions intentionally excluded
    // from dependency array to prevent mass re-renders of all consumers during recall.
    // The SharedValue versions (recallingRackIndicesShared, recallingBoardPositionsShared)
    // are used for frame-perfect hiding on the UI thread instead.
    [
      isDragging,
      isSettling,
      dragSource,
      dragTile,
      settlingTarget,
      recallingRackIndicesShared,
      recallingBoardPositionsShared,
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
      draggingBoardPositionShared,
      settlingTargetShared,
    ]
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  // Debug overlay for TestFlight diagnosis
  const handleCopyDebug = useCallback(() => {
    const text = JSON.stringify(debugInfo, null, 2);
    Clipboard.setString(text);
  }, [debugInfo]);

  const handleClearDebug = useCallback(() => {
    setDebugInfo([]);
  }, []);

  const debugOverlay = SHOW_DEBUG_OVERLAY && debugInfo.length > 0 && (
    <View style={styles.debugOverlay}>
      <View style={styles.debugHeader}>
        <Text style={styles.debugTitle}>Drop Debug ({debugInfo.length})</Text>
        <View style={styles.debugButtons}>
          <TouchableOpacity onPress={handleCopyDebug} style={styles.debugButton}>
            <Text style={styles.debugButtonText}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClearDebug} style={styles.debugButton}>
            <Text style={styles.debugButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={styles.debugScroll}>
        {debugInfo.map((info, idx) => (
          <View key={idx} style={styles.debugEntry}>
            <Text style={[styles.debugText, { color: info.placementResult === 'success' ? '#4ecdc4' : info.placementResult === 'failed' ? '#ff6b6b' : '#ffff00' }]}>
              [{info.timestamp}] cell={info.cellResult ? `${info.cellResult.x},${info.cellResult.y}` : 'NULL'} → {info.placementResult || 'pending'}
            </Text>
            {info.failReason && (
              <Text style={[styles.debugText, { color: '#ff6b6b' }]}>
                reason: {info.failReason}
              </Text>
            )}
            <Text style={styles.debugText}>
              drop: x={info.dropPosition?.x.toFixed(1)} y={info.dropPosition?.y.toFixed(1)}
            </Text>
            <Text style={styles.debugText}>
              board: x={info.boardLayout?.x.toFixed(1)} y={info.boardLayout?.y.toFixed(1)} w={info.boardLayout?.width.toFixed(1)} cell={info.boardLayout?.cellSize.toFixed(2)}
            </Text>
            <Text style={styles.debugText}>
              shared: L={info.sharedValues?.boardLeft.toFixed(1)} T={info.sharedValues?.boardTop.toFixed(1)} cs={info.sharedValues?.cellSize.toFixed(2)}
            </Text>
            <Text style={styles.debugText}>
              offset: x={info.containerOffset?.x.toFixed(1)} y={info.containerOffset?.y.toFixed(1)}
            </Text>
            {info.boardLayout && info.dropPosition && (
              <Text style={styles.debugText}>
                relPos: x={((info.dropPosition.x - info.boardLayout.x)).toFixed(1)} y={((info.dropPosition.y - info.boardLayout.y)).toFixed(1)} (max: {info.boardLayout.width.toFixed(1)})
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );

  // Per-tile floating approach: render one floating tile per rack slot.
  // Each knows its content at render time - no sync between worklet and React needed!
  // Visibility is controlled by worklet checking if this rackIndex is being dragged.
  const floatingTiles = (
    <View style={styles.floatingContainer} pointerEvents="none">
      {/* Rack floating tiles - one per slot, visibility controlled by worklet */}
      {rackTiles.map((tile, rackIndex) => (
        <RackFloatingTile
          key={rackIndex}
          tile={tile}
          rackIndex={rackIndex}
          positionX={positionX}
          positionY={positionY}
          scale={scale}
          draggingRackIndex={draggingRackIndexShared}
        />
      ))}
      {/* Board floating tile - for pending tiles dragged from board */}
      <BoardFloatingTile
        tile={boardFloatingTile}
        positionX={positionX}
        positionY={positionY}
        scale={scale}
        opacity={boardFloatingOpacity}
        shouldShow={boardFloatingShouldShow}
        draggingBoardPosition={draggingBoardPositionShared}
        pendingBoardPosition={pendingBoardPosition}
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
          {debugOverlay}
        </View>
      )}
    </DragDropContext.Provider>
  );
}

// ============================================================================
// Styles
// ============================================================================

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
  },
  floatingTileBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1000,
    // Width/height controlled via animatedStyle for pixel-perfect sizing
  },
  // Simple tile for recall animation (lightweight, no hooks)
  // Background and border colors are animated - see RecallingTileItem
  simpleTile: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  simpleTileLetter: {
    fontSize: Math.round(TILE_SIZE * 0.65), // Match unified tile (34px)
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
    marginRight: '15%',
  },
  simpleTilePoints: {
    position: 'absolute',
    bottom: '-4%',
    right: 0,
    fontSize: Math.round(TILE_SIZE * 0.38), // Match unified tile (20px)
    fontWeight: '600',
    color: '#333333',
  },
  // Debug overlay styles
  debugOverlay: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    maxHeight: 300,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 8,
    padding: 8,
    zIndex: 2000,
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    paddingBottom: 4,
  },
  debugTitle: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: 'bold',
  },
  debugButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  debugButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  debugButtonText: {
    color: '#4ecdc4',
    fontSize: 12,
    fontWeight: '600',
  },
  debugScroll: {
    maxHeight: 220,
  },
  debugEntry: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  debugText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 14,
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
