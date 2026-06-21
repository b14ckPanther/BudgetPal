-- Phase 7: report export storage, idempotency, and status lifecycle.

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ready',
  ADD COLUMN IF NOT EXISTS idempotency_key uuid,
  ADD COLUMN IF NOT EXISTS data_snapshot_hash text,
  ADD COLUMN IF NOT EXISTS failure_reason text;

ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS check_report_status;
ALTER TABLE public.reports
  ADD CONSTRAINT check_report_status
  CHECK (status IN ('pending', 'ready', 'failed'));

CREATE UNIQUE INDEX IF NOT EXISTS reports_user_idempotency_unique
  ON public.reports (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS reports_user_created_idx
  ON public.reports (user_id, created_at DESC);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-exports',
  'report-exports',
  false,
  5242880,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY report_exports_select_own ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'report-exports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY report_exports_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'report-exports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
