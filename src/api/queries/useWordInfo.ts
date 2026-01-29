import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import { wordInfoKeys } from './queryKeys';
import type { WordInfo } from '../../types';

interface WordInfoParams {
  gameUlid: string;
  x: number;
  y: number;
}

interface WordInfoApiResponse {
  data: {
    word: string;
    times_played: number;
    last_played_at: string | null;
    definition?: {
      senses: {
        definition: string;
        pos?: string;
        examples?: string[];
      }[];
      etymology?: string;
      proverbs?: string[];
    };
  }[];
}

export function useWordInfo(
  { gameUlid, x, y }: WordInfoParams,
  enabled = false
) {
  return useQuery({
    queryKey: wordInfoKeys.info(gameUlid, x, y),
    queryFn: async (): Promise<WordInfo[]> => {
      const { data } = await apiClient.get<WordInfoApiResponse>(
        `/games/${gameUlid}/word-info`,
        { params: { x, y } }
      );
      return data.data.map((item) => ({
        word: item.word,
        timesPlayed: item.times_played,
        lastPlayedAt: item.last_played_at,
        definition: item.definition,
      }));
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - word info doesn't change often
  });
}
