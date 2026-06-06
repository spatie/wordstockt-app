import { colors } from '@/config/theme';

export const TILE_LETTERS = [
  'W',
  'O',
  'R',
  'D',
  'S',
  'T',
  'C',
  'K',
  'A',
  'E',
  'I',
  'N',
  'L',
  'P',
  'M',
];
export const TILE_COLORS = [colors.primary, '#E85D4C', '#F5A623']; // blue, red, orange like the logo

export interface TileConfig {
  delay: number;
  startX: number;
  startY: number;
  size: number;
  duration: number;
  rotationRange: number;
  scaleRange: [number, number];
  fadeDuration: number;
}

/**
 * Builds the floating tile layout for a given window size.
 *
 * Positions are derived from the passed-in width/height so the layout adapts to
 * rotation, resize and web. Call this with current window dimensions (e.g. from
 * `useWindowDimensions()`) rather than relying on dimensions captured at module load.
 */
export function createTiles(width: number, height: number): TileConfig[] {
  const SCREEN_WIDTH = width;
  const SCREEN_HEIGHT = height;

  return [
    {
      delay: 0,
      startX: SCREEN_WIDTH * 0.02,
      startY: SCREEN_HEIGHT * 0.2,
      size: 28,
      duration: 12000,
      rotationRange: 15,
      scaleRange: [0.9, 1.1] as [number, number],
      fadeDuration: 8000,
    },
    {
      delay: 1500,
      startX: SCREEN_WIDTH * 0.85,
      startY: SCREEN_HEIGHT * 0.15,
      size: 24,
      duration: 14000,
      rotationRange: 20,
      scaleRange: [0.85, 1.15] as [number, number],
      fadeDuration: 6500,
    },
    {
      delay: 3000,
      startX: SCREEN_WIDTH * 0.1,
      startY: SCREEN_HEIGHT * 0.5,
      size: 32,
      duration: 11000,
      rotationRange: 12,
      scaleRange: [0.95, 1.1] as [number, number],
      fadeDuration: 9500,
    },
    {
      delay: 500,
      startX: SCREEN_WIDTH * 0.8,
      startY: SCREEN_HEIGHT * 0.4,
      size: 26,
      duration: 13000,
      rotationRange: 18,
      scaleRange: [0.9, 1.12] as [number, number],
      fadeDuration: 7200,
    },
    {
      delay: 2000,
      startX: SCREEN_WIDTH * 0.5,
      startY: SCREEN_HEIGHT * 0.7,
      size: 30,
      duration: 10000,
      rotationRange: 25,
      scaleRange: [0.88, 1.08] as [number, number],
      fadeDuration: 5800,
    },
    {
      delay: 4000,
      startX: SCREEN_WIDTH * 0.05,
      startY: SCREEN_HEIGHT * 0.75,
      size: 24,
      duration: 15000,
      rotationRange: 10,
      scaleRange: [0.92, 1.1] as [number, number],
      fadeDuration: 10500,
    },
    {
      delay: 2500,
      startX: SCREEN_WIDTH * 0.9,
      startY: SCREEN_HEIGHT * 0.6,
      size: 28,
      duration: 12500,
      rotationRange: 22,
      scaleRange: [0.85, 1.15] as [number, number],
      fadeDuration: 7800,
    },
    {
      delay: 1000,
      startX: SCREEN_WIDTH * 0.35,
      startY: SCREEN_HEIGHT * 0.1,
      size: 22,
      duration: 13500,
      rotationRange: 16,
      scaleRange: [0.9, 1.1] as [number, number],
      fadeDuration: 6200,
    },
    {
      delay: 3500,
      startX: SCREEN_WIDTH * 0.65,
      startY: SCREEN_HEIGHT * 0.8,
      size: 26,
      duration: 11500,
      rotationRange: 14,
      scaleRange: [0.88, 1.12] as [number, number],
      fadeDuration: 8800,
    },
    {
      delay: 800,
      startX: SCREEN_WIDTH * -0.02,
      startY: SCREEN_HEIGHT * 0.38,
      size: 30,
      duration: 14500,
      rotationRange: 20,
      scaleRange: [0.92, 1.08] as [number, number],
      fadeDuration: 11000,
    },
    {
      delay: 4500,
      startX: SCREEN_WIDTH * 0.92,
      startY: SCREEN_HEIGHT * 0.28,
      size: 24,
      duration: 10500,
      rotationRange: 18,
      scaleRange: [0.9, 1.15] as [number, number],
      fadeDuration: 5500,
    },
    {
      delay: 1800,
      startX: SCREEN_WIDTH * 0.45,
      startY: SCREEN_HEIGHT * 0.85,
      size: 28,
      duration: 12000,
      rotationRange: 12,
      scaleRange: [0.85, 1.1] as [number, number],
      fadeDuration: 9000,
    },
    {
      delay: 2800,
      startX: SCREEN_WIDTH * 0.75,
      startY: SCREEN_HEIGHT * 0.05,
      size: 26,
      duration: 13000,
      rotationRange: 24,
      scaleRange: [0.9, 1.12] as [number, number],
      fadeDuration: 7500,
    },
    {
      delay: 600,
      startX: SCREEN_WIDTH * 0.2,
      startY: SCREEN_HEIGHT * 0.65,
      size: 32,
      duration: 11000,
      rotationRange: 15,
      scaleRange: [0.88, 1.08] as [number, number],
      fadeDuration: 6800,
    },
    {
      delay: 3800,
      startX: SCREEN_WIDTH * 0.55,
      startY: SCREEN_HEIGHT * 0.32,
      size: 24,
      duration: 14000,
      rotationRange: 20,
      scaleRange: [0.92, 1.15] as [number, number],
      fadeDuration: 8500,
    },
    {
      delay: 1200,
      startX: SCREEN_WIDTH * 0.03,
      startY: SCREEN_HEIGHT * 0.88,
      size: 28,
      duration: 12500,
      rotationRange: 16,
      scaleRange: [0.85, 1.1] as [number, number],
      fadeDuration: 10000,
    },
    {
      delay: 2200,
      startX: SCREEN_WIDTH * 0.88,
      startY: SCREEN_HEIGHT * 0.72,
      size: 26,
      duration: 13500,
      rotationRange: 22,
      scaleRange: [0.9, 1.12] as [number, number],
      fadeDuration: 6000,
    },
    {
      delay: 4200,
      startX: SCREEN_WIDTH * 0.28,
      startY: SCREEN_HEIGHT * 0.22,
      size: 30,
      duration: 11500,
      rotationRange: 14,
      scaleRange: [0.88, 1.08] as [number, number],
      fadeDuration: 9200,
    },
    {
      delay: 700,
      startX: SCREEN_WIDTH * 0.7,
      startY: SCREEN_HEIGHT * 0.55,
      size: 24,
      duration: 14500,
      rotationRange: 18,
      scaleRange: [0.92, 1.1] as [number, number],
      fadeDuration: 7000,
    },
    {
      delay: 3200,
      startX: SCREEN_WIDTH * 0.15,
      startY: SCREEN_HEIGHT * 0.42,
      size: 28,
      duration: 10500,
      rotationRange: 20,
      scaleRange: [0.9, 1.15] as [number, number],
      fadeDuration: 8200,
    },
  ];
}
