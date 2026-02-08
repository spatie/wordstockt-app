import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { WordInfo } from '../../types';

interface ReportWordParams {
  word: string;
  language: string;
}

interface LookupParams {
  word: string;
  language: string;
}

interface LookupResult {
  found: boolean;
  word?: string;
  language?: string;
  data?: WordInfo;
}

export function useReportWord() {
  return useMutation({
    mutationFn: async ({ word, language }: ReportWordParams): Promise<void> => {
      await apiClient.post('/dictionary/report', {
        word,
        language,
      });
    },
  });
}

export function useDictionaryLookup() {
  return useMutation({
    mutationFn: async ({
      word,
      language,
    }: LookupParams): Promise<LookupResult> => {
      const response = await apiClient.get('/dictionary/lookup', {
        params: { word, language },
      });
      return response.data;
    },
  });
}

export function useRequestWord() {
  return useMutation({
    mutationFn: async ({ word, language }: ReportWordParams): Promise<void> => {
      await apiClient.post('/dictionary/request', {
        word,
        language,
      });
    },
  });
}
