#!/usr/bin/env node
/**
 * Sync local .env variables to EAS preview + production environments.
 * Never prints secret values.
 */

import { readFileSync, existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ENV_PATH = join(ROOT, '.env');

const ENVIRONMENTS = ['preview', 'production'];

const VAR_CONFIG = [
  { name: 'EXPO_PUBLIC_SUPABASE_URL', visibility: 'plaintext' },
  { name: 'EXPO_PUBLIC_SUPABASE_ANON_KEY', visibility: 'plaintext' },
  { name: 'EXPO_PUBLIC_API_BASE_URL', visibility: 'plaintext', optional: true },
  { name: 'OPENAI_API_KEY', visibility: 'secret' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', visibility: 'secret' },
  { name: 'REPORT_AI_MODEL', visibility: 'plaintext', optional: true },
  { name: 'RECEIPT_VISION_MODEL', visibility: 'plaintext', optional: true },
];

function loadEnv() {
  if (!existsSync(ENV_PATH)) {
    console.error('.env not found');
    process.exit(1);
  }
  const out = {};
  for (const line of readFileSync(ENV_PATH, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (value) out[key] = value;
  }
  return out;
}

function upsert(name, value, visibility, environment) {
  const args = [
    'env:create',
    '--name',
    name,
    '--value',
    value,
    '--environment',
    environment,
    '--visibility',
    visibility,
    '--scope',
    'project',
    '--non-interactive',
    '--force',
  ];
  const result = spawnSync('eas', args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });
  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || '').trim();
    console.error(`Failed to set ${name} for ${environment}${err ? `: ${err}` : ''}`);
    return false;
  }
  console.log(`Set ${name} (${visibility}) for ${environment}`);
  return true;
}

function main() {
  const local = loadEnv();
  let ok = true;

  for (const env of ENVIRONMENTS) {
    console.log(`\nSyncing ${env}...`);
    for (const cfg of VAR_CONFIG) {
      const value = local[cfg.name] || process.env[cfg.name];
      if (!value) {
        if (!cfg.optional) {
          console.error(`Missing required variable: ${cfg.name}`);
          ok = false;
        }
        continue;
      }
      if (!upsert(cfg.name, value, cfg.visibility, env)) {
        ok = false;
      }
    }
  }

  process.exit(ok ? 0 : 1);
}

main();
