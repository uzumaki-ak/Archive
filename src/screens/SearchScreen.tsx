/**
 * SearchScreen — Full-screen focused search interface
 * Dark mode aware, consistent design language.
 */

import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';

import { SearchBar, EmptyState } from '../components';
import BookCard from '../components/BookCard';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setQuery,
  clearSearch,
  addToHistory,
  removeFromHistory,
  performSearch,
  loadMoreSearchResults,
  selectSearchQuery,
  selectSearchResults,
  selectSearchStatus,
  selectSearchError,
  selectSearchHistory,
  selectSearchHasMore,
  selectSearchPage,
} from '../store/slices/searchSlice';
import { useDebounce } from '../hooks/useDebounce';
import { useTheme, Typography, Spacing, Radius, FontSizes } from '../theme';
import type { Book } from '../types';
import type { TabScreenProps } from '../navigation/types';

type Props = TabScreenProps<'Search'>;

export default function SearchScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const query = useAppSelector(selectSearchQuery);
  const results = useAppSelector(selectSearchResults);
  const status = useAppSelector(selectSearchStatus);
  const error = useAppSelector(selectSearchError);
  const history = useAppSelector(selectSearchHistory);
  const hasMore = useAppSelector(selectSearchHasMore);
  const page = useAppSelector(selectSearchPage);

  const debouncedQuery = useDebounce(query, 500);
  const isLoadingMore = status === 'loadingMore';
  const isSearching = status === 'loading';
  const hasResults = results.length > 0;
  const showHistory = !query && history.length > 0;
  const showEmpty = status === 'succeeded' && !hasResults && !!debouncedQuery;

  useEffect(() => {
    if (debouncedQuery.trim().length >= 3) {
      dispatch(performSearch({ query: debouncedQuery, page: 1 }));
    }
  }, [debouncedQuery, dispatch]);

  useEffect(() => {
    if (status === 'succeeded' && hasResults && debouncedQuery) {
      dispatch(addToHistory(debouncedQuery));
    }
  }, [status, hasResults, debouncedQuery, dispatch]);

  const handleQueryChange = useCallback((text: string) => { dispatch(setQuery(text)); }, [dispatch]);
  const handleClear = useCallback(() => { dispatch(clearSearch()); }, [dispatch]);
  const handleHistoryPress = useCallback((term: string) => { dispatch(setQuery(term)); }, [dispatch]);
  const handleRemoveHistory = useCallback((term: string) => { dispatch(removeFromHistory(term)); }, [dispatch]);
  const handleBookPress = useCallback((book: Book) => { navigation.navigate('Detail', { book }); }, [navigation]);

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore && status === 'succeeded' && query) {
      dispatch(loadMoreSearchResults({ query, page }));
    }
  }, [dispatch, hasMore, isLoadingMore, page, query, status]);

  const renderBook = useCallback(
    ({ item, index }: { item: Book; index: number }) => (
      <View style={styles.cardWrapper}>
        <BookCard book={item} onPress={handleBookPress} index={index} variant="grid" />
      </View>
    ),
    [handleBookPress],
  );

  const keyExtractor = useCallback((item: Book) => item.key, []);

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }, [isLoadingMore, colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <Text style={[styles.kicker, { color: colors.accent }]}>DISCOVER</Text>
        <Text style={[styles.heading, { color: colors.text }]}>Search</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar value={query} onChangeText={handleQueryChange} onClear={handleClear} autoFocus={false} />
        {!!query && query.length < 3 && (
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Type at least 3 characters
          </Text>
        )}
        {!!query && hasResults && (
          <Text style={[styles.resultCount, { color: colors.textMuted }]}>
            {results.length} results
          </Text>
        )}
      </View>

      {/* History */}
      {showHistory && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.historyContainer}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>RECENT SEARCHES</Text>
          {history.map((term) => (
            <View key={term} style={[styles.historyRow, { borderBottomColor: colors.border }]}>
              <Pressable onPress={() => handleHistoryPress(term)} style={styles.historyTerm}>
                <Icon name="clock" size={14} color={colors.textMuted} />
                <Text style={[styles.historyText, { color: colors.text }]}> {term}</Text>
              </Pressable>
              <Pressable onPress={() => handleRemoveHistory(term)} hitSlop={12}>
                <Icon name="x" size={14} color={colors.textMuted} />
              </Pressable>
            </View>
          ))}
        </Animated.View>
      )}

      {/* Loading */}
      {isSearching && results.length === 0 && (
        <View style={styles.searchingLoader}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={[styles.searchingText, { color: colors.textMuted }]}>Searching the archive…</Text>
        </View>
      )}

      {/* Results — using plain FlatList for stability */}
      {hasResults && (
        <FlatList
          data={results}
          renderItem={renderBook}
          keyExtractor={keyExtractor}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}

      {/* Empty */}
      {showEmpty && (
        <EmptyState icon="Search" title={`Nothing found for "${debouncedQuery}"`} subtitle="Try different keywords or check spelling." />
      )}

      {/* Error */}
      {status === 'failed' && (
        <View style={[styles.errorContainer, { backgroundColor: colors.surfaceElevated }]}>
          <Icon name="alert-circle" size={20} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error?.includes('422') ? 'Try a more specific search term' : error}
          </Text>
        </View>
      )}

      {/* Idle */}
      {!query && !showHistory && (
        <View style={styles.idleState}>
          <Icon name="book-open" size={48} color={colors.textMuted} style={{ opacity: 0.15 }} />
          <Text style={[styles.idleText, { color: colors.textMuted }]}>
            Search across{'\n'}millions of books
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  kicker: {
    fontFamily: Typography.label,
    fontSize: 11,
    letterSpacing: 4,
    marginBottom: Spacing.xs,
  },
  heading: {
    fontFamily: Typography.displayBold,
    fontSize: FontSizes.xxxl,
    lineHeight: 42,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  hint: {
    fontFamily: Typography.mono,
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
    letterSpacing: 0.3,
  },
  resultCount: {
    fontFamily: Typography.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 0.3,
    marginTop: Spacing.xs,
  },
  historyContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  sectionLabel: {
    fontFamily: Typography.label,
    fontSize: FontSizes.xs,
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyTerm: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  historyText: {
    fontFamily: Typography.body,
    fontSize: FontSizes.md,
  },
  listContent: {
    paddingHorizontal: Spacing.xs,
    paddingTop: Spacing.sm,
    paddingBottom: 120,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  searchingLoader: {
    paddingTop: Spacing.xxxl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  searchingText: {
    fontFamily: Typography.mono,
    fontSize: FontSizes.sm,
  },
  idleState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.lg,
  },
  idleText: {
    fontFamily: Typography.serifAccent,
    fontSize: FontSizes.xxl,
    textAlign: 'center',
    lineHeight: 36,
  },
  footer: { paddingVertical: Spacing.xl, alignItems: 'center' },
  errorContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  errorText: {
    fontFamily: Typography.body,
    fontSize: FontSizes.md,
    flex: 1,
  },
  cardWrapper: {
    flex: 1,
    maxWidth: '50%',
  },
});
