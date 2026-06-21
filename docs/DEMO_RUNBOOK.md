# BudgetPal Demo Runbook — Noor presentation account

Development-only guide for the **Noor** presentation demo (`noor@gmail.com`).

## Demo identity (public)

| Field | Value |
|-------|--------|
| Email | `noor@gmail.com` |
| Username | `noor` |
| User UUID | `6e6f6f72-6465-4000-8000-000000000001` |

Password is **not** stored in the repo. Set `DEMO_NOOR_PASSWORD` in local `.env` only.

## Prerequisites

- Local `.env` with `EXPO_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `DEMO_NOOR_PASSWORD`.
- Migration `20260620000011_seed_noor_demo_account.sql` applied to your Supabase project.
- Migration `20260620000012_repair_noor_demo_baseline.sql` applied (replaces `seed_demo_noor_baseline` RPC with cycle-aware repair logic).
- Expo dev server for app verification.

## First-time setup

```bash
# 1. Apply migrations (Supabase CLI or dashboard)
supabase db push

# 2. Create auth user + seed baseline
npm run demo-provision

# 3. Validate
npm run demo-validate
```

## What `demo-reset` does (Noor only)

| Step | Action |
|------|--------|
| Storage | Deletes objects under `receipt-scans/{userId}/` and `report-exports/{userId}/` |
| Mutable data | Clears agent chat, transactions, receipts, voice entries, reports, warnings, events, limits |
| Baseline | Re-runs shared SQL `seed_demo_noor_baseline` (same source as provision) |

**Preserved:** auth account, profile, categories, budget row.

## Dry run

```bash
npm run demo-reset -- --dry-run
```

## Real reset + reseed

```bash
npm run demo-reset -- --confirm
```

## Post-reset / post-provision

1. Sign in as `noor@gmail.com` on device.
2. Bootstrap routes to main app (onboarding complete).
3. Agent tab has **empty** chat — start presentation fresh.
4. Budget shows healthy / near-limit / over-budget categories.
5. Activity shows 50+ confirmed transactions across sources.
6. Reports history is empty — generate monthly report live during demo.
7. Scan a real receipt live for the receipt demo (seed receipt has metadata only, no image).

## Seeded presentation states (current cycle)

| Category | Intended state |
|----------|----------------|
| Shopping | Healthy (&lt; 50%) |
| Food & Drinks | Near limit (~80%) |
| Car | Slightly over budget (~105%) |
| Subscriptions | Recurring (Netflix, Spotify, Cellcom history) |

## Safety rules

- `demo-reset` only accepts the fixed Noor UUID.
- Never run without `--dry-run` or `--confirm`.
- Never add provisioning/reset to the mobile app or public API routes.
- Never commit service-role keys, passwords, or bcrypt hashes.

## Validation

```bash
npm run demo-validate
```

Checks auth user, profile, budget, limits, transaction volume, sources, recurring merchants, receipt link, no pending agent actions, no fake report PDF paths.

## Troubleshooting

| Issue | Action |
|-------|--------|
| `seed_demo_noor_baseline` not found | Apply migration `20260620000011` |
| Missing `DEMO_NOOR_PASSWORD` | Add to local `.env` only |
| Login fails | Re-run `npm run demo-provision` |
| Stale app data | Sign out and sign in after reset |
