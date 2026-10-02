import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AddFriendModal } from '../AddFriendModal';

const mockSearchUsers = jest.fn();
const mockIsFriend = jest.fn();

jest.mock('../../../api/queries/useUsers', () => ({
  useSearchUsers: (query: string) => mockSearchUsers(query),
}));

jest.mock('../../../api/queries/useFriends', () => ({
  useIsFriend: (userUlid: string) => mockIsFriend(userUlid),
  useAddFriend: () => ({
    mutateAsync: jest.fn(),
    reset: jest.fn(),
    error: null,
    isPending: false,
  }),
}));

describe('AddFriendModal search state', () => {
  beforeEach(() => {
    mockSearchUsers.mockImplementation((query: string) =>
      query
        ? {
            isPending: false,
            isSuccess: true,
            isError: false,
            data: [
              {
                ulid: 'alice-id',
                username: 'alice',
                avatar: null,
                avatarColor: null,
                eloRating: 1200,
              },
            ],
          }
        : { isPending: true, isSuccess: false, isError: false, data: undefined }
    );
    mockIsFriend.mockReturnValue({ isSuccess: false, data: undefined });
  });

  it('clears the displayed result as soon as the input changes', async () => {
    await render(
      <AddFriendModal visible onClose={jest.fn()} onSuccess={jest.fn()} />
    );
    const input = screen.getByPlaceholderText('Enter exact username');

    await fireEvent.changeText(input, 'alice');
    await fireEvent.press(screen.getByText('Search'));
    expect(screen.getByText('alice')).toBeTruthy();

    await fireEvent.changeText(input, 'bob');
    expect(screen.queryByText('alice')).toBeNull();
    expect(mockSearchUsers).toHaveBeenLastCalledWith('');
  });

  it('derives the already-friend state from the active result check', async () => {
    mockIsFriend.mockImplementation((userUlid: string) =>
      userUlid
        ? { isSuccess: true, data: { isFriend: true } }
        : { isSuccess: false, data: undefined }
    );

    await render(
      <AddFriendModal visible onClose={jest.fn()} onSuccess={jest.fn()} />
    );
    await fireEvent.changeText(
      screen.getByPlaceholderText('Enter exact username'),
      'alice'
    );
    await fireEvent.press(screen.getByText('Search'));

    expect(screen.getByText('Already friends')).toBeTruthy();
  });
});
