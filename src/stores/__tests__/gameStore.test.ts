import { useGameStore } from '../gameStore';
import {
  mockTile,
  mockPendingTile,
  mockValidationResponse,
} from '../../__tests__/utils';
import { getValidationDraftKey } from '../../utils/validationKey';

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
      boardKey: 'board-v1',
      validation: null,
      swapPhase: { kind: 'idle' },
      isRackDragging: false,
      blankTileSelection: null,
    });
  });

  describe('setCurrentGame', () => {
    it('should set current game and reset transient state', () => {
      useGameStore.setState({
        swapPhase: { kind: 'selecting', indices: [1, 2] },
      });

      useGameStore.getState().setCurrentGame('new-game-456');

      const state = useGameStore.getState();
      expect(state.currentGameUlid).toBe('new-game-456');
      expect(state.swapPhase).toEqual({ kind: 'idle' });
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
      const pendingTiles = [mockPendingTile()];
      const state = useGameStore.getState();
      useGameStore.setState({
        gameStates: {
          ...state.gameStates,
          [TEST_GAME_ULID]: {
            ...state.gameStates[TEST_GAME_ULID]!,
            pendingTiles,
          },
        },
        validation: {
          gameUlid: TEST_GAME_ULID,
          draftKey: getValidationDraftKey(pendingTiles),
          boardKey: 'board-v1',
          result: mockValidationResponse(),
        },
      });

      useGameStore.getState().recallAllTiles();

      expect(useGameStore.getState().validation).toBeNull();
    });
  });

  describe('clearPendingTiles', () => {
    it('should clear pending tiles and reset rack permutation', () => {
      const pendingTiles = [mockPendingTile()];
      const state = useGameStore.getState();
      useGameStore.setState({
        gameStates: {
          ...state.gameStates,
          [TEST_GAME_ULID]: {
            pendingTiles,
            rackPermutation: [6, 5, 4, 3, 2, 1, 0],
          },
        },
        validation: {
          gameUlid: TEST_GAME_ULID,
          draftKey: getValidationDraftKey(pendingTiles),
          boardKey: 'board-v1',
          result: mockValidationResponse(),
        },
      });

      useGameStore
        .getState()
        .clearPendingTiles(TEST_GAME_ULID, getValidationDraftKey(pendingTiles));

      expect(getPendingTiles()).toHaveLength(0);
      expect(getRackPermutation()).toEqual([0, 1, 2, 3, 4, 5, 6]);
      expect(useGameStore.getState().validation).toBeNull();
    });

    it('clears only the submitted game after navigation', () => {
      const submittedTile = mockPendingTile({ x: 7, y: 7 });
      useGameStore.getState().placeTile(submittedTile, 7, 7, 0);
      const submittedDraftKey = getValidationDraftKey(getPendingTiles());

      useGameStore.getState().setCurrentGame('other-game');
      useGameStore.getState().placeTile(mockTile({ letter: 'B' }), 8, 8, 1);
      useGameStore
        .getState()
        .clearPendingTiles(TEST_GAME_ULID, submittedDraftKey);

      expect(
        useGameStore.getState().gameStates[TEST_GAME_ULID]?.pendingTiles
      ).toEqual([]);
      expect(
        useGameStore.getState().gameStates['other-game']?.pendingTiles
      ).toHaveLength(1);
    });

    it('preserves edits made while the request was in flight', () => {
      useGameStore.getState().placeTile(mockTile(), 7, 7, 0);
      const submittedDraftKey = getValidationDraftKey(getPendingTiles());
      useGameStore.getState().updatePendingTileLetter(7, 7, 'Z');

      useGameStore
        .getState()
        .clearPendingTiles(TEST_GAME_ULID, submittedDraftKey);

      expect(getPendingTiles()[0]?.letter).toBe('Z');
    });
  });

  describe('removePendingTiles', () => {
    it('removes conflicts from their source game after navigation', () => {
      const conflictingTile = mockPendingTile({ x: 7, y: 7, rackIndex: 0 });
      useGameStore.getState().placeTile(conflictingTile, 7, 7, 0);
      useGameStore.getState().setCurrentGame('other-game');
      useGameStore.getState().placeTile(mockTile({ letter: 'B' }), 8, 8, 1);

      useGameStore
        .getState()
        .removePendingTiles(TEST_GAME_ULID, [conflictingTile]);

      expect(
        useGameStore.getState().gameStates[TEST_GAME_ULID]?.pendingTiles
      ).toEqual([]);
      expect(
        useGameStore.getState().gameStates['other-game']?.pendingTiles
      ).toHaveLength(1);
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

  describe('insertByActualIndex', () => {
    it('shifts tiles left when dragging a tile rightward', () => {
      // perm starts [0,1,2,3,4,5,6]; move tile at slot 1 onto slot 4
      useGameStore.getState().insertByActualIndex(1, 4);

      expect(getRackPermutation()).toEqual([0, 2, 3, 4, 1, 5, 6]);
    });

    it('shifts tiles right when dragging a tile leftward', () => {
      // perm starts [0,1,2,3,4,5,6]; move tile at slot 3 onto slot 1
      useGameStore.getState().insertByActualIndex(3, 1);

      expect(getRackPermutation()).toEqual([0, 3, 1, 2, 4, 5, 6]);
    });

    it('is a no-op when the tile is already at the target slot', () => {
      useGameStore.getState().insertByActualIndex(3, 3);

      expect(getRackPermutation()).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });

    it('locates the tile by actual index, not by slot', () => {
      useGameStore.setState((state) => ({
        gameStates: {
          ...state.gameStates,
          [TEST_GAME_ULID]: {
            ...state.gameStates[TEST_GAME_ULID]!,
            rackPermutation: [6, 5, 4, 3, 2, 1, 0],
          },
        },
      }));

      // Tile with actual index 6 currently sits at slot 0; insert it at slot 2
      useGameStore.getState().insertByActualIndex(6, 2);

      expect(getRackPermutation()).toEqual([5, 4, 6, 3, 2, 1, 0]);
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
    it('accepts validation for the current game, draft, and board', () => {
      const tile = mockTile();
      useGameStore.getState().placeTile(tile, 7, 7, 0);
      const draftKey = getValidationDraftKey(getPendingTiles());
      const validation = mockValidationResponse();

      useGameStore.getState().setValidationResult(validation, {
        gameUlid: TEST_GAME_ULID,
        draftKey,
        boardKey: 'board-v1',
      });

      expect(useGameStore.getState().validation?.result).toEqual(validation);
    });

    it('rejects a late result after the draft or board changes', () => {
      useGameStore.getState().placeTile(mockTile(), 7, 7, 0);
      const draftKey = getValidationDraftKey(getPendingTiles());
      useGameStore.getState().updatePendingTileLetter(7, 7, 'B');
      useGameStore.getState().setValidationResult(mockValidationResponse(), {
        gameUlid: TEST_GAME_ULID,
        draftKey,
        boardKey: 'board-v1',
      });
      expect(useGameStore.getState().validation).toBeNull();

      useGameStore.getState().setBoardKey(TEST_GAME_ULID, 'board-v2');
      useGameStore.getState().setValidationResult(mockValidationResponse(), {
        gameUlid: TEST_GAME_ULID,
        draftKey: getValidationDraftKey(getPendingTiles()),
        boardKey: 'board-v1',
      });
      expect(useGameStore.getState().validation).toBeNull();
    });

    it('rejects a result after switching games', () => {
      useGameStore.getState().setCurrentGame('other-game');
      useGameStore.getState().setValidationResult(mockValidationResponse(), {
        gameUlid: TEST_GAME_ULID,
        draftKey: getValidationDraftKey([]),
        boardKey: 'board-v1',
      });

      expect(useGameStore.getState().validation).toBeNull();
    });
  });

  describe('swap mode', () => {
    it('selects, clears, completes, and dismisses a swap', () => {
      const actions = useGameStore.getState();
      actions.enterSwapMode();
      actions.toggleSwapTile(0);
      actions.toggleSwapTile(2);
      expect(useGameStore.getState().swapPhase).toEqual({
        kind: 'selecting',
        indices: [0, 2],
      });

      actions.clearSwapSelection();
      expect(useGameStore.getState().swapPhase).toEqual({
        kind: 'selecting',
        indices: [],
      });

      actions.toggleSwapTile(2);
      actions.completeSwap(TEST_GAME_ULID, [2]);
      expect(useGameStore.getState().swapPhase).toEqual({
        kind: 'completed',
        indices: [2],
      });

      actions.toggleSwapTile(4);
      actions.clearSwapSelection();
      expect(useGameStore.getState().swapPhase).toEqual({
        kind: 'completed',
        indices: [2],
      });

      actions.dismissSwapResult();
      expect(useGameStore.getState().swapPhase).toEqual({ kind: 'idle' });
    });

    it('rejects completion after switching games or exiting selection', () => {
      const actions = useGameStore.getState();
      actions.enterSwapMode();
      actions.toggleSwapTile(1);
      actions.completeSwap('another-game', [1]);
      expect(useGameStore.getState().swapPhase.kind).toBe('selecting');

      actions.toggleSwapTile(2);
      actions.completeSwap(TEST_GAME_ULID, [1]);
      expect(useGameStore.getState().swapPhase).toEqual({
        kind: 'completed',
        indices: [1],
      });

      actions.exitSwapMode();
      actions.completeSwap(TEST_GAME_ULID, [1, 2]);
      expect(useGameStore.getState().swapPhase).toEqual({ kind: 'idle' });
    });
  });
});
