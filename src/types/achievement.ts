export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  context?: Record<string, unknown>;
}

export interface UserAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  isUnlocked: boolean;
  unlockedAt: string | null;
  context: Record<string, unknown> | null;
}

export interface AchievementsResponse {
  totalUnlocked: number;
  totalAvailable: number;
  categories: Record<string, { unlocked: number; total: number }>;
  achievements: UserAchievement[];
}
