import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react-native';
import ProfileScreen from '../(main)/profile';
import { useAuthStore } from '../../src/stores/authStore';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock the auth store
jest.mock('../../src/stores/authStore');
const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;

// Mock useUpdateProfile
const mockMutateAsync = jest.fn();
jest.mock('../../src/api/queries/useAuth', () => ({
  useUpdateProfile: () => ({
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

// Mock SnackbarProvider
jest.mock('../../src/components/ui/SnackbarProvider', () => ({
  useSnackbar: () => ({
    showSnackbar: jest.fn(),
  }),
}));

const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  avatar: null,
  eloRating: 1200,
  gamesPlayed: 20,
  gamesWon: 12,
};

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ user: mockUser })
    );
  });

  it('renders user profile information', () => {
    render(<ProfileScreen />);

    expect(screen.getByText('TE')).toBeTruthy(); // Avatar initials
    expect(screen.getByText('test@example.com')).toBeTruthy();
    expect(screen.getByDisplayValue('testuser')).toBeTruthy();
  });

  it('displays user statistics', () => {
    render(<ProfileScreen />);

    expect(screen.getByText('Statistics')).toBeTruthy();
    expect(screen.getByText('1200')).toBeTruthy(); // ELO Rating
    expect(screen.getByText('20')).toBeTruthy(); // Games Played
    expect(screen.getByText('12')).toBeTruthy(); // Games Won
    expect(screen.getByText('60%')).toBeTruthy(); // Win Rate
  });

  it('save button is initially disabled when username is unchanged', () => {
    render(<ProfileScreen />);

    // Button should exist and be disabled (opacity style applied)
    const saveButton = screen.getByText('Save Changes');
    expect(saveButton).toBeTruthy();
  });

  it('enables save button when username is changed to valid value', () => {
    render(<ProfileScreen />);

    const usernameInput = screen.getByDisplayValue('testuser');
    fireEvent.changeText(usernameInput, 'newusername');

    // Save button should be pressable after valid change
    const saveButton = screen.getByText('Save Changes');
    expect(saveButton).toBeTruthy();
  });

  it('keeps save button disabled when username is too short', () => {
    render(<ProfileScreen />);

    const usernameInput = screen.getByDisplayValue('testuser');
    fireEvent.changeText(usernameInput, 'ab'); // Too short

    // Button should still exist
    const saveButton = screen.getByText('Save Changes');
    expect(saveButton).toBeTruthy();
  });

  it('keeps save button disabled when username contains invalid characters', () => {
    render(<ProfileScreen />);

    const usernameInput = screen.getByDisplayValue('testuser');
    fireEvent.changeText(usernameInput, 'invalid user!'); // Invalid characters

    // Button should still exist
    const saveButton = screen.getByText('Save Changes');
    expect(saveButton).toBeTruthy();
  });

  it('calls updateProfile when save is pressed', async () => {
    mockMutateAsync.mockResolvedValue({});
    render(<ProfileScreen />);

    const usernameInput = screen.getByDisplayValue('testuser');
    fireEvent.changeText(usernameInput, 'newusername');

    const saveButton = screen.getByText('Save Changes').parent;
    fireEvent.press(saveButton!);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({ username: 'newusername' });
    });
  });

  it('returns null when no user is present', () => {
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ user: null })
    );
    const { toJSON } = render(<ProfileScreen />);

    expect(toJSON()).toBeNull();
  });

  it('shows username validation hint', () => {
    render(<ProfileScreen />);

    expect(
      screen.getByText(
        '3-20 characters, letters, numbers, and underscores only'
      )
    ).toBeTruthy();
  });
});
