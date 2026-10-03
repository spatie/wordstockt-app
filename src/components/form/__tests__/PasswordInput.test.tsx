import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PasswordInput } from '../PasswordInput';

describe('PasswordInput', () => {
  const defaultProps = {
    value: '',
    onChangeText: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default placeholder', async () => {
    await render(<PasswordInput {...defaultProps} />);

    expect(screen.getByPlaceholderText('Password')).toBeTruthy();
  });

  it('renders with custom placeholder', async () => {
    await render(
      <PasswordInput {...defaultProps} placeholder="Enter your password" />
    );

    expect(screen.getByPlaceholderText('Enter your password')).toBeTruthy();
  });

  it('hides password (secureTextEntry)', async () => {
    await render(<PasswordInput {...defaultProps} value="secret123" />);

    const input = screen.getByDisplayValue('secret123');
    expect(input.props.secureTextEntry).toBe(true);
  });

  it('calls onChangeText when text changes', async () => {
    const onChangeText = jest.fn();
    await render(
      <PasswordInput {...defaultProps} onChangeText={onChangeText} />
    );

    const input = screen.getByPlaceholderText('Password');
    await fireEvent.changeText(input, 'newpassword');

    expect(onChangeText).toHaveBeenCalledWith('newpassword');
  });

  it('displays error message when error prop is provided', async () => {
    await render(
      <PasswordInput {...defaultProps} error="Password is too short" />
    );

    expect(screen.getByText('Password is too short')).toBeTruthy();
  });

  it('renders with value', async () => {
    await render(<PasswordInput {...defaultProps} value="mypassword" />);

    expect(screen.getByDisplayValue('mypassword')).toBeTruthy();
  });
});
