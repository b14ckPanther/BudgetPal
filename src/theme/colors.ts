/**
 * BudgetPal — Premium Fintech Mint Color Palette
 * Source of truth for all colors in the application.
 * Do NOT hardcode color values in screens or components.
 */

export const colors = {
  // Base
  background: '#080B12',
  backgroundSoft: '#0B1020',
  surface: '#101827',
  surfaceElevated: '#172033',
  surfaceGlass: 'rgba(255, 255, 255, 0.06)',
  border: '#263247',
  borderSoft: '#1D2638',

  // Text
  textPrimary: '#F7F9FC',
  textSecondary: '#AAB4C3',
  textMuted: '#6F7A8C',
  textInverse: '#071018',

  // Brand / Money
  primary: '#4ADEB2',
  primaryHover: '#35C99D',
  primarySoft: '#123C33',
  primaryGlow: 'rgba(74, 222, 178, 0.28)',

  // AI / Agent
  ai: '#6C8CFF',
  aiSoft: '#18224A',
  aiGlow: 'rgba(108, 140, 255, 0.28)',

  // Semantic
  success: '#35D399',
  successSoft: '#11392E',
  warning: '#F5B84C',
  warningSoft: '#3B2B10',
  risk: '#FF8A5C',
  riskSoft: '#3A2117',
  danger: '#FF5F6D',
  dangerSoft: '#3B171C',
  info: '#67B7FF',
  infoSoft: '#102C44',

  // Charts
  chart1: '#4ADEB2',
  chart2: '#6C8CFF',
  chart3: '#F5B84C',
  chart4: '#FF8A5C',
  chart5: '#B084FF',
  chart6: '#67D8FF',

  // Gradients
  heroGradientStart: '#10243A',
  heroGradientMiddle: '#102D2A',
  heroGradientEnd: '#080B12',

  // Transparency helpers
  white05: 'rgba(255, 255, 255, 0.05)',
  white10: 'rgba(255, 255, 255, 0.10)',
  white15: 'rgba(255, 255, 255, 0.15)',
  black40: 'rgba(0, 0, 0, 0.40)',
} as const;

export type ColorToken = keyof typeof colors;
