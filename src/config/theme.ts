import { MD3DarkTheme } from 'react-native-paper';

// Dark navy theme colors
export const colors = {
  // Background colors
  background: '#0D1B2A', // Main dark navy background
  backgroundLight: '#1B2838', // Slightly lighter for cards/sections
  boardBackground: '#1B2838', // Board container background
  cellBackground: 'rgba(44, 62, 80, 0.5)', // Empty cell background (semi-transparent)

  // Accent colors
  primary: '#4A90D9', // Blue accent color
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
} as const;

export const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    secondaryContainer: colors.primary, // Selected state for SegmentedButtons
    onSecondaryContainer: colors.textPrimary, // Text on selected SegmentedButtons
    error: '#E91E63',
    surface: colors.backgroundLight,
    background: colors.background,
  },
};

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
