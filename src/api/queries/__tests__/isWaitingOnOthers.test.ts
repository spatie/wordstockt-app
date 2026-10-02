import { isWaitingOnOthers } from '../useGame';
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
