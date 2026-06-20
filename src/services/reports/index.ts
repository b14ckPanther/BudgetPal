import { supabase } from '@/lib/supabase';
import { Report } from '@/types/api';
import { mapReport } from '../mapper';

export async function getReports(): Promise<Report[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return [];

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((item) => mapReport(item));
}

export async function createReportRecord(report: Partial<Report>): Promise<Report> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('User not authenticated');

  const dbInsert = {
    user_id: user.id,
    title: report.title || 'Untitled Report',
    type: report.type || 'monthly',
    date_from: report.dateFrom || null,
    date_to: report.dateTo || null,
    summary: report.summary || null,
    metrics: report.metrics || {},
    file_url: report.fileUrl || null,
  };

  const { data, error } = await supabase
    .from('reports')
    .insert(dbInsert)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create report record');
  }

  return mapReport(data);
}
