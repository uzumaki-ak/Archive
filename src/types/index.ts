// ─── Open Library API Response Types ────────────────────────────────────────

export interface Book {
  key: string;                       // e.g. '/works/OL45804W'
  title: string;
  author_name?: string[];
  author_key?: string[];
  cover_i?: number;                  // cover ID for cover URL
  first_publish_year?: number;
  publisher?: string[];
  subject?: string[];
  number_of_pages_median?: number;
  isbn?: string[];
  language?: string[];
  edition_count?: number;
  ia?: string[];                     // Internet Archive identifiers
}

export interface BookSearchResponse {
  numFound: number;
  start: number;
  numFoundExact: boolean;
  docs: Book[];
}

export interface BookDetail {
  key: string;
  title: string;
  description?: string | { value: string };
  subjects?: string[];
  subject_places?: string[];
  subject_times?: string[];
  first_publish_date?: string;
  covers?: number[];
  authors?: Array<{ author: { key: string } }>;
  links?: Array<{ url: string; title: string }>;
}

// ─── Redux State Types ───────────────────────────────────────────────────────

export interface BooksState {
  items: Book[];
  status: 'idle' | 'loading' | 'loadingMore' | 'succeeded' | 'failed';
  error: string | null;
  page: number;
  hasMore: boolean;
  totalFound: number;
  lastFetchedAt: number | null;   // Unix timestamp — for stale-check on foreground
}

export interface SearchState {
  query: string;
  results: Book[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  page: number;
  hasMore: boolean;
  history: string[];               // Recent search terms (max 10)
}

export interface SavedLibraryState {
  books: Book[];
}

// ─── Navigation Types ────────────────────────────────────────────────────────

export type RootStackParamList = {
  MainTabs: undefined;
  Detail: { book: Book };
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Saved: undefined;
};

// ─── Component Prop Types ────────────────────────────────────────────────────

export interface BookCardProps {
  book: Book;
  onPress: (book: Book) => void;
  index: number;
}

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export interface LoaderProps {
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
}

export interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
}

// ─── API Types ───────────────────────────────────────────────────────────────

export interface FetchBooksParams {
  page: number;
  limit?: number;
}

export interface SearchBooksParams {
  query: string;
  page: number;
  limit?: number;
}
