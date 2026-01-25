import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Tile,
  PendingTile,
  ValidationResponse,
  TileValidationState,
} from '../types';

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
  validationResult: ValidationResponse | null;
  isSwapMode: boolean;
  selectedSwapIndices: number[];
  swapCompleted: boolean;
  swappedTileIndices: number[];
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
  clearPendingTiles: () => void;
  clearGameState: (gameUlid: string) => void;
  setSelectedRackIndex: (index: number | null) => void;
  swapRackSlots: (slotA: number, slotB: number) => void;
  swapByActualIndex: (
    actualRackIndex: number,
    targetVisualSlot: number
  ) => void;
  setRackPermutation: (permutation: number[]) => void;
  shuffleRack: (filledIndices?: number[]) => void;
  resetRackPermutation: () => void;
  setRackDragging: (isDragging: boolean) => void;
  setValidationResult: (result: ValidationResponse | null) => void;
  enterSwapMode: () => void;
  exitSwapMode: () => void;
  toggleSwapTile: (rackIndex: number) => void;
  clearSwapSelection: () => void;
  completeSwap: () => void;
  dismissSwapResult: () => void;
  startBlankTileSelection: (rackIndex: number, x: number, y: number) => void;
  cancelBlankTileSelection: () => void;
  confirmBlankTileLetter: (letter: string) => void;
  updatePendingTileLetter: (x: number, y: number, letter: string) => void;
}

const DEFAULT_RACK_PERMUTATION = [0, 1, 2, 3, 4, 5, 6];

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

export const useGameStore = create<GameUIState & GameUIActions>()(
  persist(
    (set, get) => ({
      currentGameUlid: null,
      gameStates: {},
      selectedRackIndex: null,
      isRackDragging: false,
      validationResult: null,
      isSwapMode: false,
      selectedSwapIndices: [],
      swapCompleted: false,
      swappedTileIndices: [],
      blankTileSelection: null,

      setCurrentGame: (gameUlid) => {
        set({
          currentGameUlid: gameUlid,
          // Reset transient state when switching games
          selectedRackIndex: null,
          isRackDragging: false,
          validationResult: null,
          isSwapMode: false,
          selectedSwapIndices: [],
          swapCompleted: false,
          swappedTileIndices: [],
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
          };
        });
      },

      moveTile: (fromX, fromY, toX, toY) =>
        set((state) => {
          const gameState = getCurrentGameState(state);
          return updateCurrentGameState(state, {
            pendingTiles: gameState.pendingTiles.map((t) =>
              t.x === fromX && t.y === fromY ? { ...t, x: toX, y: toY } : t
            ),
          });
        }),

      removeTile: (x, y) => {
        set((state) => {
          const gameState = getCurrentGameState(state);
          return updateCurrentGameState(state, {
            pendingTiles: gameState.pendingTiles.filter(
              (t) => t.x !== x || t.y !== y
            ),
          });
        });
      },

      recallAllTiles: () => {
        set((state) => ({
          ...updateCurrentGameState(state, { pendingTiles: [] }),
          validationResult: null,
        }));
      },

      clearPendingTiles: () => {
        set((state) => ({
          ...updateCurrentGameState(state, {
            pendingTiles: [],
            rackPermutation: [...DEFAULT_RACK_PERMUTATION],
          }),
          validationResult: null,
        }));
      },

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

      swapByActualIndex: (actualRackIndex, targetVisualSlot) =>
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
          const temp = newPerm[currentVisualSlot]!;
          newPerm[currentVisualSlot] = newPerm[targetVisualSlot]!;
          newPerm[targetVisualSlot] = temp;
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

      setValidationResult: (result) => set({ validationResult: result }),

      enterSwapMode: () =>
        set({
          isSwapMode: true,
          selectedSwapIndices: [],
          swapCompleted: false,
          swappedTileIndices: [],
        }),

      exitSwapMode: () =>
        set({
          isSwapMode: false,
          selectedSwapIndices: [],
          swapCompleted: false,
          swappedTileIndices: [],
        }),

      toggleSwapTile: (rackIndex) =>
        set((state) => ({
          selectedSwapIndices: state.selectedSwapIndices.includes(rackIndex)
            ? state.selectedSwapIndices.filter((i) => i !== rackIndex)
            : [...state.selectedSwapIndices, rackIndex],
        })),

      clearSwapSelection: () => set({ selectedSwapIndices: [] }),

      completeSwap: () =>
        set((state) => ({
          swapCompleted: true,
          swappedTileIndices: [...state.selectedSwapIndices],
          selectedSwapIndices: [],
        })),

      dismissSwapResult: () =>
        set({
          isSwapMode: false,
          selectedSwapIndices: [],
          swapCompleted: false,
          swappedTileIndices: [],
        }),

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
            };
          }

          return { blankTileSelection: null };
        }),

      updatePendingTileLetter: (x, y, letter) =>
        set((state) => {
          const gameState = getCurrentGameState(state);
          return updateCurrentGameState(state, {
            pendingTiles: gameState.pendingTiles.map((t) =>
              t.x === x && t.y === y ? { ...t, letter } : t
            ),
          });
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

    const validation = state.validationResult;
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

    const validation = state.validationResult;
    if (!validation || !validation.placement_valid) return null;

    // Check if validation is stale: pending tile positions must EXACTLY match
    // what was validated (tile_status contains one entry per pending tile that was validated)
    const validatedPositions = new Set(
      validation.tile_status.map((t) => `${t.x},${t.y}`)
    );
    const pendingPositions = new Set(pendingTiles.map((t) => `${t.x},${t.y}`));

    // If sets don't match exactly, validation is stale
    if (validatedPositions.size !== pendingPositions.size) return null;
    for (const pos of validatedPositions) {
      if (!pendingPositions.has(pos)) return null;
    }

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
export const useIsSwapMode = () => useGameStore((state) => state.isSwapMode);

export const useSelectedSwapIndices = () =>
  useGameStore((state) => state.selectedSwapIndices);

export const useIsSwapSelected = (rackIndex: number) =>
  useGameStore((state) => state.selectedSwapIndices.includes(rackIndex));

export const useSwapCompleted = () =>
  useGameStore((state) => state.swapCompleted);

export const useSwappedTileIndices = () =>
  useGameStore((state) => state.swappedTileIndices);

export const useIsSwappedTile = (rackIndex: number) =>
  useGameStore((state) => state.swappedTileIndices.includes(rackIndex));

// Blank tile selectors
export const useBlankTileSelection = () =>
  useGameStore((state) => state.blankTileSelection);

// Drag state selector
export const useIsRackDragging = () =>
  useGameStore((state) => state.isRackDragging);

// Validation result selector
export const useValidationResult = () =>
  useGameStore((state) => state.validationResult);
