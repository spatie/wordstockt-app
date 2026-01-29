import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { colors } from '../../config/theme';
import type { EloHistoryEntry } from '../../types';

const screenWidth = Dimensions.get('window').width;

interface EloHistoryCardProps {
  eloHistory: EloHistoryEntry[];
  currentElo: number;
}

export function EloHistoryCard({
  eloHistory,
  currentElo,
}: EloHistoryCardProps) {
  const [showAll, setShowAll] = useState(false);

  if (eloHistory.length < 2) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>ELO HISTORY</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Play more games to see your ELO progression
          </Text>
        </View>
      </View>
    );
  }

  const dataToShow = showAll ? eloHistory : eloHistory.slice(0, 30);
  const chartData = dataToShow
    .slice()
    .reverse()
    .map((entry, index) => ({
      value: entry.eloAfter,
      label: index % 5 === 0 ? `${index + 1}` : '',
      dataPointText: '',
    }));

  const minElo = Math.min(...chartData.map((d) => d.value)) - 20;
  const maxElo = Math.max(...chartData.map((d) => d.value)) + 20;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ELO HISTORY</Text>
        <View style={styles.toggleContainer}>
          <Pressable
            onPress={() => setShowAll(false)}
            style={({ pressed }) => [
              styles.toggleButton,
              !showAll && styles.toggleButtonActive,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text
              style={[styles.toggleText, !showAll && styles.toggleTextActive]}
            >
              Recent
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setShowAll(true)}
            style={({ pressed }) => [
              styles.toggleButton,
              showAll && styles.toggleButtonActive,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text
              style={[styles.toggleText, showAll && styles.toggleTextActive]}
            >
              All
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={screenWidth - 80}
          height={180}
          color={colors.primary}
          dataPointsColor={colors.primary}
          startFillColor={colors.primary}
          endFillColor={colors.background}
          areaChart
          curved
          thickness={2}
          startOpacity={0.3}
          endOpacity={0.05}
          yAxisOffset={minElo}
          maxValue={maxElo - minElo}
          noOfSections={4}
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          hideRules
          yAxisColor={colors.border}
          xAxisColor={colors.border}
          pointerConfig={{
            pointerStripColor: colors.primary,
            pointerStripWidth: 2,
            pointerColor: colors.primary,
            radius: 6,
            pointerLabelWidth: 80,
            pointerLabelHeight: 40,
            pointerLabelComponent: (items: { value: number }[]) => {
              const item = items[0];
              if (!item) return null;
              return (
                <View style={styles.pointerLabel}>
                  <Text style={styles.pointerText}>
                    {Math.round(item.value + minElo)}
                  </Text>
                </View>
              );
            },
          }}
          formatYLabel={(value) =>
            Math.round(Number(value) + minElo).toString()
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  toggleTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
  },
  axisText: {
    color: colors.textMuted,
    fontSize: 10,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  pointerLabel: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pointerText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 12,
  },
});
