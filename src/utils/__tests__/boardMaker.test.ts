import {
  BOARD_MAKER_LIMITS,
  createEmptyBoardTemplate,
  cycleBoardCell,
  getBoardTemplateCounts,
  randomizeBoardTemplate,
} from '../boardMaker';

describe('board maker operations', () => {
  it('recounts each destination after switching from asymmetric to symmetric editing', () => {
    const empty = createEmptyBoardTemplate();
    const asymmetric = cycleBoardCell(empty, 0, 0, false);
    const symmetric = cycleBoardCell(asymmetric, 0, 0, true);

    expect(getBoardTemplateCounts(asymmetric)['2L']).toBe(1);
    expect(getBoardTemplateCounts(symmetric)).toEqual({
      '2L': 0,
      '3L': 4,
      '2W': 0,
      '3W': 0,
    });
    expect(symmetric[0]?.[0]).toBe('3L');
    expect(symmetric[0]?.[14]).toBe('3L');
    expect(symmetric[14]?.[0]).toBe('3L');
    expect(symmetric[14]?.[14]).toBe('3L');
    expect(empty[0]?.[0]).toBeNull();
  });

  it('skips a bonus type when a symmetric edit would exceed its limit', () => {
    const template = createEmptyBoardTemplate();
    let placed = 0;
    for (let y = 0; y < 15 && placed < 27; y++) {
      for (let x = 0; x < 15 && placed < 27; x++) {
        if ((x === 0 || x === 14) && (y === 0 || y === 14)) continue;
        if (x === 7 && y === 7) continue;
        template[y]![x] = '2L';
        placed++;
      }
    }

    const updated = cycleBoardCell(template, 0, 0, true);
    const counts = getBoardTemplateCounts(updated);

    expect(counts['2L']).toBe(27);
    expect(counts['3L']).toBe(4);
    expect(updated[7]?.[7]).toBe('STAR');
  });

  it.each([true, false])(
    'randomization respects every limit with symmetry %s',
    (symmetryEnabled) => {
      const template = randomizeBoardTemplate(symmetryEnabled);
      const counts = getBoardTemplateCounts(template);

      expect(template[7]?.[7]).toBe('STAR');
      for (const type of Object.keys(
        BOARD_MAKER_LIMITS
      ) as (keyof typeof BOARD_MAKER_LIMITS)[]) {
        expect(counts[type]).toBeLessThanOrEqual(BOARD_MAKER_LIMITS[type]);
      }
    }
  );
});
