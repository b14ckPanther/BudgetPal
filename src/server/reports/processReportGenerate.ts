/**
 * Race-safe report generation lifecycle.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../types/database';
import { loadUserContext } from '../agent/loadUserContext';
import { computeReport } from './computeReport';
import { generateReportNarrative, buildAgentReportSummary } from './generateReportNarrative';
import { deleteReportPdf, uploadReportPdf } from './storageReportPdf';
import { STALE_PENDING_MS } from './reportConfig';
import type { ReportGenerateParams } from './reportTypes';
import type { ReportMetrics } from '../../types/api';

export interface PublicReportRow {
  id: string;
  title: string;
  type: string;
  dateFrom: string;
  dateTo: string;
  summary: string;
  metrics: ReportMetrics;
  status: string;
  hasPdf: boolean;
  createdAt: string;
}

export type ProcessReportResult =
  | { ok: true; report: PublicReportRow; reused: boolean }
  | { ok: false; noData: true; message: string }
  | { ok: false; error: string; statusCode?: number; stage?: string };

function toPublicRow(row: {
  id: string;
  title: string;
  type: string;
  date_from: string | null;
  date_to: string | null;
  summary: string | null;
  metrics: unknown;
  status: string;
  file_url: string | null;
  created_at: string;
}): PublicReportRow {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    dateFrom: row.date_from || '',
    dateTo: row.date_to || '',
    summary: row.summary || '',
    metrics: (row.metrics as ReportMetrics) || {
      totalIncome: 0,
      totalExpenses: 0,
      netSavings: 0,
      categoryBreakdown: [],
      topMerchants: [],
      hasData: false,
      currency: 'ILS',
    },
    status: row.status,
    hasPdf: !!row.file_url && row.status === 'ready',
    createdAt: row.created_at,
  };
}

async function failReport(
  supabase: SupabaseClient<Database>,
  reportId: string,
  userId: string,
  hadPdf = false
): Promise<void> {
  if (hadPdf) {
    await deleteReportPdf(userId, reportId);
  }
  await supabase
    .from('reports')
    .update({
      status: 'failed',
      failure_reason: 'generation_failed',
      file_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .eq('user_id', userId);
}

async function resolveIdempotentRow(
  supabase: SupabaseClient<Database>,
  userId: string,
  idempotencyKey: string
) {
  const { data } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();
  return data;
}

async function markStalePendingFailed(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  const cutoff = new Date(Date.now() - STALE_PENDING_MS).toISOString();
  await supabase
    .from('reports')
    .update({
      status: 'failed',
      failure_reason: 'stale_pending',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('status', 'pending')
    .lt('updated_at', cutoff);
}

export async function processReportGenerate(
  supabase: SupabaseClient<Database>,
  userId: string,
  params: ReportGenerateParams
): Promise<ProcessReportResult> {
  const ctx = await loadUserContext(supabase, userId);
  const skipPdfForHebrew = ctx.preferredLanguage === 'he';

  const existing = await resolveIdempotentRow(supabase, userId, params.idempotencyKey);
  if (existing) {
    if (existing.status === 'ready') {
      return { ok: true, report: toPublicRow(existing), reused: true };
    }
    if (existing.status === 'pending') {
      const age = Date.now() - new Date(existing.updated_at).getTime();
      if (age < STALE_PENDING_MS) {
        return {
          ok: false,
          error: 'This report is still being generated. Please wait a moment.',
          statusCode: 409,
        };
      }
      await failReport(supabase, existing.id, userId);
    }
    if (existing.status === 'failed') {
      if (existing.file_url) {
        await deleteReportPdf(userId, existing.id);
      }
      await supabase.from('reports').delete().eq('id', existing.id).eq('user_id', userId);
    }
  }

  const computed = computeReport(ctx, params);

  if (!computed.ok) {
    if ('noData' in computed && computed.noData) {
      return { ok: false, noData: true, message: computed.message };
    }
    return {
      ok: false,
      error: ('error' in computed ? computed.error : undefined) || 'Could not build this report.',
      stage: 'compute_failed',
    };
  }

  const { report: computedReport } = computed;

  const { data: reserved, error: reserveError } = await supabase
    .from('reports')
    .insert({
      user_id: userId,
      title: computedReport.title,
      type: computedReport.type,
      date_from: computedReport.range.start,
      date_to: computedReport.range.end,
      summary: '',
      metrics: {},
      status: 'pending',
      idempotency_key: params.idempotencyKey,
      data_snapshot_hash: computedReport.dataSnapshotHash,
    })
    .select()
    .single();

  if (reserveError || !reserved) {
    const dup = await resolveIdempotentRow(supabase, userId, params.idempotencyKey);
    if (dup?.status === 'ready') {
      return { ok: true, report: toPublicRow(dup), reused: true };
    }
    if (dup?.status === 'pending') {
      return {
        ok: false,
        error: 'This report is still being generated. Please wait a moment.',
        statusCode: 409,
      };
    }
    return {
      ok: false,
      error: 'Could not start report generation. Please try again.',
      stage: reserveError?.message || 'reserve_failed',
    };
  }

  const reportId = reserved.id;
  let uploadedPdf = false;

  try {
    const skipAiNarrative = process.env.REPORT_SKIP_AI_NARRATIVE === '1';
    const narrative = skipAiNarrative
      ? buildAgentReportSummary(computedReport)
      : await generateReportNarrative(computedReport);
    computedReport.summary = narrative.summary;
    computedReport.metrics.recommendations = narrative.recommendations;

    let filePath: string | null = null;
    if (params.includePdf !== false && !skipPdfForHebrew) {
      const { renderReportPdf } = await import('./renderReportPdf');
      const pdfBuffer = await renderReportPdf(computedReport, narrative);
      filePath = await uploadReportPdf(userId, reportId, pdfBuffer);
      uploadedPdf = true;
    }

    const metricsPayload: ReportMetrics = JSON.parse(
      JSON.stringify({
        totalIncome: computedReport.metrics.totalIncome,
        totalExpenses: computedReport.metrics.totalExpenses,
        netSavings: computedReport.metrics.netSavings,
        safeToSpend: computedReport.metrics.safeToSpend,
        safeToSpendNote: computedReport.metrics.safeToSpendNote,
        categoryBreakdown: computedReport.metrics.categoryBreakdown.map((c) => ({
          categoryName: c.categoryName,
          amount: c.amount,
          percentage: c.percentage,
          limit: c.limit,
          isOverBudget: c.isOverBudget,
        })),
        overBudgetCategories: computedReport.metrics.overBudgetCategories.map((c) => ({
          categoryName: c.categoryName,
          amount: c.amount,
          percentage: c.percentage,
          limit: c.limit,
          isOverBudget: c.isOverBudget,
        })),
        largestTransactions: computedReport.metrics.largestTransactions,
        topMerchants: computedReport.metrics.topMerchants,
        recurringSignals: computedReport.metrics.recurringSignals,
        trend: computedReport.metrics.trend,
        recommendations: computedReport.metrics.recommendations,
        hasData: true,
        currency: computedReport.metrics.currency,
        computedAt: computedReport.metrics.computedAt,
        periodLabel: computedReport.range.label,
      })
    ) as ReportMetrics;

    const { data: updated, error: updateError } = await supabase
      .from('reports')
      .update({
        summary: narrative.summary,
        metrics: metricsPayload as unknown as Database['public']['Tables']['reports']['Update']['metrics'],
        file_url: filePath,
        status: 'ready',
        failure_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError || !updated) {
      const detail = updateError?.message || 'no_row_returned';
      console.error('[reports] update failed:', detail);
      throw new Error(`update_failed:${detail}`);
    }

    return { ok: true, report: toPublicRow(updated), reused: false };
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'unknown';
    console.error('[reports] generate failed:', reason);
    await failReport(supabase, reportId, userId, uploadedPdf);
    return {
      ok: false,
      error: 'Could not complete report generation. Please try again.',
      statusCode: 500,
      stage: `generation_failed:${reason}`,
    };
  }
}

/** Agent preview — compute only, no DB row, no PDF, no AI. */
export async function computeReportPreview(
  supabase: SupabaseClient<Database>,
  userId: string,
  params: Omit<ReportGenerateParams, 'idempotencyKey' | 'includePdf'>
) {
  const ctx = await loadUserContext(supabase, userId);
  const computed = computeReport(ctx, params);
  if (!computed.ok) return computed;
  const { buildAgentReportSummary } = await import('./generateReportNarrative');
  const narrative = buildAgentReportSummary(computed.report);
  computed.report.summary = narrative.summary;
  computed.report.metrics.recommendations = narrative.recommendations;
  return { ok: true as const, report: computed.report };
}
