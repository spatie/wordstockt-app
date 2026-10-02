import { mockGame, mockPendingTile, mockTile } from '../../__tests__/utils';
import { getValidationBoardKey, getValidationDraftKey } from '../validationKey';

it('distinguishes a blank letter edit at the same coordinates', () => {
  const tile = mockPendingTile({ x: 7, y: 7, isBlank: true, letter: 'A' });
  expect(getValidationDraftKey([tile])).not.toBe(
    getValidationDraftKey([{ ...tile, letter: 'B' }])
  );
});

it('distinguishes a changed board with the same pending draft', () => {
  const before = mockGame().board;
  const after = before.map((row) => [...row]);
  after[7]![7] = { ...mockTile(), x: 7, y: 7 };
  expect(getValidationBoardKey(before)).not.toBe(getValidationBoardKey(after));
});
