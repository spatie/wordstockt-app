import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Animated,
} from 'react-native';
import { BaseModal } from '../ui/BaseModal';
import { Button } from '../ui/Button';
import {
  useDictionaryLookup,
  useRequestWord,
} from '../../api/queries/useDictionary';
import { colors } from '../../config/theme';
import { SPACING, RADIUS, DIMENSIONS } from '../../config/constants';
import type { WordInfo } from '../../types';

interface DictionaryLookupModalProps {
  visible: boolean;
  onClose: () => void;
  language: string;
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

function DefinitionContent({ wordInfo }: { wordInfo: WordInfo }) {
  const { definition } = wordInfo;
  const senses = definition?.senses ?? [];
  const showNumbers = senses.length > 1;

  let animationIndex = 0;
  const getDelay = () => animationIndex++ * 60;

  return (
    <View>
      <FadeSlideIn delay={getDelay()}>
        <Text style={styles.resultWord}>{wordInfo.word}</Text>
      </FadeSlideIn>

      {senses.length > 0 && (
        <View style={styles.definitionSection}>
          <FadeSlideIn delay={getDelay()}>
            <Text style={styles.sectionLabel}>
              {senses.length === 1 ? 'Definition' : 'Definitions'}
            </Text>
          </FadeSlideIn>
          {senses.map((sense, index) => (
            <FadeSlideIn key={index} delay={getDelay()}>
              <View style={styles.senseItem}>
                <View style={styles.senseHeader}>
                  {showNumbers && (
                    <Text style={styles.senseNumber}>{index + 1}.</Text>
                  )}
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
            </FadeSlideIn>
          ))}
        </View>
      )}

      {definition?.etymology && (
        <FadeSlideIn delay={getDelay()}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📖 Etymology</Text>
            <Text style={styles.etymologyText}>{definition.etymology}</Text>
          </View>
        </FadeSlideIn>
      )}

      {definition?.proverbs && definition.proverbs.length > 0 && (
        <FadeSlideIn delay={getDelay()}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔮 Proverbs</Text>
            {definition.proverbs.map((proverb, index) => (
              <View key={index} style={styles.proverbItem}>
                <Text style={styles.proverbQuote}>&quot;</Text>
                <Text style={styles.proverbText}>{proverb}</Text>
              </View>
            ))}
          </View>
        </FadeSlideIn>
      )}
    </View>
  );
}

export function DictionaryLookupModal({
  visible,
  onClose,
  language,
}: DictionaryLookupModalProps) {
  const [searchText, setSearchText] = useState('');
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const inputRef = useRef<TextInput>(null);

  const lookup = useDictionaryLookup();
  const requestWord = useRequestWord();

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setSearchText('');
      setRequested(new Set());
      lookup.reset();
      requestWord.reset();
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    const trimmed = searchText.trim();
    if (trimmed.length < 2) {
      return;
    }

    requestWord.reset();
    lookup.mutate({ word: trimmed, language });
  };

  const handleRequest = () => {
    const word = lookup.data?.word ?? searchText.trim().toUpperCase();
    requestWord.mutate(
      { word, language },
      {
        onSuccess: () => {
          setRequested((prev) => new Set(prev).add(word));
        },
      }
    );
  };

  const renderResults = () => {
    if (lookup.isPending) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (lookup.isError) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            Something went wrong. Please try again.
          </Text>
        </View>
      );
    }

    if (!lookup.data) {
      return (
        <View style={styles.centered}>
          <Text style={styles.hintText}>
            Look up a word to check if it's valid and see its definition.
          </Text>
        </View>
      );
    }

    if (!lookup.data.found) {
      const word = lookup.data.word ?? '';
      const isRequested = requested.has(word);

      return (
        <View style={styles.centered}>
          <Text style={styles.notFoundText}>
            &quot;{word}&quot; was not found in the dictionary.
          </Text>
          {isRequested ? (
            <View style={styles.requestedContainer}>
              <Text style={styles.requestedIcon}>✓</Text>
              <Text style={styles.requestedText}>
                Request sent! We&apos;ll review it.
              </Text>
            </View>
          ) : (
            <Button
              label={requestWord.isPending ? 'Requesting...' : 'Request Addition'}
              onPress={handleRequest}
              variant="outline"
              size="md"
              rounded
              disabled={requestWord.isPending}
              style={styles.requestButton}
            />
          )}
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <DefinitionContent wordInfo={lookup.data.data!} />
      </ScrollView>
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
      <Text style={styles.title}>Dictionary</Text>

      <View style={styles.searchRow}>
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Type a word..."
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <Pressable
          style={({ pressed }) => [
            styles.searchButton,
            {
              opacity:
                pressed && searchText.trim().length >= 2
                  ? 0.7
                  : searchText.trim().length < 2
                    ? 0.5
                    : 1,
            },
          ]}
          onPress={handleSearch}
          disabled={searchText.trim().length < 2}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </Pressable>
      </View>

      {renderResults()}

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
  searchRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  searchInput: {
    flex: 1,
    height: DIMENSIONS.modalInputHeight,
    backgroundColor: colors.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchButton: {
    height: DIMENSIONS.modalInputHeight,
    paddingHorizontal: SPACING.lg,
    backgroundColor: colors.primary,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  scrollView: {
    height: 350,
    marginBottom: SPACING.lg,
  },
  centered: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  hintText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    color: '#EF4444',
    textAlign: 'center',
  },
  notFoundText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  requestButton: {
    marginTop: SPACING.sm,
  },
  requestedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  requestedIcon: {
    fontSize: 14,
    color: colors.gameWon,
  },
  requestedText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  resultWord: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: SPACING.md,
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
  etymologyText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  proverbItem: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  proverbQuote: {
    fontSize: 24,
    color: colors.primary,
    marginRight: SPACING.xs,
    marginTop: -4,
    fontWeight: 'bold',
  },
  proverbText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
});
