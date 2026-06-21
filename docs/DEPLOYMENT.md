# BudgetPal — EAS Hosting Deployment

Staging API is deployed on **EAS Hosting** with Expo Router `web.output: "server"`.

## Staging origin

| Item | Value |
|------|-------|
| **HTTPS API origin** | `https://millionroses-budgetpal--51c0qpbrkq.expo.app` |
| **Health check** | `GET /api/health` |
| **EAS project** | `@millionroses/budgetpal` |
| **Dashboard** | https://expo.dev/projects/15c9f26e-16a3-41dc-96e3-ac8b99e5efae/hosting/deployments |

Each `eas deploy` creates a new immutable URL. Update preview `EXPO_PUBLIC_API_BASE_URL` after every staging deploy, or assign a stable alias with `eas deploy:alias`.

## Presentation API alias (native builds)

| Item | Value |
|------|-------|
| **Stable alias** | `presentation` |
| **HTTPS API origin** | `https://millionroses-budgetpal--presentation.expo.app` |
| **EAS environment** | `production` (`EXPO_PUBLIC_API_BASE_URL`) |
| **Used by** | `presentation-android`, `presentation-ios` EAS Build profiles |

Preview/staging continues to use the one-off preview deployment URL in the **preview** environment. Native presentation builds must **not** embed staging deployment IDs.

Promote a validated server build to the presentation alias:

```bash
npx expo export --platform web
eas deploy --environment production --prod --alias=presentation --non-interactive
eas env:create --name EXPO_PUBLIC_API_BASE_URL \
  --value "https://millionroses-budgetpal--presentation.expo.app" \
  --environment production --visibility plaintext --scope project --force
```

Pre-build check: `npm run validate:presentation-build`

## Environment variables (names only)

### Mobile public (`EXPO_PUBLIC_*` — EAS Build + client bundle)

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (client-safe) |
| `EXPO_PUBLIC_API_BASE_URL` | **Required for release builds.** HTTPS API origin (no trailing slash) |

### Server-only (EAS Hosting deploy — never `EXPO_PUBLIC_*`)

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Whisper, vision, agent, reports (secret) |
| `SUPABASE_SERVICE_ROLE_KEY` | Private storage, username login lookup (secret) |
| `EXPO_PUBLIC_SUPABASE_URL` | Also read by server helpers |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Also read by server auth helpers |

### Optional server tuning

| Variable | Purpose |
|----------|---------|
| `REPORT_AI_MODEL` | Report narrative model (default `gpt-4o-mini`) |
| `RECEIPT_VISION_MODEL` | Receipt vision model (default `gpt-4o-mini`) |
| `REPORT_SKIP_AI_NARRATIVE` | Set to `1` on EAS Hosting to use deterministic report copy and reduce Worker subrequests |

### Local-only (never commit)

| Variable | Purpose |
|----------|---------|
| `DEMO_NOOR_PASSWORD` | Demo account password for `scripts/smoke-test-staging.mjs` |
| `STAGING_API_BASE_URL` | Override smoke-test target origin |

## EAS environments

| Environment | Used by | Notes |
|-------------|---------|-------|
| `preview` | Staging API deploy, `preview` EAS Build profile | One-off staging deployment URL |
| `production` | Presentation API alias + `presentation-*` EAS Build profiles | `EXPO_PUBLIC_API_BASE_URL` → `https://millionroses-budgetpal--presentation.expo.app` |

`eas.json` maps `preview` → `preview` and `production` → `production` environments.

## Deploy commands

```bash
# 1. Pull preview env for local export (secrets remain on EAS servers)
eas env:pull --environment preview --non-interactive

# 2. Export Expo Router server bundle (all 14 API routes)
npx expo export --platform web

# 3. Deploy to EAS Hosting (preview secrets injected server-side)
eas deploy --environment preview --non-interactive

# 4. Update preview EXPO_PUBLIC_API_BASE_URL to the new Deployment URL
eas env:create --name EXPO_PUBLIC_API_BASE_URL --value "https://YOUR-DEPLOYMENT.expo.app" \
  --environment preview --visibility plaintext --scope project --non-interactive --force
```

Production promotion (when ready):

```bash
eas deploy --environment production --prod
```

## Health check

```bash
curl -s https://millionroses-budgetpal--51c0qpbrkq.expo.app/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

## Smoke tests

```bash
# Requires DEMO_NOOR_PASSWORD in local .env (or service-role session minting fallback)
STAGING_API_BASE_URL=https://millionroses-budgetpal--51c0qpbrkq.expo.app node scripts/smoke-test-staging.mjs
```

Covers: health, auth helpers, agent, voice multipart, receipt scan, report generation, exports, bearer security.

## Native builds (configured — not started)

EAS Build profiles:

| Profile | Platform | Distribution | API env |
|---------|----------|--------------|---------|
| `presentation-android` | Android APK | internal | production |
| `presentation-ios` | iOS | store (TestFlight) | production |

Before building:

1. `npm run validate:presentation-build` must pass.
2. `EXPO_PUBLIC_API_BASE_URL` in **production** must be the presentation alias (not staging).
3. Release builds **fail fast** if `EXPO_PUBLIC_API_BASE_URL` is missing (`ApiConfigurationError` in `getApiBaseUrl()`).
4. Do **not** rely on Metro/LAN fallback in release builds.

```bash
# After validation passes:
eas build --profile presentation-android --platform android
eas build --profile presentation-ios --platform ios
# Optional submit (Apple credentials on EAS only):
eas submit --profile production --platform ios
```

## EAS Hosting constraints (verified on staging)

| Route | Staging result | Notes |
|-------|----------------|-------|
| `/api/voice/transcribe` | **Pass** | Multipart + Whisper + agent |
| `/api/receipts/scan` | **Pass** | Multipart + vision + private storage |
| `/api/reports/generate` | **Pass** | With `REPORT_SKIP_AI_NARRATIVE=1`; English PDF validated on staging |

**Worker subrequest limit:** Report generation initially failed with Cloudflare `Too many subrequests`. Mitigations applied:

- Removed duplicate profile fetch (use `loadUserContext.preferredLanguage`)
- Optional `REPORT_SKIP_AI_NARRATIVE=1` (preview env)
- Lazy `pdf-lib` import (only when PDF is generated)
- Skip storage delete on `failReport` when no PDF was uploaded

**PDF on EAS Hosting:** The Noor presentation baseline uses English (`preferred_language: en`) so English PDF render/upload/download is validated on staging. Hebrew remains selectable in-app; **Hebrew PDF export is intentionally deferred** until separately validated (`skipPdfForHebrew` in `processReportGenerate.ts`). Run `npm run validate:staging-pdf` after deploy to re-check the English path.

## Fallback to separate Node backend (Option B)

Recommend **Option B** (self-hosted Node export of Expo server) if:

- English PDF generation fails or times out on EAS Hosting
- Full OpenAI report narratives are required without `REPORT_SKIP_AI_NARRATIVE`
- Report generation regresses above Worker subrequest limits
- Multipart voice/receipt routes fail on Workers

## Sync EAS env from local `.env`

```bash
node scripts/sync-eas-env.mjs
```

Never commit `.env`. Never print secrets in logs.
