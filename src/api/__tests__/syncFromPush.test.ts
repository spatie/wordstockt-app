import { queryClient } from '../queryClient';
import { gameKeys } from '../queries/queryKeys';
import { invitationKeys } from '../queries/useInvitations';
import { syncFromPush } from '../syncFromPush';
import { useInvitationStore } from '../../stores/invitationStore';
import type { GameInvitation } from '../../types/invitation';

const invitation = (
  overrides: Partial<GameInvitation> = {}
): GameInvitation => ({
  ulid: 'invitation-1',
  status: 'pending',
  game: { ulid: 'game-1', language: 'en' },
  inviter: {
    ulid: 'inviter-1',
    username: 'massica',
    avatar: null,
    avatarColor: null,
  },
  invitee: { ulid: 'me', username: 'me', avatar: null, avatarColor: null },
  createdAt: new Date().toISOString(),
  ...overrides,
});

const invalidatedKeys = (spy: jest.SpyInstance) =>
  spy.mock.calls.map(([filters]) => filters.queryKey);

describe('syncFromPush', () => {
  let invalidateSpy: jest.SpyInstance;

  beforeEach(() => {
    queryClient.clear();
    useInvitationStore.setState({ pendingInvitation: null });
    invalidateSpy = jest
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue();
    jest.spyOn(queryClient, 'refetchQueries').mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Drop cached queries so their garbage collection timers don't keep Jest alive
    queryClient.clear();
  });

  it('refreshes the game, its move history and the lists for a game push', async () => {
    await syncFromPush({ game_ulid: 'game-1' });

    expect(invalidatedKeys(invalidateSpy)).toEqual(
      expect.arrayContaining([
        gameKeys.lists(),
        gameKeys.detail('game-1'),
        gameKeys.moveHistory('game-1'),
        invitationKeys.lists(),
      ])
    );
  });

  it('only refreshes the lists when the push is not about a game', async () => {
    await syncFromPush({});

    expect(invalidatedKeys(invalidateSpy)).toEqual([
      gameKeys.lists(),
      invitationKeys.lists(),
    ]);
  });

  it('shows the invitation dialog for an invitation push', async () => {
    queryClient.setQueryData(invitationKeys.lists(), [
      invitation({ ulid: 'other', game: { ulid: 'game-2', language: 'en' } }),
      invitation(),
    ]);

    await syncFromPush({ type: 'invitation', game_ulid: 'game-1' });

    expect(queryClient.refetchQueries).toHaveBeenCalledWith({
      queryKey: invitationKeys.lists(),
    });
    expect(useInvitationStore.getState().pendingInvitation?.ulid).toBe(
      'invitation-1'
    );
  });

  it('does not show a dialog for an invitation that is no longer pending', async () => {
    queryClient.setQueryData(invitationKeys.lists(), [
      invitation({ status: 'declined' }),
    ]);

    await syncFromPush({ type: 'invitation', game_ulid: 'game-1' });

    expect(useInvitationStore.getState().pendingInvitation).toBeNull();
  });
});
