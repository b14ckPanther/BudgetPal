#!/usr/bin/env node
/**
 * English PDF path validation on deployed EAS Hosting staging API.
 *
 * Usage:
 *   STAGING_API_BASE_URL=https://xxx.expo.app node scripts/validate-staging-pdf.mjs
 *
 * Requires DEMO_NOOR_PASSWORD in local .env (or service-role session minting).
 * Never logs secrets, storage paths, or signed URLs.
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import {
  DEMO_NOOR_EMAIL,
  DEMO_NOOR_USERNAME,
  DEMO_NOOR_USER_ID,
  DEMO_SEED_RPC,
} from './demo/constants.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadDotEnv() {
  for (const name of ['.env', '.env.local']) {
    const envPath = join(ROOT, name);
    if (!existsSync(envPath)) continue;
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadDotEnv();

const BASE = (process.env.STAGING_API_BASE_URL || process.argv[2] || '').replace(/\/$/, '');
const PASSWORD = process.env.DEMO_NOOR_PASSWORD || '';

const results = [];

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function login() {
  if (PASSWORD) {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: DEMO_NOOR_USERNAME, password: PASSWORD }),
    });
    const body = await res.json();
    if (res.ok && body?.session?.access_token) return body.session.access_token;
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceKey) {
    throw new Error('Missing Supabase env for session minting');
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: DEMO_NOOR_EMAIL,
  });
  if (linkError || !linkData?.properties?.hashed_token) {
    throw new Error('Could not mint demo session');
  }
  const anon = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const { data: otpData, error: otpError } = await anon.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'email',
  });
  if (otpError || !otpData.session?.access_token) {
    throw new Error('Could not verify demo session');
  }
  return otpData.session.access_token;
}

async function ensureEnglishBaseline() {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase env for baseline check');
  }
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: profile } = await admin
    .from('profiles')
    .select('preferred_language, theme_preference')
    .eq('id', DEMO_NOOR_USER_ID)
    .single();

  if (profile?.preferred_language !== 'en') {
    const { error } = await admin.rpc(DEMO_SEED_RPC, { p_user_id: DEMO_NOOR_USER_ID });
    if (error) throw new Error(`Could not restore English demo baseline: ${error.message}`);
    record('Noor baseline language', true, 'restored via seed_demo_noor_baseline');
  } else {
    record('Noor baseline language', true, 'preferred_language=en');
  }

  const { data: after } = await admin
    .from('profiles')
    .select('preferred_language, theme_preference')
    .eq('id', DEMO_NOOR_USER_ID)
    .single();
  if (after?.preferred_language !== 'en') {
    record('Noor English profile', false, `got ${after?.preferred_language || 'null'}`);
    throw new Error('Noor is not English');
  }
  record('Noor dark appearance', after?.theme_preference === 'dark', after?.theme_preference || 'unknown');
}

async function main() {
  if (!BASE.startsWith('https://')) {
    console.error('Set STAGING_API_BASE_URL to the deployed HTTPS origin.');
    process.exit(1);
  }

  console.log(`PDF validation: ${BASE}`);
  console.log('---');

  await ensureEnglishBaseline();

  const token = await login();
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const idempotencyKey = randomUUID();
  const genRes = await fetch(`${BASE}/api/reports/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ type: 'monthly', includePdf: true, idempotencyKey }),
  });
  const genBody = await genRes.json().catch(() => null);

  const report = genBody?.report;
  const ready = genRes.ok && report?.status === 'ready';
  record(
    'POST /api/reports/generate (English PDF)',
    ready && report?.hasPdf === true,
    ready
      ? report?.hasPdf
        ? 'ready with PDF flag'
        : 'ready but hasPdf=false'
      : `status ${genRes.status}${genBody?.error?.code ? ` (${genBody.error.code})` : ''}`
  );

  if (!ready || !report?.id) {
    printSummary();
    process.exit(1);
  }

  record('Report metrics present', !!report.metrics?.hasData, `expenses ${report.metrics?.totalExpenses ?? 0}`);
  record('Report title/date range', !!report.title && !!report.dateFrom && !!report.dateTo, report.title || '');

  const dlRes = await fetch(`${BASE}/api/reports/${report.id}/download`, { headers: { Authorization: `Bearer ${token}` } });
  const dlBody = await dlRes.json().catch(() => null);
  const hasSignedUrl = dlRes.ok && !!dlBody?.downloadUrl && dlBody.downloadUrl.startsWith('https://');
  record('GET /api/reports/[id]/download', hasSignedUrl, hasSignedUrl ? 'signed URL issued' : `status ${dlRes.status}`);

  if (!hasSignedUrl) {
    printSummary();
    process.exit(1);
  }

  const pdfRes = await fetch(dlBody.downloadUrl);
  const pdfBuf = Buffer.from(await pdfRes.arrayBuffer());
  const isPdf = pdfBuf.slice(0, 5).toString('utf8') === '%PDF-';
  record('PDF bytes downloadable', pdfRes.ok && isPdf, `${pdfBuf.length} bytes, valid header=${isPdf}`);

  record(
    'PDF render sanity',
    pdfBuf.length > 1000,
    `${pdfBuf.length} bytes (compressed streams; visual check on device)`
  );

  const outPath = join(ROOT, 'scripts', '.staging-report-sample.pdf');
  writeFileSync(outPath, pdfBuf);
  record('PDF saved for device check', true, 'scripts/.staging-report-sample.pdf (gitignored path)');

  const admin = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
  const { data: row } = await admin
    .from('reports')
    .select('status, file_url')
    .eq('id', report.id)
    .eq('user_id', DEMO_NOOR_USER_ID)
    .single();
  record(
    'Private storage row',
    row?.status === 'ready' && !!row?.file_url,
    row?.file_url ? 'file_url set (path not logged)' : 'missing file_url'
  );

  const { data: objects } = await admin.storage.from('report-exports').list(DEMO_NOOR_USER_ID, { limit: 5 });
  const hasObject = (objects || []).some((o) => o.name?.endsWith('.pdf'));
  record('report-exports bucket object', hasObject, hasObject ? 'PDF object present' : 'not found');

  const foreignRes = await fetch(`${BASE}/api/reports/00000000-0000-4000-8000-000000000099`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  record('Security: foreign report 404', foreignRes.status === 404, `status ${foreignRes.status}`);

  const bodyStr = JSON.stringify(genBody);
  const leaked =
    bodyStr.includes('sk-proj') ||
    bodyStr.includes('service_role') ||
    bodyStr.includes('report-exports/');
  record('No secrets/paths in generate JSON', !leaked, leaked ? 'possible leak' : 'clean');
  record(
    'Report currency in API metrics',
    report.metrics?.currency === 'ILS',
    report.metrics?.currency || 'missing'
  );

  printSummary();
  process.exit(results.every((r) => r.ok) ? 0 : 1);
}

function printSummary() {
  console.log('---');
  const passed = results.filter((r) => r.ok).length;
  console.log(`Summary: ${passed}/${results.length} passed`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
