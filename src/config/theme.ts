import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import type { AppearanceName } from '../stores/appearanceStore';

// Dark navy theme colors
export const colors = {
  // Background colors
  background: '#0D1B2A', // Main dark navy background
  backgroundLight: '#1B2838', // Slightly lighter for cards/sections
  boardBackground: '#1B2838', // Board container background
  cellBackground: 'rgba(44, 62, 80, 0.5)', // Empty cell background (semi-transparent)

  // Accent colors
  primary: '#4A90D9', // Blue accent color
  onPrimary: '#FFFFFF', // Text on primary buttons
  primaryLight: '#5BA3EC', // Lighter blue for highlights
  secondary: '#3D5A80', // Secondary blue

  // Multiplier colors
  tripleWord: '#A93226', // Richer maroon for TW
  doubleLetter: '#4A7C9B', // Steel blue for DL

  // Tile colors
  tileBackground: '#3D5A80', // Dark blue tile background
  tilePending: '#1B2838', // Pending tile background
  tileBorder: '#4A90D9', // Blue border for pending tiles
  tileText: '#FFFFFF', // White text on tiles

  // UI colors
  textPrimary: '#FFFFFF',
  textSecondary: '#8B9DC3',
  textMuted: '#5D6D7E',
  border: '#2C3E50',

  // Rack colors
  rackBackground: '#1B2838',
  emptySlot: '#2C3E50',
  emptySlotBorder: '#3D5A80',

  // Button colors
  buttonPrimary: '#4A90D9',
  buttonSecondary: '#2C3E50',

  // Classic tile colors (for rack tiles)
  tileClassicBackground: '#E8E4DC',
  tileClassicSelected: '#D4E4F7',
  tileShadow: '#4A90D9',

  // UI feedback colors
  warning: '#FF9800',
  warningOverlay: 'rgba(255, 193, 7, 0.25)',

  // Game result badges
  gameWon: '#27AE60',
  gameLost: '#7F8C8D',
  onResult: '#FFFFFF',

  // Surfaces layered over the background
  cardSurface: 'rgba(27, 40, 56, 0.5)',
  headerSurface: 'rgba(13, 27, 42, 0.48)',
  controlSurface: 'rgba(26, 35, 47, 0.7)',
  controlBorder: 'rgba(255, 255, 255, 0.22)',

  // Board chrome
  boardOutline: 'rgba(74, 144, 217, 0.5)',
  boardShadow: '#FFFFFF',
  gridLine: '#0D1520',
  scoreFooterBackground: 'rgba(0, 0, 0, 0.2)',
  scoreFooterPressed: 'rgba(0, 0, 0, 0.35)',

  // Bevel on classic tiles
  tileEdgeLight: '#F5F3EF',
  tileEdgeDark: '#B8B4AA',
} as const;

export type ThemeColors = { [Key in keyof typeof colors]: string };

