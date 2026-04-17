# The Archive

> A sophisticated, editorial-grade Book Browser built with React Native CLI.

---

## App Functionality

**The Archive** is a mobile book discovery app that lets users:

- **Browse** a curated, infinite-scrolling grid of books sourced from the Open Library API
- **Search** across millions of titles and authors with real-time debounced results and paginated infinite scroll
- **View** an editorial book detail screen with large cover art, full metadata, description, and subject tags
- **Save** books to a personal offline library that survives app restarts
- **Revisit** recent searches through a persisted search history

The aesthetic is "Modern Library" — minimalist, spacious, and tactile — using Instrument Serif for headings and Inter for metadata.

---

## Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Home | `MainTabs → Home` | Infinite-scroll 2-column book grid |
| Search | `MainTabs → Search` | Debounced search with history + paginated results |
| Detail | `RootStack → Detail` | Editorial detail with parallax cover + save toggle |
| Saved | `MainTabs → Saved` | Offline personal library from MMKV storage |

---

## How to Run

### Prerequisites

- Node.js ≥ 18
- React Native CLI environment set up ([official guide](https://reactnative.dev/docs/environment-setup))
- Android Studio (for Android) or Xcode ≥ 15 (for iOS)
- CocoaPods (iOS only): `brew install cocoapods`

### Install

```bash
git clone https://github.com/uzumaki-ak/Archive.git
cd Archive
npm install

# iOS only
cd ios && pod install && cd ..
```

### Add Fonts

Download **Instrument Serif** and **Inter** from Google Fonts and place `.ttf` files in:
```
android/app/src/main/assets/fonts/
ios/TheArchive/fonts/
```

Then link (React Native ≥ 0.60 auto-links, but fonts need manual copy for iOS):
```bash
npx react-native-asset
```

### Run

```bash
# Start Metro bundler
npm start

# Android
npm run android

# iOS
npm run ios
```

### Build APK (for submission)

```bash
cd android
./gradlew assembleRelease
# APK → android/app/build/outputs/apk/release/app-release.apk
```

---

## Architecture

```
src/
├── api/
│   └── openLibrary.ts       # All network calls. AbortController + timeout.
├── components/
│   ├── BookCard.tsx          # Memoized grid card with staggered animation
│   └── index.tsx             # SearchBar, Loader, EmptyState, SaveButton
├── hooks/
│   ├── useDebounce.ts        # 400ms debounce for search input
│   └── useAppState.ts        # AppState foreground/background lifecycle
├── navigation/
│   ├── AppNavigator.tsx      # Root Stack + Bottom Tabs setup
│   └── types.ts              # Typed navigation params
├── screens/
│   ├── HomeScreen.tsx        # Infinite scroll feed + foreground refresh
│   ├── SearchScreen.tsx      # Debounced search + history + pagination
│   ├── DetailScreen.tsx      # Parallax cover + metadata + save
│   └── SavedScreen.tsx       # Offline MMKV-backed personal library
├── store/
│   ├── index.ts              # Store config + typed hooks
│   ├── persist.ts            # MMKV adapter for redux-persist
│   └── slices/
│       ├── booksSlice.ts     # Home feed: load, paginate, stale check
│       ├── searchSlice.ts    # Search: query, results, history
│       └── savedLibrarySlice.ts # Saved books: toggle, persist
├── theme/
│   └── index.ts              # Design tokens: colors, typography, spacing
├── types/
│   └── index.ts              # Shared TypeScript interfaces
└── utils/
    ├── logger.ts             # Structured logger (dev-only)
    └── sanitize.ts           # Input sanitization before API/state
```

---

## Key Technical Decisions

### React Native CLI (not Expo)
Chosen for full native access, no Expo overhead (~50MB removed from bundle), direct control over the New Architecture (Bridgeless/JSI), and alignment with production engineering standards.

### Redux Toolkit
RTK eliminates boilerplate by ~70% over vanilla Redux. `createAsyncThunk` gives us automatic loading/error state management. Typed slices with selectors keep screens thin — they only consume data, never fetch it.

### MMKV over AsyncStorage
`react-native-mmkv` is synchronous at the JSI level (~30x faster than AsyncStorage). No async/await in the storage layer, no bridge round-trips. In a production app with auth tokens, MMKV would be initialised with an `encryptionKey` fetched from Android Keystore / `react-native-keychain`.

### FlashList over FlatList
Shopify's FlashList recycles cells using a fundamentally different algorithm that avoids blank cells during fast scrolling. For a 2-column book grid with cover images, this is a measurable UX improvement.

### Reanimated 3 (Worklets)
All animations run on the UI thread via Reanimated worklets — never on the JS thread. This means scroll-linked parallax on DetailScreen and entrance animations on BookCard are immune to JS busy states.

### Selective Persistence
Only two things survive app restarts via redux-persist + MMKV:
- `savedLibrary` — full book objects (100% offline access)
- `search.history` — recent search terms (max 10)

The books feed is intentionally NOT persisted. It re-fetches on launch and checks a 5-minute staleness threshold on foreground events, always showing fresh content.

### AbortController on every API call
Every fetch is cancellable. Detail screens abort their request on unmount. Redux thunks receive the RTK `signal` and forward it to the API layer. This prevents stale responses from updating state after navigation.

### Input Sanitization
All search queries are sanitized (`sanitizeSearchQuery`) before they reach the API layer — length capped at 100 characters, dangerous characters stripped. API responses are validated (type checks on `key` and `title`) before entering Redux state.

### Structured Logging
A namespaced logger (`logger.info/warn/error`) is used throughout. It's automatically silenced in production builds via `__DEV__`. It never logs API response bodies (which could contain user PII in a real service).

---

## Improvements With More Time

1. **React Navigation v8 + Liquid Glass Tabs** — v8 alpha supports native iOS liquid glass tab bars on iOS 26. Worth upgrading once stable.
2. **WatermelonDB for offline-first** — For a proper offline mode, WatermelonDB with lazy loading would replace the MMKV persistence of full book objects. It scales to 10,000+ saved books without memory pressure.
3. **React Query / TanStack Query** — Would handle caching, background refetching, and request deduplication more elegantly than manual `lastFetchedAt` stale checking.
4. **Optimistic UI** — Save/unsave actions could update the UI immediately before the Redux write completes.
5. **E2E tests with Maestro** — Maestro is the current standard for React Native E2E; would add flows for search, save, and pagination.
6. **Error boundaries** — React error boundaries per screen to prevent a single screen crash from taking down the whole app.
7. **Accessibility audit** — Full VoiceOver/TalkBack audit with proper `accessibilityHint`, `accessibilityRole`, and live region announcements.
8. **Image caching** — Replace core `Image` with `react-native-fast-image` for LRU disk caching of cover images — significant improvement on slow networks.
9. **CodePush / OTA updates** — For rapid iteration post-release without full App Store submissions.
10. **Android Keystore encryption** — Enable MMKV encryption with a key stored in Android Keystore and iOS Keychain for full data-at-rest security.

---

## API

This app uses the [Open Library API](https://openlibrary.org/developers/api) — fully public, no API key required.

| Endpoint | Used For |
|----------|----------|
| `GET /search.json?subject={s}&page={p}` | Home feed |
| `GET /search.json?q={query}&page={p}` | Search |
| `GET /works/{key}.json` | Book detail + description |
| `https://covers.openlibrary.org/b/id/{id}-M.jpg` | Cover images |
