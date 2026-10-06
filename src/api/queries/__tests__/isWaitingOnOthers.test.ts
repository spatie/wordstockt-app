import { AxiosError } from 'axios';
import { isWaitingOnOthers, shouldRetryGameRequest } from '../useGame';
import { mockGame } from '../../../__tests__/utils';

describe('isWaitingOnOthers', () => {
  it('is waiting while it is an opponent’s turn', () => {
    const game = mockGame({
      status: 'active',
      currentTurnUserUlid: 'opponent',
    });

    expect(isWaitingOnOthers(game, 'me')).toBe(true);
  });

  it('is not waiting on your own turn', () => {
    const game = mockGame({ status: 'active', currentTurnUserUlid: 'me' });

    expect(isWaitingOnOthers(game, 'me')).toBe(false);
  });

  it('is waiting while a game waits for players to join', () => {
    expect(isWaitingOnOthers(mockGame({ status: 'pending' }), 'me')).toBe(true);
  });

  it('is not waiting once a game is finished', () => {
    const game = mockGame({ status: 'finished', currentTurnUserUlid: null });

    expect(isWaitingOnOthers(game, 'me')).toBe(false);
  });

  it('is not waiting without a game or a user', () => {
    expect(isWaitingOnOthers(undefined, 'me')).toBe(false);
    expect(isWaitingOnOthers(mockGame(), undefined)).toBe(false);
  });
});

describe('shouldRetryGameRequest', () => {
  it('stops immediately when a game is inaccessible', () => {
    const error = new AxiosError('Forbidden');
    error.response = { status: 403 } as AxiosError['response'];

    expect(shouldRetryGameRequest(0, error)).toBe(false);
  });

  it('retries a temporary server error twice', () => {
    const error = new AxiosError('Server error');
    error.response = { status: 500 } as AxiosError['response'];

    expect(shouldRetryGameRequest(0, error)).toBe(true);
    expect(shouldRetryGameRequest(2, error)).toBe(false);
  });
});
