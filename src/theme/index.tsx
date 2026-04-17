/**
 * THE ARCHIVE — Design System v2
 * Anti-AI Aesthetic: Minimalist Brutalism meets Swiss Typography
 * Dark mode default, Light mode toggle.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';

// ─── Typography ──────────────────────────────────────────────────────────────

export const Typography = {
  // Display / Headlines — Syne ExtraBold
  displayBold: 'Syne-ExtraBold',
  displayRegular: 'Syne-Bold',

  // Serif Accent — Cormorant Garamond Italic (for "human" words in headings)
  serifAccent: 'CormorantGaramond-Italic',

  // Data / Technical — IBM Plex Mono
  mono: 'IBMPlexMono-Regular',
  monoMedium: 'IBMPlexMono-Medium',

  // Primary UI — Bricolage Grotesque (buttons, nav labels)
  ui: 'BricolageGrotesque-Variable',

  // Secondary / Labels — Space Mono
  label: 'SpaceMono-Regular',

  // Body — Inter
  body: 'Inter-Regular',
  bodyMedium: 'Inter-Medium',
  bodyBold: 'Inter-Bold',

  // Legacy aliases (keep old imports from breaking)
  serif: 'CormorantGaramond-Italic',
  serifItalic: 'CormorantGaramond-Italic',
  sansRegular: 'Inter-Regular',
  sansMedium: 'Inter-Medium',
  sansSemiBold: 'Inter-Medium',
  sansBold: 'Inter-Bold',
} as const;

// ─── Color Palettes ──────────────────────────────────────────────────────────

const DarkPalette = {
  background: '#050505',
  surface: '#0F0F0F',
  surfaceElevated: '#1A1A1A',
  text: '#F2F2F2',
  textSecondary: '#999999',
  textMuted: '#666666',
  accent: '#4A5D4E',
  accentLight: '#6B8F72',
  accentMuted: 'rgba(74, 93, 78, 0.2)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderSubtle: 'rgba(255, 255, 255, 0.04)',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.7)',
  error: '#E84855',
  success: '#4A5D4E',
  cardBackground: '#111111',
  tabBar: 'rgba(15, 15, 15, 0.92)',
  tabBarBorder: 'rgba(255, 255, 255, 0.06)',
  pill: 'rgba(74, 93, 78, 0.15)',
  statusBar: 'light-content' as const,
} as const;

const LightPalette = {
  background: '#FDFCFB',
  surface: '#F5F2EE',
  surfaceElevated: '#FFFFFF',
  text: '#121212',
  textSecondary: '#6B6560',
  textMuted: '#A09890',
  accent: '#4A5D4E',
  accentLight: '#6B8F72',
  accentMuted: 'rgba(74, 93, 78, 0.1)',
  border: 'rgba(18, 18, 18, 0.08)',
  borderSubtle: 'rgba(18, 18, 18, 0.04)',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(18, 18, 18, 0.5)',
  error: '#8B2635',
  success: '#4A5D4E',
  cardBackground: '#FFFFFF',
  tabBar: 'rgba(253, 252, 251, 0.92)',
  tabBarBorder: 'rgba(18, 18, 18, 0.06)',
  pill: 'rgba(74, 93, 78, 0.1)',
  statusBar: 'dark-content' as const,
} as const;

export type ThemePalette = typeof DarkPalette;
export type ThemeMode = 'dark' | 'light';

// ─── Spacing & Layout ────────────────────────────────────────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const Radius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
  display: 48,
} as const;

// ─── Legacy Colors export (backward compat) ──────────────────────────────────

export const Colors = {
  background: '#FDFCFB',
  text: '#121212',
  accent: '#4A5D4E',
  accentLight: '#6B8F72',
  accentMuted: '#E8EDE9',
  surface: '#F5F2EE',
  border: '#E2DDD8',
  muted: '#8A8078',
  mutedLight: '#C4BDB5',
  white: '#FFFFFF',
  overlay: 'rgba(18,18,18,0.5)',
  error: '#8B2635',
  success: '#4A5D4E',
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 48,
    elevation: 16,
  },
} as const;

// ─── Theme Context ───────────────────────────────────────────────────────────

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemePalette;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  colors: DarkPalette,
  toggleTheme: () => {},
  isDark: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('dark'); // Default dark

  const toggleTheme = useCallback(() => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const colors = mode === 'dark' ? DarkPalette : LightPalette;
  const isDark = mode === 'dark';

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// ─── Default Export ──────────────────────────────────────────────────────────

const Theme = {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadow,
  FontSizes,
};

export default Theme;
