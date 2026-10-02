import React from 'react';
import { render } from '@testing-library/react-native';
import MoveHistoryScreen from '../(main)/game/[id]/history';

const mockPlayers = [
  { ulid: 'author', username: 'Author' },
  { ulid: 'player', username: 'Player' },
  { ulid: 'third', username: 'Third' },
];
let mockCurrentUserUlid = 'viewer';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'game' }),
}));

jest.mock('../../src/api/queries/useGame', () => ({
  useGame: () => ({ data: { players: mockPlayers }, isLoading: false }),
}));

jest.mock('../../src/api/queries/useMoveHistory', () => ({
  useMoveHistory: () => ({
    data: [
      {
        ulid: 'move',
        type: 'pass',
        user: { ulid: 'author', username: 'Author', avatar: null },
        scoreBreakdown: null,
        score: 0,
        tilesCount: 0,
        tiles: null,
        words: null,
        reactions: [{ userUlid: 'third', reaction: 'clap' }],
        createdAt: '2026-10-02T00:00:00Z',
      },
    ],
    isLoading: false,
  }),
}));

jest.mock('../../src/api/queries/useMoveReaction', () => ({
  useMoveReaction: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

jest.mock('../../src/hooks/useWebSocket', () => ({
  useWebSocket: jest.fn(),
}));

jest.mock('../../src/stores/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { ulid: mockCurrentUserUlid } }),
}));

jest.mock('../../src/components/ui/SnackbarProvider', () => ({
  useSnackbar: () => ({ showSnackbar: jest.fn() }),
}));

jest.mock('../../src/components/ui/Avatar', () => ({
  Avatar: () => null,
}));

describe('move history reactions', () => {
  it('shows who reacted without offering reactions to a public game viewer', async () => {
    mockCurrentUserUlid = 'viewer';
    const { getByLabelText, queryByLabelText } = await render(
      <MoveHistoryScreen />
    );

    expect(getByLabelText('Third reacted with applause')).toBeTruthy();
    expect(queryByLabelText('React to move')).toBeNull();
  });

  it('allows a game player to react to an opponent move', async () => {
    mockCurrentUserUlid = 'player';
    const { getByLabelText } = await render(<MoveHistoryScreen />);

    expect(getByLabelText('React to move')).toBeTruthy();
  });

  it('does not offer a reaction on your own move', async () => {
    mockCurrentUserUlid = 'author';
    const { queryByLabelText } = await render(<MoveHistoryScreen />);

    expect(queryByLabelText('React to move')).toBeNull();
  });
});
