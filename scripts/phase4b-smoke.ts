/**
 * Phase 4B smoke test — run with: npx tsx scripts/phase4b-smoke.ts
 */
import { resolveCategoryTerms } from '../src/lib/categoryHierarchy';
import { resolveDateRange } from '../src/server/agent/dateRanges';
import { runSpendingAnalysis } from '../src/server/agent/runSpendingAnalysis';
import { evaluateAffordability } from '../src/server/agent/evaluateAffordability';
import { generateSavingAdvice } from '../src/server/agent/generateSavingAdvice';

const categories = [
  { id: 'food', name: 'Food & Drinks', type: 'expense', parentCategoryId: null },
  { id: 'rest', name: 'Restaurants', type: 'expense', parentCategoryId: 'food' },
  { id: 'car', name: 'Car', type: 'expense', parentCategoryId: null },
  { id: 'transport', name: 'Transport', type: 'expense', parentCategoryId: null },
  { id: 'fuel-car', name: 'Fuel', type: 'expense', parentCategoryId: 'car' },
  { id: 'fuel-t', name: 'Fuel', type: 'expense', parentCategoryId: 'transport' },
];

const today = '2026-06-20';
const transactions = [
  { id: '1', amount: 55, type: 'expense', status: 'confirmed', date: today, categoryId: 'food', subcategoryId: 'rest', merchant: null, title: 'Lunch' },
  { id: '2', amount: 25, type: 'expense', status: 'confirmed', date: today, categoryId: 'food', subcategoryId: 'rest', merchant: null, title: 'Dinner' },
];

const ctx = {
  userId: 'test',
  currency: 'ILS',
  savingsGoal: 0,
  categories,
  budget: { id: 'b1', cycleStartDay: 1, monthlyIncome: 5000, currency: 'ILS' },
  limits: [{ categoryId: 'food', monthlyLimit: 100 }],
  transactions,
};

console.log('car terms', resolveCategoryTerms(['car'], categories));
console.log('fuel terms', resolveCategoryTerms(['fuel'], categories));
console.log('semester', resolveDateRange('semester'));

const analysis = runSpendingAnalysis(
  {
    analysisType: 'top_categories',
    dateRangePreset: 'this_month',
    categoryTerms: ['food'],
    merchantTerms: [],
    compareToPreviousPeriod: false,
    confidence: 0.9,
  },
  transactions,
  categories,
  new Date(today)
);
console.log('food analysis total', analysis.ok && analysis.result.totalSpent);

const afford = evaluateAffordability({ amount: 300, itemLabel: 'headphones', categoryTerm: null, confidence: 0.9 }, ctx);
console.log('afford 300', afford.ok && afford.result.verdict);

const advice = generateSavingAdvice(ctx);
console.log('advice', advice.observation);
