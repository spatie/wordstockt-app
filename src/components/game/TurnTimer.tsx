import React, { useState, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, theme } from '../../config/theme';
import {
  getTimeRemaining,
  type TimeRemainingResult,
} from '../../utils/timeRemaining';

interface TurnTimerProps {
  expiresAt: string | null;
  isMyTurn: boolean;
  compact?: boolean;
  alwaysShow?: boolean;
}

export function TurnTimer({
  expiresAt,
  isMyTurn,
  compact = false,
  alwaysShow = false,
}: TurnTimerProps) {
  const [timeRemaining, setTimeRemaining] =
    useState<TimeRemainingResult | null>(() => getTimeRemaining(expiresAt));

  useEffect(() => {
    if (!expiresAt) {
      setTimeRemaining(null);
      return;
    }

    // Update immediately
    setTimeRemaining(getTimeRemaining(expiresAt));

    // Update every minute
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(expiresAt));
    }, 60000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Only show when less than 10 hours remain (unless alwaysShow is true)
  if (!timeRemaining || (!alwaysShow && timeRemaining.hours > 10)) {
    return null;
  }

  const getTimerColor = () => {
    // Only show urgent colors when it's my turn
    if (isMyTurn) {
      if (timeRemaining.isCritical) return theme.colors.error;
      if (timeRemaining.isUrgent) return colors.warning;
    }
    return colors.textSecondary;
  };

  return (
    <Text
      style={[
        compact ? styles.compactText : styles.time,
        { color: getTimerColor() },
      ]}
    >
      {compact ? timeRemaining.shortText : timeRemaining.displayText}
    </Text>
  );
}

const styles = StyleSheet.create({
  time: {
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 2,
  },
  compactText: {
    fontSize: 13,
  },
});
