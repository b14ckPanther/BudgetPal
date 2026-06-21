# BudgetPal Demo Runbook

Development-only guide for resetting a dedicated demo account before presentations.

## Prerequisites

- Local `.env` with `EXPO_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (never commit these).
- A dedicated demo Supabase user UUID — not a production or personal account.
- Expo dev server running separately for app verification.

## What the reset script clears (demo user only)

| Area | Cleared |
|------|---------|
| Agent chat | `agent_messages`, `agent_actions` |
| Financial activity | `transactions`, `receipts`, `voice_entries` |
| Reports | `reports` rows + PDF objects in `report-exports` |
| Warnings / events | `warnings`, `budget_events` |
| Receipt images | Objects under `receipt-scans/{demoUserId}/` |

**Not cleared:** `profiles`, `budgets`, `categories`, `budget_category_limits`, auth account.

## Pre-demo checklist

1. Sign in to the demo account on a test device and note the user UUID (Profile → or Supabase Auth dashboard).
2. Confirm no other users share this device session.
3. Run a dry run (see below) and verify counts match expectations.
4. Close the app or sign out before the real reset to avoid stale cached queries.

## Dry run

```bash
node scripts/demo-reset.mjs --demo-user-id=<DEMO_USER_UUID> --dry-run
```

Expected: JSON summary listing row counts per table and object counts per bucket for **only** the demo user. No writes occur.

## Real reset

```bash
node scripts/demo-reset.mjs --demo-user-id=<DEMO_USER_UUID> --confirm
```

Expected: concise JSON `demo-reset-complete` log. No secrets, signed URLs, or file paths in output.

## Post-reset recovery

1. Sign in again as the demo user.
2. Bootstrap should route through `/` → main app (onboarding already complete).
3. Agent tab should show a fresh chat with no pending proposals.
4. Activity and Reports should be empty; Budget limits and profile settings remain.
5. Optionally log one sample transaction or run a scripted voice/receipt demo.

## Safety rules

- Never run without `--demo-user-id`.
- Never run without `--dry-run` or `--confirm`.
- Never add this script to the mobile app or a public API route.
- Never commit service-role keys or demo credentials.
- Never use broad `DELETE` without `user_id` filter (the script enforces per-table scoped deletes).

## Phase 8 verification tie-ins

| Check | How |
|-------|-----|
| Dry run scopes one user | Inspect dry-run JSON — only `demoUserId` counts |
| Real reset isolation | Compare another user's data before/after — unchanged |
| Clear History + pending | Create a proposal, confirm Clear History is blocked |
| Session expiry | Force 401 — single toast, single login redirect |
| Report detail metadata | Open report from large history — single `GET /api/reports/[id]` |

## Troubleshooting

| Issue | Action |
|-------|--------|
| Missing env vars | Copy from `.env.example`; fill service role locally only |
| Invalid UUID | Copy exact user id from Supabase Auth |
| Storage cleanup partial | Re-run dry run; manually verify bucket folder is empty in dashboard |
| App shows stale data | Sign out, sign in, or kill app after reset |
