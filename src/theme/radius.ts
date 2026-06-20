/**
 * BudgetPal — Border Radius Tokens
 * Consistent radius values for cards, buttons, inputs, chips, etc.
 */

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;
