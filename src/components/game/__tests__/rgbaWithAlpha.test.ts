import { rgbaWithAlpha } from '../ScoreBar';

describe('rgbaWithAlpha', () => {
  it('never serializes the alpha in scientific notation (the Reanimated crash)', () => {
    // This exact value crashed Reanimated: "rgba(74, 144, 217, 3.386623966701304e-7)".
    const result = rgbaWithAlpha(74, 144, 217, 3.386623966701304e-7);

    expect(result).toBe('rgba(74, 144, 217, 0.000)');
    expect(result).not.toContain('e');
  });

  it('formats normal alpha values to three decimals', () => {
    expect(rgbaWithAlpha(74, 144, 217, 0.2)).toBe('rgba(74, 144, 217, 0.200)');
    expect(rgbaWithAlpha(76, 175, 80, 0.6)).toBe('rgba(76, 175, 80, 0.600)');
    expect(rgbaWithAlpha(0, 0, 0, 1)).toBe('rgba(0, 0, 0, 1.000)');
  });

  it('produces a parseable string across a fading alpha range', () => {
    for (let i = 0; i <= 20; i++) {
      const alpha = (0.2 * i) / 20; // 0 .. 0.2, including tiny near-zero steps
      const result = rgbaWithAlpha(74, 144, 217, alpha * 1e-6 + alpha);
      expect(result).not.toMatch(/e/i);
    }
  });
});