export const palettes: Record<AppearanceName, ThemeColors> = {
  navy: colors,
  forest: {
    background: '#0E1C16',
    backgroundLight: '#182B22',
    boardBackground: '#182B22',
    cellBackground: 'rgba(43, 70, 57, 0.5)',
    primary: '#3FB984',
    onPrimary: '#05140D',
    primaryLight: '#62D29F',
    secondary: '#2D5644',
    tripleWord: '#B5473A',
    doubleLetter: '#3E8A7E',
    tileBackground: '#2D5644',
    tilePending: '#182B22',
    tileBorder: '#3FB984',
    tileText: '#FFFFFF',
    textPrimary: '#F1F7F3',
    textSecondary: '#9DBFAE',
    textMuted: '#6E8D7E',
    border: '#2A4237',
    rackBackground: '#182B22',
    emptySlot: '#2A4237',
    emptySlotBorder: '#2D5644',
    buttonPrimary: '#3FB984',
    buttonSecondary: '#2A4237',
    tileClassicBackground: '#ECE8DE',
    tileClassicSelected: '#D3EEDD',
    tileShadow: '#3FB984',
    warning: '#F2A33A',
    warningOverlay: 'rgba(242, 163, 58, 0.25)',
    gameWon: '#2F9E6A',
    gameLost: '#66796F',
    onResult: '#FFFFFF',
    cardSurface: 'rgba(24, 43, 34, 0.55)',
    headerSurface: 'rgba(14, 28, 22, 0.5)',
    controlSurface: 'rgba(22, 38, 31, 0.7)',
    controlBorder: 'rgba(255, 255, 255, 0.2)',
    boardOutline: 'rgba(63, 185, 132, 0.45)',
    boardShadow: '#FFFFFF',
    gridLine: '#0A1410',
    scoreFooterBackground: 'rgba(0, 0, 0, 0.2)',
    scoreFooterPressed: 'rgba(0, 0, 0, 0.35)',
    tileEdgeLight: '#F5F3EF',
    tileEdgeDark: '#B8B4AA',
  },
  plum: {
    background: '#1A1024',
    backgroundLight: '#291A37',
    boardBackground: '#291A37',
    cellBackground: 'rgba(72, 50, 94, 0.5)',
    primary: '#B07CF0',
    onPrimary: '#1A1024',
    primaryLight: '#C89DF7',
    secondary: '#5A3E78',
    tripleWord: '#C0465A',
    doubleLetter: '#5A7FC0',
    tileBackground: '#5A3E78',
    tilePending: '#291A37',
    tileBorder: '#B07CF0',
    tileText: '#FFFFFF',
    textPrimary: '#F6F0FB',
    textSecondary: '#BDA9D5',
    textMuted: '#8874A3',
    border: '#3D2B52',
    rackBackground: '#291A37',
    emptySlot: '#3D2B52',
    emptySlotBorder: '#5A3E78',
    buttonPrimary: '#B07CF0',
    buttonSecondary: '#3D2B52',
    tileClassicBackground: '#EEE9E2',
    tileClassicSelected: '#E6D6F8',
    tileShadow: '#B07CF0',
    warning: '#FFB547',
    warningOverlay: 'rgba(255, 181, 71, 0.25)',
    gameWon: '#3FA877',
    gameLost: '#7A6D8C',
    onResult: '#FFFFFF',
    cardSurface: 'rgba(41, 26, 55, 0.55)',
    headerSurface: 'rgba(26, 16, 36, 0.5)',
    controlSurface: 'rgba(36, 23, 49, 0.7)',
    controlBorder: 'rgba(255, 255, 255, 0.2)',
    boardOutline: 'rgba(176, 124, 240, 0.45)',
    boardShadow: '#FFFFFF',
    gridLine: '#120A19',
    scoreFooterBackground: 'rgba(0, 0, 0, 0.2)',
    scoreFooterPressed: 'rgba(0, 0, 0, 0.35)',
    tileEdgeLight: '#F5F3EF',
    tileEdgeDark: '#B8B4AA',
  },
  paper: {
    background: '#F5F0E6',
    backgroundLight: '#FFFCF6',
    boardBackground: '#CDB795',
    cellBackground: '#D7C5A8',
    primary: '#985332',
    onPrimary: '#FFFFFF',
    primaryLight: '#B66B43',
    secondary: '#D8BB9A',
    tripleWord: '#A54838',
    doubleLetter: '#477E85',
    tileBackground: '#BF8254',
    tilePending: '#E5DAC7',
    tileBorder: '#985332',
    tileText: '#241B16',
    textPrimary: '#241B16',
    textSecondary: '#594B40',
    textMuted: '#716357',
    border: '#C8B9A5',
    rackBackground: '#E5DAC7',
    emptySlot: '#D4C4AC',
    emptySlotBorder: '#B59C7E',
    buttonPrimary: '#985332',
    buttonSecondary: '#D4C4AC',
    tileClassicBackground: '#FFFCF3',
    tileClassicSelected: '#F2D3AD',
    tileShadow: '#8B6244',
    warning: '#955300',
    warningOverlay: 'rgba(149, 83, 0, 0.14)',
    gameWon: '#276F45',
    gameLost: '#675E54',
    onResult: '#FFFFFF',
    cardSurface: '#FFFCF6',
    headerSurface: '#F5F0E6',
    controlSurface: '#FFFCF6',
    controlBorder: '#C8B9A5',
    boardOutline: '#9C7D58',
    boardShadow: '#8B6244',
    gridLine: '#B09A7C',
    scoreFooterBackground: '#E9DDCA',
    scoreFooterPressed: '#DDCDB6',
    tileEdgeLight: '#FFFEF8',
    tileEdgeDark: '#9C8669',
  },
  sky: {
    background: '#EEF4FA',
    backgroundLight: '#FFFFFF',
    boardBackground: '#DCE7F2',
    cellBackground: '#E8F0F8',
    primary: '#2F6FB5',
    onPrimary: '#FFFFFF',
    primaryLight: '#4A8AD0',
    secondary: '#B8D0E8',
    tripleWord: '#B5473A',
    doubleLetter: '#3E7FA8',
    tileBackground: '#7FA7D1',
    tilePending: '#DCE7F2',
    tileBorder: '#2F6FB5',
    tileText: '#13253A',
    textPrimary: '#13253A',
    textSecondary: '#41566E',
    textMuted: '#5F7287',
    border: '#C3D3E3',
    rackBackground: '#DCE7F2',
    emptySlot: '#C9D8E8',
    emptySlotBorder: '#9DB6CF',
    buttonPrimary: '#2F6FB5',
    buttonSecondary: '#C9D8E8',
    tileClassicBackground: '#FFFDF7',
    tileClassicSelected: '#CFE2F6',
    tileShadow: '#4A6A8C',
    warning: '#9A5A00',
    warningOverlay: 'rgba(154, 90, 0, 0.14)',
    gameWon: '#23784A',
    gameLost: '#5F6B78',
    onResult: '#FFFFFF',
    cardSurface: '#FFFFFF',
    headerSurface: '#EEF4FA',
    controlSurface: '#FFFFFF',
    controlBorder: '#C3D3E3',
    boardOutline: '#C3D3E3',
    boardShadow: '#2A4A6B',
    gridLine: '#9DB3CA',
    scoreFooterBackground: 'rgba(19, 37, 58, 0.05)',
    scoreFooterPressed: 'rgba(19, 37, 58, 0.1)',
    tileEdgeLight: '#FFFFFF',
    tileEdgeDark: '#A3B1C1',
  },
  sage: {
    background: '#EEF2EC',
    backgroundLight: '#FBFCF9',
    boardBackground: '#DCE5D7',
    cellBackground: '#E7EEE3',
    primary: '#3F7552',
    onPrimary: '#FFFFFF',
    primaryLight: '#548E68',
    secondary: '#BFD2C2',
    tripleWord: '#A9493B',
    doubleLetter: '#3F7F86',
    tileBackground: '#8DB09A',
    tilePending: '#DCE5D7',
    tileBorder: '#3F7552',
    tileText: '#1C2A21',
    textPrimary: '#1C2A21',
    textSecondary: '#4A5C50',
    textMuted: '#64756A',
    border: '#C5D3C4',
    rackBackground: '#DCE5D7',
    emptySlot: '#CCD9CA',
    emptySlotBorder: '#A3B8A4',
    buttonPrimary: '#3F7552',
    buttonSecondary: '#CCD9CA',
    tileClassicBackground: '#FFFDF6',
    tileClassicSelected: '#D7E9D9',
    tileShadow: '#56705E',
    warning: '#8F5500',
    warningOverlay: 'rgba(143, 85, 0, 0.14)',
    gameWon: '#2E6B45',
    gameLost: '#66706A',
    onResult: '#FFFFFF',
    cardSurface: '#FBFCF9',
    headerSurface: '#EEF2EC',
    controlSurface: '#FBFCF9',
    controlBorder: '#C5D3C4',
    boardOutline: '#C5D3C4',
    boardShadow: '#2F4A38',
    gridLine: '#9DB09A',
    scoreFooterBackground: 'rgba(28, 42, 33, 0.05)',
    scoreFooterPressed: 'rgba(28, 42, 33, 0.1)',
    tileEdgeLight: '#FFFFFF',
    tileEdgeDark: '#A3B09F',
  },
};

