export interface WordSense {
  definition: string;
  pos?: string;
  examples?: string[];
}

export interface WordDefinition {
  senses: WordSense[];
  etymology?: string;
  proverbs?: string[];
}

export interface WordInfo {
  word: string;
  timesPlayed: number;
  lastPlayedAt: string | null;
  definition?: WordDefinition;
}
