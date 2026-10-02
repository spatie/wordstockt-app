import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Tile,
  PendingTile,
  ValidationResponse,
  TileValidationState,
} from '../types';
import { getValidationDraftKey } from '../utils/validationKey';

type SwapPhase =
  | { kind: 'idle' }
  | { kind: 'selecting'; indices: number[] }
  | { kind: 'completed'; indices: number[] };

interface ValidationScope {
  gameUlid: string;
  draftKey: string;
  boardKey: string;
}

interface ScopedValidation extends ValidationScope {
  result: ValidationResponse;
}

// Per-game persisted state
interface PerGameState {
  pendingTiles: PendingTile[];
  rackPermutation: number[];
}

interface GameUIState {
  // Current game context
  currentGameUlid: string | null;
  // Per-game state (persisted)
  gameStates: Record<string, PerGameState>;
  // Transient UI state (not persisted)
  selectedRackIndex: number | null;
  isRackDragging: boolean;
  boardKey: string | null;
  validation: ScopedValidation | null;
  swapPhase: SwapPhase;
  blankTileSelection: {
    rackIndex: number;
    x: number;
    y: number;
  } | null;
}

interface GameUIActions {
  setCurrentGame: (gameUlid: string | null) => void;
  placeTile: (tile: Tile, x: number, y: number, rackIndex: number) => void;
  moveTile: (fromX: number, fromY: number, toX: number, toY: number) => void;
  removeTile: (x: number, y: number) => void;
  recallAllTiles: () => void;
  clearPendingTiles: (gameUlid: string, expectedDraftKey: string) => void;
  removePendingTiles: (gameUlid: string, tiles: PendingTile[]) => void;
  clearGameState: (gameUlid: string) => void;
  setSelectedRackIndex: (index: number | null) => void;
  swapRackSlots: (slotA: number, slotB: number) => void;
  insertByActualIndex: (
    actualRackIndex: number,
    targetVisualSlot: number
  ) => void;
  setRackPermutation: (permutation: number[]) => void;
  shuffleRack: (filledIndices?: number[]) => void;
  resetRackPermutation: () => void;
  setRackDragging: (isDragging: boolean) => void;
  setBoardKey: (gameUlid: string, boardKey: string) => void;
  setValidationResult: (
    result: ValidationResponse | null,
    scope: ValidationScope
  ) => void;
  enterSwapMode: () => void;
  exitSwapMode: () => void;
  toggleSwapTile: (rackIndex: number) => void;
  clearSwapSelection: () => void;
  completeSwap: (gameUlid: string, indices: number[]) => void;
  dismissSwapResult: () => void;
  startBlankTileSelection: (rackIndex: number, x: number, y: number) => void;
  cancelBlankTileSelection: () => void;
  confirmBlankTileLetter: (letter: string) => void;
  updatePendingTileLetter: (x: number, y: number, letter: string) => void;
}

const DEFAULT_RACK_PERMUTATION = [0, 1, 2, 3, 4, 5, 6];
const EMPTY_SWAP_INDICES: number[] = [];

const DEFAULT_PER_GAME_STATE: PerGameState = {
  pendingTiles: [],
  rackPermutation: [...DEFAULT_RACK_PERMUTATION],
};

// Helper to get current game state
const getCurrentGameState = (state: GameUIState): PerGameState => {
  if (!state.currentGameUlid) return DEFAULT_PER_GAME_STATE;
  return state.gameStates[state.currentGameUlid] ?? DEFAULT_PER_GAME_STATE;
};

// Helper to update current game state
const updateCurrentGameState = (
  state: GameUIState,
  updates: Partial<PerGameState>
): Partial<GameUIState> => {
  if (!state.currentGameUlid) return {};
  const currentState = getCurrentGameState(state);
  return {
    gameStates: {
      ...state.gameStates,
      [state.currentGameUlid]: {
        ...currentState,
        ...updates,
      },
    },
  };
};

const getCurrentValidation = (
  state: GameUIState
): ValidationResponse | null => {
  const validation = state.validation;
  if (
    !validation ||
    validation.gameUlid !== state.currentGameUlid ||
    validation.boardKey !== state.boardKey ||
    validation.draftKey !==
      getValidationDraftKey(getCurrentGameState(state).pendingTiles)
  ) {
    return null;
  }
  return validation.result;
};

