import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { WinCelebration } from '../WinCelebration';
import { haptics } from '../../../utils/haptics';

jest.mock('../../../utils/haptics', () => ({
  haptics: { success: jest.fn() },
}));

describe('WinCelebration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the final score and celebrates when a win becomes visible', async () => {
    const onDismiss = jest.fn();
    await render(<WinCelebration visible score={362} onDismiss={onDismiss} />);

    expect(screen.getByText('You won!')).toBeTruthy();
    expect(screen.getByText('362')).toBeTruthy();
    expect(screen.getByText('Continue')).toBeTruthy();
    expect(haptics.success).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByText('Continue'));
    await waitFor(() => expect(onDismiss).toHaveBeenCalledTimes(1));
  });

  it('does not celebrate while hidden', async () => {
    await render(
      <WinCelebration visible={false} score={362} onDismiss={jest.fn()} />
    );

    expect(haptics.success).not.toHaveBeenCalled();
  });
});
