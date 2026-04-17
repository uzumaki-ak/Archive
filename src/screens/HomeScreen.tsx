/**
 * HomeScreen — Pinterest masonry feed with sticky collapsing header
 * Header shrinks on scroll and stays fixed at top. No scroll glitch.
 */

import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { MasonryFlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BookCard from '../components/BookCard';
import { Loader, EmptyState } from '../components';
import { useAppDispatch, useAppSelector } from '../store';
import {
  loadBooks,
  loadMoreBooks,
  selectBooks,
  selectBooksStatus,
  selectBooksError,
  selectBooksPage,
  selectHasMore,
  selectIsStale,
} from '../store/slices/booksSlice';
import { useAppState } from '../hooks/useAppState';
import { useTheme, Typography, Spacing, FontSizes } from '../theme';
import type { Book } from '../types';
import type { TabScreenProps } from '../navigation/types';

type Props = TabScreenProps<'Home'>;

const HEADER_EXPANDED = 120;
const HEADER_COLLAPSED = 52;
const SCROLL_RANGE = HEADER_EXPANDED - HEADER_COLLAPSED;

export default function HomeScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const books = useAppSelector(selectBooks);
  const status = useAppSelector(selectBooksStatus);
  const error = useAppSelector(selectBooksError);
  const page = useAppSelector(selectBooksPage);
  const hasMore = useAppSelector(selectHasMore);
  const isStale = useAppSelector(selectIsStale);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const scrollY = useSharedValue(0);

  const isLoading = status === 'loading';
  const isLoadingMore = status === 'loadingMore';
  const isRefreshing = status === 'loading' && books.length > 0;

  useEffect(() => {
    if (books.length === 0 || isStale) dispatch(loadBooks());
  }, []);

  useAppState({
    onForeground: useCallback(() => {
      if (isStale) dispatch(loadBooks());
    }, [dispatch, isStale]),
  });

  const handleRefresh = useCallback(() => { dispatch(loadBooks()); }, [dispatch]);

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore && status === 'succeeded') {
      dispatch(loadMoreBooks(page));
    }
  }, [dispatch, hasMore, isLoadingMore, page, status]);

  const handleBookPress = useCallback(
    (book: Book) => { navigation.navigate('Detail', { book }); },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Book; index: number }) => (
      <BookCard book={item} onPress={handleBookPress} index={index} />
    ),
    [handleBookPress],
  );

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }, [isLoadingMore, colors]);

  const keyExtractor = useCallback((item: Book) => item.key, []);

  // Simple JS onScroll — update shared value without wrapping the list
  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.value = e.nativeEvent.contentOffset.y;
  }, [scrollY]);

  // Animated styles for collapsing header
  const headerStyle = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [0, SCROLL_RANGE], [HEADER_EXPANDED, HEADER_COLLAPSED], Extrapolation.CLAMP),
  }));

  const kickerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, SCROLL_RANGE * 0.3], [1, 0], Extrapolation.CLAMP),
    height: interpolate(scrollY.value, [0, SCROLL_RANGE * 0.4], [16, 0], Extrapolation.CLAMP),
  }));

  const titleStyle = useAnimatedStyle(() => ({
    fontSize: interpolate(scrollY.value, [0, SCROLL_RANGE], [36, 18], Extrapolation.CLAMP),
  }));

  const dividerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, SCROLL_RANGE * 0.5], [1, 0], Extrapolation.CLAMP),
    height: interpolate(scrollY.value, [0, SCROLL_RANGE * 0.5], [1, 0], Extrapolation.CLAMP),
  }));

  const totalHeaderHeight = insets.top + HEADER_EXPANDED;

  if (isLoading && books.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />
        <Loader fullScreen />
      </View>
    );
  }

  if (status === 'failed' && books.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />
        <EmptyState icon="Error" title="Could not load books" subtitle={error ?? 'Check your connection.'} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      {/* Sticky Collapsing Header — fixed at top, shrinks on scroll */}
      <Animated.View
        style={[
          styles.stickyHeader,
          { paddingTop: insets.top, backgroundColor: colors.background },
          headerStyle,
        ]}
      >
        <Animated.Text style={[styles.kicker, { color: colors.accent }, kickerStyle]} numberOfLines={1}>
          THE ARCHIVE
        </Animated.Text>
        <Animated.Text style={[styles.heroTitle, { color: colors.text }, titleStyle]} numberOfLines={1}>
          Curated Selection
        </Animated.Text>
        <Animated.View style={[styles.divider, { backgroundColor: colors.border }, dividerStyle]} />
      </Animated.View>

      {/* List — starts below the header */}
      <MasonryFlashList
        data={books}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        estimatedItemSize={260}
        contentContainerStyle={{
          ...styles.listContent,
          paddingTop: totalHeaderHeight + Spacing.sm,
        }}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <EmptyState icon="Library" title="The archive is quiet" subtitle="Pull down to refresh" />
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressViewOffset={totalHeaderHeight}
          />
        }
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'flex-end',
    paddingBottom: Spacing.sm,
    overflow: 'hidden',
  },
  kicker: {
    fontFamily: Typography.label,
    fontSize: 11,
    letterSpacing: 4,
    marginBottom: Spacing.xs,
  },
  heroTitle: {
    fontFamily: Typography.displayBold,
    marginBottom: Spacing.xs,
  },
  divider: { width: 60 },
  listContent: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: 120,
  },
  footer: { paddingVertical: Spacing.xl, alignItems: 'center' },
});