export const useGameStore = create<GameUIState & GameUIActions>()(
  persist(
    (set, get) => ({
      currentGameUlid: null,
      gameStates: {},
      selectedRackIndex: null,
      isRackDragging: false,
      boardKey: null,
      validation: null,
      swapPhase: { kind: 'idle' },
      blankTileSelection: null,

      setCurrentGame: (gameUlid) => {
        set({
          currentGameUlid: gameUlid,
          // Reset transient state when switching games
          selectedRackIndex: null,
          isRackDragging: false,
          boardKey: null,
          validation: null,
          swapPhase: { kind: 'idle' },
          blankTileSelection: null,
        });
      },

      placeTile: (tile, x, y, rackIndex) => {
        set((state) => {
          const gameState = getCurrentGameState(state);
          const newPendingTiles = [
            ...gameState.pendingTiles,
            { ...tile, x, y, rackIndex },
          ];
          return {
            ...updateCurrentGameState(state, {
              pendingTiles: newPendingTiles,
            }),
            selectedRackIndex: null,
            validation: null,
          };
        });
      },

      moveTile: (fromX, fromY, toX, toY) =>
        set((state) => {
          const gameState = getCurrentGameState(state);
          return {
            ...updateCurrentGameState(state, {
              pendingTiles: gameState.pendingTiles.map((t) =>
                t.x === fromX && t.y === fromY ? { ...t, x: toX, y: toY } : t
              ),
            }),
            validation: null,
          };
        }),

      removeTile: (x, y) => {
        set((state) => {
          const gameState = getCurrentGameState(state);
          return {
            ...updateCurrentGameState(state, {
              pendingTiles: gameState.pendingTiles.filter(
                (t) => t.x !== x || t.y !== y
              ),
            }),
            validation: null,
          };
        });
      },

      recallAllTiles: () => {
        set((state) => ({
          ...updateCurrentGameState(state, { pendingTiles: [] }),
          validation: null,
        }));
      },

      clearPendingTiles: (gameUlid, expectedDraftKey) =>
        set((state) => {
          const gameState = state.gameStates[gameUlid];
          if (
            !gameState ||
            getValidationDraftKey(gameState.pendingTiles) !== expectedDraftKey
          ) {
            return state;
          }
          return {
            gameStates: {
              ...state.gameStates,
              [gameUlid]: {
                ...gameState,
                pendingTiles: [],
                rackPermutation: [...DEFAULT_RACK_PERMUTATION],
              },
            },
            validation:
              state.currentGameUlid === gameUlid ? null : state.validation,
          };
        }),

      removePendingTiles: (gameUlid, tiles) =>
        set((state) => {
          const gameState = state.gameStates[gameUlid];
          if (!gameState) return state;
          const toRemove = new Set(
            tiles.map((tile) => `${tile.x},${tile.y},${tile.rackIndex}`)
          );
          return {
            gameStates: {
              ...state.gameStates,
              [gameUlid]: {
                ...gameState,
                pendingTiles: gameState.pendingTiles.filter(
                  (tile) =>
                    !toRemove.has(`${tile.x},${tile.y},${tile.rackIndex}`)
                ),
              },
            },
            validation:
              state.currentGameUlid === gameUlid ? null : state.validation,
          };
        }),

      clearGameState: (gameUlid) => {
        set((state) => {
          const { [gameUlid]: _, ...remainingStates } = state.gameStates;
          return { gameStates: remainingStates };
        });
      },

      setSelectedRackIndex: (index) => set({ selectedRackIndex: index }),

      swapRackSlots: (slotA, slotB) =>
        set((state) => {
          const gameState = getCurrentGameState(state);
          const newPerm = [...gameState.rackPermutation];
          const temp = newPerm[slotA]!;
          newPerm[slotA] = newPerm[slotB]!;
          newPerm[slotB] = temp;
          return updateCurrentGameState(state, { rackPermutation: newPerm });
        }),

      insertByActualIndex: (actualRackIndex, targetVisualSlot) =>
        set((state) => {
          const gameState = getCurrentGameState(state);
          const newPerm = [...gameState.rackPermutation];
          const currentVisualSlot = newPerm.indexOf(actualRackIndex);
          if (
            currentVisualSlot === -1 ||
            currentVisualSlot === targetVisualSlot
          ) {
            return state;
          }
          // Remove the tile from its current slot and insert it at the target,
          // shifting the tiles in between to make room (drag-to-reorder).
          const [moved] = newPerm.splice(currentVisualSlot, 1);
          newPerm.splice(targetVisualSlot, 0, moved!);
          return updateCurrentGameState(state, { rackPermutation: newPerm });
        }),

      setRackPermutation: (permutation) =>
        set((state) =>
          updateCurrentGameState(state, { rackPermutation: permutation })
        ),

      setRackDragging: (isDragging) => set({ isRackDragging: isDragging }),

      shuffleRack: (filledIndices?: number[]) =>
        set((state) => {
          if (state.isRackDragging) return state;

          const gameState = getCurrentGameState(state);

          if (filledIndices && filledIndices.length > 0) {
            const shuffled = [...filledIndices];
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
            }

            const emptyIndices = gameState.rackPermutation.filter(
              (idx) => !filledIndices.includes(idx)
            );
            const newPerm = [...shuffled, ...emptyIndices];
            return updateCurrentGameState(state, { rackPermutation: newPerm });
          }

          const newPerm = [...gameState.rackPermutation];
          for (let i = newPerm.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newPerm[i], newPerm[j]] = [newPerm[j]!, newPerm[i]!];
          }
          return updateCurrentGameState(state, { rackPermutation: newPerm });
        }),

      resetRackPermutation: () =>
        set((state) =>
          updateCurrentGameState(state, {
            rackPermutation: [...DEFAULT_RACK_PERMUTATION],
          })
        ),

      setBoardKey: (gameUlid, boardKey) =>
        set((state) => {
          if (
            state.currentGameUlid !== gameUlid ||
            state.boardKey === boardKey
          ) {
            return state;
          }
          return { boardKey, validation: null };
        }),

      setValidationResult: (result, scope) =>
        set((state) => {
          if (state.currentGameUlid !== scope.gameUlid) return state;
          if (
            state.boardKey !== scope.boardKey ||
            getValidationDraftKey(getCurrentGameState(state).pendingTiles) !==
              scope.draftKey
          ) {
            return state;
          }
          if (!result) return { validation: null };
          return { validation: { ...scope, result } };
        }),

      enterSwapMode: () =>
        set({ swapPhase: { kind: 'selecting', indices: [] } }),

      exitSwapMode: () => set({ swapPhase: { kind: 'idle' } }),

      toggleSwapTile: (rackIndex) =>
        set((state) => {
          if (state.swapPhase.kind !== 'selecting') return state;
          const indices = state.swapPhase.indices;
          return {
            swapPhase: {
              kind: 'selecting',
              indices: indices.includes(rackIndex)
                ? indices.filter((index) => index !== rackIndex)
                : [...indices, rackIndex],
            },
          };
        }),

      clearSwapSelection: () =>
        set((state) =>
          state.swapPhase.kind === 'selecting'
            ? { swapPhase: { kind: 'selecting', indices: [] } }
            : state
        ),

      completeSwap: (gameUlid, indices) =>
        set((state) => {
          if (
            state.currentGameUlid !== gameUlid ||
            state.swapPhase.kind !== 'selecting'
          ) {
            return state;
          }
          return { swapPhase: { kind: 'completed', indices: [...indices] } };
        }),

      dismissSwapResult: () => set({ swapPhase: { kind: 'idle' } }),

      startBlankTileSelection: (rackIndex, x, y) =>
        set({ blankTileSelection: { rackIndex, x, y } }),

      cancelBlankTileSelection: () => set({ blankTileSelection: null }),

      confirmBlankTileLetter: (letter) =>
        set((state) => {
          if (!state.blankTileSelection) return state;

          const { x, y } = state.blankTileSelection;
          const gameState = getCurrentGameState(state);

          const existingTile = gameState.pendingTiles.find(
            (t) => t.x === x && t.y === y
          );

          if (existingTile) {
            return {
              ...updateCurrentGameState(state, {
                pendingTiles: gameState.pendingTiles.map((t) =>
                  t.x === x && t.y === y ? { ...t, letter } : t
                ),
              }),
              blankTileSelection: null,
              validation: null,
            };
          }

          return { blankTileSelection: null };
        }),

      updatePendingTileLetter: (x, y, letter) =>
        set((state) => {
          const gameState = getCurrentGameState(state);
          return {
            ...updateCurrentGameState(state, {
              pendingTiles: gameState.pendingTiles.map((t) =>
                t.x === x && t.y === y ? { ...t, letter } : t
              ),
            }),
            validation: null,
          };
        }),
    }),
    {
      name: 'wordstockt-game-state',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the per-game state, not transient UI state
      partialize: (state) => ({
        gameStates: state.gameStates,
      }),
    }
  )
);

