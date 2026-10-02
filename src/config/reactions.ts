export const MOVE_REACTIONS = [
  { id: 'clap', emoji: '👏', label: 'Applause' },
  { id: 'wow', emoji: '😮', label: 'Surprised' },
  { id: 'laugh', emoji: '😄', label: 'Laugh' },
  { id: 'flex', emoji: '💪', label: 'Strong move' },
] as const;

export type MoveReactionType = (typeof MOVE_REACTIONS)[number]['id'];
