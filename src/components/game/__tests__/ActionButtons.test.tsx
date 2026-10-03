import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ActionButtons } from '../ActionButtons';

describe('ActionButtons', () => {
  const defaultProps = {
    onRecall: jest.fn(),
    onPass: jest.fn(),
    onPlay: jest.fn(),
    onMix: jest.fn(),
    canPlay: true,
    isLoading: false,
    disabled: false,
    isMyTurn: true,
    pendingScore: 0,
    hasPendingTiles: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all action buttons', async () => {
    await render(<ActionButtons {...defaultProps} />);

    expect(screen.getByText('Mix')).toBeTruthy();
    expect(screen.getByText('Pass')).toBeTruthy();
    expect(screen.getByText('Recall')).toBeTruthy();
    expect(screen.getByText('PLAY')).toBeTruthy();
  });

  it('calls onMix when Mix button is pressed', async () => {
    await render(<ActionButtons {...defaultProps} />);

    await fireEvent.press(screen.getByText('Mix'));

    expect(defaultProps.onMix).toHaveBeenCalled();
  });

  it('calls onPass when Pass button is pressed', async () => {
    await render(<ActionButtons {...defaultProps} />);

    await fireEvent.press(screen.getByText('Pass'));

    expect(defaultProps.onPass).toHaveBeenCalled();
  });

  it('calls onRecall when Recall button is pressed', async () => {
    await render(<ActionButtons {...defaultProps} hasPendingTiles={true} />);

    await fireEvent.press(screen.getByText('Recall'));

    expect(defaultProps.onRecall).toHaveBeenCalled();
  });

  it('calls onPlay when Play button is pressed', async () => {
    await render(<ActionButtons {...defaultProps} />);

    await fireEvent.press(screen.getByText('PLAY'));

    expect(defaultProps.onPlay).toHaveBeenCalled();
  });

  it('disables all buttons when disabled prop is true', async () => {
    await render(<ActionButtons {...defaultProps} disabled={true} />);

    await fireEvent.press(screen.getByText('Mix'));
    await fireEvent.press(screen.getByText('Recall'));
    await fireEvent.press(screen.getByText('PLAY'));

    expect(defaultProps.onMix).not.toHaveBeenCalled();
    expect(defaultProps.onRecall).not.toHaveBeenCalled();
    expect(defaultProps.onPlay).not.toHaveBeenCalled();
  });

  it('disables Play button when canPlay is false', async () => {
    await render(<ActionButtons {...defaultProps} canPlay={false} />);

    await fireEvent.press(screen.getByText('PLAY'));

    expect(defaultProps.onPlay).not.toHaveBeenCalled();
  });

  it('disables Pass button when not my turn', async () => {
    await render(<ActionButtons {...defaultProps} isMyTurn={false} />);

    await fireEvent.press(screen.getByText('Pass'));

    expect(defaultProps.onPass).not.toHaveBeenCalled();
  });

  it('disables Recall button when no pending tiles', async () => {
    await render(<ActionButtons {...defaultProps} hasPendingTiles={false} />);

    await fireEvent.press(screen.getByText('Recall'));

    expect(defaultProps.onRecall).not.toHaveBeenCalled();
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

  it('Mix remains enabled when not my turn', async () => {
    await render(<ActionButtons {...defaultProps} isMyTurn={false} />);

    await fireEvent.press(screen.getByText('Mix'));

    expect(defaultProps.onMix).toHaveBeenCalled();
  });
});
