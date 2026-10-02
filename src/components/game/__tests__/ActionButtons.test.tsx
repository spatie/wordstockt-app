import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ActionButtons } from '../ActionButtons';

describe('ActionButtons', () => {
  const defaultProps = {
    onRecall: jest.fn(),
    onPass: jest.fn(),
    onPlay: jest.fn(),
    onMix: jest.fn(),
    onSwap: jest.fn(),
    onResign: jest.fn(),
    onDictionary: jest.fn(),
    canPlay: true,
    isLoading: false,
    disabled: false,
    isMyTurn: true,
    pendingScore: 0,
    hasPendingTiles: false,
  };

  const chooseFromMore = async (event: string) => {
    await fireEvent(screen.getByTestId('more-actions'), 'pressAction', {
      nativeEvent: { event },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows Shuffle, Swap, More and Play', async () => {
    await render(<ActionButtons {...defaultProps} />);

    expect(screen.getByText('Shuffle')).toBeTruthy();
    expect(screen.getByText('Swap')).toBeTruthy();
    expect(screen.getByText('More')).toBeTruthy();
    expect(screen.getByText('PLAY')).toBeTruthy();
  });

  it('shows Recall instead of Shuffle once tiles are placed', async () => {
    await render(<ActionButtons {...defaultProps} hasPendingTiles={true} />);

    expect(screen.queryByText('Shuffle')).toBeNull();
    await fireEvent.press(screen.getByText('Recall'));

    expect(defaultProps.onRecall).toHaveBeenCalled();
  });

  it('calls onMix when Shuffle is pressed', async () => {
    await render(<ActionButtons {...defaultProps} />);

    await fireEvent.press(screen.getByText('Shuffle'));

    expect(defaultProps.onMix).toHaveBeenCalled();
  });

  it('calls onSwap when Swap is pressed', async () => {
    await render(<ActionButtons {...defaultProps} />);

    await fireEvent.press(screen.getByText('Swap'));

    expect(defaultProps.onSwap).toHaveBeenCalled();
  });

  it('passes, opens the dictionary and resigns from the More menu', async () => {
    await render(<ActionButtons {...defaultProps} />);

    await chooseFromMore('pass');
    await chooseFromMore('dictionary');
    await chooseFromMore('resign');

    expect(defaultProps.onPass).toHaveBeenCalled();
    expect(defaultProps.onDictionary).toHaveBeenCalled();
    expect(defaultProps.onResign).toHaveBeenCalled();
  });

  it('disables Pass in the More menu when it is not my turn', async () => {
    await render(<ActionButtons {...defaultProps} isMyTurn={false} />);

    const passAction = screen
      .getByTestId('more-actions')
      .props.actions.find((action: { id: string }) => action.id === 'pass');

    expect(passAction.attributes.disabled).toBe(true);
  });

  it('calls onPlay when Play button is pressed', async () => {
    await render(<ActionButtons {...defaultProps} />);

    await fireEvent.press(screen.getByText('PLAY'));

    expect(defaultProps.onPlay).toHaveBeenCalled();
  });

  it('disables buttons when disabled prop is true', async () => {
    await render(<ActionButtons {...defaultProps} disabled={true} />);

    await fireEvent.press(screen.getByText('Shuffle'));
    await fireEvent.press(screen.getByText('PLAY'));

    expect(defaultProps.onMix).not.toHaveBeenCalled();
    expect(defaultProps.onPlay).not.toHaveBeenCalled();
  });

  it('disables Play button when canPlay is false', async () => {
    await render(<ActionButtons {...defaultProps} canPlay={false} />);

    await fireEvent.press(screen.getByText('PLAY'));

    expect(defaultProps.onPlay).not.toHaveBeenCalled();
  });

  it('disables Swap when not my turn', async () => {
    await render(<ActionButtons {...defaultProps} isMyTurn={false} />);

    await fireEvent.press(screen.getByText('Swap'));

    expect(defaultProps.onSwap).not.toHaveBeenCalled();
  });

  it('disables Swap when no handler is available', async () => {
    const { onSwap: _onSwap, ...props } = defaultProps;
    await render(<ActionButtons {...props} />);

    expect(
      screen.getByRole('button', { name: 'Swap' }).props.accessibilityState
        ?.disabled
    ).toBe(true);
  });

  it('shows loading indicator when isLoading is true', async () => {
    await render(<ActionButtons {...defaultProps} isLoading={true} />);

    // Play text should not be visible when loading
    expect(screen.queryByText('PLAY')).toBeNull();
  });

  it('shows pending score badge when pendingScore > 0', async () => {
    await render(<ActionButtons {...defaultProps} pendingScore={25} />);

    expect(screen.getByText('25')).toBeTruthy();
  });

  it('does not show score badge when pendingScore is 0', async () => {
    await render(<ActionButtons {...defaultProps} pendingScore={0} />);

    expect(screen.queryByText('0')).toBeNull();
  });

  it('Shuffle remains enabled when not my turn', async () => {
    await render(<ActionButtons {...defaultProps} isMyTurn={false} />);

    await fireEvent.press(screen.getByText('Shuffle'));

    expect(defaultProps.onMix).toHaveBeenCalled();
  });
});
