#!/usr/bin/env node
/**
 * Development-only demo reset for the Noor presentation account.
 * Clears mutable data + storage, then restores the shared SQL baseline.
 *
 * Usage:
 *   npm run demo-reset -- --dry-run
 *   npm run demo-reset -- --confirm
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEMO_NOOR_USER_ID,
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

function parseArgs(argv) {
  const args = { demoUserId: DEMO_NOOR_USER_ID, dryRun: false, confirm: false };
  for (const arg of argv) {
    if (arg === '--dry-run') args.dryRun = true;
    if (arg === '--confirm') args.confirm = true;
    if (arg.startsWith('--demo-user-id=')) {
      args.demoUserId = arg.slice('--demo-user-id='.length).trim();
    }
  }
  return args;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SCOPED_TABLES = [
  'agent_actions',
  'agent_messages',
  'transactions',
  'receipts',
  'voice_entries',
  'reports',
  'warnings',
  'budget_events',
  'budget_category_limits',
];

const STORAGE_BUCKETS = ['receipt-scans', 'report-exports'];

async function countRows(supabase, table, userId) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) throw new Error(`${table}: ${error.message}`);
  return count || 0;
}

async function listStorageObjects(supabase, bucket, prefix) {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) throw new Error(`${bucket}/${prefix}: ${error.message}`);
  return data || [];
}

async function deleteStoragePrefix(supabase, bucket, userId) {
  const objects = await listStorageObjects(supabase, bucket, userId);
  if (objects.length === 0) return 0;

  const paths = objects.map((obj) => `${userId}/${obj.name}`);
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) throw new Error(`${bucket} cleanup failed`);
  return paths.length;
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('demo-reset is disabled in production.');
    process.exit(1);
  }

  loadEnvFile();

  const { demoUserId, dryRun, confirm } = parseArgs(process.argv.slice(2));

  if (!demoUserId || !UUID_RE.test(demoUserId)) {
    console.error('Invalid demo user id.');
    process.exit(1);
  }

  if (demoUserId !== DEMO_NOOR_USER_ID) {
    console.error('demo-reset only supports the Noor presentation demo user.');
    process.exit(1);
  }

  if (!dryRun && !confirm) {
    console.error('Pass --dry-run to preview or --confirm to execute reset + reseed.');
    process.exit(1);
  }

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in local .env');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const summary = {
    demoUserId,
    mode: dryRun ? 'dry-run' : 'confirm',
    tables: {},
    storage: {},
  };

  for (const table of SCOPED_TABLES) {
    summary.tables[table] = await countRows(supabase, table, demoUserId);
  }

  for (const bucket of STORAGE_BUCKETS) {
    const objects = await listStorageObjects(supabase, bucket, demoUserId);
    summary.storage[bucket] = objects.length;
  }

  console.log(JSON.stringify({ action: 'demo-reset-preview', ...summary }, null, 2));

  if (dryRun) {
    console.log('Dry run complete. No data was changed.');
    return;
  }

  for (const bucket of STORAGE_BUCKETS) {
    await deleteStoragePrefix(supabase, bucket, demoUserId);
  }

  const { error: clearError } = await supabase.rpc(DEMO_CLEAR_RPC, { p_user_id: demoUserId });
  if (clearError) throw new Error(clearError.message);

  const { error: seedError } = await supabase.rpc(DEMO_SEED_RPC, { p_user_id: demoUserId });
  if (seedError) throw new Error(seedError.message);

  console.log(
    JSON.stringify({
      action: 'demo-reset-complete',
      demoUserId,
      tablesCleared: SCOPED_TABLES.length,
      storageBuckets: STORAGE_BUCKETS,
      baselineRestored: true,
    })
  );
}

main().catch((err) => {
  console.error('demo-reset failed:', err instanceof Error ? err.message : 'unknown error');
  process.exit(1);
});
