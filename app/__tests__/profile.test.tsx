import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import ProfileScreen from '../(main)/profile';
import { useAuthStore } from '../../src/stores/authStore';
import { ROUTES } from '../../src/config/routes';

const mockPush = jest.fn();

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
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

  it('renders the user and a link to edit the profile', async () => {
    await render(<ProfileScreen />);

    expect(screen.getByText('TE')).toBeTruthy(); // Avatar initials
    expect(screen.getByText('testuser')).toBeTruthy();
    expect(screen.getByText('Edit profile')).toBeTruthy();
    await fireEvent.press(screen.getByText('Appearance'));
    expect(mockPush).toHaveBeenCalledWith(ROUTES.APPEARANCE);
  });

  it('lets guests open the appearance page', async () => {
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ user: mockUser, isGuest: true })
    );
    await render(<ProfileScreen />);

    await fireEvent.press(screen.getByText('Appearance'));
    expect(mockPush).toHaveBeenCalledWith(ROUTES.APPEARANCE);
  });

  it('displays user statistics', async () => {
    await render(<ProfileScreen />);

    expect(screen.getByText('Word & Move Records')).toBeTruthy();
    expect(screen.getByText('Game Performance')).toBeTruthy();
  });

  it('returns null when no user is present', async () => {
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ user: null })
    );
    const { toJSON } = await render(<ProfileScreen />);

    expect(toJSON()).toBeNull();
  });
});
