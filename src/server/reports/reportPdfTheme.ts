/**
 * Print-safe PDF export theme for BudgetPal reports.
 * Intentionally separate from the dark mobile app theme — optimized for
 * white/off-white pages, iPhone PDF viewing, sharing, and printing.
 */

export const reportPdfTheme = {
  pageBackground: '#FAFBFC',
  surface: '#F3F6F9',
  surfaceMint: '#E8F8F3',
  textPrimary: '#0B1220',
  textSecondary: '#3D4A5C',
  textMuted: '#5C6B7F',
  border: '#D8E0EA',
  accentMint: '#1FA67A',
  accentMintSoft: '#D4F5EA',
  brandNavy: '#0B1220',
  success: '#15803D',
  warning: '#B45309',
  warningSurface: '#FEF3C7',
  danger: '#B91C1C',
  dangerSurface: '#FEE2E2',
  chartTrack: '#E5EBF2',
  chartBar: '#1FA67A',
  chartBarAlt: '#3B82F6',
  tableHeaderBackground: '#EEF2F7',
  tableHeaderText: '#0B1220',
  tableRowAlt: '#F7F9FC',
  footerText: '#6B7280',
  metricCardBackground: '#F0FAF6',
  metricCardBorder: '#B8E8D8',
} as const;

export type ReportPdfTheme = typeof reportPdfTheme;

/** Bar colors for category charts — readable in grayscale when paired with labels. */
export const reportPdfChartBars = [
  reportPdfTheme.chartBar,
  reportPdfTheme.chartBarAlt,
  '#D97706',
  '#7C3AED',
  '#0891B2',
  '#BE185D',
] as const;
