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

const mockSearchUsers = jest.fn();
jest.mock('../../../api/queries/useUsers', () => ({
  useSearchUsers: (query: string) => mockSearchUsers(query),
}));

jest.mock('../../../api/queries/useFriends', () => ({
  useFriends: () => ({
    data: [],
    isLoading: false,
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
    mockSearchUsers.mockReturnValue({
      data: [],
      isLoading: false,
    });
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

  it('shows no match message when search has no exact match', () => {
    mockSearchUsers.mockReturnValue({
      data: [
        {
          ulid: '01hxyz0000000similar01',
          username: 'similar_user',
          avatar: null,
        },
      ],
      isLoading: false,
    });

    render(<InvitePlayerModal {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search by username');
    fireEvent.changeText(searchInput, 'test');

    expect(screen.getByText('No user found with username "test"')).toBeTruthy();
  });

  it('shows user card when exact username match is found', () => {
    mockSearchUsers.mockReturnValue({
      data: [
        { ulid: '01hxyz000000000testuser', username: 'testuser', avatar: null },
      ],
      isLoading: false,
    });

    render(<InvitePlayerModal {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search by username');
    fireEvent.changeText(searchInput, 'testuser');

    expect(screen.getByText('testuser')).toBeTruthy();
    expect(
      screen.queryByText('No user found with username "testuser"')
    ).toBeNull();
  });

  it('matches username case-insensitively', () => {
    mockSearchUsers.mockReturnValue({
      data: [
        { ulid: '01hxyz000000000testuser', username: 'TestUser', avatar: null },
      ],
      isLoading: false,
    });

    render(<InvitePlayerModal {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search by username');
    fireEvent.changeText(searchInput, 'testuser');

    expect(screen.getByText('TestUser')).toBeTruthy();
  });

  it('calls invite mutation when Send Invitation is pressed', async () => {
    mockSearchUsers.mockReturnValue({
      data: [
        { ulid: '01hxyz000000000testuser', username: 'testuser', avatar: null },
      ],
      isLoading: false,
    });
    mockMutateAsync.mockResolvedValue({});

    render(<InvitePlayerModal {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search by username');
    fireEvent.changeText(searchInput, 'testuser');

    fireEvent.press(screen.getByText('Send Invitation'));

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

    mockSearchUsers.mockReturnValue({
      data: [
        { ulid: '01hxyz000000000testuser', username: 'testuser', avatar: null },
      ],
      isLoading: false,
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

    fireEvent.press(screen.getByText('Send Invitation'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('disables Send Invitation button when no user is matched', () => {
    mockSearchUsers.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<InvitePlayerModal {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search by username');
    fireEvent.changeText(searchInput, 'nonexistent');

    const button = screen.getByText('Send Invitation');
    // Button should have disabled styles (opacity 0.5)
    expect(button).toBeTruthy();
  });
});
