import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { Switch } from 'react-native-paper';
import { BoardMakerCell } from './BoardMakerCell';
import { Button } from '../ui/Button';
import { useBoardMakerStore } from '../../stores/boardMakerStore';
import { colors, MULTIPLIER_COLORS } from '../../config/theme';
import { BOARD_SIZE, SPACING } from '../../config/constants';
import type { SquareType } from '../../types/game';

interface BoardMakerProps {
  onAccept: (template: SquareType[][]) => void;
  onCancel: () => void;
}

const SQUARE_TYPE_ORDER = ['2L', '3L', '2W', '3W'] as const;

export function BoardMaker({ onAccept, onCancel }: BoardMakerProps) {
  const { width: windowWidth } = useWindowDimensions();
  const {
    template,
    symmetryEnabled,
    initialize,
    cycleCell,
    setSymmetry,
    randomize,
    clear,
    getTemplate,
    getCounts,
    getLimits,
  } = useBoardMakerStore();

  const [isAnimating, setIsAnimating] = useState(false);
  const boardOpacity = useRef(new Animated.Value(1)).current;
  const boardScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    initialize();
  }, [initialize]);

  const counts = getCounts();
  const limits = getLimits();

  const boardSize = Math.min(windowWidth - SPACING.lg * 2, 400);
  const cellGap = 2;
  const cellSize = (boardSize - cellGap * (BOARD_SIZE - 1)) / BOARD_SIZE;

  const animateAction = useCallback(
    (action: () => void) => {
      setIsAnimating(true);

      // Shrink and fade out
      Animated.parallel([
        Animated.timing(boardOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(boardScale, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Run action while hidden
        action();

        // Wait for React to re-render with new state before animating back
        requestAnimationFrame(() => {
          Animated.parallel([
            Animated.timing(boardOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.spring(boardScale, {
              toValue: 1,
              tension: 100,
              friction: 8,
              useNativeDriver: true,
            }),
          ]).start(() => setIsAnimating(false));
        });
      });
    },
    [boardOpacity, boardScale]
  );

  const handleClear = useCallback(() => {
    animateAction(clear);
  }, [animateAction, clear]);

  const handleRandomize = useCallback(() => {
    animateAction(randomize);
  }, [animateAction, randomize]);

  const handleAccept = () => {
    onAccept(getTemplate());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Design Your Board</Text>

      <View style={styles.countsRow}>
        {SQUARE_TYPE_ORDER.map((type) => (
          <View key={type} style={styles.countBadge}>
            <View
              style={[
                styles.countDot,
                { backgroundColor: MULTIPLIER_COLORS[type] },
              ]}
            />
            <Text style={styles.countText}>
              {type}: {limits[type] - counts[type]}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.helpText}>
        Tap cells to cycle through bonus types
      </Text>

      <Animated.View
        style={[
          styles.board,
          { width: boardSize, height: boardSize },
          { opacity: boardOpacity, transform: [{ scale: boardScale }] },
        ]}
      >
        {template.map((row, y) => (
          <View key={y} style={[styles.row, { gap: cellGap }]}>
            {row.map((cell, x) => (
              <BoardMakerCell
                key={`${x}-${y}`}
                squareType={cell}
                size={cellSize}
                onPress={() => cycleCell(x, y)}
                disabled={cell === 'STAR' || isAnimating}
              />
            ))}
          </View>
        ))}
      </Animated.View>

      <View style={styles.controls}>
        <View style={styles.symmetryRow}>
          <Text style={styles.symmetryLabel}>4-way Symmetry</Text>
          <Switch
            value={symmetryEnabled}
            onValueChange={setSymmetry}
            color={colors.primary}
          />
        </View>

        <View style={styles.buttonRow}>
          <Button
            label="Clear"
            onPress={handleClear}
            variant="secondary"
            size="sm"
            style={styles.controlButton}
            disabled={isAnimating}
          />
          <Button
            label="Randomize"
            onPress={handleRandomize}
            variant="secondary"
            size="sm"
            style={styles.controlButton}
            disabled={isAnimating}
          />
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          label="Cancel"
          onPress={onCancel}
          variant="secondary"
          style={styles.actionButton}
        />
        <Button
          label="Accept"
          onPress={handleAccept}
          style={styles.actionButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: SPACING.md,
  },
  countsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 4,
  },
  countText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  helpText: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: SPACING.md,
  },
  board: {
    backgroundColor: colors.boardBackground,
    padding: 4,
    borderRadius: 4,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
  },
  controls: {
    width: '100%',
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  symmetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  symmetryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  controlButton: {
    minWidth: 100,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xl,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    maxWidth: 150,
  },
});
