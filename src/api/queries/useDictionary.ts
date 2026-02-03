import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../client';

interface ReportWordParams {
  word: string;
  language: string;
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
