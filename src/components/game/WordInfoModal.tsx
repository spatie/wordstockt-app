import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { BaseModal } from '../ui/BaseModal';
import { Button } from '../ui/Button';
import { colors } from '../../config/theme';
import { SPACING, RADIUS } from '../../config/constants';
import type { WordInfo } from '../../types';

interface WordInfoModalProps {
  visible: boolean;
  onClose: () => void;
  words: WordInfo[] | undefined;
  isLoading: boolean;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';

  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function FadeSlideIn({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.spring(opacity, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timeout);
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

function PosBadge({ pos }: { pos: string }) {
  return (
    <View style={styles.posBadge}>
      <Text style={styles.posBadgeText}>{pos}</Text>
    </View>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {icon} {title}
      </Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function ProverbItem({ text }: { text: string }) {
  return (
    <View style={styles.exampleItem}>
      <Text style={styles.exampleQuote}>&quot;</Text>
      <Text style={styles.exampleText}>{text}</Text>
    </View>
  );
}

function SenseItem({
  sense,
  index,
  showNumber,
}: {
  sense: { definition: string; pos?: string; examples?: string[] };
  index: number;
  showNumber: boolean;
}) {
  return (
    <View style={styles.senseItem}>
      <View style={styles.senseHeader}>
        {showNumber && <Text style={styles.senseNumber}>{index + 1}.</Text>}
        {sense.pos && <PosBadge pos={sense.pos} />}
      </View>
      <Text style={styles.senseDefinition}>{sense.definition}</Text>
      {sense.examples && sense.examples.length > 0 && (
        <View style={styles.senseExamples}>
          {sense.examples.map((example, i) => (
            <Text key={i} style={styles.senseExampleText}>
              &quot;{example}&quot;
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function WordHeader({ word }: { word: WordInfo }) {
  return (
    <View style={styles.wordHeader}>
      <View style={styles.wordTitleRow}>
        <Text style={styles.wordTitle}>{word.word}</Text>
      </View>
      <View style={styles.statsRow}>
        <Stat label="Times Played" value={word.timesPlayed} />
        <Stat label="Last Played" value={formatDate(word.lastPlayedAt)} />
      </View>
    </View>
  );
}

function WordContent({ word }: { word: WordInfo }) {
  const { definition } = word;
  const senses = definition?.senses ?? [];
  const showNumbers = senses.length > 1;

  let animationIndex = 0;
  const getDelay = () => animationIndex++ * 60;

  return (
    <View style={styles.wordContent}>
      {senses.length > 0 && (
        <View style={styles.definitionSection}>
          <FadeSlideIn delay={getDelay()}>
            <Text style={styles.sectionLabel}>
              {senses.length === 1 ? 'Definition' : 'Definitions'}
            </Text>
          </FadeSlideIn>
          {senses.map((sense, index) => (
            <FadeSlideIn key={index} delay={getDelay()}>
              <SenseItem sense={sense} index={index} showNumber={showNumbers} />
            </FadeSlideIn>
          ))}
        </View>
      )}

      {definition?.etymology && (
        <FadeSlideIn delay={getDelay()}>
          <Section title="Etymology" icon="📖">
            <Text style={styles.etymologyText}>{definition.etymology}</Text>
          </Section>
        </FadeSlideIn>
      )}

      {definition?.proverbs && definition.proverbs.length > 0 && (
        <FadeSlideIn delay={getDelay()}>
          <Section title="Proverbs" icon="🔮">
            {definition.proverbs.map((proverb, index) => (
              <ProverbItem key={index} text={proverb} />
            ))}
          </Section>
        </FadeSlideIn>
      )}
    </View>
  );
}

export function WordInfoModal({
  visible,
  onClose,
  words,
  isLoading,
}: WordInfoModalProps) {
  // Cache content while modal is closing to prevent jarring disappearance
  const cachedWordsRef = useRef<WordInfo[] | undefined>(undefined);
  const cachedLoadingRef = useRef(false);

  useEffect(() => {
    if (visible) {
      cachedWordsRef.current = words;
      cachedLoadingRef.current = isLoading;
    }
  }, [visible, words, isLoading]);

  // Use cached values when closing, current values when open
  const displayWords = visible ? words : cachedWordsRef.current;
  const displayLoading = visible ? isLoading : cachedLoadingRef.current;

  const renderContent = () => {
    if (displayLoading) {
      return (
        <View style={[styles.scrollView, styles.centered]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (!displayWords?.length) {
      return (
        <View style={styles.scrollView}>
          <Text style={styles.emptyText}>No word information available</Text>
        </View>
      );
    }

    return (
      <SectionList
        style={styles.scrollView}
        sections={displayWords.map((word) => ({
          word,
          data: [word],
        }))}
        keyExtractor={(item) => item.word}
        renderSectionHeader={({ section }) => (
          <WordHeader word={section.word} />
        )}
        renderItem={({ item }) => <WordContent word={item} />}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      overlayOpacity={0.7}
      backdropBlur
      contentStyle={styles.modal}
    >
      <Text style={styles.title}>Word Info</Text>
      {renderContent()}
      <Button label="Close" onPress={onClose} fullWidth rounded size="lg" />
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  modal: {
    padding: SPACING.xl,
    maxHeight: '80%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  scrollView: {
    height: 400,
    marginBottom: SPACING.lg,
  },
  centered: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordHeader: {
    backgroundColor: colors.background,
    borderRadius: RADIUS.lg,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  wordTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  wordContent: {
    backgroundColor: colors.background,
    borderRadius: RADIUS.lg,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    marginBottom: SPACING.md,
  },
  wordTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  posBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  posBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  definitionSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: SPACING.md,
  },
  sectionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  senseItem: {
    marginBottom: SPACING.md,
  },
  senseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  senseNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  senseDefinition: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  senseExamples: {
    marginTop: SPACING.xs,
    paddingLeft: SPACING.md,
  },
  senseExampleText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: SPACING.xs,
  },
  section: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: SPACING.sm,
  },
  sectionContent: {
    paddingBottom: SPACING.md,
  },
  etymologyText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  exampleItem: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  exampleQuote: {
    fontSize: 24,
    color: colors.primary,
    marginRight: SPACING.xs,
    marginTop: -4,
    fontWeight: 'bold',
  },
  exampleText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: SPACING.xl,
  },
});
