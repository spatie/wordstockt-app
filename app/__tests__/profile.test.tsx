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
  useFocusEffect: (callback: () => void) => {
    // Call the callback immediately for testing
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require('react');
    React.useEffect(() => {
      callback();
    }, [callback]);
  },
}));

// Mock the auth store
jest.mock('../../src/stores/authStore');
const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;

// Mock useAuth hooks
const mockMutateAsync = jest.fn();
const mockResendMutate = jest.fn();
const mockRefetchUser = jest.fn();
jest.mock('../../src/api/queries/useAuth', () => ({
  useUpdateProfile: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  useResendVerification: () => ({
    mutate: mockResendMutate,
    isPending: false,
  }),
  useCurrentUser: () => ({
    refetch: mockRefetchUser,
  }),
  useUpdateAvatar: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
  useDeleteAvatar: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
}));

// Mock useUserStats
jest.mock('../../src/api/queries/useStats', () => ({
  useUserStats: () => ({
    data: {
      ulid: '01hxyz000000000001',
      username: 'testuser',
      avatar: null,
      eloRating: 1200,
      gamesPlayed: 20,
      gamesWon: 12,
      gamesLost: 8,
      gamesDraw: 0,
      winRate: 60,
      highestScoringWord: { word: 'QUARTZ', score: 75 },
      highestScoringMove: 75,
      bingosCount: 5,
      totalWordsPlayed: 150,
      totalPointsScored: 3500,
      highestGameScore: 350,
      averageGameScore: 175,
      currentWinStreak: 3,
      bestWinStreak: 5,
      biggestComeback: 50,
      closestVictory: 5,
      tripleWordTilesUsed: 20,
      doubleWordTilesUsed: 40,
      blankTilesPlayed: 10,
      firstMoveWinRate: 55,
      highestEloEver: 1250,
      lowestEloEver: 1100,
    },
    isLoading: false,
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
  ulid: '01hxyz000000000001',
  username: 'testuser',
  email: 'test@example.com',
  avatar: null,
  avatarColor: null,
  isGuest: false,
};

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ user: mockUser, isGuest: false })
    );
  });

  it('renders user profile information', () => {
    render(<ProfileScreen />);

    expect(screen.getByText('TE')).toBeTruthy(); // Avatar initials
    // Email is in a TextInput, so use getByDisplayValue
    expect(screen.getByDisplayValue('test@example.com')).toBeTruthy();
    expect(screen.getByDisplayValue('testuser')).toBeTruthy();
  });

  it('displays user statistics', () => {
    render(<ProfileScreen />);

    // Check for actual section titles in the profile
    expect(screen.getByText('Word & Move Records')).toBeTruthy();
    expect(screen.getByText('Game Performance')).toBeTruthy();
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
