import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  PixelRatio,
  Platform,
  type LayoutChangeEvent,
} from 'react-native';
import { BOARD_SIZE } from '../../config/constants';
import { useThemeColors } from '../../hooks/useThemeColors';

// Android renders hairlines with artifacts at intersections, so use 1px instead
export const GRID_LINE_WIDTH =
  Platform.OS === 'android' ? 1 : StyleSheet.hairlineWidth;

/**
 * Draws the board's grid lines as one overlay instead of per-cell borders.
 * Cells are a fractional number of points wide, and iOS drops some hairline
 * borders once those edges are rounded to the pixel grid, so whole rows of
 * lines went missing. Here every line is snapped to a physical pixel.
 *
 * Like the old borders, each line sits on the right and bottom edge of a
 * cell, inside the inset that BoardCell keeps free of content.
 */
export function BoardGrid() {
  const colors = useThemeColors();
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null
  );

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  }, []);

  const lines: React.ReactNode[] = [];

  if (size) {
    for (let i = 1; i <= BOARD_SIZE; i++) {
      const x = snapLine((size.width / BOARD_SIZE) * i, size.width);
      const y = snapLine((size.height / BOARD_SIZE) * i, size.height);

      lines.push(
        <View
          key={`v${i}`}
          style={[
            styles.vertical,
            { left: x, backgroundColor: colors.gridLine },
          ]}
        />,
        <View
          key={`h${i}`}
          style={[
            styles.horizontal,
            { top: y, backgroundColor: colors.gridLine },
          ]}
        />
      );
    }
  }

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={handleLayout}
    >
      {lines}
    </View>
  );
}

// Places the line just before a cell edge, on a physical pixel
function snapLine(position: number, max: number): number {
  return (
    Math.min(PixelRatio.roundToNearestPixel(position), max) - GRID_LINE_WIDTH
  );
}

const styles = StyleSheet.create({
  vertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: GRID_LINE_WIDTH,
  },
  horizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: GRID_LINE_WIDTH,
  },
});
