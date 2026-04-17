import React from 'react';
import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { Typography, FontSizes, useTheme } from '../../theme';

// ─── ThemedText ──────────────────────────────────────────────────────────────

interface ThemedTextProps extends TextProps {
  variant?: 'body' | 'medium' | 'bold' | 'muted' | 'small' | 'mono' | 'label' | 'ui';
  color?: string; // direct color override
  themeColor?: 'text' | 'textSecondary' | 'textMuted' | 'accent' | 'error';
  align?: TextStyle['textAlign'];
}

export const ThemedText: React.FC<ThemedTextProps> = ({
  variant = 'body',
  color,
  themeColor,
  align = 'left',
  style,
  ...props
}) => {
  const { colors } = useTheme();

  const getVariantStyle = (): TextStyle => {
    switch (variant) {
      case 'medium':
        return { fontFamily: Typography.bodyMedium, fontSize: FontSizes.md };
      case 'bold':
        return { fontFamily: Typography.bodyBold, fontSize: FontSizes.md };
      case 'muted':
        return { fontFamily: Typography.body, fontSize: FontSizes.sm, color: colors.textMuted };
      case 'small':
        return { fontFamily: Typography.label, fontSize: FontSizes.xs, color: colors.textMuted };
      case 'mono':
        return { fontFamily: Typography.mono, fontSize: FontSizes.sm };
      case 'label':
        return { fontFamily: Typography.label, fontSize: FontSizes.xs, letterSpacing: 2, textTransform: 'uppercase' };
      case 'ui':
        return { fontFamily: Typography.ui, fontSize: FontSizes.md };
      default:
        return { fontFamily: Typography.body, fontSize: FontSizes.md };
    }
  };

  const resolvedColor = color
    ?? (themeColor ? colors[themeColor] : undefined)
    ?? colors.text;

  return (
    <RNText
      style={[
        { color: resolvedColor, textAlign: align },
        getVariantStyle(),
        style,
      ]}
      {...props}
    />
  );
};

// ─── ThemedHeading ───────────────────────────────────────────────────────────

interface ThemedHeadingProps extends TextProps {
  level?: 1 | 2 | 3;
  color?: string;
  themeColor?: 'text' | 'textSecondary' | 'textMuted' | 'accent';
  align?: TextStyle['textAlign'];
  italic?: boolean;
}

export const ThemedHeading: React.FC<ThemedHeadingProps> = ({
  level = 2,
  color,
  themeColor,
  align = 'left',
  italic = false,
  style,
  ...props
}) => {
  const { colors } = useTheme();

  const getLevelStyle = (): TextStyle => {
    switch (level) {
      case 1:
        return { fontSize: FontSizes.display, lineHeight: 52 };
      case 3:
        return { fontSize: FontSizes.xxl, lineHeight: 34 };
      default:
        return { fontSize: FontSizes.xxxl, lineHeight: 42 };
    }
  };

  const resolvedColor = color
    ?? (themeColor ? colors[themeColor] : undefined)
    ?? colors.text;

  return (
    <RNText
      style={[
        {
          color: resolvedColor,
          textAlign: align,
          fontFamily: italic ? Typography.serifAccent : Typography.displayBold,
        },
        getLevelStyle(),
        style,
      ]}
      {...props}
    />
  );
};
