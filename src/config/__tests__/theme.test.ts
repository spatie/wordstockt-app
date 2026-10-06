import {
  appearances,
  getMultiplierColors,
  isLightAppearance,
  palettes,
} from '../theme';
import { APPEARANCE_NAMES } from '../../stores/appearanceStore';

const newThemes = [
  'library',
  'arcade',
  'terracotta',
  'monochrome',
  'classic',
  'ember',
] as const;

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((index) => {
    const value = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}

function contrast(first: string, second: string): number {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}

it('offers exactly twelve named themes', () => {
  expect(APPEARANCE_NAMES).toHaveLength(12);
  expect(new Set(APPEARANCE_NAMES).size).toBe(12);
  expect(Object.keys(palettes).sort()).toEqual([...APPEARANCE_NAMES].sort());
  expect(Object.keys(appearances).sort()).toEqual([...APPEARANCE_NAMES].sort());
});

it.each(newThemes)(
  '%s keeps text, buttons, and rack tiles readable',
  (name) => {
    const palette = palettes[name];
    expect(
      contrast(palette.textPrimary, palette.backgroundLight)
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(palette.textSecondary, palette.backgroundLight)
    ).toBeGreaterThanOrEqual(4.5);
    expect(contrast(palette.onPrimary, palette.primary)).toBeGreaterThanOrEqual(
      4.5
    );
    expect(
      contrast('#1A1A1A', palette.tileClassicBackground)
    ).toBeGreaterThanOrEqual(4.5);
  }
);

it('uses readable grayscale bonus squares for Monochrome', () => {
  const colors = getMultiplierColors('monochrome');
  expect(Object.keys(colors)).toHaveLength(5);
  for (const color of Object.values(colors)) {
    expect(contrast('#FFFFFF', color)).toBeGreaterThanOrEqual(4.5);
  }
  expect(isLightAppearance('monochrome')).toBe(true);
});

it('uses readable red and blue bonus squares for Classic', () => {
  const colors = getMultiplierColors('classic');
  expect(Object.keys(colors)).toHaveLength(5);
  for (const color of Object.values(colors)) {
    expect(contrast('#FFFFFF', color)).toBeGreaterThanOrEqual(4.5);
  }
  expect(isLightAppearance('classic')).toBe(true);
});
