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
  tile: Tile | null;
  positionX: SharedValue<number>;
  positionY: SharedValue<number>;
  scale: SharedValue<number>;
  opacity: SharedValue<number>;
}

function FloatingTile({
  tile,
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

  if (!tile) return null;

  const isBlank = tile.isBlank;
  const displayLetter = tile.letter === '*' ? '' : tile.letter;
  const TILE_INNER_SIZE = TILE_SIZE * 0.92;

  return (
    <Animated.View
      style={[styles.floatingTile, animatedStyle]}
      pointerEvents="none"
    >
      <View style={[styles.tileContent, isBlank && styles.blankTile]}>
        {tile.letter !== '*' && (
          <>
            <Animated.Text style={styles.letterText}>
              {displayLetter}
            </Animated.Text>
            <Animated.Text style={styles.points}>{tile.points}</Animated.Text>
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

  // Sync swap mode state to shared value for worklet access
  const isSwapMode = useIsSwapMode();
  useEffect(() => {
    isSwapModeShared.value = isSwapMode;
  }, [isSwapMode, isSwapModeShared]);

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
      onDragEnd?: (target: DropTarget, wasDragged: boolean) => void
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
  const setBoardLayout = useCallback((layout: BoardLayout) => {
    boardLayoutRef.current = layout;
  }, []);

  const setRackLayout = useCallback((layout: RackLayout) => {
    rackLayoutRef.current = layout;
  }, []);

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
  // Hit Testing
  // -------------------------------------------------------------------------
  const findDraggableAtPosition = useCallback(
    (x: number, y: number): DraggableItem | null => {
      const rackLayout = rackLayoutRef.current;
      const state = useGameStore.getState();
      const currentGameUlid = state.currentGameUlid;
      const permutation = (currentGameUlid &&
        state.gameStates[currentGameUlid]?.rackPermutation) || [
        0, 1, 2, 3, 4, 5, 6,
      ];

      // Find all matching items and pick the one closest to touch point
      let closestItem: DraggableItem | null = null;
      let closestDistance = Infinity;

      for (const [id, item] of draggablesRef.current) {
        let hitArea = item.hitArea;

        // For rack items, recalculate hit area from current permutation
        if (item.source.type === 'rack' && rackLayout) {
          const visualSlot = permutation.indexOf(item.source.rackIndex);
          if (visualSlot !== -1) {
            const slotWidth = TILE_SIZE + GAP;
            hitArea = {
              x: rackLayout.x + visualSlot * slotWidth,
              y: rackLayout.y,
              width: TILE_SIZE,
              height: TILE_SIZE,
            };
          }
        }

        // Check if touch point is within hit area
        if (
          x >= hitArea.x &&
          x <= hitArea.x + hitArea.width &&
          y >= hitArea.y &&
          y <= hitArea.y + hitArea.height
        ) {
          // Calculate distance from touch point to hit area center
          const centerX = hitArea.x + hitArea.width / 2;
          const centerY = hitArea.y + hitArea.height / 2;
          const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

          if (distance < closestDistance) {
            closestDistance = distance;
            closestItem = { ...item, hitArea };
          }
        }
      }

      return closestItem;
    },
    []
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
      onDragEnd?: (target: DropTarget, wasDragged: boolean) => void
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
          lastDragEndTimeRef.current = Date.now();
          setDragStatus('idle');
          setDragTile(null);
          setDragSource(null);
          activeDragRef.current = null;
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
      lastDragEndTimeRef.current = Date.now();
      setDragStatus('idle');
      setDragTile(null);
      setDragSource(null);
      setSettlingTarget(null);
      activeDragRef.current = null;
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
        lastDragEndTimeRef.current = Date.now();
        setDragStatus('idle');
        setDragTile(null);
        setDragSource(null);
        setSettlingTarget(null);
        activeDragRef.current = null;

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
    lastDragEndTimeRef.current = Date.now();
    setDragStatus('idle');
    setDragTile(null);
    setDragSource(null);
    setSettlingTarget(null);
    activeDragRef.current = null;

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
      console.log('[DragDrop] handleGestureStart called', { x, y });
      // Check cooldown on JS thread
      const now = Date.now();
      if (now - lastDragEndTimeRef.current < DRAG_COOLDOWN_MS) {
        console.log('[DragDrop] Cooldown active, skipping');
        return;
      }

      const draggable = findDraggableAtPosition(x, y);
      console.log(
        '[DragDrop] findDraggableAtPosition result:',
        draggable ? 'found' : 'not found'
      );
      if (draggable) {
        console.log('[DragDrop] Starting drag for', draggable.tile.letter);
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
    console.log('[DragDrop] onGestureStart wrapper called');
    handleGestureStartRef.current(x, y);
  }, []);

  const onGestureEnd = useCallback(() => {
    console.log('[DragDrop] onGestureEnd wrapper called');
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

  // Shared values for rack layout (accessed in worklet for immediate activation)
  const rackTop = useSharedValue(0);
  const rackBottom = useSharedValue(0);

  // Sync container offset and rack layout to shared values
  useEffect(() => {
    const syncValues = () => {
      containerOffsetX.value = containerOffsetRef.current.x;
      containerOffsetY.value = containerOffsetRef.current.y;
      if (rackLayoutRef.current) {
        rackTop.value = rackLayoutRef.current.y;
        rackBottom.value =
          rackLayoutRef.current.y + rackLayoutRef.current.height;
      }
    };
    // Sync immediately and also set up a small interval for the initial layout
    syncValues();
    const timer = setInterval(syncValues, 100);
    // Clear after a short time - we just need to catch the initial measurement
    setTimeout(() => clearInterval(timer), 500);
    return () => clearInterval(timer);
  }, [containerOffsetX, containerOffsetY, rackTop, rackBottom]);

  // Edge threshold for iOS swipe-back gesture (in pixels from left edge)
  const EDGE_THRESHOLD = 20;
  // Track if touch started near edge (to fail gesture on first move)
  const touchStartedNearEdge = useSharedValue(false);
  // Track if touch started on rack (to activate immediately)
  const touchStartedOnRack = useSharedValue(false);

  const panGesture = Gesture.Pan()
    .minDistance(DRAG_ACTIVATION_DISTANCE)
    .maxPointers(1)
    .manualActivation(true)
    .onTouchesDown((event, stateManager) => {
      'worklet';
      const touch = event.allTouches[0];
      if (!touch) return;

      // Check if touch is on the rack area
      const touchY = touch.absoluteY;
      const isOnRack = touchY >= rackTop.value && touchY <= rackBottom.value;
      touchStartedOnRack.value = isOnRack;

      // Check if touch starts near left edge (for iOS swipe-back)
      // But NOT if on the rack - rack touches are always for tile dragging
      touchStartedNearEdge.value =
        !isOnRack && touch.absoluteX < EDGE_THRESHOLD;

      // In swap mode, fail immediately for rack touches to allow tap handling
      if (isOnRack && isSwapModeShared.value) {
        stateManager.fail();
        return;
      }

      // Activate immediately for rack touches (not in swap mode)
      if (isOnRack) {
        stateManager.activate();
      }
    })
    .onTouchesMove((event, stateManager) => {
      'worklet';
      // If in swap mode and touch started on rack, fail to allow tap handling
      if (isSwapModeShared.value && touchStartedOnRack.value) {
        stateManager.fail();
        return;
      }

      // If already activated (rack touch), do nothing
      if (touchStartedOnRack.value) return;

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
      // Find draggable at position (must call on JS thread, includes cooldown check)
      runOnJS(onGestureStart)(event.absoluteX, event.absoluteY);
    })
    .onUpdate((event) => {
      'worklet';
      if (!isDraggingShared.value) return;

      // Convert absolute screen coordinates to container-relative coordinates
      const relativeX = event.absoluteX - containerOffsetX.value;
      const relativeY = event.absoluteY - containerOffsetY.value;

      // Update position directly on UI thread - no bridge!
      positionX.value = relativeX + TILE_OFFSET;
      positionY.value = relativeY + TILE_OFFSET;

      // Also update ref for endDrag calculations (keep absolute for hit testing)
      runOnJS(onPositionUpdate)(event.absoluteX, event.absoluteY);
    })
    .onEnd(() => {
      'worklet';
      if (!isDraggingShared.value) return;
      runOnJS(onGestureEnd)();
    })
    .onFinalize(() => {
      'worklet';
      // Handle cancelled gestures
      if (isDraggingShared.value) {
        runOnJS(onGestureEnd)();
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
      registerDraggable,
      unregisterDraggable,
      startDragFromRack,
      startDragFromBoard,
      updateDrag,
      endDrag,
      startRecallAnimation,
      getBoardCell,
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
      registerDraggable,
      unregisterDraggable,
      startDragFromRack,
      startDragFromBoard,
      updateDrag,
      endDrag,
      startRecallAnimation,
      getBoardCell,
    ]
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  const floatingTiles = (
    <View style={styles.floatingContainer} pointerEvents="none">
      <FloatingTile
        tile={dragTile}
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
  },
  points: {
    position: 'absolute',
    bottom: '4%',
    right: '5%',
    fontSize: 10,
    fontWeight: '800',
    color: '#1A1A1A',
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
