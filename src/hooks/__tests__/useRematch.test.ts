import { act, renderHook } from '@testing-library/react-native';
import { useCreateGame } from '../../api/queries/useGames';
import { useInvitePlayer } from '../../api/queries/useInvites';
import { mockGame, mockPlayer } from '../../__tests__/utils';
import { useRematch } from '../useRematch';

jest.mock('../../api/queries/useGames', () => ({ useCreateGame: jest.fn() }));
jest.mock('../../api/queries/useInvites', () => ({
  useInvitePlayer: jest.fn(),
}));

const createGame = jest.fn();
const invitePlayer = jest.fn();

beforeEach(() => {
  createGame.mockReset();
  invitePlayer.mockReset();
  (useCreateGame as jest.Mock).mockReturnValue({ mutateAsync: createGame });
  (useInvitePlayer as jest.Mock).mockReturnValue({ mutateAsync: invitePlayer });
});

describe('useRematch', () => {
  it('returns the created game when one multiplayer invitation fails', async () => {
    createGame.mockResolvedValue({ ulid: 'new-game' });
    invitePlayer.mockImplementation(({ userUlid }) =>
      userUlid === 'opponent-2'
        ? Promise.reject(new Error('Invite failed'))
        : Promise.resolve({})
    );
    const game = mockGame({
      players: [
        mockPlayer({ ulid: 'me', username: 'me' }),
        mockPlayer({ ulid: 'opponent-1', username: 'Alice' }),
        mockPlayer({ ulid: 'opponent-2', username: 'Bob' }),
      ],
    });
    const { result } = await renderHook(() =>
      useRematch({ game, opponentUsername: 'Alice', currentUserUlid: 'me' })
    );

    let outcome: Awaited<ReturnType<typeof result.current.createRematch>> =
      null;
    await act(async () => {
      outcome = await result.current.createRematch();
    });

    expect(outcome).toEqual({
      gameUlid: 'new-game',
      failedInvitations: ['Bob'],
    });
    expect(createGame).toHaveBeenCalledTimes(1);
    expect(invitePlayer).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
  });

  it('returns null only when creation fails', async () => {
    createGame.mockRejectedValue(new Error('Create failed'));
    const { result } = await renderHook(() =>
      useRematch({
        game: mockGame(),
        opponentUsername: 'opponent',
        currentUserUlid: '01user',
      })
    );

    let outcome: Awaited<ReturnType<typeof result.current.createRematch>> =
      null;
    await act(async () => {
      outcome = await result.current.createRematch();
    });

    expect(outcome).toBeNull();
    expect(result.current.error).toBe('Create failed');
    expect(invitePlayer).not.toHaveBeenCalled();
  });

  it('keeps the direct two-player invitation in the create request', async () => {
    createGame.mockResolvedValue({ ulid: 'new-game' });
    const { result } = await renderHook(() =>
      useRematch({
        game: mockGame(),
        opponentUsername: 'opponent',
        currentUserUlid: '01user',
      })
    );

    let outcome: Awaited<ReturnType<typeof result.current.createRematch>> =
      null;
    await act(async () => {
      outcome = await result.current.createRematch();
    });

    expect(outcome).toEqual({ gameUlid: 'new-game', failedInvitations: [] });
    expect(createGame).toHaveBeenCalledWith(
      expect.objectContaining({ opponent_username: 'opponent' })
    );
    expect(invitePlayer).not.toHaveBeenCalled();
  });
});
