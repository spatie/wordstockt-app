import { withAlpha } from '../color';

describe('withAlpha', () => {
  it('converts a six digit hex color to rgba', () => {
    expect(withAlpha('#4A90D9', 0.2)).toBe('rgba(74, 144, 217, 0.2)');
  });

  it('expands three digit hex colors', () => {
    expect(withAlpha('#FFF', 0.5)).toBe('rgba(255, 255, 255, 0.5)');
  });

  it('replaces the alpha of an rgba color', () => {
    expect(withAlpha('rgba(27, 40, 56, 0.5)', 0)).toBe('rgba(27, 40, 56, 0)');
  });

  it('returns transparent for colors it cannot parse', () => {
    expect(withAlpha('transparent', 0.4)).toBe('transparent');
  });
});
