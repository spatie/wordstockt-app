import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { FormInput } from '../FormInput';

describe('FormInput', () => {
  it('renders with placeholder', async () => {
    await render(<FormInput placeholder="Enter email" />);

    expect(screen.getByPlaceholderText('Enter email')).toBeTruthy();
  });

  it('renders with value', async () => {
    await render(<FormInput value="test@example.com" />);

    expect(screen.getByDisplayValue('test@example.com')).toBeTruthy();
  });

  it('calls onChangeText when text changes', async () => {
    const onChangeText = jest.fn();
    await render(<FormInput placeholder="Email" onChangeText={onChangeText} />);

    const input = screen.getByPlaceholderText('Email');
    await fireEvent.changeText(input, 'new value');

    expect(onChangeText).toHaveBeenCalledWith('new value');
  });

  it('displays error message when error prop is provided', async () => {
    await render(<FormInput error="Email is required" />);

    expect(screen.getByText('Email is required')).toBeTruthy();
  });

  it('does not display error when error prop is not provided', async () => {
    await render(<FormInput placeholder="Email" />);

    expect(screen.queryByText(/error/i)).toBeNull();
  });

  it('renders right element when provided', async () => {
    await render(
      <FormInput
        placeholder="Password"
        rightElement={<Text testID="right-element">Show</Text>}
      />
    );

    expect(screen.getByTestId('right-element')).toBeTruthy();
  });

  it('passes through additional TextInput props', async () => {
    await render(
      <FormInput
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        testID="email-input"
      />
    );

    const input = screen.getByTestId('email-input');
    expect(input).toBeTruthy();
  });
});
