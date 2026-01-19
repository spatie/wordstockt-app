import { getTimeRemaining, formatTimeRemaining } from '../timeRemaining';

describe('getTimeRemaining', () => {
  it('returns null for null input', () => {
    expect(getTimeRemaining(null)).toBeNull();
  });

  it('returns 0h left for past dates', () => {
    const pastDate = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    const result = getTimeRemaining(pastDate);

    expect(result?.hours).toBe(0);
    expect(result?.shortText).toBe('0h left');
    expect(result?.isCritical).toBe(true);
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

    expect(result?.displayText).toBe('12h left to make the next move');
    expect(result?.shortText).toBe('12h left');
  });

  it('formats many hours correctly', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 50).toISOString();
    const result = getTimeRemaining(futureDate);

    expect(result?.displayText).toBe('50h left to make the next move');
    expect(result?.shortText).toBe('50h left');
  });

  it('formats less than an hour correctly', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 45).toISOString();
    const result = getTimeRemaining(futureDate);

    expect(result?.displayText).toBe('<1h left to make the next move');
    expect(result?.shortText).toBe('<1h left');
  });

  it('formats 48 hours correctly', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString();
    const result = getTimeRemaining(futureDate);

    expect(result?.displayText).toBe('48h left to make the next move');
    expect(result?.shortText).toBe('48h left');
  });

  it('returns 0h when expired', () => {
    const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString();
    const result = getTimeRemaining(pastDate);

    expect(result?.hours).toBe(0);
    expect(result?.shortText).toBe('0h left');
  });
});

describe('formatTimeRemaining', () => {
  it('returns empty string for null', () => {
    expect(formatTimeRemaining(null)).toBe('');
  });

  it('returns formatted text for valid date', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    expect(formatTimeRemaining(futureDate)).toBe(
      '24h left to make the next move'
    );
  });

  it('returns 0h left for past date', () => {
    const pastDate = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    expect(formatTimeRemaining(pastDate)).toBe('0h left to make the next move');
  });
});
