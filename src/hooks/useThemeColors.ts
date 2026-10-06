import { useMemo } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import {
  getMultiplierColors,
  isLightAppearance,
  palettes,
  type ThemeColors,
} from '../config/theme';
import {
  useAppearanceStore,
  type AppearanceName,
} from '../stores/appearanceStore';

const stylesheetCache = new WeakMap<
  (colors: ThemeColors) => object,
  WeakMap<ThemeColors, object>
>();

function getThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (colors: ThemeColors) => T,
  colors: ThemeColors
): T {
  let byPalette = stylesheetCache.get(factory);

  if (!byPalette) {
    byPalette = new WeakMap();
    stylesheetCache.set(factory, byPalette);
  }

  let styles = byPalette.get(colors);

  if (!styles) {
    styles = factory(colors);
    byPalette.set(colors, styles);
  }

  return styles as T;
}

// The theme in use: the chosen one, or Paper/Navy when following the system
export function useAppearance(): AppearanceName {
  const appearance = useAppearanceStore((state) => state.appearance);
  const followSystem = useAppearanceStore((state) => state.followSystem);
  const systemScheme = useColorScheme();

  if (!followSystem) {
    return appearance;
  }

  return systemScheme === 'light' ? 'paper' : 'navy';
}

export function useThemeColors(): ThemeColors {
  return palettes[useAppearance()];
}

export function useMultiplierColors() {
  return getMultiplierColors(useAppearance());
}

export function useIsLightAppearance(): boolean {
  return isLightAppearance(useAppearance());
}

export function useThemeBlurTint(): 'light' | 'dark' {
  return useIsLightAppearance() ? 'light' : 'dark';
}

export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (colors: ThemeColors) => T
): T {
  const colors = useThemeColors();

  return useMemo(() => getThemedStyles(factory, colors), [colors, factory]);
}
