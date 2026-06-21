#!/usr/bin/env node
/**
 * Pre-flight checks before presentation EAS native builds.
 * Never prints secret values.
 *
 * Usage: npm run validate:presentation-build
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { randomUUID } from 'crypto';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { DEMO_NOOR_EMAIL, DEMO_NOOR_USERNAME } from './demo/constants.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const FORBIDDEN_API_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '10.',
  '192.168.',
  '172.16.',
  '172.17.',
  '172.18.',
  '172.19.',
  '172.20.',
  '172.21.',
  '172.22.',
  '172.23.',
  '172.24.',
  '172.25.',
  '172.26.',
  '172.27.',
  '172.28.',
  '172.29.',
  '172.30.',
  '172.31.',
];

/** One-off deployment IDs look like --51c0qpbrkq.expo.app (not stable aliases). */
const STABLE_PRESENTATION_HOST = 'millionroses-budgetpal--presentation.expo.app';
const STABLE_PRODUCTION_HOST = 'millionroses-budgetpal.expo.app';
const EPHEMERAL_DEPLOYMENT_ID_RE = /--[a-z0-9]{6,}\.expo\.app$/i;

function isHttpsProductionUrl(url) {
  if (!url || !url.startsWith('https://')) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (FORBIDDEN_API_HOSTS.some((h) => host === h || host.startsWith(h))) return false;
    if (host === STABLE_PRESENTATION_HOST || host === STABLE_PRODUCTION_HOST) return true;
    if (EPHEMERAL_DEPLOYMENT_ID_RE.test(host)) return false;
    return host.endsWith('.expo.app');
  } catch {
    return false;
  }
}
const CLIENT_SCAN_DIRS = ['app', 'src/components', 'src/hooks', 'src/lib', 'src/services', 'src/contexts'];
const CLIENT_SECRET_PATTERNS = [
  /\bSUPABASE_SERVICE_ROLE_KEY\b/,
  /\bOPENAI_API_KEY\b/,
  /\bDEMO_NOOR_PASSWORD\b/,
  /\bsk-proj-/,
];

const results = [];

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ` — ${detail}` : ''}`);
}

function readJson(relPath) {
  return JSON.parse(readFileSync(join(ROOT, relPath), 'utf8'));
}

function runEas(args) {
  return spawnSync('eas', args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function getProductionApiBaseUrl() {
  const result = runEas([
    'env:get',
    'production',
    '--variable-name',
    'EXPO_PUBLIC_API_BASE_URL',
    '--format',
    'short',
    '--non-interactive',
  ]);
  if (result.status !== 0) return null;
  const raw = (result.stdout || '').trim();
  const line = raw.split('\n').pop()?.trim() || '';
  const value = line.includes('=') ? line.slice(line.indexOf('=') + 1).trim() : line;
  if (!value || /not found|error/i.test(value)) return null;
  return value.replace(/\/$/, '');
}

function scanClientSecrets() {
  const offenders = [];
  function walk(rel) {
    const full = join(ROOT, rel);
    if (!existsSync(full)) return;
    const stat = statSync(full);
    if (stat.isFile() && /\.(tsx?|jsx?)$/.test(rel)) {
      const norm = rel.replace(/\\/g, '/');
      if (norm.includes('/server/') || norm.includes('app/api/')) return;
      const text = readFileSync(full, 'utf8');
      for (const pattern of CLIENT_SECRET_PATTERNS) {
        if (pattern.test(text)) {
          offenders.push(norm);
          break;
        }
      }
      return;
    }
    if (!stat.isDirectory()) return;
    for (const name of readdirSync(full)) {
      if (name === 'node_modules') continue;
      walk(join(rel, name));
    }
  }
  for (const dir of CLIENT_SCAN_DIRS) walk(dir);
  return offenders;
}

function checkGitNoDemoPassword() {
  const git = spawnSync(
    'git',
    ['grep', '-l', 'DEMO_NOOR_PASSWORD', '--', 'app', 'src', 'assets'],
    { cwd: ROOT, encoding: 'utf8', shell: true }
  );
  return git.status === 1 && !git.stdout?.trim();
}

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

async function loginToken(apiBase) {
  const password = process.env.DEMO_NOOR_PASSWORD;
  if (password) {
    const res = await fetch(`${apiBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: DEMO_NOOR_USERNAME, password }),
    });
    const body = await res.json().catch(() => null);
    if (res.ok && body?.session?.access_token) return body.session.access_token;
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceKey) return null;

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: linkData } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: DEMO_NOOR_EMAIL,
  });
  if (!linkData?.properties?.hashed_token) return null;
  const anon = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const { data: otpData } = await anon.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'email',
  });
  return otpData?.session?.access_token || null;
}

