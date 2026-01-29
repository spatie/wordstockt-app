import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import RegisterScreen from '../(auth)/register';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
  }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock the useRegister hook
const mockMutate = jest.fn();
jest.mock('../../src/api/queries/useAuth', () => ({
  useRegister: () => ({
    mutate: mockMutate,
    isPending: false,
    error: null,
  }),
}));

// Mock SafeAreaView
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the registration form', () => {
    render(<RegisterScreen />);

    // "Create Account" appears as title and button
    expect(screen.getAllByText('Create Account').length).toBe(2);
    expect(
      screen.getByText('Join WordStockt and challenge your friends.')
    ).toBeTruthy();
    expect(screen.getByPlaceholderText('Username')).toBeTruthy();
    expect(screen.getByPlaceholderText('Email')).toBeTruthy();
    expect(screen.getByPlaceholderText('Password')).toBeTruthy();
  });

  it('shows validation error when username is too short', () => {
    render(<RegisterScreen />);

    const usernameInput = screen.getByPlaceholderText('Username');
    fireEvent.changeText(usernameInput, 'ab');

    expect(
      screen.getByText('3-20 characters, letters, numbers, underscore only')
    ).toBeTruthy();
  });

  it('shows validation error for invalid email', () => {
    render(<RegisterScreen />);

    const emailInput = screen.getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, 'invalid');

    expect(screen.getByText('Enter a valid email')).toBeTruthy();
  });

  it('shows validation error when password is too short', () => {
    render(<RegisterScreen />);

    const passwordInput = screen.getByPlaceholderText('Password');
    fireEvent.changeText(passwordInput, 'short');

    expect(screen.getByText('At least 8 characters')).toBeTruthy();
  });

  it('enables submit button when all fields are valid', () => {
    render(<RegisterScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(
      screen.getByPlaceholderText('Email'),
      'test@example.com'
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Password'),
      'password123'
    );

    // No validation errors should be shown
    expect(
      screen.queryByText('3-20 characters, letters, numbers, underscore only')
    ).toBeNull();
    expect(screen.queryByText('Enter a valid email')).toBeNull();
    expect(screen.queryByText('At least 8 characters')).toBeNull();
  });

  it('calls register mutation with correct data when form is submitted', () => {
    render(<RegisterScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(
      screen.getByPlaceholderText('Email'),
      'test@example.com'
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Password'),
      'password123'
    );

    // Find the button with the arrow icon (submit button has → icon)
    const arrowIcon = screen.getByText('→');
    // Press the parent TouchableOpacity
    fireEvent.press(arrowIcon.parent!.parent!);

    expect(mockMutate).toHaveBeenCalledWith({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      password_confirmation: 'password123',
    });
  });

  it('shows sign in link', () => {
    render(<RegisterScreen />);

    expect(screen.getByText('Already have an account?')).toBeTruthy();
    expect(screen.getByText('Sign In')).toBeTruthy();
  });
});