export const appearances: Record<
  AppearanceName,
  { label: string; isLight: boolean }
> = {
  navy: { label: 'Navy', isLight: false },
  forest: { label: 'Forest', isLight: false },
  plum: { label: 'Plum', isLight: false },
  paper: { label: 'Paper', isLight: true },
  sky: { label: 'Sky', isLight: true },
  sage: { label: 'Sage', isLight: true },
};

export function isLightAppearance(appearance: AppearanceName): boolean {
  return appearances[appearance].isLight;
}

export function getPaperTheme(appearance: AppearanceName) {
  const palette = palettes[appearance];
  const base = isLightAppearance(appearance) ? MD3LightTheme : MD3DarkTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: palette.primary,
      secondary: palette.secondary,
      secondaryContainer: palette.primary,
      onSecondaryContainer: palette.onPrimary,
      surface: palette.backgroundLight,
      background: palette.background,
      onSurface: palette.textPrimary,
      onBackground: palette.textPrimary,
    },
  };
}

// Native stacks paint their container with the navigation theme background.
// Keep it transparent so each stack's contentStyle and the glowing background show.
export function getNavigationTheme(appearance: AppearanceName): Theme {
  const palette = palettes[appearance];
  const base = isLightAppearance(appearance) ? DefaultTheme : DarkTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: palette.primary,
      background: 'transparent',
      card: palette.backgroundLight,
      text: palette.textPrimary,
      border: palette.border,
    },
  };
}

export const theme = getPaperTheme('navy');

export const MULTIPLIER_COLORS = {
  '3W': '#C0392B', // Deep crimson for Triple Word
  '2W': '#E67E22', // Carrot orange for Double Word
  '3L': '#1A5276', // Deep navy for Triple Letter
  '2L': '#3498DB', // Bright cerulean for Double Letter
  STAR: '#F39C12', // Golden for center star
} as const;

export const MULTIPLIER_LABELS = {
  '3W': '3W',
  '2W': '2W',
  '3L': '3L',
  '2L': '2L',
  STAR: '★',
} as const;

// Validation state colors for tiles and score display
export const VALIDATION_COLORS = {
  valid: '#2E7D32', // Dark green
  invalid: '#C62828', // Dark red
  placement_error: '#E65100', // Dark orange
  default: '#1A1A1A', // Default tile text color
} as const;

// Highlight overlay colors for placed tiles in formed words
export const HIGHLIGHT_COLORS = {
  valid: 'rgba(46, 125, 50, 0.35)', // Dark green overlay
  invalid: 'rgba(198, 40, 40, 0.35)', // Dark red overlay
} as const;

// Shadow system - consistent elevation levels
export const shadows = {
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
  },
} as const;

// Gradient presets for use with expo-linear-gradient
export const gradients = {
  primary: ['#5EAAF0', '#4088D0'] as const,
  primaryDark: ['#4A90D9', '#3D5A80'] as const,
  success: ['#34D399', '#10B981'] as const,
  danger: ['#F87171', '#EF4444'] as const,
} as const;
