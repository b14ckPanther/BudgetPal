-- One confirmed transaction per receipt (database-level idempotency).

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_receipt_id_unique
  ON public.transactions (receipt_id)
  WHERE receipt_id IS NOT NULL;
