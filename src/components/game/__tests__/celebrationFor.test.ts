import { celebrationFor } from '../MoveCelebration';

describe('celebrationFor', () => {
  it('celebrates a bingo whatever the score', () => {
    expect(celebrationFor(7, 30, 1)).toEqual({
      id: 1,
      title: 'BINGO!',
      score: 30,
    });
  });

  it('celebrates a big score', () => {
    expect(celebrationFor(3, 52, 2)?.title).toBe('Great move!');
  });

  it('does not celebrate an ordinary move', () => {
    expect(celebrationFor(3, 24, 3)).toBeNull();
  });

  it('does not celebrate without a score', () => {
    expect(celebrationFor(7, undefined, 4)).toBeNull();
  });
});
