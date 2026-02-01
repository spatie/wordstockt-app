import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react-native';
import { InvitePlayerModal } from '../InvitePlayerModal';

// Mock react-native-paper
jest.mock('react-native-paper', () => ({
  MD3DarkTheme: {
    colors: {
      primary: '#4A90D9',
      secondary: '#3D5A80',
      error: '#E91E63',
      background: '#0D1B2A',
      surface: '#1B2838',
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
      onBackground: '#FFFFFF',
      onSurface: '#FFFFFF',
    },
  },
}));

// Mock the API hooks
const mockMutateAsync = jest.fn();
const mockReset = jest.fn();
jest.mock('../../../api/queries/useInvites', () => ({
  useInvitePlayer: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
    error: null,
    reset: mockReset,
  }),
}));

// Mock apiClient for search functionality
const mockApiClientGet = jest.fn();
jest.mock('../../../api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockApiClientGet(...args),
  },
  getApiError: (err: unknown) => ({
    message: (err as Error)?.message || 'Error',
  }),
}));

jest.mock('../../../api/queries/useFriends', () => ({
  useFriends: () => ({
    data: [],
    isLoading: false,
  }),
}));

// Mock useCreateInviteLink
const mockCreateInviteLinkMutateAsync = jest.fn();
const mockCreateInviteLinkReset = jest.fn();
jest.mock('../../../api/queries/useInviteLink', () => ({
  useCreateInviteLink: () => ({
    mutateAsync: mockCreateInviteLinkMutateAsync,
    isPending: false,
    error: null,
    reset: mockCreateInviteLinkReset,
  }),
}));

describe('InvitePlayerModal', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    gameUlid: '01hxyz000000000game0001',
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiClientGet.mockResolvedValue({ data: { data: [] } });
  });

  it('renders the modal when visible', () => {
    render(<InvitePlayerModal {...defaultProps} />);

    expect(screen.getByText('Invite Player')).toBeTruthy();
    expect(screen.getByPlaceholderText('Search by username')).toBeTruthy();
  });

  it('does not render content when not visible', () => {
    render(<InvitePlayerModal {...defaultProps} visible={false} />);

    expect(screen.queryByText('Invite Player')).toBeNull();
  });

  it('calls onClose when close button is pressed', () => {
    const onClose = jest.fn();
    render(<InvitePlayerModal {...defaultProps} onClose={onClose} />);

    fireEvent.press(screen.getByText('×'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows no users found message when search returns empty', async () => {
    mockApiClientGet.mockResolvedValue({ data: { data: [] } });

    render(<InvitePlayerModal {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search by username');
    fireEvent.changeText(searchInput, 'testuser');

    // Press the Search button
    fireEvent.press(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeTruthy();
    });
  });

  it('shows user card when search returns results', async () => {
    mockApiClientGet.mockResolvedValue({
      data: {
        data: [
          {
            ulid: '01hxyz000000000testuser',
            username: 'testuser',
            avatar: null,
          },
        ],
      },
    });

    render(<InvitePlayerModal {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search by username');
    fireEvent.changeText(searchInput, 'testuser');

    // Press the Search button
    fireEvent.press(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeTruthy();
    });
  });

  it('calls invite mutation when Invite button is pressed', async () => {
    mockApiClientGet.mockResolvedValue({
      data: {
        data: [
          {
            ulid: '01hxyz000000000testuser',
            username: 'testuser',
            avatar: null,
          },
        ],
      },
    });
    mockMutateAsync.mockResolvedValue({});

    render(<InvitePlayerModal {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search by username');
    fireEvent.changeText(searchInput, 'testuser');

    // Press the Search button
    fireEvent.press(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeTruthy();
    });

    // Press the Invite button for the user
    fireEvent.press(screen.getByText('Invite'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        gameUlid: '01hxyz000000000game0001',
        userUlid: '01hxyz000000000testuser',
      });
    });
  });

  it('calls onSuccess and onClose after successful invitation', async () => {
    const onSuccess = jest.fn();
    const onClose = jest.fn();

    mockApiClientGet.mockResolvedValue({
      data: {
        data: [
          {
            ulid: '01hxyz000000000testuser',
            username: 'testuser',
            avatar: null,
          },
        ],
      },
    });
    mockMutateAsync.mockResolvedValue({});

    render(
      <InvitePlayerModal
        {...defaultProps}
        onSuccess={onSuccess}
        onClose={onClose}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search by username');
    fireEvent.changeText(searchInput, 'testuser');

    // Press the Search button
    fireEvent.press(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeTruthy();
    });

    // Press the Invite button
    fireEvent.press(screen.getByText('Invite'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('shows validation error when search query is too short', () => {
    render(<InvitePlayerModal {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search by username');
    fireEvent.changeText(searchInput, 'a');

    // Press the Search button
    fireEvent.press(screen.getByText('Search'));

    expect(
      screen.getByText('Username must be at least 2 characters')
    ).toBeTruthy();
  });
});
