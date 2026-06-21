-- Private storage bucket for receipt scan images (paths only in receipts.file_url).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipt-scans',
  'receipt-scans',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY receipt_scans_select_own ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipt-scans'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY receipt_scans_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'receipt-scans'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
