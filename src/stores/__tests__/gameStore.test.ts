import {
  useGameStore,
  usePendingTiles,
  useRackPermutation,
} from '../gameStore';
import {
  mockTile,
  mockPendingTile,
  mockValidationResponse,
} from '../../__tests__/utils';

const TEST_GAME_ULID = 'test-game-123';

// Helper to get pending tiles for current game
const getPendingTiles = () => {
  const state = useGameStore.getState();
  return state.gameStates[state.currentGameUlid ?? '']?.pendingTiles ?? [];
};

// Helper to get rack permutation for current game
const getRackPermutation = () => {
  const state = useGameStore.getState();
  return (
    state.gameStates[state.currentGameUlid ?? '']?.rackPermutation ?? [
      0, 1, 2, 3, 4, 5, 6,
    ]
  );
};

describe('gameStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useGameStore.setState({
      currentGameUlid: TEST_GAME_ULID,
      gameStates: {
        [TEST_GAME_ULID]: {
          pendingTiles: [],
          rackPermutation: [0, 1, 2, 3, 4, 5, 6],
        },
      },
      selectedRackIndex: null,
      validationResult: null,
      isSwapMode: false,
      selectedSwapIndices: [],
      swapCompleted: false,
      swappedTileIndices: [],
      isRackDragging: false,
      blankTileSelection: null,
    });
  });

  describe('setCurrentGame', () => {
    it('should set current game and reset transient state', () => {
      useGameStore.setState({
        isSwapMode: true,
        selectedSwapIndices: [1, 2],
      });

      useGameStore.getState().setCurrentGame('new-game-456');

      const state = useGameStore.getState();
      expect(state.currentGameUlid).toBe('new-game-456');
      expect(state.isSwapMode).toBe(false);
      expect(state.selectedSwapIndices).toEqual([]);
    });

    it('should preserve existing game states when switching', () => {
      const tile = mockTile({ letter: 'A', points: 1 });
      useGameStore.getState().placeTile(tile, 7, 7, 0);

      useGameStore.getState().setCurrentGame('new-game-456');

      const state = useGameStore.getState();
      expect(state.gameStates[TEST_GAME_ULID]?.pendingTiles).toHaveLength(1);
      expect(state.gameStates['new-game-456']?.pendingTiles ?? []).toHaveLength(
        0
      );
    });
  });

  describe('placeTile', () => {
    it('should add tile to pendingTiles', () => {
      const tile = mockTile({ letter: 'A', points: 1 });

      useGameStore.getState().placeTile(tile, 7, 7, 0);

      const pendingTiles = getPendingTiles();
      expect(pendingTiles).toHaveLength(1);
      expect(pendingTiles[0]).toMatchObject({
        letter: 'A',
        points: 1,
        x: 7,
        y: 7,
        rackIndex: 0,
      });
    });

    it('should clear selectedRackIndex after placing tile', () => {
      useGameStore.setState({ selectedRackIndex: 2 });
      const tile = mockTile();

      useGameStore.getState().placeTile(tile, 7, 7, 0);

      expect(useGameStore.getState().selectedRackIndex).toBeNull();
    });

    it('should allow multiple tiles to be placed', () => {
      const tileA = mockTile({ letter: 'A' });
      const tileB = mockTile({ letter: 'B' });

      useGameStore.getState().placeTile(tileA, 7, 7, 0);
      useGameStore.getState().placeTile(tileB, 8, 7, 1);

      expect(getPendingTiles()).toHaveLength(2);
    });
  });

  describe('moveTile', () => {
    it('should move tile from one position to another', () => {
      const state = useGameStore.getState();
      useGameStore.setState({
        gameStates: {
          ...state.gameStates,
          [TEST_GAME_ULID]: {
            ...state.gameStates[TEST_GAME_ULID]!,
            pendingTiles: [
              mockPendingTile({ letter: 'A', x: 5, y: 5, rackIndex: 0 }),
            ],
          },
        },
      });

      useGameStore.getState().moveTile(5, 5, 7, 7);

      const pendingTiles = getPendingTiles();
      expect(pendingTiles[0]).toMatchObject({ x: 7, y: 7 });
    });

    it('should only move the exact tile at position', () => {
      const state = useGameStore.getState();
      useGameStore.setState({
        gameStates: {
          ...state.gameStates,
          [TEST_GAME_ULID]: {
            ...state.gameStates[TEST_GAME_ULID]!,
            pendingTiles: [
              mockPendingTile({ letter: 'A', x: 5, y: 5, rackIndex: 0 }),
              mockPendingTile({ letter: 'B', x: 6, y: 5, rackIndex: 1 }),
            ],
          },
        },
      });

      useGameStore.getState().moveTile(5, 5, 7, 7);

      const pendingTiles = getPendingTiles();
      expect(pendingTiles.find((t) => t.letter === 'A')).toMatchObject({
        x: 7,
        y: 7,
      });
      expect(pendingTiles.find((t) => t.letter === 'B')).toMatchObject({
        x: 6,
        y: 5,
      });
    });

    it('should not modify array if no tile at position', () => {
      const state = useGameStore.getState();
      useGameStore.setState({
        gameStates: {
          ...state.gameStates,
          [TEST_GAME_ULID]: {
            ...state.gameStates[TEST_GAME_ULID]!,
            pendingTiles: [mockPendingTile({ x: 5, y: 5 })],
          },
        },
      });

      useGameStore.getState().moveTile(10, 10, 7, 7);

      expect(getPendingTiles()[0]).toMatchObject({
        x: 5,
        y: 5,
      });
    });
  });

  describe('removeTile', () => {
    it('should remove tile at position', () => {
      const state = useGameStore.getState();
      useGameStore.setState({
        gameStates: {
          ...state.gameStates,
          [TEST_GAME_ULID]: {
            ...state.gameStates[TEST_GAME_ULID]!,
            pendingTiles: [mockPendingTile({ x: 7, y: 7 })],
          },
        },
      });

      useGameStore.getState().removeTile(7, 7);

      expect(getPendingTiles()).toHaveLength(0);
    });

    it('should only remove exact position match', () => {
      const state = useGameStore.getState();
      useGameStore.setState({
        gameStates: {
          ...state.gameStates,
          [TEST_GAME_ULID]: {
            ...state.gameStates[TEST_GAME_ULID]!,
            pendingTiles: [
              mockPendingTile({ letter: 'A', x: 5, y: 5, rackIndex: 0 }),
              mockPendingTile({ letter: 'B', x: 5, y: 6, rackIndex: 1 }),
            ],
          },
        },
      });

      useGameStore.getState().removeTile(5, 5);

      const pendingTiles = getPendingTiles();
      expect(pendingTiles).toHaveLength(1);
      expect(pendingTiles[0]!.letter).toBe('B');
    });

    it('should not remove anything if position not found', () => {
      const state = useGameStore.getState();
      useGameStore.setState({
        gameStates: {
          ...state.gameStates,
          [TEST_GAME_ULID]: {
            ...state.gameStates[TEST_GAME_ULID]!,
            pendingTiles: [mockPendingTile({ x: 5, y: 5 })],
          },
        },
      });

      useGameStore.getState().removeTile(10, 10);

      expect(getPendingTiles()).toHaveLength(1);
    });
  });

  describe('recallAllTiles', () => {
    it('should clear all pending tiles', () => {
      const state = useGameStore.getState();
      useGameStore.setState({
        gameStates: {
          ...state.gameStates,
          [TEST_GAME_ULID]: {
            ...state.gameStates[TEST_GAME_ULID]!,
            pendingTiles: [
              mockPendingTile({ x: 5, y: 5 }),
              mockPendingTile({ x: 6, y: 5 }),
            ],
          },
        },
      });

      useGameStore.getState().recallAllTiles();

      expect(getPendingTiles()).toHaveLength(0);
    });

    it('should clear validation result', () => {
      const state = useGameStore.getState();
      useGameStore.setState({
        gameStates: {
          ...state.gameStates,
          [TEST_GAME_ULID]: {
            ...state.gameStates[TEST_GAME_ULID]!,
            pendingTiles: [mockPendingTile()],
          },
        },
        validationResult: mockValidationResponse(),
      });

      useGameStore.getState().recallAllTiles();

      expect(useGameStore.getState().validationResult).toBeNull();
    });
  });

  describe('clearPendingTiles', () => {
    it('should clear pending tiles and reset rack permutation', () => {
      const state = useGameStore.getState();
      useGameStore.setState({
        gameStates: {
          ...state.gameStates,
          [TEST_GAME_ULID]: {
            pendingTiles: [mockPendingTile()],
            rackPermutation: [6, 5, 4, 3, 2, 1, 0],
          },
        },
        validationResult: mockValidationResponse(),
      });

      useGameStore.getState().clearPendingTiles();

      expect(getPendingTiles()).toHaveLength(0);
      expect(getRackPermutation()).toEqual([0, 1, 2, 3, 4, 5, 6]);
      expect(useGameStore.getState().validationResult).toBeNull();
    });
  });

  describe('clearGameState', () => {
    it('should remove game state for specified game', () => {
      useGameStore.getState().clearGameState(TEST_GAME_ULID);

      const state = useGameStore.getState();
      expect(state.gameStates[TEST_GAME_ULID]).toBeUndefined();
    });
  });

  describe('setSelectedRackIndex', () => {
    it('should set selected rack index', () => {
      useGameStore.getState().setSelectedRackIndex(3);

      expect(useGameStore.getState().selectedRackIndex).toBe(3);
    });

    it('should allow clearing selection with null', () => {
      useGameStore.setState({ selectedRackIndex: 3 });

      useGameStore.getState().setSelectedRackIndex(null);

      expect(useGameStore.getState().selectedRackIndex).toBeNull();
    });
  });

  describe('swapRackSlots', () => {
    it('should swap two slots correctly', () => {
      useGameStore.getState().swapRackSlots(0, 6);

      const rackPermutation = getRackPermutation();
      expect(rackPermutation[0]).toBe(6);
      expect(rackPermutation[6]).toBe(0);
    });

    it('should swap correctly at boundaries', () => {
      useGameStore.getState().swapRackSlots(0, 6);

      const perm = getRackPermutation();
      expect(perm[0]).toBe(6);
      expect(perm[6]).toBe(0);
      // Middle should be unchanged
      expect(perm[3]).toBe(3);
    });

    it('should handle swapping same slot (no-op)', () => {
      useGameStore.getState().swapRackSlots(3, 3);

      expect(getRackPermutation()[3]).toBe(3);
    });

    it('should handle multiple swaps', () => {
      useGameStore.getState().swapRackSlots(0, 1);
      useGameStore.getState().swapRackSlots(1, 2);

      const perm = getRackPermutation();
      expect(perm[0]).toBe(1);
      expect(perm[1]).toBe(2);
      expect(perm[2]).toBe(0);
    });
  });

  describe('shuffleRack', () => {
    it('should shuffle rack permutation', () => {
      const originalPerm = [...getRackPermutation()];

      // Shuffle multiple times to ensure at least one is different
      let shuffled = false;
      for (let i = 0; i < 10; i++) {
        useGameStore.getState().shuffleRack();
        const newPerm = getRackPermutation();
        if (JSON.stringify(newPerm) !== JSON.stringify(originalPerm)) {
          shuffled = true;
          break;
        }
        // Reset for next attempt
        const state = useGameStore.getState();
        useGameStore.setState({
          gameStates: {
            ...state.gameStates,
            [TEST_GAME_ULID]: {
              ...state.gameStates[TEST_GAME_ULID]!,
              rackPermutation: [...originalPerm],
            },
          },
        });
      }

      expect(shuffled).toBe(true);
    });

    it('should only shuffle filled indices when provided', () => {
      const filledIndices = [0, 1, 2];

      useGameStore.getState().shuffleRack(filledIndices);

      const perm = getRackPermutation();
      // Empty indices (3,4,5,6) should be at the end
      const emptyPortion = perm.slice(3);
      expect(emptyPortion).toEqual(expect.arrayContaining([3, 4, 5, 6]));
    });

    it('should preserve all indices when shuffling', () => {
      useGameStore.getState().shuffleRack();

      const perm = getRackPermutation();
      const sorted = [...perm].sort((a, b) => a - b);
      expect(sorted).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });
  });

  describe('resetRackPermutation', () => {
    it('should reset to default permutation', () => {
      const state = useGameStore.getState();
      useGameStore.setState({
        gameStates: {
          ...state.gameStates,
          [TEST_GAME_ULID]: {
            ...state.gameStates[TEST_GAME_ULID]!,
            rackPermutation: [6, 5, 4, 3, 2, 1, 0],
          },
        },
      });

      useGameStore.getState().resetRackPermutation();

      expect(getRackPermutation()).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });
  });

  describe('setValidationResult', () => {
    it('should set validation result', () => {
      const validation = mockValidationResponse();

      useGameStore.getState().setValidationResult(validation);

      expect(useGameStore.getState().validationResult).toEqual(validation);
    });

    it('should allow clearing validation with null', () => {
      useGameStore.setState({ validationResult: mockValidationResponse() });

      useGameStore.getState().setValidationResult(null);

      expect(useGameStore.getState().validationResult).toBeNull();
    });
  });

  describe('swap mode', () => {
    describe('enterSwapMode', () => {
      it('should enter swap mode and clear previous state', () => {
        useGameStore.setState({
          swappedTileIndices: [1, 2],
          swapCompleted: true,
        });

        useGameStore.getState().enterSwapMode();

        const state = useGameStore.getState();
        expect(state.isSwapMode).toBe(true);
        expect(state.selectedSwapIndices).toEqual([]);
        expect(state.swapCompleted).toBe(false);
        expect(state.swappedTileIndices).toEqual([]);
      });
    });

    describe('exitSwapMode', () => {
      it('should exit swap mode and clear all swap state', () => {
        useGameStore.setState({
          isSwapMode: true,
          selectedSwapIndices: [1, 2],
          swapCompleted: true,
          swappedTileIndices: [1, 2],
        });

        useGameStore.getState().exitSwapMode();

        const state = useGameStore.getState();
        expect(state.isSwapMode).toBe(false);
        expect(state.selectedSwapIndices).toEqual([]);
        expect(state.swapCompleted).toBe(false);
        expect(state.swappedTileIndices).toEqual([]);
      });
    });

    describe('toggleSwapTile', () => {
      it('should add tile to selection', () => {
        useGameStore.setState({ isSwapMode: true });

        useGameStore.getState().toggleSwapTile(2);

        expect(useGameStore.getState().selectedSwapIndices).toEqual([2]);
      });

      it('should remove tile from selection if already selected', () => {
        useGameStore.setState({
          isSwapMode: true,
          selectedSwapIndices: [2],
        });

        useGameStore.getState().toggleSwapTile(2);

        expect(useGameStore.getState().selectedSwapIndices).toEqual([]);
      });

      it('should allow multiple selections', () => {
        useGameStore.setState({ isSwapMode: true });

        useGameStore.getState().toggleSwapTile(0);
        useGameStore.getState().toggleSwapTile(2);
        useGameStore.getState().toggleSwapTile(4);

        expect(useGameStore.getState().selectedSwapIndices).toEqual([0, 2, 4]);
      });
    });

    describe('clearSwapSelection', () => {
      it('should clear selections without exiting swap mode', () => {
        useGameStore.setState({
          isSwapMode: true,
          selectedSwapIndices: [0, 2, 4],
        });

        useGameStore.getState().clearSwapSelection();

        const state = useGameStore.getState();
        expect(state.isSwapMode).toBe(true);
        expect(state.selectedSwapIndices).toEqual([]);
      });
    });

    describe('completeSwap', () => {
      it('should copy selectedSwapIndices to swappedTileIndices', () => {
        useGameStore.setState({
          isSwapMode: true,
          selectedSwapIndices: [0, 2, 4],
        });

        useGameStore.getState().completeSwap();

        const state = useGameStore.getState();
        expect(state.swapCompleted).toBe(true);
        expect(state.swappedTileIndices).toEqual([0, 2, 4]);
        expect(state.selectedSwapIndices).toEqual([]);
      });
    });

    describe('dismissSwapResult', () => {
      it('should reset all swap state', () => {
        useGameStore.setState({
          isSwapMode: true,
          selectedSwapIndices: [1],
          swapCompleted: true,
          swappedTileIndices: [0, 2, 4],
        });

        useGameStore.getState().dismissSwapResult();

        const state = useGameStore.getState();
        expect(state.isSwapMode).toBe(false);
        expect(state.selectedSwapIndices).toEqual([]);
        expect(state.swapCompleted).toBe(false);
        expect(state.swappedTileIndices).toEqual([]);
      });
    });
  });
});
