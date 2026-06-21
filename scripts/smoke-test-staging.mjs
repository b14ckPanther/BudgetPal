#!/usr/bin/env node
/**
 * Staging smoke tests for deployed BudgetPal API (EAS Hosting).
 *
 * Usage:
 *   STAGING_API_BASE_URL=https://xxx.expo.app node scripts/smoke-test-staging.mjs
 *
 * Auth: set DEMO_NOOR_PASSWORD in .env, or service role is used to mint a session.
 * Never logs secrets, tokens, signed URLs, or storage paths.
 */

import { readFileSync, existsSync } from 'fs';
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
  const envPath = join(ROOT, '.env');
  if (!existsSync(envPath)) return;
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

const DEMO_USERNAME = DEMO_NOOR_USERNAME;

loadDotEnv();

const BASE = (process.env.STAGING_API_BASE_URL || process.argv[2] || '').replace(/\/$/, '');
const PASSWORD = process.env.DEMO_NOOR_PASSWORD || '';

const results = [];

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${name}${detail ? ` — ${detail}` : ''}`);
}

function assertNoSecrets(text) {
  const lower = String(text).toLowerCase();
  const forbidden = [
    'sk-proj',
    'service_role',
    'supabase.co/storage/v1/object',
    'receipt-scans/',
    'report-exports/',
  ];
  for (const token of forbidden) {
    if (lower.includes(token)) {
      throw new Error(`Response may contain sensitive data (matched: ${token})`);
    }
  }
}

async function api(path, options = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  let body = null;
  if (contentType.includes('application/json')) {
    body = await res.json().catch(() => null);
  } else {
    body = await res.text().catch(() => '');
  }
  return { res, body };
}

async function cleanupStaleProposedActions() {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return;
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  await admin
    .from('agent_actions')
    .delete()
    .eq('user_id', DEMO_NOOR_USER_ID)
    .eq('status', 'proposed');
}

async function login() {
  if (PASSWORD) {
    const { res, body } = await api('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: DEMO_USERNAME, password: PASSWORD }),
    });
    if (res.ok && body?.session?.access_token) {
      return body.session.access_token;
    }
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceKey) {
    throw new Error('Missing Supabase env for session minting');
  }

  if (PASSWORD) {
    const client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    const { data, error } = await client.auth.signInWithPassword({
      email: DEMO_NOOR_EMAIL,
      password: PASSWORD,
    });
    if (!error && data.session?.access_token) {
      return data.session.access_token;
    }
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: DEMO_NOOR_EMAIL,
  });
  if (linkError || !linkData?.properties?.hashed_token) {
    throw new Error('Could not mint demo session for smoke tests');
  }

  const anon = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const { data: otpData, error: otpError } = await anon.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'email',
  });
  if (otpError || !otpData.session?.access_token) {
    throw new Error('Could not verify demo session for smoke tests');
  }
  return otpData.session.access_token;
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function firstProposedActionId(body) {
  if (!body?.actions?.length) return undefined;
  const proposed = body.actions.find((a) => a?.status === 'proposed' || a?.type === 'propose_transaction');
  return (proposed || body.actions[0])?.id;
}

/** Minimal valid WAV (silence, >512 bytes, duration >= 800ms for server validation). */
function minimalWavBuffer() {
  const sampleRate = 8000;
  const durationSec = 1.0;
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
}

function loadReceiptImageBuffer() {
  const iconPath = join(ROOT, 'assets', 'images', 'icon.png');
  const buf = readFileSync(iconPath);
  if (buf.length < 1024) {
    throw new Error('Test receipt image too small');
  }
  return buf;
}

async function main() {
  if (!BASE || !BASE.startsWith('https://')) {
    console.error('Set STAGING_API_BASE_URL to the deployed HTTPS origin.');
    process.exit(1);
  }

  console.log(`Smoke testing: ${BASE}`);
  console.log('---');

  await cleanupStaleProposedActions();

  // 1. Health
  try {
    const { res, body } = await api('/api/health');
    assertNoSecrets(JSON.stringify(body));
    const ok = res.ok && body?.status === 'ok';
    record('GET /api/health', ok, ok ? 'status ok' : `status ${res.status}`);
  } catch (e) {
    record('GET /api/health', false, e.message);
  }

  // 2. Auth helpers
  try {
    const { res, body } = await api('/api/auth/check-username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: DEMO_USERNAME }),
    });
    assertNoSecrets(JSON.stringify(body));
    record('POST /api/auth/check-username', res.ok && body?.available === false, 'noor taken');
  } catch (e) {
    record('POST /api/auth/check-username', false, e.message);
  }

  try {
    const { res, body } = await api('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '', password: '' }),
    });
    assertNoSecrets(JSON.stringify(body));
    record('POST /api/auth/login invalid', res.status === 400, 'safe 400');
  } catch (e) {
    record('POST /api/auth/login invalid', false, e.message);
  }

  let token;
  try {
    if (PASSWORD) {
      const { res, body } = await api('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: DEMO_USERNAME, password: PASSWORD }),
      });
      assertNoSecrets(JSON.stringify(body));
      const apiOk = res.ok && !!body?.session?.access_token;
      record(
        'POST /api/auth/login username',
        apiOk,
        apiOk ? 'API username login' : `status ${res.status}`
      );
      if (apiOk) token = body.session.access_token;
    } else {
      record('POST /api/auth/login username', true, 'skipped — no password; using admin-minted session');
    }

    if (!token) {
      token = await login();
    }
  } catch (e) {
    record('POST /api/auth/login username', false, e.message);
    printSummary();
    process.exit(1);
  }

  // Security: missing bearer
  try {
    const { res } = await api('/api/agent/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hi' }),
    });
    record('Security: missing bearer', res.status === 401, `status ${res.status}`);
  } catch (e) {
    record('Security: missing bearer', false, e.message);
  }

  // 3. Agent greeting
  let greetingBody;
  try {
    const { res, body } = await api('/api/agent/message', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ message: 'Hey' }),
    });
    assertNoSecrets(JSON.stringify(body));
    greetingBody = body;
    record('Agent greeting', res.ok && !!body?.message, 'reply received');
  } catch (e) {
    record('Agent greeting', false, e.message);
  }

  // Agent transaction proposal
  let actionId;
  try {
    const { res, body } = await api('/api/agent/message', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ message: 'I spent 55 shekels at Supermarket today for groceries' }),
    });
    assertNoSecrets(JSON.stringify(body));
    actionId = firstProposedActionId(body);
    record('Agent transaction proposal', res.ok && !!actionId, actionId ? 'action proposed' : 'no action');
  } catch (e) {
    record('Agent transaction proposal', false, e.message);
  }

  // Cancel action
  if (actionId) {
    try {
      const { res, body } = await api('/api/agent/confirm-action', {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ actionId, action: 'cancel' }),
      });
      assertNoSecrets(JSON.stringify(body));
      record('Agent cancel action', res.ok && body?.action === 'cancelled', 'cancelled');
    } catch (e) {
      record('Agent cancel action', false, e.message);
    }
  } else {
    record('Agent cancel action', false, 'skipped — no actionId');
  }

  // Confirm action (new proposal)
  let confirmActionId;
  try {
    const { res, body } = await api('/api/agent/message', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ message: 'Paid 18 shekels for bus ticket today' }),
    });
    confirmActionId = firstProposedActionId(body);
    if (confirmActionId) {
      const confirm = await api('/api/agent/confirm-action', {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ actionId: confirmActionId, action: 'confirm' }),
      });
      assertNoSecrets(JSON.stringify(confirm.body));
      record('Agent confirm action', confirm.res.ok && confirm.body?.action === 'confirmed', 'confirmed');
    } else {
      record('Agent confirm action', false, 'no proposal to confirm');
    }
  } catch (e) {
    record('Agent confirm action', false, e.message);
  }

  // Clear history without pending
  try {
    const { res, body } = await api('/api/agent/clear-history', {
      method: 'POST',
      headers: authHeaders(token),
    });
    assertNoSecrets(JSON.stringify(body));
    record(
      'Agent clear history (no pending)',
      res.ok && body?.ok === true,
      res.ok ? 'cleared' : `status ${res.status}`
    );
  } catch (e) {
    record('Agent clear history (no pending)', false, e.message);
  }

  // Clear history with pending (create then expect 409)
  try {
    const propose = await api('/api/agent/message', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ message: 'Spent 25 on snacks' }),
    });
    const pendingId = firstProposedActionId(propose.body);
    const { res, body } = await api('/api/agent/clear-history', {
      method: 'POST',
      headers: authHeaders(token),
    });
    assertNoSecrets(JSON.stringify(body));
    const ok = res.status === 409 && pendingId;
    record('Agent clear history (pending 409)', ok, ok ? '409 as expected' : `status ${res.status}`);
    if (pendingId) {
      await api('/api/agent/confirm-action', {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ actionId: pendingId, action: 'cancel' }),
      });
    }
  } catch (e) {
    record('Agent clear history (pending 409)', false, e.message);
  }

  // 4. Voice
  try {
    const form = new FormData();
    const wav = minimalWavBuffer();
    form.append('audio', new Blob([wav], { type: 'audio/wav' }), 'test.wav');
    form.append('durationMs', '1000');
    form.append('speechDetected', 'true');

    const res = await fetch(`${BASE}/api/voice/transcribe`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const body = await res.json().catch(() => null);
    assertNoSecrets(JSON.stringify(body));
    // Whisper may return 422 on silence; 200 or 422 both prove runtime works
    const runtimeOk = res.status === 200 || res.status === 422;
    const detail =
      res.status === 200
        ? 'transcribed + agent reply'
        : res.status === 422
          ? 'runtime ok (no speech detected)'
          : `status ${res.status}`;
    record('POST /api/voice/transcribe', runtimeOk, detail);
  } catch (e) {
    record('POST /api/voice/transcribe', false, e.message);
  }

  try {
    const form = new FormData();
    form.append('audio', new Blob([Buffer.alloc(10)], { type: 'audio/wav' }), 'tiny.wav');
    form.append('durationMs', '100');
    form.append('speechDetected', 'true');
    const res = await fetch(`${BASE}/api/voice/transcribe`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    record('Voice invalid upload rejected', res.status === 400, `status ${res.status}`);
  } catch (e) {
    record('Voice invalid upload rejected', false, e.message);
  }

  // 5. Receipt scan
  let receiptActionId;
  try {
    const form = new FormData();
    const imageBuf = loadReceiptImageBuffer();
    form.append('image', new Blob([imageBuf], { type: 'image/png' }), 'receipt.png');

    const res = await fetch(`${BASE}/api/receipts/scan`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const body = await res.json().catch(() => null);
    assertNoSecrets(JSON.stringify(body));
    receiptActionId = firstProposedActionId(body);
    record(
      'POST /api/receipts/scan',
      res.ok && (!!body?.message || !!receiptActionId),
      res.ok ? 'vision + proposal' : `status ${res.status}`
    );
  } catch (e) {
    record('POST /api/receipts/scan', false, e.message);
  }

  if (receiptActionId) {
    try {
      const cancel = await api('/api/agent/confirm-action', {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ actionId: receiptActionId, action: 'cancel' }),
      });
      record('Receipt cancel cleanup', cancel.res.ok, 'cancelled');
    } catch (e) {
      record('Receipt cancel cleanup', false, e.message);
    }
  }

  try {
    const form = new FormData();
    form.append('image', new Blob([Buffer.alloc(50)], { type: 'image/png' }), 'tiny.png');
    const res = await fetch(`${BASE}/api/receipts/scan`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    record('Receipt invalid upload rejected', res.status === 400, `status ${res.status}`);
  } catch (e) {
    record('Receipt invalid upload rejected', false, e.message);
  }

  // 6. Reports (English PDF path — Noor presentation baseline is en)
  let reportId;
  let reportHasPdf = false;
  let noorLanguage = 'en';
  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceKey) {
      const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
      const { data: profile } = await admin
        .from('profiles')
        .select('preferred_language')
        .eq('id', DEMO_NOOR_USER_ID)
        .single();
      noorLanguage = profile?.preferred_language || 'en';
      if (noorLanguage !== 'en') {
        await admin.rpc(DEMO_SEED_RPC, { p_user_id: DEMO_NOOR_USER_ID });
        const { data: after } = await admin
          .from('profiles')
          .select('preferred_language')
          .eq('id', DEMO_NOOR_USER_ID)
          .single();
        noorLanguage = after?.preferred_language || noorLanguage;
      }
      record(
        'Noor presentation language',
        noorLanguage === 'en',
        noorLanguage === 'en' ? 'preferred_language=en' : `expected en, got ${noorLanguage}`
      );
    }
  } catch (e) {
    record('Noor presentation language', false, e.message);
  }

  try {
    const idempotencyKey = randomUUID();
    const { res, body } = await api('/api/reports/generate', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        type: 'monthly',
        includePdf: true,
        idempotencyKey,
      }),
    });
    assertNoSecrets(JSON.stringify(body));
    reportId = body?.report?.id;
    reportHasPdf = !!body?.report?.hasPdf;
    const ready = res.ok && body?.report?.status === 'ready';
    const expectPdf = noorLanguage === 'en';
    const pdfOk = ready && (!expectPdf || reportHasPdf);
    const pdfNote = reportHasPdf
      ? 'ready with PDF'
      : expectPdf
        ? 'ready but hasPdf=false (English PDF expected)'
        : 'ready (Hebrew profile defers PDF by product rule)';
    record('POST /api/reports/generate (PDF)', pdfOk, ready ? pdfNote : `status ${res.status}`);
  } catch (e) {
    record('POST /api/reports/generate (PDF)', false, e.message);
  }

  if (reportId && reportHasPdf) {
    try {
      const { res, body: downloadBody } = await api(`/api/reports/${reportId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const hasUrl = !!downloadBody?.downloadUrl && downloadBody.downloadUrl.startsWith('https://');
      const safeJson =
        !JSON.stringify(downloadBody).includes('sk-proj') &&
        !JSON.stringify(downloadBody).includes('service_role');
      record(
        'Report signed download URL',
        res.ok && hasUrl && safeJson,
        hasUrl ? 'signed URL issued' : 'missing url'
      );

      if (hasUrl) {
        const pdfRes = await fetch(downloadBody.downloadUrl);
        const pdfBuf = Buffer.from(await pdfRes.arrayBuffer());
        const isPdf = pdfBuf.slice(0, 5).toString('utf8') === '%PDF-';
        record(
          'Report PDF download bytes',
          pdfRes.ok && isPdf && pdfBuf.length > 500,
          `${pdfBuf.length} bytes`
        );
      } else {
        record('Report PDF download bytes', false, 'skipped — no signed URL');
      }
    } catch (e) {
      record('Report signed download URL', false, e.message);
      record('Report PDF download bytes', false, e.message);
    }
  } else if (reportId && noorLanguage !== 'en') {
    record('Report signed download URL', true, 'skipped — Hebrew profile defers PDF');
    record('Report PDF download bytes', true, 'skipped — Hebrew profile defers PDF');
  } else {
    record('Report signed download URL', false, 'skipped — no PDF on English path');
    record('Report PDF download bytes', false, 'skipped — no PDF on English path');
  }

  if (reportId) {
    try {
      const { res } = await api(`/api/reports/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      record('GET /api/reports/[id]', res.ok, `status ${res.status}`);
    } catch (e) {
      record('GET /api/reports/[id]', false, e.message);
    }
  } else {
    record('GET /api/reports/[id]', false, 'skipped — no reportId');
  }

  try {
    const { res, body } = await api('/api/reports', {
      headers: { Authorization: `Bearer ${token}` },
    });
    record('GET /api/reports', res.ok && Array.isArray(body?.reports), `count ${body?.reports?.length ?? 0}`);
  } catch (e) {
    record('GET /api/reports', false, e.message);
  }

  try {
    const { res, body } = await api('/api/export/transactions', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const ok = res.ok && typeof body === 'string' && body.includes('date');
    record('GET /api/export/transactions', ok, 'CSV returned');
  } catch (e) {
    record('GET /api/export/transactions', false, e.message);
  }

  try {
    const res = await fetch(`${BASE}/api/export/account`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const text = await res.text();
    const ok = res.ok && text.includes('"profile"');
    record('GET /api/export/account', ok, 'JSON export returned');
  } catch (e) {
    record('GET /api/export/account', false, e.message);
  }

  // Security: cross-user report access (fake UUID)
  try {
    const { res } = await api('/api/reports/00000000-0000-4000-8000-000000000099', {
      headers: { Authorization: `Bearer ${token}` },
    });
    record('Security: foreign report 404', res.status === 404, `status ${res.status}`);
  } catch (e) {
    record('Security: foreign report 404', false, e.message);
  }

  printSummary();
  const failed = results.filter((r) => !r.ok);
  process.exit(failed.length ? 1 : 0);
}

function printSummary() {
  console.log('---');
  const passed = results.filter((r) => r.ok).length;
  console.log(`Summary: ${passed}/${results.length} passed`);
  const critical = [
    'POST /api/voice/transcribe',
    'POST /api/receipts/scan',
    'POST /api/reports/generate (PDF)',
  ];
  for (const name of critical) {
    const row = results.find((r) => r.name === name);
    if (row) console.log(`Critical runtime: ${name} => ${row.ok ? 'PASS' : 'FAIL'}`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
