import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { FormInput } from '../FormInput';

describe('FormInput', () => {
  it('renders with placeholder', () => {
    render(<FormInput placeholder="Enter email" />);

    expect(screen.getByPlaceholderText('Enter email')).toBeTruthy();
  });

  it('renders with value', () => {
    render(<FormInput value="test@example.com" />);

    expect(screen.getByDisplayValue('test@example.com')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const onChangeText = jest.fn();
    render(<FormInput placeholder="Email" onChangeText={onChangeText} />);

    const input = screen.getByPlaceholderText('Email');
    fireEvent.changeText(input, 'new value');

    expect(onChangeText).toHaveBeenCalledWith('new value');
  });

  it('displays error message when error prop is provided', () => {
    render(<FormInput error="Email is required" />);

    expect(screen.getByText('Email is required')).toBeTruthy();
  });

  it('does not display error when error prop is not provided', () => {
    render(<FormInput placeholder="Email" />);

    expect(screen.queryByText(/error/i)).toBeNull();
  });

  it('renders right element when provided', () => {
    render(
      <FormInput
        placeholder="Password"
        rightElement={<Text testID="right-element">Show</Text>}
      />
    );

    expect(screen.getByTestId('right-element')).toBeTruthy();
  });

  it('passes through additional TextInput props', () => {
    render(
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
