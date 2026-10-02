import { act, renderHook } from '@testing-library/react-native';
import {
  useSubmitMove,
  usePassTurn,
  useSwapTiles,
  useResignGame,
} from '../../api/queries/useGame';
import { mockPendingTile, mockTile } from '../../__tests__/utils';
import { useGameStore } from '../../stores/gameStore';
import { useGameActions } from '../useGameActions';

jest.mock('../../api/queries/useGame', () => ({
  useSubmitMove: jest.fn(),
  usePassTurn: jest.fn(),
  useSwapTiles: jest.fn(),
  useResignGame: jest.fn(),
}));
jest.mock('../useApiError', () => ({
  useApiError: () => ({
    errorMessage: null,
    setError: jest.fn(),
    setErrorMessage: jest.fn(),
    clearError: jest.fn(),
  }),
}));

const submitMove = jest.fn();
const passTurn = jest.fn();
const swapTiles = jest.fn();
const resignGame = jest.fn();

beforeEach(() => {
  submitMove.mockReset();
  passTurn.mockReset();
  swapTiles.mockReset();
  resignGame.mockReset();
  (useSubmitMove as jest.Mock).mockReturnValue({ mutateAsync: submitMove });
  (usePassTurn as jest.Mock).mockReturnValue({ mutateAsync: passTurn });
  (useSwapTiles as jest.Mock).mockReturnValue({ mutateAsync: swapTiles });
  (useResignGame as jest.Mock).mockReturnValue({ mutateAsync: resignGame });
  useGameStore.setState({
    currentGameUlid: 'first-game',
    gameStates: {
      'first-game': {
        pendingTiles: [mockPendingTile({ x: 7, y: 7 })],
        rackPermutation: [0, 1, 2, 3, 4, 5, 6],
      },
    },
    swapPhase: { kind: 'idle' },
    validation: null,
  });
});

it('does not clear the newly viewed game when play resolves after navigation', async () => {
  let resolveMove!: (value: {
    move: { words: string[]; score: number };
  }) => void;
  submitMove.mockReturnValue(
    new Promise((resolve) => {
      resolveMove = resolve;
    })
  );
  const { result } = await renderHook(() =>
    useGameActions({
      gameUlid: 'first-game',
      pendingTiles:
        useGameStore.getState().gameStates['first-game']!.pendingTiles,
      canPlay: true,
      myRack: [mockTile()],
    })
  );

  let playPromise!: ReturnType<typeof result.current.handlePlay>;
  await act(() => {
    playPromise = result.current.handlePlay();
    useGameStore.getState().setCurrentGame('second-game');
    useGameStore.getState().placeTile(mockTile({ letter: 'B' }), 8, 8, 0);
  });
  await act(async () => {
    resolveMove({ move: { words: ['TEST'], score: 10 } });
    await playPromise;
  });

  expect(submitMove).toHaveBeenCalledWith({
    gameUlid: 'first-game',
    tiles: expect.any(Array),
  });
  expect(
    useGameStore.getState().gameStates['first-game']?.pendingTiles
  ).toEqual([]);
  expect(
    useGameStore.getState().gameStates['second-game']?.pendingTiles
  ).toHaveLength(1);
});

it('completes the submitted swap only while its game is active', async () => {
  swapTiles.mockResolvedValue({});
  useGameStore.getState().enterSwapMode();
  useGameStore.getState().toggleSwapTile(0);
  const { result } = await renderHook(() =>
    useGameActions({
      gameUlid: 'first-game',
      pendingTiles:
        useGameStore.getState().gameStates['first-game']!.pendingTiles,
      canPlay: false,
      myRack: [mockTile()],
    })
  );

  await act(async () => {
    await result.current.handleSwap();
  });

  expect(useGameStore.getState().swapPhase).toEqual({
    kind: 'completed',
    indices: [0],
  });
});
