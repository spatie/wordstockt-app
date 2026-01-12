import { getTimeRemaining, formatTimeRemaining } from '../timeRemaining';

describe('getTimeRemaining', () => {
  it('returns null for null input', () => {
    expect(getTimeRemaining(null)).toBeNull();
  });

  it('returns expired for past dates', () => {
    const pastDate = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    const result = getTimeRemaining(pastDate);

    expect(result?.isExpired).toBe(true);
    expect(result?.displayText).toBe('Expired');
  });

  it('returns critical and urgent for less than 1 hour', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 30).toISOString();
    const result = getTimeRemaining(futureDate);

    expect(result?.isCritical).toBe(true);
    expect(result?.isUrgent).toBe(true);
  });

  it('returns urgent but not critical for 1-4 hours', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString();
    const result = getTimeRemaining(futureDate);

    expect(result?.isCritical).toBe(false);
    expect(result?.isUrgent).toBe(true);
  });

  it('returns neither urgent nor critical for more than 4 hours', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    const result = getTimeRemaining(futureDate);

    expect(result?.isCritical).toBe(false);
    expect(result?.isUrgent).toBe(false);
  });

  it('formats hours correctly', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString();
    const result = getTimeRemaining(futureDate);

    expect(result?.displayText).toBe('12h');
  });

  it('formats days and hours correctly', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 50).toISOString();
    const result = getTimeRemaining(futureDate);

    expect(result?.displayText).toBe('2d 2h');
  });

  it('formats minutes when less than an hour', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 45).toISOString();
    const result = getTimeRemaining(futureDate);

    expect(result?.displayText).toBe('45m');
  });

  it('formats days only when no remaining hours', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString();
    const result = getTimeRemaining(futureDate);

    expect(result?.displayText).toBe('2d');
  });

  it('returns zero hours when expired', () => {
    const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString();
    const result = getTimeRemaining(pastDate);

    expect(result?.hours).toBe(0);
  });
});

describe('formatTimeRemaining', () => {
  it('returns empty string for null', () => {
    expect(formatTimeRemaining(null)).toBe('');
  });

  it('returns formatted text for valid date', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    expect(formatTimeRemaining(futureDate)).toBe('24h');
  });

  it('returns Expired for past date', () => {
    const pastDate = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    expect(formatTimeRemaining(pastDate)).toBe('Expired');
  });
});
