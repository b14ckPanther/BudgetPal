#!/usr/bin/env node
/**
 * Dev-only: provision the Noor presentation demo auth user + seed baseline.
 * Password is read from DEMO_NOOR_PASSWORD in local .env only — never committed.
 *
 * Usage:
 *   npm run demo-provision
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEMO_NOOR_USER_ID,
  DEMO_NOOR_EMAIL,
  DEMO_NOOR_USERNAME,
  DEMO_CLEAR_RPC,
  DEMO_SEED_RPC,
} from './demo/constants.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function loadEnvFile() {
  const envPath = resolve(ROOT, '.env');
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('demo-provision is disabled in production.');
    process.exit(1);
  }

  loadEnvFile();

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const password = process.env.DEMO_NOOR_PASSWORD;

  if (!url || !serviceKey) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in local .env');
    process.exit(1);
  }

  if (!password) {
    console.error('Missing DEMO_NOOR_PASSWORD in local .env (dev-only, never commit).');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: byId, error: byIdError } = await supabase.auth.admin.getUserById(DEMO_NOOR_USER_ID);

  if (byIdError && !byIdError.message.includes('not found')) {
    throw new Error(byIdError.message);
  }

  if (!byId?.user) {
    const { error: createError } = await supabase.auth.admin.createUser({
      id: DEMO_NOOR_USER_ID,
      email: DEMO_NOOR_EMAIL,
      password,
      email_confirm: true,
      user_metadata: {
        username: DEMO_NOOR_USERNAME,
        first_name: 'Noor',
        last_name: 'Demo',
        display_name: 'Noor',
        preferred_language: 'en',
        currency: 'ILS',
        budget_style: 'balanced',
      },
    });

    if (createError) {
      throw new Error(createError.message);
    }

    console.log(JSON.stringify({ action: 'demo-user-created', userId: DEMO_NOOR_USER_ID, email: DEMO_NOOR_EMAIL }));
  } else {
    const { error: updateError } = await supabase.auth.admin.updateUserById(DEMO_NOOR_USER_ID, {
      email: DEMO_NOOR_EMAIL,
      email_confirm: true,
      user_metadata: {
        username: DEMO_NOOR_USERNAME,
        first_name: 'Noor',
        last_name: 'Demo',
        display_name: 'Noor',
        preferred_language: 'en',
        currency: 'ILS',
        budget_style: 'balanced',
      },
    });
    if (updateError) throw new Error(updateError.message);
    console.log(JSON.stringify({ action: 'demo-user-exists', userId: DEMO_NOOR_USER_ID }));
  }

  const { error: clearError } = await supabase.rpc(DEMO_CLEAR_RPC, { p_user_id: DEMO_NOOR_USER_ID });
  if (clearError) throw new Error(clearError.message);

  const { error: seedError } = await supabase.rpc(DEMO_SEED_RPC, { p_user_id: DEMO_NOOR_USER_ID });
  if (seedError) throw new Error(seedError.message);

  console.log(JSON.stringify({ action: 'demo-provision-complete', userId: DEMO_NOOR_USER_ID }));
}

main().catch((err) => {
  console.error('demo-provision failed:', err instanceof Error ? err.message : 'unknown error');
  process.exit(1);
});
