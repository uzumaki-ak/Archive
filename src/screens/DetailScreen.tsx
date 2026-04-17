/**
 * DetailScreen — Editorial book detail (Dark Hero + Floating Card)
 *
 * Inspired by modern e-commerce book apps:
 * - Dark background with large centered cover
 * - White floating card sliding up with metadata
 * - Pill-style metadata chips
 * - "Save to Library" CTA
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';

import { useAppDispatch, useAppSelector } from '../store';
import { toggleSaved, selectIsSaved } from '../store/slices/savedLibrarySlice';
import { getCoverUrl, fetchBookDetail } from '../api/openLibrary';
import { extractDescription } from '../utils/sanitize';
import { logger } from '../utils/logger';
import { useTheme, Typography, Spacing, FontSizes, Radius } from '../theme';
import type { RootStackProps } from '../navigation/types';
import type { BookDetail } from '../types';

const { width, height } = Dimensions.get('window');
const COVER_SECTION_HEIGHT = height * 0.42;
const COVER_WIDTH = width * 0.45;
const COVER_HEIGHT = COVER_WIDTH * 1.5;

type Props = RootStackProps<'Detail'>;

export default function DetailScreen({ route, navigation }: Props) {
  const { book } = route.params;
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const isSaved = useAppSelector(selectIsSaved(book.key));
  const { colors, isDark } = useTheme();

  const [detail, setDetail] = useState<BookDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Fetch full detail ───────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    async function load() {
      setDetailLoading(true);
      try {
        const data = await fetchBookDetail(book.key, controller.signal);
        if (mounted) setDetail(data);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          logger.warn('DetailScreen', 'fetchBookDetail failed', err);
        }
      } finally {
        if (mounted) setDetailLoading(false);
      }
    }

    load();
    return () => { mounted = false; controller.abort(); };
  }, [book.key]);

  const handleSaveToggle = useCallback(() => {
    dispatch(toggleSaved(book));
  }, [dispatch, book]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // ── Data ────────────────────────────────────────────────────────────────
  const authorName = book.author_name?.[0] ?? 'Unknown Author';
  const year = book.first_publish_year ? String(book.first_publish_year) : null;
  const publisher = book.publisher?.[0] ?? null;
  const pages = book.number_of_pages_median ?? null;
  const editions = book.edition_count ?? null;
  const languages = book.language?.slice(0, 3) ?? [];
  const subjects = (detail?.subjects ?? book.subject ?? []).slice(0, 5);
  const description = detail ? extractDescription(detail.description) : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* ── Dark Hero Section ─────────────────────────────────── */}
        <View style={[styles.heroSection, { paddingTop: insets.top }]}>
          {/* Back + Save buttons */}
          <Animated.View entering={FadeIn.delay(100)} style={styles.topBar}>
            <Pressable onPress={handleBack} style={styles.circleBtn} hitSlop={12}>
              <Icon name="x" size={20} color="#F2F2F2" />
            </Pressable>
            <Pressable onPress={handleSaveToggle} style={styles.circleBtn} hitSlop={12}>
              <Icon
                name={isSaved ? 'check' : 'bookmark'}
                size={20}
                color={isSaved ? '#4A5D4E' : '#F2F2F2'}
              />
            </Pressable>
          </Animated.View>

          {/* Cover Image */}
          <Animated.View entering={FadeInDown.delay(150).springify().damping(16)} style={styles.coverWrap}>
            {book.cover_i ? (
              <Image
                source={{ uri: getCoverUrl(book.cover_i, 'L') }}
                style={styles.coverImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.coverImage, styles.coverPlaceholder]}>
                <Text style={styles.coverInitial}>
                  {book.title.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </Animated.View>
        </View>

        {/* ── Floating White Card ──────────────────────────────── */}
        <Animated.View
          entering={FadeInUp.delay(250).springify().damping(18)}
          style={[styles.card, { backgroundColor: colors.surfaceElevated }]}
        >
          {/* Title + Author */}
          <View style={styles.titleBlock}>
            <Text style={[styles.bookTitle, { color: colors.text }]}>
              {book.title}
            </Text>
            <View style={styles.authorRow}>
              <Text style={[styles.authorLabel, { color: colors.textMuted }]}>
                Author
              </Text>
              <Text style={[styles.authorName, { color: colors.text }]}>
                {authorName}
              </Text>
            </View>
            {year && (
              <Text style={[styles.year, { color: colors.textMuted }]}>
                First published {year}
              </Text>
            )}
          </View>

          {/* Description */}
          {detailLoading ? (
            <View style={styles.descLoader}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : description ? (
            <Animated.View entering={FadeIn.delay(350)}>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {description}
              </Text>
            </Animated.View>
          ) : null}

          {/* Metadata Pills */}
          <View style={styles.pillRow}>
            {pages && (
              <MetaPill
                label="Length"
                value={`${pages} Pages`}
                colors={colors}
              />
            )}
            {languages.length > 0 && (
              <MetaPill
                label="Language"
                value={languages[0].toUpperCase()}
                colors={colors}
              />
            )}
            {editions && (
              <MetaPill
                label="Editions"
                value={String(editions)}
                colors={colors}
              />
            )}
          </View>

          {publisher && (
            <View style={[styles.publisherRow, { borderColor: colors.border }]}>
              <Text style={[styles.publisherLabel, { color: colors.textMuted }]}>
                Publisher
              </Text>
              <Text style={[styles.publisherValue, { color: colors.text }]}>
                {publisher}
              </Text>
            </View>
          )}

          {/* Subjects */}
          {subjects.length > 0 && (
            <Animated.View entering={FadeIn.delay(400)} style={styles.subjectsBlock}>
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                SUBJECTS
              </Text>
              <View style={styles.tags}>
                {subjects.map((s) => (
                  <View key={s} style={[styles.tag, { backgroundColor: colors.accentMuted }]}>
                    <Text style={[styles.tagText, { color: colors.accent }]}>{s}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>

      {/* ── Bottom CTA ────────────────────────────────────────── */}
      <Animated.View
        entering={FadeInUp.delay(400).springify()}
        style={[
          styles.bottomCta,
          {
            paddingBottom: insets.bottom + Spacing.md,
            backgroundColor: isSaved ? colors.accent : colors.text,
          },
        ]}
      >
        <Pressable
          onPress={handleSaveToggle}
          style={styles.ctaPress}
          accessibilityRole="button"
        >
          <Icon
            name={isSaved ? 'check' : 'plus'}
            size={20}
            color={isSaved ? '#F2F2F2' : colors.background}
          />
          <Text style={[styles.ctaText, { color: isSaved ? '#F2F2F2' : colors.background }]}>
            {isSaved ? 'Saved to Library' : 'Save to Library'}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ─── MetaPill ─────────────────────────────────────────────────────────────────

function MetaPill({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={[pillStyles.container, { borderColor: colors.border }]}>
      <Text style={[pillStyles.label, { color: colors.textMuted }]}>{label}:</Text>
      <Text style={[pillStyles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: 6,
  },
  label: {
    fontFamily: Typography.label,
    fontSize: FontSizes.xs,
    letterSpacing: 0.5,
  },
  value: {
    fontFamily: Typography.bodyMedium,
    fontSize: FontSizes.sm,
  },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Hero
  heroSection: {
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    paddingBottom: Spacing.xxl,
    minHeight: COVER_SECTION_HEIGHT,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 20,
  },
  coverImage: {
    width: COVER_WIDTH,
    height: COVER_HEIGHT,
    borderRadius: Radius.md,
  },
  coverPlaceholder: {
    backgroundColor: '#4A5D4E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverInitial: {
    fontFamily: Typography.displayBold,
    fontSize: FontSizes.display,
    color: 'rgba(255,255,255,0.6)',
  },
  // Card
  card: {
    marginTop: -Spacing.lg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    minHeight: height * 0.5,
  },
  titleBlock: {
    marginBottom: Spacing.lg,
  },
  bookTitle: {
    fontFamily: Typography.displayBold,
    fontSize: FontSizes.xxl,
    lineHeight: 34,
    marginBottom: Spacing.sm,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  authorLabel: {
    fontFamily: Typography.label,
    fontSize: FontSizes.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  authorName: {
    fontFamily: Typography.bodyMedium,
    fontSize: FontSizes.md,
  },
  year: {
    fontFamily: Typography.mono,
    fontSize: FontSizes.xs,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  description: {
    fontFamily: Typography.body,
    fontSize: FontSizes.md,
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  publisherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    alignSelf: 'flex-start',
  },
  publisherLabel: {
    fontFamily: Typography.label,
    fontSize: FontSizes.xs,
    letterSpacing: 0.5,
  },
  publisherValue: {
    fontFamily: Typography.bodyMedium,
    fontSize: FontSizes.sm,
  },
  sectionLabel: {
    fontFamily: Typography.label,
    fontSize: FontSizes.xs,
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  subjectsBlock: {
    marginTop: Spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
  },
  tagText: {
    fontFamily: Typography.body,
    fontSize: FontSizes.sm,
  },
  descLoader: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  // Bottom CTA
  bottomCta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  ctaPress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  ctaText: {
    fontFamily: Typography.ui,
    fontSize: FontSizes.lg,
    letterSpacing: 0.3,
  },
});
