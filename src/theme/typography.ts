/**
 * BudgetPal — Typography Tokens
 * Uses Ubuntu by Dalton Maag for all app text.
 * Load with expo-font. Do NOT hardcode font family in screens.
 */

export const typography = {
  fontFamily: {
    regular: 'Ubuntu-Regular',
    medium: 'Ubuntu-Medium',
    bold: 'Ubuntu-Bold',
  },

  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 40,
  },

  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 36,
    display: 46,
  },

  weight: {
    regular: '400' as const,
    medium: '500' as const,
    bold: '700' as const,
  },
} as const;

export type FontFamily = keyof typeof typography.fontFamily;
export type FontSize = keyof typeof typography.size;
