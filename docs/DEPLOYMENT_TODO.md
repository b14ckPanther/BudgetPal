# Deployment TODO — Expo API Routes

## Server-capable runtime required for production

BudgetPal agent features (Phase 4A/4B) use **Expo Router API Routes** under `app/api/**+api.ts`. These routes run server-side logic including OpenAI calls and authenticated Supabase access.

### Local development

- `npx expo start` serves API routes on the dev server (e.g. `http://<LAN-IP>:8081/api/...`).
- The mobile client uses `EXPO_PUBLIC_API_BASE_URL` or auto-detects the Metro host.
- **Local Expo dev behavior is not production deployment verification.**

### Before final demo / production

- [ ] Deploy the app to a **server-capable Expo/hosting runtime** that supports Expo API Routes (not static web export only).
- [ ] Set production environment variables on the host:
  - `OPENAI_API_KEY` (server-only, never `EXPO_PUBLIC_`)
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (if used by server helpers)
- [ ] Set `EXPO_PUBLIC_API_BASE_URL` on the mobile build to the deployed API origin.
- [ ] Verify `/api/health` returns `{ status: 'ok' }` from the deployed URL.
- [ ] Verify authenticated `/api/agent/message` and `/api/agent/confirm-action` from a release build.
- [ ] Do **not** change `app.json` `web.output` in Phase 4B; address web/server output as part of the deployment milestone above.

### Security reminders

- User identity is derived from the bearer token only; never trust client-sent `user_id`.
- OpenAI and service role keys must never ship in the mobile client bundle.
