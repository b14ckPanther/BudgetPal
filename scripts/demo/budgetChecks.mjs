/**
 * Shared budget validation helpers for demo-validate (mirrors src/lib/budgets + categoryHierarchy).
 */

export function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function formatLocalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function getCycleRange(currentDate, cycleStartDay) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const cappedThisMonthDay = Math.min(cycleStartDay, daysInMonth(year, month));
  const candidateDate = new Date(year, month, cappedThisMonthDay, 0, 0, 0, 0);

  let startDate;
  let endDate;

  if (currentDate >= candidateDate) {
    startDate = candidateDate;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const cappedNextMonthDay = Math.min(cycleStartDay, daysInMonth(nextYear, nextMonth));
    const nextCycleStart = new Date(nextYear, nextMonth, cappedNextMonthDay, 0, 0, 0, 0);
    endDate = new Date(nextCycleStart.getTime() - 1);
  } else {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const cappedPrevMonthDay = Math.min(cycleStartDay, daysInMonth(prevYear, prevMonth));
    startDate = new Date(prevYear, prevMonth, cappedPrevMonthDay, 0, 0, 0, 0);
    endDate = new Date(candidateDate.getTime() - 1);
  }

  return { startDate, endDate };
}

function buildParentMap(categories) {
  const parentMap = new Map();
  for (const cat of categories) {
    parentMap.set(cat.id, cat.parent_category_id ?? null);
  }
  return parentMap;
}

function getTransactionCategoryAttribution(tx, parentMap) {
  const ids = new Set();
  for (const startId of [tx.category_id, tx.subcategory_id ?? null]) {
    if (!startId) continue;
    let current = startId;
    while (current) {
      ids.add(current);
      current = parentMap.get(current) ?? null;
    }
  }
  return [...ids];
}

export function computeParentSpendInCycle(transactions, categories, cycleStart, cycleEnd) {
  const parentMap = buildParentMap(categories);
  const spendById = new Map();
  const start = parseLocalDate(cycleStart);
  const end = parseLocalDate(cycleEnd);

  for (const tx of transactions) {
    if (tx.type !== 'expense' || tx.status !== 'confirmed' || !tx.date) continue;
    const txDate = parseLocalDate(tx.date);
    if (txDate < start || txDate > end) continue;

    for (const catId of getTransactionCategoryAttribution(tx, parentMap)) {
      spendById.set(catId, (spendById.get(catId) || 0) + Number(tx.amount));
    }
  }

  const parentSpend = new Map();
  for (const cat of categories) {
    if (cat.parent_category_id || cat.type !== 'expense') continue;
    parentSpend.set(cat.name, spendById.get(cat.id) || 0);
  }
  return parentSpend;
}

export function computeCycleExpenseTotal(transactions, cycleStart, cycleEnd) {
  const start = parseLocalDate(cycleStart);
  const end = parseLocalDate(cycleEnd);
  let total = 0;
  for (const tx of transactions) {
    if (tx.type !== 'expense' || tx.status !== 'confirmed' || !tx.date) continue;
    const txDate = parseLocalDate(tx.date);
    if (txDate < start || txDate > end) continue;
    total += Number(tx.amount);
  }
  return total;
}

export function computeSafeToSpend(budget, transactions, categories, limits, referenceDate = new Date()) {
  if (!budget || !limits.length) return null;

  const { startDate, endDate } = getCycleRange(referenceDate, budget.cycle_start_day);
  const cycleStart = formatLocalDate(startDate);
  const cycleEnd = formatLocalDate(endDate);
  const spend = computeParentSpendInCycle(transactions, categories, cycleStart, cycleEnd);

  let overallLimit = 0;
  for (const lim of limits) {
    overallLimit += Number(lim.monthly_limit);
  }
  const overallSpent = computeCycleExpenseTotal(transactions, cycleStart, cycleEnd);

  const startOfToday = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    0,
    0,
    0,
    0
  );
  const endOfCycle = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 0, 0, 0, 0);
  const diffDays = Math.ceil((endOfCycle.getTime() - startOfToday.getTime()) / 86400000);
  const daysLeft = Math.max(1, diffDays + 1);

  if (overallLimit <= 0) return null;
  const remainingPlanned = overallLimit - overallSpent;
  return Math.max(0, remainingPlanned / daysLeft);
}
