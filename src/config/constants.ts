// Tile and board dimensions
export const TILE_SIZE = 52;
export const SLOT_COUNT = 7;
export const BOARD_SIZE = 15;
export const GAP = 4;

// Animation
export const ANIMATION_DURATION = 150;
export const SPRING_CONFIG = {
  damping: 50,
  stiffness: 500,
};
// Faster spring for rack-to-rack swaps (more snappy)
export const SPRING_CONFIG_FAST = {
  damping: 100,
  stiffness: 2000,
};

// Interaction
export const CLICK_THRESHOLD = 5; // pixels - movement below this is considered a click

// Spacing scale
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// Border radii
export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
} as const;

// Component dimensions
export const DIMENSIONS = {
  inputHeight: 56,
  buttonHeightSm: 30,
  buttonHeightMd: 40,
  buttonHeightLg: 56,
  headerHeight: 56,
  tabBarHeight: 48,
  avatarSm: 32,
  avatarMd: 48,
  avatarLg: 64,
  iconButton: 44,
  fab: 56,
  // ScoreBar specific
  avatarScoreBar: 28,
  avatarScoreBarContainer: 36,
  // Modal inputs
  modalInputHeight: 48,
} as const;

// Layout constraints
export const LAYOUT = {
  authFormMaxWidth: 500,
  gameControlsMaxWidth: 600,
  contentMaxWidth: 700,
} as const;

// Logo tile sizes
export const LOGO_TILE_SIZES = {
  small: { tile: 24, font: 14 },
  medium: { tile: 28, font: 16 },
  large: { tile: 100, font: 48 },
} as const;
