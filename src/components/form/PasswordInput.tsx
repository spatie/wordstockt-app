import React from 'react';
import { FormInput } from './FormInput';

interface PasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  autoComplete?: 'password' | 'new-password';
}

export function PasswordInput({
  value,
  onChangeText,
  placeholder = 'Password',
  error,
  autoComplete = 'password',
}: PasswordInputProps) {
  return (
    <FormInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry
      autoCapitalize="none"
      autoComplete={autoComplete}
      error={error}
    />
  );
}
