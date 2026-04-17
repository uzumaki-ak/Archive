/**
 * SavedScreen — Personal Library
 * Dark mode aware, consistent with HomeScreen design language.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MasonryFlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';

import BookCard from '../components/BookCard';
import { EmptyState } from '../components';
import { ThemedHeading } from '../components/common/Typography';
import { useAppDispatch, useAppSelector } from '../store';
import {
  selectSavedBooks,
  clearLibrary,
} from '../store/slices/savedLibrarySlice';
import { useTheme, Typography, Spacing, FontSizes } from '../theme';
import type { Book } from '../types';
import type { TabScreenProps } from '../navigation/types';

type Props = TabScreenProps<'Saved'>;

export default function SavedScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const books = useAppSelector(selectSavedBooks);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const handleBookPress = useCallback(
    (book: Book) => { navigation.navigate('Detail', { book }); },
    [navigation],
  );

  const handleClearAll = useCallback(() => {
    dispatch(clearLibrary());
  }, [dispatch]);

  const renderItem = useCallback(
    ({ item, index }: { item: Book; index: number }) => (
      <BookCard book={item} onPress={handleBookPress} index={index} />
    ),
    [handleBookPress],
  );

  const keyExtractor = useCallback((item: Book) => item.key, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.kicker, { color: colors.accent }]}>PERSONAL COLLECTION</Text>
          <ThemedHeading level={2}>My Library</ThemedHeading>
          <Text style={[styles.count, { color: colors.textMuted }]}>
            {books.length === 0
              ? 'Nothing saved yet'
              : `${books.length} book${books.length !== 1 ? 's' : ''} saved`}
          </Text>
        </View>

        {books.length > 0 && (
          <Pressable
            onPress={handleClearAll}
            hitSlop={12}
            style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.5 }]}
          >
            <Icon name="trash-2" size={16} color={colors.error} />
            <Text style={[styles.clearLabel, { color: colors.error }]}>Clear</Text>
          </Pressable>
        )}
      </Animated.View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {books.length === 0 ? (
        <EmptyState
          icon="Library"
          title="Your library is empty"
          subtitle="Save books from the Archive or Search to build your collection."
        />
      ) : (
        <MasonryFlashList
          data={books}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={2}
          estimatedItemSize={260}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: { flex: 1 },
  kicker: {
    fontFamily: Typography.label,
    fontSize: 11,
    letterSpacing: 4,
    marginBottom: Spacing.xs,
  },
  count: {
    fontFamily: Typography.mono,
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
    letterSpacing: 0.5,
  },
  divider: { height: 1, marginHorizontal: Spacing.lg, opacity: 0.5 },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    marginTop: Spacing.lg,
  },
  clearLabel: {
    fontFamily: Typography.label,
    fontSize: FontSizes.xs,
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: 120,
  },
});
