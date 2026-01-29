import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { colors, MULTIPLIER_COLORS } from '../../src/config/theme';

function RuleCard({
  title,
  children,
  highlight,
}: {
  title: string;
  children: React.ReactNode;
  highlight?: 'red' | 'blue';
}) {
  return (
    <View
      style={[
        styles.card,
        highlight === 'red' && styles.cardHighlightRed,
        highlight === 'blue' && styles.cardHighlightBlue,
      ]}
    >
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Dot({ color }: { color: 'red' | 'blue' }) {
  return (
    <View
      style={[
        styles.dot,
        { backgroundColor: color === 'red' ? '#FF6B6B' : '#4A90D9' },
      ]}
    />
  );
}

function MultiplierBadge({
  type,
  label,
}: {
  type: '3W' | '2W' | '3L' | '2L';
  label: string;
}) {
  const bgColor = MULTIPLIER_COLORS[type];
  return (
    <View style={styles.multiplierRow}>
      <View style={[styles.multiplierBadge, { backgroundColor: bgColor }]}>
        <Text style={styles.multiplierBadgeText}>{type}</Text>
      </View>
      <Text style={styles.multiplierLabel}>{label}</Text>
    </View>
  );
}

function TileSample({ letter, points }: { letter: string; points: number }) {
  return (
    <View style={styles.tileSample}>
      <Text style={styles.tileLetter}>{letter}</Text>
      <Text style={styles.tilePoints}>{points}</Text>
    </View>
  );
}

export default function RulesScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.pageTitle}>Game Rules</Text>
        <Text style={styles.pageSubtitle}>
          WordStockt is a multiplayer word game where you compete to score the
          most points by forming words on a shared board.
        </Text>

        {/* Basic Gameplay */}
        <RuleCard title="How to Play">
          <Text style={styles.ruleText}>
            Take turns placing letter tiles on the board to form words. Each
            word must connect to existing tiles (except the first word, which
            must cover the center star).
          </Text>
          <View style={styles.ruleList}>
            <Text style={styles.ruleListItem}>
              {'\u2022'} Place tiles in a single line (horizontal or vertical)
            </Text>
            <Text style={styles.ruleListItem}>
              {'\u2022'} All formed words must be valid dictionary words
            </Text>
            <Text style={styles.ruleListItem}>
              {'\u2022'} Draw new tiles after each turn to maintain 7 tiles
            </Text>
          </View>
        </RuleCard>

        {/* Scoring */}
        <RuleCard title="Scoring">
          <Text style={styles.ruleText}>
            Each letter has a point value. Place tiles strategically on
            multiplier squares to maximize your score!
          </Text>
          <View style={styles.multiplierContainer}>
            <MultiplierBadge type="3W" label="Triple Word Score" />
            <MultiplierBadge type="2W" label="Double Word Score" />
            <MultiplierBadge type="3L" label="Triple Letter Score" />
            <MultiplierBadge type="2L" label="Double Letter Score" />
          </View>
          <View style={styles.tileExamples}>
            <View style={styles.tileExampleRow}>
              <TileSample letter="E" points={1} />
              <TileSample letter="K" points={2} />
              <TileSample letter="W" points={3} />
              <TileSample letter="Z" points={4} />
              <TileSample letter="Q" points={8} />
            </View>
            <Text style={styles.tileCaption}>
              Common letters are worth less, rare letters are worth more
            </Text>
          </View>
        </RuleCard>

        {/* Bingo Bonus */}
        <RuleCard title="Bingo Bonus">
          <Text style={styles.ruleText}>
            Use all 7 tiles from your rack in a single turn to earn a{' '}
            <Text style={styles.highlight}>+50 point bonus</Text>! This is
            called a &quot;Bingo&quot;. Combined with the tiles played bonus
            (+100 for 7 tiles), you&apos;ll get a massive{' '}
            <Text style={styles.highlight}>+150 total bonus</Text>!
          </Text>
        </RuleCard>

        {/* Tiles Played Bonus */}
        <RuleCard title="Tiles Played Bonus">
          <Text style={styles.ruleText}>
            You earn bonus points based on the number of tiles you play in your
            turn:
          </Text>
          <View style={styles.bonusTable}>
            <View style={styles.bonusRow}>
              <Text style={styles.bonusLength}>2 tiles</Text>
              <Text style={styles.bonusPoints}>+3</Text>
            </View>
            <View style={styles.bonusRow}>
              <Text style={styles.bonusLength}>3 tiles</Text>
              <Text style={styles.bonusPoints}>+6</Text>
            </View>
            <View style={styles.bonusRow}>
              <Text style={styles.bonusLength}>4 tiles</Text>
              <Text style={styles.bonusPoints}>+12</Text>
            </View>
            <View style={styles.bonusRow}>
              <Text style={styles.bonusLength}>5 tiles</Text>
              <Text style={styles.bonusPoints}>+25</Text>
            </View>
            <View style={styles.bonusRow}>
              <Text style={styles.bonusLength}>6 tiles</Text>
              <Text style={styles.bonusPoints}>+50</Text>
            </View>
            <View style={styles.bonusRow}>
              <Text style={styles.bonusLength}>7 tiles</Text>
              <Text style={styles.bonusPoints}>+100</Text>
            </View>
          </View>
        </RuleCard>

        {/* Word Extension Bonus */}
        <RuleCard title="Word Extension Bonus">
          <Text style={styles.ruleText}>
            If you extend an existing word on the board by{' '}
            <Text style={styles.highlight}>at least 2 letters</Text>, you earn
            bonus points based on the original word&apos;s length:
          </Text>
          <View style={styles.bonusTable}>
            <View style={styles.bonusRow}>
              <Text style={styles.bonusLength}>2-letter word</Text>
              <Text style={styles.bonusPoints}>+10</Text>
            </View>
            <View style={styles.bonusRow}>
              <Text style={styles.bonusLength}>3-letter word</Text>
              <Text style={styles.bonusPoints}>+12</Text>
            </View>
            <View style={styles.bonusRow}>
              <Text style={styles.bonusLength}>4-letter word</Text>
              <Text style={styles.bonusPoints}>+15</Text>
            </View>
            <View style={styles.bonusRow}>
              <Text style={styles.bonusLength}>5-letter word</Text>
              <Text style={styles.bonusPoints}>+19</Text>
            </View>
            <View style={styles.bonusRow}>
              <Text style={styles.bonusLength}>6-letter word</Text>
              <Text style={styles.bonusPoints}>+23</Text>
            </View>
            <View style={styles.bonusRow}>
              <Text style={styles.bonusLength}>7+ letter word</Text>
              <Text style={styles.bonusPoints}>+28 to +100</Text>
            </View>
          </View>
          <View style={styles.exampleBox}>
            <Text style={styles.exampleTitle}>Example</Text>
            <Text style={styles.exampleText}>
              PLAY is on the board. You add GROUND to form PLAYGROUND. You earn{' '}
              <Text style={styles.highlight}>+50</Text> for placing 6 tiles and{' '}
              <Text style={styles.highlight}>+15</Text> for extending a 4-letter
              word = <Text style={styles.highlight}>65 bonus points</Text>!
            </Text>
          </View>
          <Text style={[styles.ruleText, styles.ruleTextMargin]}>
            Note: Adding just 1 letter (like S to CAR → CARS) doesn&apos;t
            qualify for the extension bonus.
          </Text>
        </RuleCard>

        {/* Guaranteed Blank Tile - Special Feature */}
        <RuleCard title="Guaranteed Blank Tile" highlight="red">
          <View style={styles.dotExplanation}>
            <View style={styles.dotRow}>
              <Dot color="red" />
              <Text style={styles.dotLabel}>Blank tile pending</Text>
            </View>
          </View>
          <Text style={styles.ruleText}>
            In WordStockt, every player is{' '}
            <Text style={styles.highlight}>
              guaranteed to receive one blank tile
            </Text>{' '}
            during the game. A <Dot color="red" /> red dot appears next to your
            score until you receive your blank tile.
          </Text>
          <Text style={[styles.ruleText, styles.ruleTextMargin]}>
            Blank tiles can represent any letter you choose and are incredibly
            valuable for forming difficult words!
          </Text>
        </RuleCard>

        {/* Free Swap - Special Feature */}
        <RuleCard title="Free Swap" highlight="blue">
          <View style={styles.dotExplanation}>
            <View style={styles.dotRow}>
              <Dot color="blue" />
              <Text style={styles.dotLabel}>Free swap available</Text>
            </View>
          </View>
          <Text style={styles.ruleText}>
            Each player gets <Text style={styles.highlight}>one free swap</Text>{' '}
            per game! A <Dot color="blue" /> blue dot appears next to your score
            when your free swap is available.
          </Text>
          <Text style={[styles.ruleText, styles.ruleTextMargin]}>
            Use it wisely to exchange difficult tiles without losing your turn.
            Regular swaps count as your turn, but the free swap doesn&apos;t!
          </Text>
        </RuleCard>

        {/* Other Actions */}
        <RuleCard title="Pass & Swap">
          <Text style={styles.ruleText}>
            If you can&apos;t (or don&apos;t want to) play a word, you have two
            options:
          </Text>
          <View style={styles.actionList}>
            <View style={styles.actionItem}>
              <Text style={styles.actionTitle}>Pass</Text>
              <Text style={styles.actionDesc}>
                Skip your turn without playing. Four consecutive passes (2 per
                player) ends the game.
              </Text>
            </View>
            <View style={styles.actionItem}>
              <Text style={styles.actionTitle}>Swap</Text>
              <Text style={styles.actionDesc}>
                Exchange 1-7 tiles with the bag. Only possible when 7+ tiles
                remain in the bag.
              </Text>
            </View>
          </View>
        </RuleCard>

        {/* End Game */}
        <RuleCard title="End Game">
          <Text style={styles.ruleText}>The game ends when:</Text>
          <View style={styles.ruleList}>
            <Text style={styles.ruleListItem}>
              {'\u2022'} A player uses all their tiles and the bag is empty
            </Text>
            <Text style={styles.ruleListItem}>
              {'\u2022'} Four consecutive passes occur (2 per player)
            </Text>
            <Text style={styles.ruleListItem}>{'\u2022'} A player resigns</Text>
          </View>
          <Text style={[styles.ruleText, styles.ruleTextMargin]}>
            When the game ends, players subtract the value of their remaining
            tiles. If you empty your rack, you also{' '}
            <Text style={styles.highlight}>
              gain the value of your opponent&apos;s remaining tiles
            </Text>
            !
          </Text>
        </RuleCard>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Good luck and have fun!</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  card: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.border,
  },
  cardHighlightRed: {
    borderLeftColor: '#FF6B6B',
  },
  cardHighlightBlue: {
    borderLeftColor: '#4A90D9',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  ruleText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  ruleTextMargin: {
    marginTop: 12,
  },
  highlight: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  ruleList: {
    marginTop: 12,
    gap: 6,
  },
  ruleListItem: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    paddingLeft: 4,
  },
  multiplierContainer: {
    marginTop: 16,
    gap: 10,
  },
  multiplierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  multiplierBadge: {
    width: 36,
    height: 24,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  multiplierBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  multiplierLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  tileExamples: {
    marginTop: 20,
    alignItems: 'center',
  },
  tileExampleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tileSample: {
    width: 40,
    height: 44,
    backgroundColor: '#E8E4DC',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  tileLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  tilePoints: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    fontSize: 9,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  tileCaption: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 10,
    textAlign: 'center',
  },
  dotExplanation: {
    marginBottom: 12,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  actionList: {
    marginTop: 12,
    gap: 12,
  },
  actionItem: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bonusTable: {
    marginTop: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  bonusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bonusLength: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  bonusPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  exampleBox: {
    marginTop: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  exampleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exampleText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  footer: {
    marginTop: 8,
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});
