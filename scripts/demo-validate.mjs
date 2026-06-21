#!/usr/bin/env node
/**
 * Validates the Noor presentation demo account baseline.
 *
 * Usage:
 *   npm run demo-validate
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEMO_NOOR_USER_ID,
  DEMO_NOOR_EMAIL,
  DEMO_NOOR_USERNAME,
  DEMO_NOOR_BUDGET_ID,
} from './demo/constants.mjs';
import {
  getCycleRange,
  formatLocalDate,
  computeParentSpendInCycle,
  computeSafeToSpend,
} from './demo/budgetChecks.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const REQUIRED_SUBCATEGORIES = [
  ['Food & Drinks', 'Groceries'],
  ['Food & Drinks', 'Restaurants'],
  ['Car', 'Fuel'],
  ['Bills', 'Rent'],
  ['Subscriptions', 'Streaming'],
  ['Income', 'Salary'],
];

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

function fail(checks, name, detail) {
  checks.push({ name, ok: false, detail });
}

function pass(checks, name, detail) {
  checks.push({ name, ok: true, detail });
}

async function main() {
  loadEnvFile();

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const checks = [];
  const userId = DEMO_NOOR_USER_ID;
  const today = new Date();

  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
  if (authError || !authUser?.user) {
    fail(checks, 'auth_user_exists', authError?.message || 'not found');
  } else {
    pass(checks, 'auth_user_exists', userId);
    if (authUser.user.email === DEMO_NOOR_EMAIL) pass(checks, 'auth_email', DEMO_NOOR_EMAIL);
    else fail(checks, 'auth_email', `expected ${DEMO_NOOR_EMAIL}`);
    if (authUser.user.email_confirmed_at) pass(checks, 'auth_email_confirmed', 'yes');
    else fail(checks, 'auth_email_confirmed', 'not confirmed');
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (!profile) {
    fail(checks, 'profile_exists', 'missing');
  } else {
    pass(checks, 'profile_exists', profile.id);
    if (profile.username === DEMO_NOOR_USERNAME) pass(checks, 'profile_username', 'noor');
    else fail(checks, 'profile_username', profile.username || 'null');
    if (profile.onboarding_completed) pass(checks, 'onboarding_complete', 'true');
    else fail(checks, 'onboarding_complete', 'false');
    if (profile.currency === 'ILS') pass(checks, 'profile_currency', 'ILS');
    else fail(checks, 'profile_currency', profile.currency);
    if (profile.preferred_language === 'en') pass(checks, 'profile_language', 'en');
    else fail(checks, 'profile_language', profile.preferred_language || 'null');
    if (profile.budget_style === 'balanced') pass(checks, 'profile_budget_style', 'balanced');
    else fail(checks, 'profile_budget_style', profile.budget_style || 'null');
    if (profile.theme_preference) pass(checks, 'profile_theme', profile.theme_preference);
    else fail(checks, 'profile_theme', 'missing');
    if (Number(profile.monthly_income) > 0) pass(checks, 'profile_monthly_income', String(profile.monthly_income));
    else fail(checks, 'profile_monthly_income', '0');
  }

  const { data: budget } = await supabase
    .from('budgets')
    .select('*')
    .eq('id', DEMO_NOOR_BUDGET_ID)
    .eq('user_id', userId)
    .maybeSingle();

  const { count: activeBudgetCount } = await supabase
    .from('budgets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true);

  if (budget?.is_active && (activeBudgetCount || 0) === 1) {
    pass(checks, 'active_budget', budget.id);
  } else {
    fail(checks, 'active_budget', `active=${activeBudgetCount || 0}`);
  }

  if (budget?.currency === 'ILS') pass(checks, 'budget_currency', 'ILS');
  else fail(checks, 'budget_currency', budget?.currency || 'missing');

  if (budget && Number(budget.monthly_income) >= 1000) {
    pass(checks, 'budget_monthly_income', String(budget.monthly_income));
  } else {
    fail(checks, 'budget_monthly_income', String(budget?.monthly_income || 0));
  }

  const cycleDay = budget?.cycle_start_day || 1;
  const { startDate, endDate } = getCycleRange(today, cycleDay);
  const cycleStartStr = formatLocalDate(startDate);
  const cycleEndStr = formatLocalDate(endDate);
  const todayStr = formatLocalDate(today);

  if (todayStr >= cycleStartStr && todayStr <= cycleEndStr) {
    pass(checks, 'budget_cycle_includes_today', `${cycleStartStr}..${cycleEndStr}`);
  } else {
    fail(checks, 'budget_cycle_includes_today', `${cycleStartStr}..${cycleEndStr}`);
  }

  const { count: limitCount } = await supabase
    .from('budget_category_limits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('budget_id', DEMO_NOOR_BUDGET_ID);

  if ((limitCount || 0) >= 8) pass(checks, 'category_limits', String(limitCount));
  else fail(checks, 'category_limits', String(limitCount || 0));

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, type, parent_category_id')
    .eq('user_id', userId);

  const catById = new Map((categories || []).map((c) => [c.id, c]));

  for (const [parentName, childName] of REQUIRED_SUBCATEGORIES) {
    const parent = (categories || []).find(
      (c) => c.name === parentName && !c.parent_category_id
    );
    const child = parent
      ? (categories || []).find(
          (c) => c.name === childName && c.parent_category_id === parent.id
        )
      : null;
    if (parent && child) pass(checks, `subcategory_${childName.replace(/\s+/g, '_').toLowerCase()}`, 'ok');
    else fail(checks, `subcategory_${childName.replace(/\s+/g, '_').toLowerCase()}`, 'missing');
  }

  const { data: limits } = await supabase
    .from('budget_category_limits')
    .select('category_id, monthly_limit')
    .eq('user_id', userId)
    .eq('budget_id', DEMO_NOOR_BUDGET_ID);

  const badLimits = (limits || []).filter((l) => !catById.has(l.category_id));
  if (badLimits.length === 0) pass(checks, 'limits_linked_to_categories', 'ok');
  else fail(checks, 'limits_linked_to_categories', String(badLimits.length));

  const { data: allTx } = await supabase
    .from('transactions')
    .select('amount, type, category_id, subcategory_id, source, status, date, merchant')
    .eq('user_id', userId);

  const badTx = (allTx || []).filter(
    (t) => t.category_id && !catById.has(t.category_id)
  );
  if (badTx.length === 0) pass(checks, 'transactions_valid_categories', 'ok');
  else fail(checks, 'transactions_valid_categories', String(badTx.length));

  const parentSpend = computeParentSpendInCycle(allTx || [], categories || [], cycleStartStr, cycleEndStr);
  const limitByCat = new Map((limits || []).map((l) => [l.category_id, Number(l.monthly_limit)]));

  let hasHealthy = false;
  let hasCaution = false;
  let hasOver = false;

  for (const [catId, limit] of limitByCat) {
    const cat = catById.get(catId);
    if (!cat || limit <= 0) continue;
    const spent = parentSpend.get(cat.name) || 0;
    const pct = (spent / limit) * 100;
    if (pct < 50) hasHealthy = true;
    if (pct >= 75 && pct < 100) hasCaution = true;
    if (pct >= 100) hasOver = true;
  }

  if (hasHealthy) pass(checks, 'cycle_healthy_category', 'found');
  else fail(checks, 'cycle_healthy_category', 'none under 50%');
  if (hasCaution) pass(checks, 'cycle_caution_category', 'found');
  else fail(checks, 'cycle_caution_category', 'none 75-99%');
  if (hasOver) pass(checks, 'cycle_over_category', 'found');
  else fail(checks, 'cycle_over_category', 'none at or over 100%');

  const safeToSpend = computeSafeToSpend(budget, allTx || [], categories || [], limits || [], today);
  if (safeToSpend !== null && safeToSpend > 0) {
    pass(checks, 'safe_to_spend', String(Math.floor(safeToSpend)));
  } else {
    fail(checks, 'safe_to_spend', safeToSpend === null ? 'null' : String(safeToSpend));
  }

  const { count: txCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'confirmed');
  if ((txCount || 0) >= 60) pass(checks, 'transaction_count', String(txCount));
  else fail(checks, 'transaction_count', String(txCount || 0));

  const priorMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const priorMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  const priorStartStr = formatLocalDate(priorMonthStart);
  const priorEndStr = formatLocalDate(priorMonthEnd);
  const { count: priorMonthTx } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .gte('date', priorStartStr)
    .lte('date', priorEndStr);
  if ((priorMonthTx || 0) >= 5) pass(checks, 'prior_month_transactions', String(priorMonthTx));
  else fail(checks, 'prior_month_transactions', String(priorMonthTx || 0));

  const { count: cycleTxCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .gte('date', cycleStartStr)
    .lte('date', cycleEndStr);
  if ((cycleTxCount || 0) >= 10) pass(checks, 'current_cycle_transactions', String(cycleTxCount));
  else fail(checks, 'current_cycle_transactions', String(cycleTxCount || 0));

  const { count: incomeCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', 'income')
    .eq('status', 'confirmed');
  if ((incomeCount || 0) >= 2) pass(checks, 'income_transactions', String(incomeCount));
  else fail(checks, 'income_transactions', String(incomeCount || 0));

  for (const source of ['manual', 'text', 'voice', 'receipt']) {
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('source', source)
      .eq('status', 'confirmed');
    if ((count || 0) >= 1) pass(checks, `source_${source}`, String(count));
    else fail(checks, `source_${source}`, '0');
  }

  for (const merchant of ['Netflix', 'Spotify']) {
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('merchant', merchant)
      .eq('status', 'confirmed');
    if ((count || 0) >= 2) pass(checks, `recurring_${merchant.toLowerCase()}`, String(count));
    else fail(checks, `recurring_${merchant.toLowerCase()}`, String(count || 0));
  }

  const { count: receiptLinked } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('source', 'receipt')
    .not('receipt_id', 'is', null);
  if ((receiptLinked || 0) >= 1) pass(checks, 'receipt_linked_tx', String(receiptLinked));
  else fail(checks, 'receipt_linked_tx', '0');

  const { count: pendingActions } = await supabase
    .from('agent_actions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'proposed');
  if ((pendingActions || 0) === 0) pass(checks, 'no_pending_agent_actions', '0');
  else fail(checks, 'no_pending_agent_actions', String(pendingActions));

  const { count: agentMessages } = await supabase
    .from('agent_messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  if ((agentMessages || 0) <= 2) pass(checks, 'minimal_agent_history', String(agentMessages || 0));
  else fail(checks, 'minimal_agent_history', String(agentMessages));

  const { count: fakeReports } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('file_url', 'is', null);
  if ((fakeReports || 0) === 0) pass(checks, 'no_seeded_report_files', '0');
  else fail(checks, 'no_seeded_report_files', String(fakeReports));

  const { count: futureTx } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gt('date', todayStr);
  if ((futureTx || 0) === 0) pass(checks, 'no_future_transactions', '0');
  else fail(checks, 'no_future_transactions', String(futureTx));

  const failed = checks.filter((c) => !c.ok);
  const result = {
    action: failed.length === 0 ? 'demo-validate-pass' : 'demo-validate-fail',
    userId,
    passed: checks.filter((c) => c.ok).length,
    failed: failed.length,
    checks,
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('demo-validate failed:', err instanceof Error ? err.message : 'unknown error');
  process.exit(1);
});
