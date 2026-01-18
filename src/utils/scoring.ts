/**
 * Calculate the tiles-played bonus based on how many tiles were placed in a single turn.
 * This matches the backend WordLengthBonusRule.
 */
export function calculateTilesPlayedBonus(tilesPlayed: number): number {
  const bonuses: Record<number, number> = {
    2: 3,
    3: 6,
    4: 12,
    5: 25,
    6: 50,
    7: 100,
  };

  return bonuses[tilesPlayed] ?? 0;
}

/**
 * Get a display label for the tiles-played bonus.
 */
export function getTilesPlayedBonusLabel(tilesPlayed: number): string | null {
  const bonus = calculateTilesPlayedBonus(tilesPlayed);
  if (bonus === 0) return null;
  return `+${bonus}`;
}