// Selectors that use current game context
export const usePendingTiles = () =>
  useGameStore((state) => getCurrentGameState(state).pendingTiles);

export const useRackPermutation = () =>
  useGameStore((state) => getCurrentGameState(state).rackPermutation);

export const usePendingTileAt = (x: number, y: number) =>
  useGameStore((state) =>
    getCurrentGameState(state).pendingTiles.find((t) => t.x === x && t.y === y)
  );

// Rack indices whose tile is currently placed on the board, as a stable
// string so subscribers only re-render when the set actually changes
export const useUsedRackIndicesKey = () =>
  useGameStore((state) =>
    getCurrentGameState(state)
      .pendingTiles.map((t) => t.rackIndex)
      .sort((a, b) => a - b)
      .join(',')
  );

export const useRackTileUsed = (actualRackIndex: number) =>
  useGameStore((state) =>
    getCurrentGameState(state).pendingTiles.some(
      (t) => t.rackIndex === actualRackIndex
    )
  );

export const useActualRackIndex = (visualSlot: number) =>
  useGameStore(
    (state) => getCurrentGameState(state).rackPermutation[visualSlot]
  );

export const useTileValidationState = (
  x: number,
  y: number
): TileValidationState =>
  useGameStore((state) => {
    const gameState = getCurrentGameState(state);
    const isPending = gameState.pendingTiles.some(
      (t) => t.x === x && t.y === y
    );
    if (!isPending) return null;

    const validation = getCurrentValidation(state);
    if (!validation) return null;

    if (!validation.placement_valid) return 'placement_error';

    const tileStatus = validation.tile_status.find(
      (t) => t.x === x && t.y === y
    );
    if (!tileStatus) return null;

    return tileStatus.valid ? 'valid' : 'invalid';
  });

