import { act, renderHook } from '@testing-library/react-native';
import { useDragDrop } from '../../context/DragDropContext';
import { mockGame, mockPendingTile, mockTile } from '../../__tests__/utils';
import { useGameStore } from '../../stores/gameStore';
import { useConflictingTilesRecall } from '../useConflictingTilesRecall';
import type { Game } from '../../types';

jest.mock('../../context/DragDropContext', () => ({ useDragDrop: jest.fn() }));

const startRecallAnimation = jest.fn();
const gameUlid = 'source-game';

beforeEach(() => {
  startRecallAnimation.mockReset();
  (useDragDrop as jest.Mock).mockReturnValue({ startRecallAnimation });
  useGameStore.setState({
    currentGameUlid: gameUlid,
    gameStates: {
      [gameUlid]: {
        pendingTiles: [mockPendingTile({ x: 7, y: 7, rackIndex: 0 })],
        rackPermutation: [0, 1, 2, 3, 4, 5, 6],
      },
    },
    validation: null,
    boardKey: null,
    swapPhase: { kind: 'idle' },
  });
});

describe('useConflictingTilesRecall', () => {
  it('recalls a persisted conflict on the first loaded board', async () => {
    const board = mockGame().board;
    board[7]![7] = { ...mockTile(), x: 7, y: 7 };
    await renderHook(() =>
      useConflictingTilesRecall(mockGame({ ulid: gameUlid, board }))
    );

    expect(startRecallAnimation).toHaveBeenCalledTimes(1);
    await act(() => {
      startRecallAnimation.mock.calls[0]![1]();
    });
    expect(useGameStore.getState().gameStates[gameUlid]?.pendingTiles).toEqual(
      []
    );
  });

  it('suppresses repeated recalls and removes only the source game after navigation', async () => {
    const board = mockGame().board;
    board[7]![7] = { ...mockTile(), x: 7, y: 7 };
    const game = mockGame({ ulid: gameUlid, board });
    const { rerender } = await renderHook<void, { currentGame: Game }>(
      ({ currentGame }) => useConflictingTilesRecall(currentGame),
      { initialProps: { currentGame: game } }
    );

    await rerender({
      currentGame: { ...game, board: board.map((row) => [...row]) },
    });
    expect(startRecallAnimation).toHaveBeenCalledTimes(1);

    await act(() => {
      useGameStore.getState().setCurrentGame('other-game');
      useGameStore.getState().placeTile(mockTile({ letter: 'B' }), 8, 8, 1);
      startRecallAnimation.mock.calls[0]![1]();
      startRecallAnimation.mock.calls[0]![2]();
    });

    expect(useGameStore.getState().gameStates[gameUlid]?.pendingTiles).toEqual(
      []
    );
    expect(
      useGameStore.getState().gameStates['other-game']?.pendingTiles
    ).toHaveLength(1);
  });
});
