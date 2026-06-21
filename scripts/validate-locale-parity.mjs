#!/usr/bin/env node
/**
 * Validates English/Hebrew translation key parity.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const en = JSON.parse(readFileSync(join(root, 'src/locales/en.json'), 'utf8'));
const he = JSON.parse(readFileSync(join(root, 'src/locales/he.json'), 'utf8'));

function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

const enKeys = new Set(flattenKeys(en));
const heKeys = new Set(flattenKeys(he));

const missingInHe = [...enKeys].filter((k) => !heKeys.has(k)).sort();
const extraInHe = [...heKeys].filter((k) => !enKeys.has(k)).sort();

if (missingInHe.length || extraInHe.length) {
  console.error('Locale parity check failed.');
  if (missingInHe.length) {
    console.error(`\nMissing in he.json (${missingInHe.length}):`);
    missingInHe.forEach((k) => console.error(`  - ${k}`));
  }
  if (extraInHe.length) {
    console.error(`\nExtra in he.json (${extraInHe.length}):`);
    extraInHe.forEach((k) => console.error(`  - ${k}`));
  }
  process.exit(1);
}

console.log(`Locale parity OK — ${enKeys.size} keys matched.`);
