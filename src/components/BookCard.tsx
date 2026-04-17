/**
 * BookCard — Supports both masonry (varying heights) and grid (fixed height) modes.
 * Pass variant="grid" for uniform FlatList, or "masonry" for MasonryFlashList.
 */

import React, { memo } from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  Image,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getCoverUrl } from '../api/openLibrary';
import { useTheme, Typography, Spacing, Radius, FontSizes } from '../theme';
import type { BookCardProps } from '../types';

// Vary cover height for masonry mode
const MASONRY_HEIGHTS = [200, 260, 230, 180, 250, 210, 240, 190, 220, 270];
const GRID_HEIGHT = 220;

interface ExtendedBookCardProps extends BookCardProps {
  variant?: 'masonry' | 'grid';
}

function BookCard({ book, onPress, index, variant = 'masonry' }: ExtendedBookCardProps) {
  const { colors } = useTheme();

  const authorText = book.author_name?.[0] ?? 'Unknown Author';
  const yearText = book.first_publish_year ? String(book.first_publish_year) : '';
  const delay = Math.min(index * 40, 250);
  const coverHeight = variant === 'masonry'
    ? MASONRY_HEIGHTS[index % MASONRY_HEIGHTS.length]
    : GRID_HEIGHT;

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(14)} style={styles.wrapper}>
      <Pressable
        onPress={() => onPress(book)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
          },
          pressed && styles.cardPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${book.title} by ${authorText}`}
      >
        <View style={[styles.coverContainer, { height: coverHeight, backgroundColor: colors.surfaceElevated }]}>
          {book.cover_i ? (
            <Image
              source={{ uri: getCoverUrl(book.cover_i, 'M') }}
              style={styles.cover}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.noCover, { backgroundColor: colors.accent }]}>
              <Text style={styles.noCoverText}>
                {book.title.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.meta}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {book.title}
          </Text>
          <Text style={[styles.author, { color: colors.textSecondary }]} numberOfLines={1}>
            {authorText}
          </Text>
          {yearText ? (
            <Text style={[styles.year, { color: colors.textMuted }]}>
              {yearText}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default memo(BookCard);

const styles = StyleSheet.create({
  wrapper: {
    padding: Spacing.xs,
    flex: 1,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  coverContainer: {
    width: '100%',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  noCover: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noCoverText: {
    fontFamily: Typography.displayBold,
    fontSize: FontSizes.xxxl,
    color: 'rgba(255,255,255,0.5)',
  },
  meta: {
    padding: Spacing.sm + 2,
    gap: 2,
  },
  title: {
    fontFamily: Typography.bodyMedium,
    fontSize: FontSizes.sm,
    lineHeight: 18,
  },
  author: {
    fontFamily: Typography.body,
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  year: {
    fontFamily: Typography.mono,
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.5,
  },
});
