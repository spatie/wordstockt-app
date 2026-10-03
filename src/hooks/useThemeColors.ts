import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { isLightAppearance, palettes, type ThemeColors } from '../config/theme';
import { useAppearanceStore } from '../stores/appearanceStore';

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

export function useThemeColors(): ThemeColors {
  const appearance = useAppearanceStore((state) => state.appearance);

  return palettes[appearance];
}

export function useIsLightAppearance(): boolean {
  const appearance = useAppearanceStore((state) => state.appearance);

  return isLightAppearance(appearance);
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
