import { apiFetch, ApiRequestError } from '@/lib/apiFetch';
import { getUserFacingMessage } from '@/lib/apiErrors';
import { t } from '@/lib/i18n';
import { Report, ReportType } from '@/types/api';

export interface GenerateReportInput {
  type: ReportType;
  dateFrom?: string;
  dateTo?: string;
  categoryId?: string;
  categoryTerms?: string[];
  merchantTerms?: string[];
  comparePrevious?: boolean;
  includePdf?: boolean;
  idempotencyKey: string;
}

export type GenerateReportResult =
  | { ok: true; report: Report; reused: boolean }
  | { ok: false; noData: true; message: string }
  | { ok: false; error: string };

export async function generateReportApi(input: GenerateReportInput): Promise<GenerateReportResult> {
  try {
    const data = await apiFetch<{
      report?: Record<string, unknown>;
      reused?: boolean;
      noData?: boolean;
      message?: string;
    }>('/api/reports/generate', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    if (data.noData) {
      return {
        ok: false,
        noData: true,
        message: data.message || t('reports.noDataBody'),
      };
    }

    return {
      ok: true,
      report: mapApiReport(data.report || {}),
      reused: !!data.reused,
    };
  } catch (err) {
    return { ok: false, error: getUserFacingMessage(err) };
  }
}

export async function listReportsApi(): Promise<Report[]> {
  const data = await apiFetch<{ reports: Record<string, unknown>[] }>('/api/reports');
  return (data.reports || []).map(mapApiReport);
}

export async function getReportByIdApi(reportId: string): Promise<Report | null> {
  try {
    const data = await apiFetch<{ report: Record<string, unknown> }>(`/api/reports/${reportId}`);
    return mapApiReport(data.report);
  } catch (err) {
    if (err instanceof ApiRequestError && err.parsed.code === 'NOT_FOUND') {
      return null;
    }
    throw err;
  }
}

export async function getReportDownloadUrl(reportId: string): Promise<{ downloadUrl: string; expiresAt: string }> {
  return apiFetch(`/api/reports/${reportId}/download`);
}

function mapApiReport(row: Record<string, unknown>): Report {
  return {
    id: String(row.id),
    userId: '',
    title: String(row.title || ''),
    type: row.type as ReportType,
    dateFrom: String(row.dateFrom || ''),
    dateTo: String(row.dateTo || ''),
    summary: String(row.summary || ''),
    metrics: (row.metrics as Report['metrics']) || {
      totalIncome: 0,
      totalExpenses: 0,
      netSavings: 0,
      categoryBreakdown: [],
      topMerchants: [],
    },
    status: row.status as Report['status'],
    hasPdf: !!row.hasPdf,
    createdAt: String(row.createdAt || ''),
    updatedAt: String(row.updatedAt || row.createdAt || ''),
  };
}
