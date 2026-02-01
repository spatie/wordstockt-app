import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react-native';
import { AxiosError } from 'axios';
import ChangePasswordScreen from '../(main)/change-password';

// Mock expo-router
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: jest.fn(),
  }),
}));

// Mock useChangePassword
const mockMutateAsync = jest.fn();
jest.mock('../../src/api/queries/useAuth', () => ({
  useChangePassword: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

// Mock SafeAreaView
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock AppHeader
jest.mock('../../src/components/ui/AppHeader', () => ({
  AppHeader: () => null,
}));

describe('ChangePasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders change password form', () => {
    render(<ChangePasswordScreen />);

    // Title and button both say "Change Password", so use getAllByText
    expect(
      screen.getAllByText('Change Password').length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByPlaceholderText('Current Password')).toBeTruthy();
    expect(screen.getByPlaceholderText('New Password')).toBeTruthy();
    expect(screen.getByPlaceholderText('Confirm New Password')).toBeTruthy();
  });

  it('shows validation error when new password is too short', () => {
    render(<ChangePasswordScreen />);

    const newPasswordInput = screen.getByPlaceholderText('New Password');
    fireEvent.changeText(newPasswordInput, 'short');

    expect(screen.getByText('At least 8 characters')).toBeTruthy();
  });

  it('shows validation error when passwords do not match', () => {
    render(<ChangePasswordScreen />);

    const newPasswordInput = screen.getByPlaceholderText('New Password');
    const confirmPasswordInput = screen.getByPlaceholderText(
      'Confirm New Password'
    );

    fireEvent.changeText(newPasswordInput, 'newpassword123');
    fireEvent.changeText(confirmPasswordInput, 'differentpassword');

    expect(screen.getByText('Passwords do not match')).toBeTruthy();
  });

  it('shows error when new password same as current', () => {
    render(<ChangePasswordScreen />);

    const currentPasswordInput =
      screen.getByPlaceholderText('Current Password');
    const newPasswordInput = screen.getByPlaceholderText('New Password');

    fireEvent.changeText(currentPasswordInput, 'samepassword');
    fireEvent.changeText(newPasswordInput, 'samepassword');

    expect(
      screen.getByText('Must be different from current password')
    ).toBeTruthy();
  });

  it('submits form and navigates back on success', async () => {
    mockMutateAsync.mockResolvedValue({});
    render(<ChangePasswordScreen />);

    const currentPasswordInput =
      screen.getByPlaceholderText('Current Password');
    const newPasswordInput = screen.getByPlaceholderText('New Password');
    const confirmPasswordInput = screen.getByPlaceholderText(
      'Confirm New Password'
    );

    fireEvent.changeText(currentPasswordInput, 'oldpassword123');
    fireEvent.changeText(newPasswordInput, 'newpassword123');
    fireEvent.changeText(confirmPasswordInput, 'newpassword123');

    // Find the button by its text and get the touchable parent
    const buttonText = screen.getAllByText('Change Password')[1]; // Second one is the button text
    const submitButton = buttonText.parent;
    fireEvent.press(submitButton!);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        current_password: 'oldpassword123',
        password: 'newpassword123',
        password_confirmation: 'newpassword123',
      });
    });

    // AnimatedSaveButton calls onSuccess after 800ms delay
    await waitFor(
      () => {
        expect(mockBack).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );
  });

  it('shows API error when change password fails', async () => {
    const axiosError = new AxiosError(
      'Request failed',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        data: { message: 'The current password is incorrect.' },
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: {},
        config: {} as any,
      }
    );

    mockMutateAsync.mockRejectedValue(axiosError);

    render(<ChangePasswordScreen />);

    const currentPasswordInput =
      screen.getByPlaceholderText('Current Password');
    const newPasswordInput = screen.getByPlaceholderText('New Password');
    const confirmPasswordInput = screen.getByPlaceholderText(
      'Confirm New Password'
    );

    fireEvent.changeText(currentPasswordInput, 'wrongpassword');
    fireEvent.changeText(newPasswordInput, 'newpassword123');
    fireEvent.changeText(confirmPasswordInput, 'newpassword123');

    const buttonText = screen.getAllByText('Change Password')[1];
    const submitButton = buttonText.parent;
    fireEvent.press(submitButton!);

    await waitFor(() => {
      expect(
        screen.getByText('The current password is incorrect.')
      ).toBeTruthy();
    });
  });

  it('clears validation hint when password is long enough', () => {
    render(<ChangePasswordScreen />);

    const newPasswordInput = screen.getByPlaceholderText('New Password');

    // First type a short password
    fireEvent.changeText(newPasswordInput, 'short');
    expect(screen.getByText('At least 8 characters')).toBeTruthy();

    // Then type a valid password
    fireEvent.changeText(newPasswordInput, 'validpassword123');
    expect(screen.queryByText('At least 8 characters')).toBeNull();
  });

  it('clears password match error when passwords match', () => {
    render(<ChangePasswordScreen />);

    const newPasswordInput = screen.getByPlaceholderText('New Password');
    const confirmPasswordInput = screen.getByPlaceholderText(
      'Confirm New Password'
    );

    // First enter mismatched passwords
    fireEvent.changeText(newPasswordInput, 'newpassword123');
    fireEvent.changeText(confirmPasswordInput, 'different');
    expect(screen.getByText('Passwords do not match')).toBeTruthy();

    // Then fix the confirmation
    fireEvent.changeText(confirmPasswordInput, 'newpassword123');
    expect(screen.queryByText('Passwords do not match')).toBeNull();
  });
});
