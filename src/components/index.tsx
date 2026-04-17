/**
 * Shared UI Components
 * SearchBar · Loader · EmptyState · SaveButton
 * All theme-aware (dark/light mode).
 */

import React, { useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { ThemedText, ThemedHeading } from './common/Typography';
import {
  useTheme,
  Typography,
  Spacing,
  Radius,
  FontSizes,
} from '../theme';
import type {
  SearchBarProps,
  LoaderProps,
  EmptyStateProps,
} from '../types';

// ─── SearchBar ────────────────────────────────────────────────────────────────

export function SearchBar({
  value,
  onChangeText,
  onClear,
  placeholder = 'Search books, authors…',
  autoFocus = false,
}: SearchBarProps) {
  const inputRef = useRef<TextInput>(null);
  const { colors } = useTheme();

  return (
    <View style={[searchStyles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Icon name="search" size={18} color={colors.textMuted} style={searchStyles.iconLeft} />
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[searchStyles.input, { color: colors.text }]}
        autoFocus={autoFocus}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
        maxLength={100}
      />
      {value.length > 0 && (
        <Pressable onPress={onClear} hitSlop={12} accessibilityLabel="Clear search" style={searchStyles.clearBtn}>
          <Icon name="x" size={16} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
}

const searchStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    borderWidth: 1,
  },
  iconLeft: { marginRight: Spacing.sm },
  input: {
    flex: 1,
    fontFamily: Typography.body,
    fontSize: FontSizes.md,
    paddingVertical: 0,
  },
  clearBtn: { padding: 4, marginLeft: Spacing.xs },
});

// ─── Loader ───────────────────────────────────────────────────────────────────

export function Loader({ size = 'large', color, fullScreen = false }: LoaderProps) {
  const { colors } = useTheme();
  const loaderColor = color ?? colors.accent;

  if (fullScreen) {
    return (
      <View style={[loaderStyles.fullScreen, { backgroundColor: colors.background }]}>
        <ActivityIndicator size={size} color={loaderColor} />
      </View>
    );
  }

  return (
    <View style={loaderStyles.inline}>
      <ActivityIndicator size={size} color={loaderColor} />
    </View>
  );
}

const loaderStyles = StyleSheet.create({
  fullScreen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  inline: { paddingVertical: Spacing.xl, alignItems: 'center' },
});

// ─── EmptyState ───────────────────────────────────────────────────────────────

const EMPTY_ICONS: Record<string, string> = {
  Library: 'bookmark',
  Error: 'alert-circle',
  Search: 'search',
  default: 'inbox',
};

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  const { colors } = useTheme();
  const iconName = EMPTY_ICONS[icon] ?? EMPTY_ICONS.default;

  return (
    <View style={emptyStyles.container}>
      <View style={[emptyStyles.iconCircle, { backgroundColor: colors.accentMuted }]}>
        <Icon name={iconName} size={32} color={colors.accent} />
      </View>
      <ThemedHeading level={3} align="center">
        {title}
      </ThemedHeading>
      {subtitle && (
        <ThemedText variant="muted" align="center" style={emptyStyles.subtitle}>
          {subtitle}
        </ThemedText>
      )}
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: { marginTop: Spacing.xs, lineHeight: 22, maxWidth: 260 },
});

// ─── SaveButton ───────────────────────────────────────────────────────────────

interface SaveButtonProps {
  isSaved: boolean;
  onPress: () => void;
  size?: 'sm' | 'lg';
}

export function SaveButton({ isSaved, onPress, size = 'lg' }: SaveButtonProps) {
  const { colors } = useTheme();
  const isLarge = size === 'lg';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        saveStyles.button,
        isLarge ? saveStyles.large : saveStyles.small,
        { borderColor: colors.accent },
        isSaved && { backgroundColor: colors.accent },
        pressed && { opacity: 0.75 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={isSaved ? 'Remove from library' : 'Save to library'}
    >
      {isLarge ? (
        <View style={saveStyles.row}>
          <Icon name={isSaved ? 'check' : 'bookmark'} size={16} color={isSaved ? '#F2F2F2' : colors.accent} />
          <Text style={[saveStyles.label, { color: isSaved ? '#F2F2F2' : colors.accent }]}>
            {isSaved ? 'Saved' : 'Save to Library'}
          </Text>
        </View>
      ) : (
        <Icon name={isSaved ? 'check' : 'bookmark'} size={18} color={isSaved ? '#F2F2F2' : colors.accent} />
      )}
    </Pressable>
  );
}

const saveStyles = StyleSheet.create({
  button: {
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  large: { paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.lg },
  small: { width: 36, height: 36 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  label: { fontFamily: Typography.ui, fontSize: FontSizes.md, letterSpacing: 0.3 },
});
