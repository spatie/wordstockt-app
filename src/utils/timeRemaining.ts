export interface TimeRemainingResult {
  hours: number;
  isExpired: boolean;
  isUrgent: boolean; // < 4 hours
  isCritical: boolean; // < 1 hour
  displayText: string;
  shortText: string;
}

export function getTimeRemaining(
  expiresAt: string | null
): TimeRemainingResult | null {
  if (!expiresAt) {
    return null;
  }

  const expiryDate = new Date(expiresAt);
  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMs <= 0) {
    return {
      hours: 0,
      isExpired: true,
      isUrgent: true,
      isCritical: true,
      displayText: 'Expired',
      shortText: 'Expired',
    };
  }

  const isUrgent = diffHours < 4;
  const isCritical = diffHours < 1;

  const shortText = diffHours < 1 ? '<1h left' : `${diffHours}h left`;
  const displayText =
    diffHours < 1
      ? '<1h left to make the next move'
      : `${diffHours}h left to make the next move`;

  return {
    hours: diffHours,
    isExpired: false,
    isUrgent,
    isCritical,
    displayText,
    shortText,
  };
}

export function formatTimeRemaining(expiresAt: string | null): string {
  const result = getTimeRemaining(expiresAt);
  return result?.displayText ?? '';
}