export const useBoardTileHighlight = (
  x: number,
  y: number
): 'valid' | 'invalid' | null =>
  useGameStore((state) => {
    const gameState = getCurrentGameState(state);
    const pendingTiles = gameState.pendingTiles;

    const isPending = pendingTiles.some((t) => t.x === x && t.y === y);
    if (isPending) return null;

    const validation = getCurrentValidation(state);
    if (!validation || !validation.placement_valid) return null;

    let isPartOfWord = false;
    let isPartOfInvalidWord = false;

    for (const word of validation.words) {
      const inWord = word.tiles.some((t) => t.x === x && t.y === y);
      if (inWord) {
        isPartOfWord = true;
        if (!word.valid) {
          isPartOfInvalidWord = true;
        }
      }
    }

    if (!isPartOfWord) return null;
    return isPartOfInvalidWord ? 'invalid' : 'valid';
  });

// Swap mode selectors
export const useIsSwapMode = () =>
  useGameStore((state) => state.swapPhase.kind !== 'idle');

export const useSelectedSwapIndices = () =>
  useGameStore((state) =>
    state.swapPhase.kind === 'selecting'
      ? state.swapPhase.indices
      : EMPTY_SWAP_INDICES
  );

export const useIsSwapSelected = (rackIndex: number) =>
  useGameStore(
    (state) =>
      state.swapPhase.kind === 'selecting' &&
      state.swapPhase.indices.includes(rackIndex)
  );

export const useSwapCompleted = () =>
  useGameStore((state) => state.swapPhase.kind === 'completed');

export const useSwappedTileIndices = () =>
  useGameStore((state) =>
    state.swapPhase.kind === 'completed'
      ? state.swapPhase.indices
      : EMPTY_SWAP_INDICES
  );

export const useIsSwappedTile = (rackIndex: number) =>
  useGameStore(
    (state) =>
      state.swapPhase.kind === 'completed' &&
      state.swapPhase.indices.includes(rackIndex)
  );

// Blank tile selectors
export const useBlankTileSelection = () =>
  useGameStore((state) => state.blankTileSelection);

// Drag state selector
export const useIsRackDragging = () =>
  useGameStore((state) => state.isRackDragging);

// Validation result selector
export const useValidationResult = () => useGameStore(getCurrentValidation);
