/**
 * BudgetPal — Spacing Tokens
 * Consistent spacing scale used throughout the app.
 * Do NOT hardcode pixel values directly in screens.
 */

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  section: 48,
} as const;

export type SpacingToken = keyof typeof spacing;
