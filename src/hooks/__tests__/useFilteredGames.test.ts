import { renderHook } from '@testing-library/react-native';
import { useFilteredGames } from '../useFilteredGames';
import { mockGameListItem } from '../../__tests__/utils';

describe('useFilteredGames', () => {
  it('should return empty arrays when games is undefined', async () => {
    const { result } = await renderHook(() => useFilteredGames(undefined));

    expect(result.current.activeGames).toEqual([]);
    expect(result.current.completedGames).toEqual([]);
    expect(result.current.yourTurnGames).toEqual([]);
    expect(result.current.opponentTurnGames).toEqual([]);
  });

  it('should return empty arrays when games is empty array', async () => {
    const { result } = await renderHook(() => useFilteredGames([]));

    expect(result.current.activeGames).toEqual([]);
    expect(result.current.completedGames).toEqual([]);
    expect(result.current.yourTurnGames).toEqual([]);
    expect(result.current.opponentTurnGames).toEqual([]);
  });

  it('should filter active games correctly', async () => {
    const games = [
      mockGameListItem({ ulid: '1', status: 'active' }),
      mockGameListItem({ ulid: '2', status: 'finished', winnerUlid: '123' }),
    ];

    const { result } = await renderHook(() => useFilteredGames(games));

    expect(result.current.activeGames).toHaveLength(1);
    expect(result.current.activeGames[0]!.ulid).toBe('1');
  });

  it('should include pending games in active games', async () => {
    const games = [
      mockGameListItem({ ulid: '1', status: 'pending' }),
      mockGameListItem({ ulid: '2', status: 'active' }),
    ];

    const { result } = await renderHook(() => useFilteredGames(games));

    expect(result.current.activeGames).toHaveLength(2);
  });

  it('should filter completed games correctly', async () => {
    const games = [
      mockGameListItem({ ulid: '1', status: 'active' }),
      mockGameListItem({ ulid: '2', status: 'finished', winnerUlid: '123' }),
      mockGameListItem({ ulid: '3', status: 'finished', winnerUlid: '456' }),
    ];

    const { result } = await renderHook(() => useFilteredGames(games));

    expect(result.current.completedGames).toHaveLength(2);
    expect(result.current.completedGames.map((g) => g.ulid)).toEqual([
      '2',
      '3',
    ]);
  });

  it('should filter yourTurnGames correctly', async () => {
    const games = [
      mockGameListItem({ ulid: '1', status: 'active', isMyTurn: true }),
      mockGameListItem({ ulid: '2', status: 'active', isMyTurn: false }),
      mockGameListItem({ ulid: '3', status: 'active', isMyTurn: true }),
    ];

    const { result } = await renderHook(() => useFilteredGames(games));

    expect(result.current.yourTurnGames).toHaveLength(2);
    expect(result.current.yourTurnGames.map((g) => g.ulid)).toEqual(['1', '3']);
  });

  it('should filter opponentTurnGames correctly', async () => {
    const games = [
      mockGameListItem({ ulid: '1', status: 'active', isMyTurn: true }),
      mockGameListItem({ ulid: '2', status: 'active', isMyTurn: false }),
      mockGameListItem({ ulid: '3', status: 'active', isMyTurn: false }),
    ];

    const { result } = await renderHook(() => useFilteredGames(games));

    expect(result.current.opponentTurnGames).toHaveLength(2);
    expect(result.current.opponentTurnGames.map((g) => g.ulid)).toEqual([
      '2',
      '3',
    ]);
  });

  it('should not include finished games in yourTurn or opponentTurn', async () => {
    const games = [
      mockGameListItem({
        ulid: '1',
        status: 'finished',
        isMyTurn: true,
        winnerUlid: '123',
      }),
      mockGameListItem({
        ulid: '2',
        status: 'finished',
        isMyTurn: false,
        winnerUlid: '456',
      }),
    ];

    const { result } = await renderHook(() => useFilteredGames(games));

    expect(result.current.yourTurnGames).toHaveLength(0);
    expect(result.current.opponentTurnGames).toHaveLength(0);
  });

  it('should handle all game states together', async () => {
    const games = [
      mockGameListItem({ ulid: '1', status: 'pending', isMyTurn: true }),
      mockGameListItem({ ulid: '2', status: 'active', isMyTurn: true }),
      mockGameListItem({ ulid: '3', status: 'active', isMyTurn: false }),
      mockGameListItem({
        ulid: '4',
        status: 'finished',
        isMyTurn: true,
        winnerUlid: '123',
      }),
    ];

    const { result } = await renderHook(() => useFilteredGames(games));

    expect(result.current.activeGames).toHaveLength(3);
    expect(result.current.completedGames).toHaveLength(1);
    expect(result.current.yourTurnGames).toHaveLength(2);
    expect(result.current.opponentTurnGames).toHaveLength(1);
  });
});
