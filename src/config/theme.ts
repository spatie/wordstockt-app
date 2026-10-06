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
  library: {
    background: '#1E1712',
    backgroundLight: '#2C2119',
    boardBackground: '#352719',
    cellBackground: 'rgba(95, 69, 42, 0.55)',
    primary: '#D9B66F',
    onPrimary: '#24170C',
    primaryLight: '#EACB8D',
    secondary: '#634A32',
    tripleWord: '#A5483D',
    doubleLetter: '#497984',
    tileBackground: '#6D5038',
    tilePending: '#3A2B1C',
    tileBorder: '#D9B66F',
    tileText: '#FFF4DA',
    textPrimary: '#F7EAD2',
    textSecondary: '#D6C2A4',
    textMuted: '#A99475',
    border: '#513C2C',
    rackBackground: '#2C2119',
    emptySlot: '#463325',
    emptySlotBorder: '#765A3A',
    buttonPrimary: '#D9B66F',
    buttonSecondary: '#463325',
    tileClassicBackground: '#F6E7C9',
    tileClassicSelected: '#FFE3A9',
    tileShadow: '#D9B66F',
    warning: '#F3B65B',
    warningOverlay: 'rgba(243, 182, 91, 0.2)',
    gameWon: '#3D9A6A',
    gameLost: '#897666',
    onResult: '#FFFFFF',
    cardSurface: 'rgba(44, 33, 25, 0.72)',
    headerSurface: 'rgba(30, 23, 18, 0.6)',
    controlSurface: 'rgba(50, 37, 27, 0.78)',
    controlBorder: 'rgba(217, 182, 111, 0.25)',
    boardOutline: 'rgba(217, 182, 111, 0.5)',
    boardShadow: '#D9B66F',
    gridLine: '#170F0A',
    scoreFooterBackground: 'rgba(0, 0, 0, 0.23)',
    scoreFooterPressed: 'rgba(0, 0, 0, 0.36)',
    tileEdgeLight: '#FFF5DC',
    tileEdgeDark: '#A98B62',
  },
  arcade: {
    background: '#090B16',
    backgroundLight: '#161B2C',
    boardBackground: '#10182A',
    cellBackground: 'rgba(31, 46, 75, 0.65)',
    primary: '#54F0C7',
    onPrimary: '#061712',
    primaryLight: '#87F9DD',
    secondary: '#344466',
    tripleWord: '#E44E78',
    doubleLetter: '#438CCC',
    tileBackground: '#24385C',
    tilePending: '#17243A',
    tileBorder: '#54F0C7',
    tileText: '#F5FFFE',
    textPrimary: '#F4FBFF',
    textSecondary: '#B3C5D9',
    textMuted: '#8298B2',
    border: '#2D405C',
    rackBackground: '#151E32',
    emptySlot: '#263451',
    emptySlotBorder: '#445D7C',
    buttonPrimary: '#54F0C7',
    buttonSecondary: '#263451',
    tileClassicBackground: '#E9FFF9',
    tileClassicSelected: '#BDFCE9',
    tileShadow: '#54F0C7',
    warning: '#FFC45E',
    warningOverlay: 'rgba(255, 196, 94, 0.2)',
    gameWon: '#35B98F',
    gameLost: '#7585A0',
    onResult: '#FFFFFF',
    cardSurface: 'rgba(22, 27, 44, 0.74)',
    headerSurface: 'rgba(9, 11, 22, 0.6)',
    controlSurface: 'rgba(21, 30, 50, 0.78)',
    controlBorder: 'rgba(84, 240, 199, 0.24)',
    boardOutline: 'rgba(84, 240, 199, 0.52)',
    boardShadow: '#54F0C7',
    gridLine: '#060A13',
    scoreFooterBackground: 'rgba(0, 0, 0, 0.25)',
    scoreFooterPressed: 'rgba(0, 0, 0, 0.4)',
    tileEdgeLight: '#FFFFFF',
    tileEdgeDark: '#92C9BF',
  },
  terracotta: {
    background: '#F7E9DA',
    backgroundLight: '#FFF7EB',
    boardBackground: '#D8AC8C',
    cellBackground: '#E9C5A8',
    primary: '#A84931',
    onPrimary: '#FFFFFF',
    primaryLight: '#C96B4B',
    secondary: '#E7B79B',
    tripleWord: '#A74437',
    doubleLetter: '#287A7E',
    tileBackground: '#C8795D',
    tilePending: '#F2D9C7',
    tileBorder: '#A84931',
    tileText: '#2B1813',
    textPrimary: '#2B1D18',
    textSecondary: '#62463D',
    textMuted: '#7B6054',
    border: '#D6B6A0',
    rackBackground: '#F1D8C4',
    emptySlot: '#E6BFA6',
    emptySlotBorder: '#C88F73',
    buttonPrimary: '#A84931',
    buttonSecondary: '#E6BFA6',
    tileClassicBackground: '#FFF9EF',
    tileClassicSelected: '#F9D0AF',
    tileShadow: '#98563B',
    warning: '#8F4C00',
    warningOverlay: 'rgba(143, 76, 0, 0.14)',
    gameWon: '#23704E',
    gameLost: '#715C55',
    onResult: '#FFFFFF',
    cardSurface: '#FFF7EB',
    headerSurface: '#F7E9DA',
    controlSurface: '#FFF7EB',
    controlBorder: '#D6B6A0',
    boardOutline: '#A96C50',
    boardShadow: '#98563B',
    gridLine: '#B98F77',
    scoreFooterBackground: 'rgba(43, 29, 24, 0.06)',
    scoreFooterPressed: 'rgba(43, 29, 24, 0.12)',
    tileEdgeLight: '#FFFFFF',
    tileEdgeDark: '#B99379',
  },
  monochrome: {
    background: '#F0EFEA',
    backgroundLight: '#FFFFFF',
    boardBackground: '#CBCBC7',
    cellBackground: '#E3E3DE',
    primary: '#202020',
    onPrimary: '#FFFFFF',
    primaryLight: '#444444',
    secondary: '#C7C7C2',
    tripleWord: '#444444',
    doubleLetter: '#777777',
    tileBackground: '#252525',
    tilePending: '#DCDCD6',
    tileBorder: '#202020',
    tileText: '#FFFFFF',
    textPrimary: '#151515',
    textSecondary: '#454545',
    textMuted: '#626262',
    border: '#B3B3B0',
    rackBackground: '#E0E0DB',
    emptySlot: '#CDCDC8',
    emptySlotBorder: '#999995',
    buttonPrimary: '#202020',
    buttonSecondary: '#CDCDC8',
    tileClassicBackground: '#FFFFFF',
    tileClassicSelected: '#DADADA',
    tileShadow: '#333333',
    warning: '#555555',
    warningOverlay: 'rgba(85, 85, 85, 0.14)',
    gameWon: '#303030',
    gameLost: '#6A6A6A',
    onResult: '#FFFFFF',
    cardSurface: '#FFFFFF',
    headerSurface: '#F0EFEA',
    controlSurface: '#FFFFFF',
    controlBorder: '#B3B3B0',
    boardOutline: '#555555',
    boardShadow: '#333333',
    gridLine: '#999995',
    scoreFooterBackground: 'rgba(21, 21, 21, 0.06)',
    scoreFooterPressed: 'rgba(21, 21, 21, 0.12)',
    tileEdgeLight: '#FFFFFF',
    tileEdgeDark: '#888888',
  },
  classic: {
    background: '#EAE7D9',
    backgroundLight: '#FFF9EA',
    boardBackground: '#286B63',
    cellBackground: '#4D8C7E',
    primary: '#285E55',
    onPrimary: '#FFFFFF',
    primaryLight: '#3E7F72',
    secondary: '#A9C2A9',
    tripleWord: '#B94246',
    doubleLetter: '#326EA2',
    tileBackground: '#DCC9A0',
    tilePending: '#F3E6C5',
    tileBorder: '#8E7650',
    tileText: '#25271D',
    textPrimary: '#242920',
    textSecondary: '#4A5145',
    textMuted: '#656C60',
    border: '#C6C7AC',
    rackBackground: '#8A6247',
    emptySlot: '#6C4B39',
    emptySlotBorder: '#A47E58',
    buttonPrimary: '#285E55',
    buttonSecondary: '#CBD9C6',
    tileClassicBackground: '#F2E2B9',
    tileClassicSelected: '#FFF0C9',
    tileShadow: '#3A4B36',
    warning: '#9D5A1A',
    warningOverlay: 'rgba(157, 90, 26, 0.14)',
    gameWon: '#28734D',
    gameLost: '#6C7467',
    onResult: '#FFFFFF',
    cardSurface: '#FFF9EA',
    headerSurface: '#EAE7D9',
    controlSurface: '#FFF9EA',
    controlBorder: '#C6C7AC',
    boardOutline: '#8E7650',
    boardShadow: '#3A4B36',
    gridLine: '#275F57',
    scoreFooterBackground: 'rgba(36, 41, 32, 0.06)',
    scoreFooterPressed: 'rgba(36, 41, 32, 0.12)',
    tileEdgeLight: '#FFF2D2',
    tileEdgeDark: '#A58C5F',
  },
  ember: {
    background: '#1B1312',
    backgroundLight: '#2B1D1B',
    boardBackground: '#36211D',
    cellBackground: 'rgba(95, 50, 42, 0.55)',
    primary: '#F29B62',
    onPrimary: '#2A130C',
    primaryLight: '#FFB986',
    secondary: '#744739',
    tripleWord: '#BE5747',
    doubleLetter: '#477E93',
    tileBackground: '#75463A',
    tilePending: '#392622',
    tileBorder: '#F29B62',
    tileText: '#FFF3E8',
    textPrimary: '#FFF3EC',
    textSecondary: '#D8B9A9',
    textMuted: '#AA8D81',
    border: '#5B3931',
    rackBackground: '#2D1D1A',
    emptySlot: '#4A2F2A',
    emptySlotBorder: '#775044',
    buttonPrimary: '#F29B62',
    buttonSecondary: '#4A2F2A',
    tileClassicBackground: '#F5E4D0',
    tileClassicSelected: '#FFD7AF',
    tileShadow: '#F29B62',
    warning: '#FFD06E',
    warningOverlay: 'rgba(255, 208, 110, 0.2)',
    gameWon: '#3DA775',
    gameLost: '#90746C',
    onResult: '#FFFFFF',
    cardSurface: 'rgba(43, 29, 27, 0.74)',
    headerSurface: 'rgba(27, 19, 18, 0.6)',
    controlSurface: 'rgba(50, 32, 28, 0.78)',
    controlBorder: 'rgba(242, 155, 98, 0.25)',
    boardOutline: 'rgba(242, 155, 98, 0.5)',
    boardShadow: '#F29B62',
    gridLine: '#170C0A',
    scoreFooterBackground: 'rgba(0, 0, 0, 0.23)',
    scoreFooterPressed: 'rgba(0, 0, 0, 0.36)',
    tileEdgeLight: '#FFF4E5',
    tileEdgeDark: '#AA806B',
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
  library: { label: 'Library', isLight: false },
  arcade: { label: 'Arcade', isLight: false },
  terracotta: { label: 'Terracotta', isLight: true },
  monochrome: { label: 'Monochrome', isLight: true },
  classic: { label: 'Classic', isLight: true },
  ember: { label: 'Ember', isLight: false },
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

const MONOCHROME_MULTIPLIER_COLORS: Record<
  keyof typeof MULTIPLIER_COLORS,
  string
> = {
  '3W': '#242424',
  '2W': '#555555',
  '3L': '#383838',
  '2L': '#686868',
  STAR: '#444444',
};

const CLASSIC_MULTIPLIER_COLORS: Record<
  keyof typeof MULTIPLIER_COLORS,
  string
> = {
  '3W': '#B94246',
  '2W': '#9B4D65',
  '3L': '#255AA2',
  '2L': '#3E78A8',
  STAR: '#8F4E66',
};

export function getMultiplierColors(appearance: AppearanceName) {
  if (appearance === 'monochrome') {
    return MONOCHROME_MULTIPLIER_COLORS;
  }
  if (appearance === 'classic') {
    return CLASSIC_MULTIPLIER_COLORS;
  }
  return MULTIPLIER_COLORS;
}

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
