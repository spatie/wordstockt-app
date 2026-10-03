import type { TextStyle } from 'react-native';

/**
 * The app's type scale, modelled on the iOS text styles. Use these instead of
 * ad-hoc font sizes so screens read as one app. Colors stay with the theme.
 */
export const typography = {
  largeTitle: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  title: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  headline: { fontSize: 17, fontWeight: '600', lineHeight: 22 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 21 },
  callout: { fontSize: 15, fontWeight: '400', lineHeight: 20 },
  subhead: { fontSize: 14, fontWeight: '400', lineHeight: 19 },
  footnote: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },

  // Small caps-style label above a group, e.g. "YOUR TURN"
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  // Scores and counts: digits of equal width so columns line up
  number: { fontVariant: ['tabular-nums'] },
} satisfies Record<string, TextStyle>;
