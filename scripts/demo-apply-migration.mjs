#!/usr/bin/env node
/**
 * Applies the Noor demo migration SQL via Supabase MCP-compatible direct SQL.
 * Requires SUPABASE_DB_URL in local .env (Session pooler URI from dashboard).
 *
 * Usage: node scripts/demo-apply-migration.mjs
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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
  loadEnvFile();
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error('Missing SUPABASE_DB_URL in .env (Postgres connection string from Supabase dashboard).');
    console.error('Alternatively apply supabase/migrations/20260620000011_seed_noor_demo_account.sql in the SQL editor.');
    process.exit(1);
  }

  let pg;
  try {
    pg = await import('pg');
  } catch {
    console.error('Install pg: npm install --save-dev pg');
    process.exit(1);
  }

  const sql = readFileSync(
    resolve(ROOT, 'supabase/migrations/20260620000011_seed_noor_demo_account.sql'),
    'utf8'
  );

  const client = new pg.default.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log(JSON.stringify({ action: 'demo-migration-applied' }));
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('demo-apply-migration failed:', err instanceof Error ? err.message : 'unknown error');
  process.exit(1);
});
