import { transformGame, transformGameListItem } from '../game.schema';

const baseListPayload = {
  ulid: 'g1',
  language: 'en',
  status: 'active' as const,
  max_players: 3,
  players: [
    {
      ulid: 'u1',
      username: 'You',
      avatar: null,
      avatar_color: null,
      score: 10,
      is_current_turn: true,
      is_me: true,
      has_left: false,
    },
    {
      ulid: 'u2',
      username: 'Jess',
      avatar: null,
      avatar_color: null,
      score: 20,
      is_current_turn: false,
      is_me: false,
      has_left: false,
    },
    {
      ulid: 'u3',
      username: 'Tom',
      avatar: null,
      avatar_color: null,
      score: 5,
      is_current_turn: false,
      is_me: false,
      has_left: true,
    },
  ],
  my_score: 10,
  is_my_turn: true,
  winner_ulid: null,
  updated_at: '2026-01-01T00:00:00Z',
  last_move_description: 'You played WINK',
  turn_expires_at: null,
  pending_invitation: null,
  is_public: false,
};

it('transforms a multiplayer game list item with a players array', () => {
  const item = transformGameListItem(baseListPayload);
  expect(item.players).toHaveLength(3);
  expect(item.maxPlayers).toBe(3);
  expect(item.myScore).toBe(10);
  expect(item.players[2]!.hasLeft).toBe(true);
  expect(item.players.find((p) => p.isMe)?.ulid).toBe('u1');
});

it('transforms game detail players with left state and turn order', () => {
  const game = transformGame({
    ulid: 'g1',
    language: 'en',
    status: 'active',
    max_players: 3,
    board: [],
    board_template: [],
    players: [
      {
        ulid: 'u1',
        username: 'You',
        avatar: null,
        avatar_color: null,
        score: 0,
        rack_count: 7,
        is_current_turn: true,
        turn_order: 1,
        has_left: false,
        left_reason: null,
      },
      {
        ulid: 'u2',
        username: 'Tom',
        avatar: null,
        avatar_color: null,
        score: 0,
        rack_count: 0,
        is_current_turn: false,
        turn_order: 2,
        has_left: true,
        left_reason: 'removed',
      },
    ],
    my_rack: [],
    tiles_remaining: 50,
    current_turn_user_ulid: 'u1',
    winner_ulid: null,
    is_last_move: false,
    last_move: null,
    turn_expires_at: null,
    pending_invitation: null,
    is_public: false,
    can_join: false,
  } as any);
  expect(game.maxPlayers).toBe(3);
  expect(game.players[1]!.hasLeft).toBe(true);
  expect(game.players[1]!.leftReason).toBe('removed');
  expect(game.players[0]!.turnOrder).toBe(1);
});
