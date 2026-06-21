/**
 * BudgetPal — Text Component
 * Themed text with variant support using Ubuntu typography.
 */

import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme } from '@/theme';
import { useIsRtl } from '@/components/locale/LocaleProvider';
import { writingDirectionForMixedContent } from '@/lib/rtl';

type TextVariant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'caption' | 'label' | 'money';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
  align?: TextStyle['textAlign'];
  weight?: 'regular' | 'medium' | 'bold';
}

export function Text({
  variant = 'body',
  color,
  align,
  weight,
  style,
  children,
  ...rest
}: TextProps) {
  const { colors, typography } = useTheme();
  const isRtl = useIsRtl();

  const variantStyles: Record<TextVariant, TextStyle> = {
    display: {
      fontFamily: typography.fontFamily.bold,
      fontSize: typography.size.display,
      lineHeight: typography.lineHeight.display,
      color: colors.textPrimary,
    },
    h1: {
      fontFamily: typography.fontFamily.bold,
      fontSize: typography.size.xxl,
      lineHeight: typography.lineHeight.xxl,
      color: colors.textPrimary,
    },
    h2: {
      fontFamily: typography.fontFamily.bold,
      fontSize: typography.size.xl,
      lineHeight: typography.lineHeight.xl,
      color: colors.textPrimary,
    },
    h3: {
      fontFamily: typography.fontFamily.medium,
      fontSize: typography.size.lg,
      lineHeight: typography.lineHeight.lg,
      color: colors.textPrimary,
    },
    body: {
      fontFamily: typography.fontFamily.regular,
      fontSize: typography.size.md,
      lineHeight: typography.lineHeight.md,
      color: colors.textSecondary,
    },
    bodySmall: {
      fontFamily: typography.fontFamily.regular,
      fontSize: typography.size.sm,
      lineHeight: typography.lineHeight.sm,
      color: colors.textSecondary,
    },
    caption: {
      fontFamily: typography.fontFamily.regular,
      fontSize: typography.size.xs,
      lineHeight: typography.lineHeight.xs,
      color: colors.textMuted,
    },
    label: {
      fontFamily: typography.fontFamily.medium,
      fontSize: typography.size.sm,
      lineHeight: typography.lineHeight.sm,
      color: colors.textSecondary,
    },
    money: {
      fontFamily: typography.fontFamily.bold,
      fontSize: typography.size.xxl,
      lineHeight: typography.lineHeight.xxl,
      color: colors.primary,
    },
  };

  const fontFamilyOverride = weight
    ? { fontFamily: typography.fontFamily[weight] }
    : {};

  return (
    <RNText
      style={[
        variantStyles[variant],
        fontFamilyOverride,
        color ? { color } : undefined,
        align ? { textAlign: align } : { textAlign: isRtl ? 'right' : 'left' },
        { writingDirection: writingDirectionForMixedContent() },
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
