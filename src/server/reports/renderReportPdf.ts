/**
 * Server-side PDF rendering with pdf-lib — print-safe light document theme.
 */

import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont, RGB } from 'pdf-lib';
import { formatMoneyForPdf } from '../../lib/formatMoneyForPdf';
import { reportPdfTheme, reportPdfChartBars } from './reportPdfTheme';
import type { ComputedReport } from './reportTypes';

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 52;
const FOOTER_H = 36;
const CONTENT_BOTTOM = FOOTER_H + 12;

function parseHex(hex: string): RGB {
  const h = hex.replace('#', '');
  return rgb(
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255
  );
}

const c = {
  page: parseHex(reportPdfTheme.pageBackground),
  surface: parseHex(reportPdfTheme.surface),
  surfaceMint: parseHex(reportPdfTheme.surfaceMint),
  text: parseHex(reportPdfTheme.textPrimary),
  textSecondary: parseHex(reportPdfTheme.textSecondary),
  muted: parseHex(reportPdfTheme.textMuted),
  border: parseHex(reportPdfTheme.border),
  mint: parseHex(reportPdfTheme.accentMint),
  mintSoft: parseHex(reportPdfTheme.accentMintSoft),
  navy: parseHex(reportPdfTheme.brandNavy),
  success: parseHex(reportPdfTheme.success),
  warning: parseHex(reportPdfTheme.warning),
  warningBg: parseHex(reportPdfTheme.warningSurface),
  danger: parseHex(reportPdfTheme.danger),
  dangerBg: parseHex(reportPdfTheme.dangerSurface),
  chartTrack: parseHex(reportPdfTheme.chartTrack),
  tableHeaderBg: parseHex(reportPdfTheme.tableHeaderBackground),
  tableHeaderText: parseHex(reportPdfTheme.tableHeaderText),
  tableRowAlt: parseHex(reportPdfTheme.tableRowAlt),
  footer: parseHex(reportPdfTheme.footerText),
  metricBg: parseHex(reportPdfTheme.metricCardBackground),
  metricBorder: parseHex(reportPdfTheme.metricCardBorder),
};

interface DocContext {
  doc: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  fontBold: PDFFont;
  y: number;
  margin: number;
  width: number;
  pageIndex: number;
  totalPages: number;
  reportTitle: string;
  periodLabel: string;
}

function textWidth(font: PDFFont, text: string, size: number): number {
  return font.widthOfTextAtSize(text, size);
}