async function main() {
  loadDotEnv();
  console.log('Presentation build readiness\n---');

  const appConfig = readJson('app.json').expo;
  const easConfig = readJson('eas.json');

  const apiBase = getProductionApiBaseUrl();
  const apiOk = isHttpsProductionUrl(apiBase);
  record(
    'production EXPO_PUBLIC_API_BASE_URL',
    !!apiBase && apiOk,
    apiBase ? `${new URL(apiBase).hostname} (HTTPS)` : 'not set in EAS production'
  );
  record(
    'API origin not localhost/LAN/staging ID',
    !!apiBase && apiOk,
    apiOk ? 'stable origin' : apiBase ? 'invalid or one-off deployment URL' : 'missing'
  );

  if (apiBase && apiOk) {
    try {
      const health = await fetch(`${apiBase}/api/health`);
      const body = await health.json().catch(() => null);
      record('production /api/health', health.ok && body?.status === 'ok', `status ${health.status}`);
    } catch (e) {
      record('production /api/health', false, e.message);
    }
  } else {
    record('production /api/health', false, 'skipped — no valid API URL');
  }

  const secretOffenders = scanClientSecrets();
  record(
    'no server secrets in mobile client code',
    secretOffenders.length === 0,
    secretOffenders.length ? `${secretOffenders.length} file(s)` : 'clean'
  );

  const iconPath = appConfig.icon?.replace('./', '');
  const androidFg = appConfig.android?.adaptiveIcon?.foregroundImage?.replace('./', '');
  record('app icon asset', iconPath && existsSync(join(ROOT, iconPath)), iconPath || 'missing');
  record(
    'Android adaptive icon',
    androidFg && existsSync(join(ROOT, androidFg)),
    androidFg || 'missing'
  );

  record('iOS bundleIdentifier', !!appConfig.ios?.bundleIdentifier, appConfig.ios?.bundleIdentifier || '');
  record('Android package', !!appConfig.android?.package, appConfig.android?.package || '');
  record(
    'Hebrew localization config',
    (appConfig.ios?.infoPlist?.CFBundleLocalizations || []).includes('he'),
    'en+he'
  );
  record('app version', !!appConfig.version, appConfig.version || '');

  const profiles = easConfig.build || {};
  const androidProfile = profiles['presentation-android'];
  const iosProfile = profiles['presentation-ios'];
  record('EAS profile presentation-android', !!androidProfile, androidProfile ? 'present' : 'missing');
  record('EAS profile presentation-ios', !!iosProfile, iosProfile ? 'present' : 'missing');
  record(
    'presentation-android uses production env',
    androidProfile?.environment === 'production',
    androidProfile?.environment || 'n/a'
  );
  record(
    'presentation-ios uses production env',
    iosProfile?.environment === 'production',
    iosProfile?.environment || 'n/a'
  );
  record(
    'presentation-android outputs APK',
    androidProfile?.android?.buildType === 'apk',
    androidProfile?.android?.buildType || 'n/a'
  );
  record(
    'presentation-ios store distribution',
    iosProfile?.distribution === 'store',
    iosProfile?.distribution || 'n/a'
  );
  record(
    'submit.production without repo credentials',
    easConfig.submit?.production !== undefined && !JSON.stringify(easConfig.submit).includes('appleId'),
    'empty submit.production (credentials on EAS only)'
  );

  const noPasswordInGit = checkGitNoDemoPassword();
  record('no DEMO_NOOR_PASSWORD in tracked app code', noPasswordInGit, noPasswordInGit ? 'clean' : 'found in git');

  if (apiBase && apiOk) {
    const token = await loginToken(apiBase);
    if (token) {
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      try {
        const agentRes = await fetch(`${apiBase}/api/agent/message`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ message: 'Hello' }),
        });
        const agentBody = await agentRes.json().catch(() => null);
        record(
          'production agent greeting',
          agentRes.ok && !!agentBody?.message,
          agentRes.ok && agentBody?.message ? 'reply received' : `status ${agentRes.status}`
        );
      } catch (e) {
        record('production agent greeting', false, e.message);
      }

      try {
        const genRes = await fetch(`${apiBase}/api/reports/generate`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ type: 'monthly', includePdf: true, idempotencyKey: randomUUID() }),
        });
        const genBody = await genRes.json().catch(() => null);
        const ready = genRes.ok && genBody?.report?.status === 'ready' && genBody?.report?.hasPdf;
        record('production report + PDF', ready, ready ? 'ready with PDF' : `status ${genRes.status}`);

        if (ready && genBody?.report?.id) {
          const dlRes = await fetch(`${apiBase}/api/reports/${genBody.report.id}/download`, { headers });
          const dlBody = await dlRes.json().catch(() => null);
          const hasUrl = dlRes.ok && !!dlBody?.downloadUrl?.startsWith('https://');
          record(
            'production PDF download route',
            hasUrl,
            hasUrl ? 'signed URL issued' : `status ${dlRes.status}`
          );
        } else {
          record('production PDF download route', false, 'skipped — report not ready');
        }
      } catch (e) {
        record('production report + PDF', false, e.message);
        record('production PDF download route', false, 'skipped');
      }
    } else {
      record('production agent greeting', false, 'skipped — no auth (set DEMO_NOOR_PASSWORD locally)');
      record('production report + PDF', false, 'skipped — no auth');
      record('production PDF download route', false, 'skipped — no auth');
    }
  }

  console.log('---');
  const passed = results.filter((r) => r.ok).length;
  console.log(`Summary: ${passed}/${results.length} passed`);
  process.exit(results.every((r) => r.ok) ? 0 : 1);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
