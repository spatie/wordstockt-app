import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { TurnTimer } from '../TurnTimer';

// Mock the timeRemaining utility
jest.mock('../../../utils/timeRemaining', () => ({
  getTimeRemaining: jest.fn((expiresAt: string | null) => {
    if (!expiresAt) return null;
    if (expiresAt.includes('expired')) {
      return {
        hours: 0,
        isUrgent: true,
        isCritical: true,
        displayText: '0h left',
        shortText: '0h left',
      };
    }
    if (expiresAt.includes('critical')) {
      return {
        hours: 0,
        isUrgent: true,
        isCritical: true,
        displayText: '30m',
      };
    }
    if (expiresAt.includes('urgent')) {
      return {
        hours: 2,
        isUrgent: true,
        isCritical: false,
        displayText: '2h',
      };
    }
    if (expiresAt.includes('normal')) {
      return {
        hours: 8,
        isUrgent: false,
        isCritical: false,
        displayText: '8h',
      };
    }
    // Default: more than 10 hours (should not render)
    return {
      hours: 24,
      isUrgent: false,
      isCritical: false,
      displayText: '24h',
    };
  }),
}));

describe('TurnTimer', () => {
  it('renders nothing when expiresAt is null', () => {
    const { toJSON } = render(<TurnTimer expiresAt={null} isMyTurn={true} />);

    expect(toJSON()).toBeNull();
  });

  it('renders with secondary color when not my turn', () => {
    render(<TurnTimer expiresAt="normal" isMyTurn={false} />);

    expect(screen.getByText('8h')).toBeTruthy();
  });

  it('renders nothing when 10 or more hours remain', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    const { toJSON } = render(
      <TurnTimer expiresAt={futureDate} isMyTurn={true} />
    );

    expect(toJSON()).toBeNull();
  });

  it('renders time remaining when less than 10 hours', () => {
    render(<TurnTimer expiresAt="normal" isMyTurn={true} />);

    expect(screen.getByText('8h')).toBeTruthy();
  });

  it('renders urgent time', () => {
    render(<TurnTimer expiresAt="urgent" isMyTurn={true} />);

    expect(screen.getByText('2h')).toBeTruthy();
  });

  it('renders critical time', () => {
    render(<TurnTimer expiresAt="critical" isMyTurn={true} />);

    expect(screen.getByText('30m')).toBeTruthy();
  });

  it('renders 0h left when expired', () => {
    render(<TurnTimer expiresAt="expired" isMyTurn={true} />);

    expect(screen.getByText('0h left')).toBeTruthy();
  });
});