function wrapTextToWidth(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (textWidth(font, candidate, size) <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    if (textWidth(font, word, size) <= maxWidth) {
      line = word;
    } else {
      let chunk = '';
      for (const ch of word) {
        const next = chunk + ch;
        if (textWidth(font, next, size) > maxWidth && chunk) {
          lines.push(chunk);
          chunk = ch;
        } else {
          chunk = next;
        }
      }
      line = chunk;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function paintPageBackground(page: PDFPage) {
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: c.page });
}

function drawPageFooter(ctx: DocContext) {
  const footerY = 22;
  ctx.page.drawLine({
    start: { x: ctx.margin, y: FOOTER_H + 6 },
    end: { x: PAGE_W - ctx.margin, y: FOOTER_H + 6 },
    thickness: 0.5,
    color: c.border,
  });
  ctx.page.drawText('BudgetPal — Personal Budget Agent', {
    x: ctx.margin,
    y: footerY,
    size: 8,
    font: ctx.font,
    color: c.footer,
  });
  const pageLabel = `Page ${ctx.pageIndex} of ${ctx.totalPages}`;
  const labelW = textWidth(ctx.font, pageLabel, 8);
  ctx.page.drawText(pageLabel, {
    x: PAGE_W - ctx.margin - labelW,
    y: footerY,
    size: 8,
    font: ctx.font,
    color: c.footer,
  });
}

function drawCompactHeader(ctx: DocContext) {
  ctx.page.drawRectangle({
    x: ctx.margin,
    y: ctx.y - 2,
    width: 36,
    height: 3,
    color: c.mint,
  });
  ctx.page.drawText('BudgetPal', {
    x: ctx.margin,
    y: ctx.y - 14,
    size: 9,
    font: ctx.fontBold,
    color: c.navy,
  });
  const truncated =
    ctx.reportTitle.length > 42 ? `${ctx.reportTitle.slice(0, 41)}…` : ctx.reportTitle;
  const titleW = textWidth(ctx.font, truncated, 9);
  ctx.page.drawText(truncated, {
    x: PAGE_W - ctx.margin - titleW,
    y: ctx.y - 14,
    size: 9,
    font: ctx.font,
    color: c.muted,
  });
  ctx.y -= 28;
}

function addPage(ctx: DocContext, compactHeader = true) {
  ctx.pageIndex += 1;
  ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
  paintPageBackground(ctx.page);
  ctx.y = PAGE_H - MARGIN;
  if (compactHeader) drawCompactHeader(ctx);
}

function ensureSpace(ctx: DocContext, needed: number) {
  if (ctx.y - needed < CONTENT_BOTTOM) {
    addPage(ctx, true);
  }
}

function drawSectionTitle(ctx: DocContext, title: string) {
  ensureSpace(ctx, 28);
  ctx.y -= 6;
  ctx.page.drawText(title, {
    x: ctx.margin,
    y: ctx.y,
    size: 13,
    font: ctx.fontBold,
    color: c.text,
  });
  ctx.y -= 18;
  ctx.page.drawLine({
    start: { x: ctx.margin, y: ctx.y },
    end: { x: PAGE_W - ctx.margin, y: ctx.y },
    thickness: 0.75,
    color: c.border,
  });
  ctx.y -= 14;
}

function drawBodyLines(
  ctx: DocContext,
  lines: string[],
  size = 10,
  color = c.textSecondary,
  lineGap = 4
) {
  for (const line of lines) {
    ensureSpace(ctx, size + lineGap + 4);
    ctx.page.drawText(line, {
      x: ctx.margin,
      y: ctx.y,
      size,
      font: ctx.font,
      color,
    });
    ctx.y -= size + lineGap;
  }
}

function drawMetricCards(ctx: DocContext, report: ComputedReport) {
  const m = report.metrics;
  const cardW = (ctx.width - 16) / 3;
  const cardH = 52;
  ensureSpace(ctx, cardH + 20);

  const items = [
    { label: 'Income', value: formatMoneyForPdf(m.totalIncome, m.currency) },
    { label: 'Expenses', value: formatMoneyForPdf(m.totalExpenses, m.currency) },
    {
      label: 'Net',
      value: formatMoneyForPdf(m.netSavings, m.currency),
      highlight: m.netSavings >= 0 ? c.success : c.danger,
    },
  ];

  const baseY = ctx.y - cardH;
  items.forEach((item, i) => {
    const x = ctx.margin + i * (cardW + 8);
    ctx.page.drawRectangle({
      x,
      y: baseY,
      width: cardW,
      height: cardH,
      color: c.metricBg,
      borderColor: c.metricBorder,
      borderWidth: 0.75,
    });
    ctx.page.drawText(item.label, {
      x: x + 10,
      y: baseY + cardH - 18,
      size: 9,
      font: ctx.font,
      color: c.muted,
    });
    ctx.page.drawText(item.value, {
      x: x + 10,
      y: baseY + 12,
      size: 11,
      font: ctx.fontBold,
      color: item.highlight || c.text,
    });
  });
  ctx.y = baseY - 16;

  if (m.safeToSpend !== null) {
    drawBodyLines(
      ctx,
      [`Safe to spend today: ${formatMoneyForPdf(m.safeToSpend, m.currency)}`],
      10,
      c.mint
    );
  } else if (m.safeToSpendNote) {
    drawBodyLines(ctx, wrapTextToWidth(m.safeToSpendNote, ctx.font, 9, ctx.width), 9, c.muted);
  }
}

function drawBarChart(
  ctx: DocContext,
  items: { label: string; amount: number; percentage: number }[],
  currency: string
) {
  const barHeight = 12;
  const rowH = 34;
  const labelColW = ctx.width * 0.32;
  const barColW = ctx.width * 0.38;
  const valueColX = ctx.margin + labelColW + barColW + 10;
  const maxAmount = Math.max(...items.map((i) => i.amount), 1);

  for (let i = 0; i < items.length; i++) {
    ensureSpace(ctx, rowH);
    const item = items[i];
    const rowTop = ctx.y;
    const barColor = parseHex(reportPdfChartBars[i % reportPdfChartBars.length]);

    const labelLines = wrapTextToWidth(item.label, ctx.font, 9, labelColW - 4);
    labelLines.slice(0, 2).forEach((ln, li) => {
      ctx.page.drawText(ln, {
        x: ctx.margin,
        y: rowTop - 10 - li * 11,
        size: 9,
        font: ctx.font,
        color: c.text,
      });
    });

    const barY = rowTop - 24;
    ctx.page.drawRectangle({
      x: ctx.margin + labelColW,
      y: barY,
      width: barColW,
      height: barHeight,
      color: c.chartTrack,
    });
    const barW = Math.max(6, (item.amount / maxAmount) * barColW);
    ctx.page.drawRectangle({
      x: ctx.margin + labelColW,
      y: barY,
      width: barW,
      height: barHeight,
      color: barColor,
    });

    const valueText = `${formatMoneyForPdf(item.amount, currency)} (${item.percentage}%)`;
    ctx.page.drawText(valueText, {
      x: valueColX,
      y: barY + 1,
      size: 9,
      font: ctx.fontBold,
      color: c.textSecondary,
    });

    ctx.y -= rowH;
  }
}

function drawWarningCallout(ctx: DocContext, lines: string[], variant: 'warning' | 'danger') {
  const bg = variant === 'danger' ? c.dangerBg : c.warningBg;
  const textColor = variant === 'danger' ? c.danger : c.warning;
  const wrapped = lines.flatMap((l) => wrapTextToWidth(l, ctx.font, 9, ctx.width - 24));
  const boxH = wrapped.length * 13 + 20;
  ensureSpace(ctx, boxH + 8);

  const boxY = ctx.y - boxH;
  ctx.page.drawRectangle({
    x: ctx.margin,
    y: boxY,
    width: ctx.width,
    height: boxH,
    color: bg,
    borderColor: textColor,
    borderWidth: 0.5,
  });
  wrapped.forEach((ln, i) => {
    ctx.page.drawText(ln, {
      x: ctx.margin + 12,
      y: boxY + boxH - 16 - i * 13,
      size: 9,
      font: ctx.font,
      color: c.text,
    });
  });
  ctx.y = boxY - 12;
}

function drawTable(
  ctx: DocContext,
  headers: [string, string],
  rows: [string, string][],
  colSplit = 0.62
) {
  const headerH = 22;
  const rowH = 20;
  const col1W = ctx.width * colSplit;
  const col2X = ctx.margin + col1W + 8;

  ensureSpace(ctx, headerH + 4);
  const headerY = ctx.y - headerH;
  ctx.page.drawRectangle({
    x: ctx.margin,
    y: headerY,
    width: ctx.width,
    height: headerH,
    color: c.tableHeaderBg,
  });
  ctx.page.drawText(headers[0], {
    x: ctx.margin + 8,
    y: headerY + 6,
    size: 9,
    font: ctx.fontBold,
    color: c.tableHeaderText,
  });
  ctx.page.drawText(headers[1], {
    x: col2X,
    y: headerY + 6,
    size: 9,
    font: ctx.fontBold,
    color: c.tableHeaderText,
  });
  ctx.y = headerY - 4;

  rows.forEach((row, idx) => {
    ensureSpace(ctx, rowH);
    const rowY = ctx.y - rowH;
    if (idx % 2 === 1) {
      ctx.page.drawRectangle({
        x: ctx.margin,
        y: rowY,
        width: ctx.width,
        height: rowH,
        color: c.tableRowAlt,
      });
    }
    const leftLines = wrapTextToWidth(row[0], ctx.font, 9, col1W - 12);
    ctx.page.drawText(leftLines[0], {
      x: ctx.margin + 8,
      y: rowY + 6,
      size: 9,
      font: ctx.font,
      color: c.text,
    });
    ctx.page.drawText(row[1], {
      x: col2X,
      y: rowY + 6,
      size: 9,
      font: ctx.fontBold,
      color: c.textSecondary,
    });
    ctx.page.drawLine({
      start: { x: ctx.margin, y: rowY },
      end: { x: PAGE_W - ctx.margin, y: rowY },
      thickness: 0.35,
      color: c.border,
    });
    ctx.y = rowY - 2;
  });
  ctx.y -= 8;
}

function drawDocumentHeader(ctx: DocContext, report: ComputedReport) {
  ctx.page.drawRectangle({
    x: 0,
    y: PAGE_H - 10,
    width: PAGE_W,
    height: 10,
    color: c.mint,
  });

  ctx.page.drawText('BudgetPal', {
    x: ctx.margin,
    y: ctx.y,
    size: 14,
    font: ctx.fontBold,
    color: c.navy,
  });
  ctx.y -= 22;

  const titleLines = wrapTextToWidth(report.title, ctx.fontBold, 20, ctx.width);
  titleLines.forEach((ln) => {
    ctx.page.drawText(ln, {
      x: ctx.margin,
      y: ctx.y,
      size: 20,
      font: ctx.fontBold,
      color: c.text,
    });
    ctx.y -= 24;
  });

  ctx.page.drawText(report.range.label, {
    x: ctx.margin,
    y: ctx.y,
    size: 11,
    font: ctx.font,
    color: c.textSecondary,
  });
  ctx.y -= 16;
  ctx.page.drawText(`Generated ${new Date().toLocaleDateString('en-US')}`, {
    x: ctx.margin,
    y: ctx.y,
    size: 9,
    font: ctx.font,
    color: c.muted,
  });
  ctx.y -= 20;
}

export async function renderReportPdf(
  report: ComputedReport,
  narrative: { summary: string; recommendations: string[] }
): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([PAGE_W, PAGE_H]);
  paintPageBackground(page);

  const ctx: DocContext = {
    doc,
    page,
    font,
    fontBold,
    y: PAGE_H - MARGIN,
    margin: MARGIN,
    width: PAGE_W - MARGIN * 2,
    pageIndex: 1,
    totalPages: 1,
    reportTitle: report.title,
    periodLabel: report.range.label,
  };

  drawDocumentHeader(ctx, report);
  drawMetricCards(ctx, report);

  const m = report.metrics;

  drawSectionTitle(ctx, 'Category Breakdown');
  const chartItems = m.categoryBreakdown.slice(0, 8).map((c) => ({
    label: c.categoryName,
    amount: c.amount,
    percentage: c.percentage,
  }));
  if (chartItems.length === 0) {
    drawBodyLines(ctx, ['No category data in this period.'], 10, c.muted);
  } else {
    drawBarChart(ctx, chartItems, m.currency);
  }

  if (m.overBudgetCategories.length > 0) {
    drawSectionTitle(ctx, 'Over Budget');
    drawWarningCallout(
      ctx,
      m.overBudgetCategories.slice(0, 6).map(
        (cat) =>
          `${cat.categoryName}: ${formatMoneyForPdf(cat.amount, m.currency)} spent (limit ${formatMoneyForPdf(cat.limit, m.currency)})`
      ),
      'danger'
    );
  }

  drawSectionTitle(ctx, 'Largest Transactions');
  drawTable(
    ctx,
    ['Transaction', 'Amount'],
    m.largestTransactions.map((tx) => [
      `${tx.merchant} · ${tx.date} · ${tx.categoryLabel}`,
      formatMoneyForPdf(tx.amount, m.currency),
    ])
  );

  drawSectionTitle(ctx, 'Top Merchants');
  drawTable(
    ctx,
    ['Merchant', 'Total'],
    m.topMerchants.slice(0, 8).map((merch) => [
      `${merch.name} (${merch.transactionCount} tx)`,
      formatMoneyForPdf(merch.totalAmount, m.currency),
    ])
  );

  if (m.trend) {
    drawSectionTitle(ctx, 'Trend Comparison');
    drawBodyLines(
      ctx,
      wrapTextToWidth(
        `Compared to ${m.trend.previousPeriodLabel}: expenses ${formatMoneyForPdf(m.trend.previousExpenses, m.currency)} → ${formatMoneyForPdf(m.totalExpenses, m.currency)} (${m.trend.expenseChangePercent >= 0 ? '+' : ''}${m.trend.expenseChangePercent}%).`,
        ctx.font,
        10,
        ctx.width
      ),
      10,
      c.textSecondary
    );
  }

  if (m.recurringSignals.length > 0) {
    drawSectionTitle(ctx, 'Recurring Signals');
    drawTable(
      ctx,
      ['Merchant', 'Pattern'],
      m.recurringSignals.map((sig) => [
        sig.merchant,
        `~${formatMoneyForPdf(sig.amount, m.currency)} × ${sig.occurrences} (${sig.note})`,
      ])
    );
  }

  drawSectionTitle(ctx, 'Summary');
  drawBodyLines(ctx, wrapTextToWidth(narrative.summary, ctx.font, 10, ctx.width), 10, c.text, 5);

  drawSectionTitle(ctx, 'Recommendations');
  for (const rec of narrative.recommendations) {
    drawBodyLines(ctx, wrapTextToWidth(`• ${rec}`, ctx.font, 10, ctx.width), 10, c.textSecondary, 5);
    ctx.y -= 2;
  }

  ctx.totalPages = doc.getPageCount();
  const pages = doc.getPages();
  pages.forEach((p, idx) => {
    const footerCtx = { ...ctx, page: p, pageIndex: idx + 1, totalPages: ctx.totalPages };
    drawPageFooter(footerCtx);
  });

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
