import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import LoginScreen from '../(auth)/login';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) =>
    children,
}));

// Mock the useLogin and useGuestLogin hooks
const mockMutate = jest.fn();
const mockGuestMutate = jest.fn();
jest.mock('../../src/api/queries/useAuth', () => ({
  useLogin: () => ({
    mutate: mockMutate,
    isPending: false,
    error: null,
  }),
  useGuestLogin: () => ({
    mutate: mockGuestMutate,
    isPending: false,
    error: null,
  }),
}));

// Mock SafeAreaView
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the login form', () => {
    render(<LoginScreen />);

    expect(screen.getByText('WordStockt')).toBeTruthy();
    expect(screen.getByPlaceholderText('Email or Username')).toBeTruthy();
    expect(screen.getByPlaceholderText('Password')).toBeTruthy();
    expect(screen.getByText('Log In')).toBeTruthy();
  });

  it('disables login button when fields are empty', () => {
    render(<LoginScreen />);

    // Find the button by accessibility role (Pressable renders as accessible button)
    // The login button text's grandparent (Pressable) has the accessibilityState
    const loginButtonText = screen.getByText('Log In');
    // Traverse up to find the element with accessibilityState
    let element = loginButtonText.parent;
    while (element && !element.props.accessibilityState) {
      element = element.parent;
    }
    expect(element?.props.accessibilityState?.disabled).toBe(true);
  });

  it('enables login button when fields are filled', () => {
    render(<LoginScreen />);

    const emailInput = screen.getByPlaceholderText('Email or Username');
    const passwordInput = screen.getByPlaceholderText('Password');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');

    const loginButton = screen.getByText('Log In').parent?.parent;
    expect(loginButton?.props.accessibilityState?.disabled).toBeFalsy();
  });

  it('calls login mutation when form is submitted', () => {
    render(<LoginScreen />);

    const emailInput = screen.getByPlaceholderText('Email or Username');
    const passwordInput = screen.getByPlaceholderText('Password');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');

    const loginButton = screen.getByText('Log In').parent?.parent;
    fireEvent.press(loginButton!);

    expect(mockMutate).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('shows sign up link', () => {
    render(<LoginScreen />);

    expect(screen.getByText("Don't have an account?")).toBeTruthy();
    expect(screen.getByText('Sign Up')).toBeTruthy();
  });

  it('shows forgot password link', () => {
    render(<LoginScreen />);

    expect(screen.getByText('Forgot Password?')).toBeTruthy();
  });
});
