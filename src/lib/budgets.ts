import { formatCurrency } from './currency';
import { buildParentMap, getTransactionCategoryAttribution } from './categoryHierarchy';

export interface CycleRange {
  startDate: Date;
  endDate: Date;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Parses a date string of format YYYY-MM-DD to a local Date object.
 * This prevents offset shifts due to timezone discrepancies.
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Formats a Date object to YYYY-MM-DD in local time.
 */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates start and end dates of current cycle based on cycleStartDay.
 */
export function getCycleRange(currentDate: Date, cycleStartDay: number): CycleRange {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Cap the start day if it exceeds the maximum days in the current month
  const cappedThisMonthDay = Math.min(cycleStartDay, daysInMonth(year, month));
  const candidateDate = new Date(year, month, cappedThisMonthDay, 0, 0, 0, 0);

  let startDate: Date;
  let endDate: Date;

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

/**
 * Calculates remaining days in current cycle (inclusive of start and end day).
 */
export function getRemainingDays(currentDate: Date, endDate: Date): number {
  const startOfToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0, 0);
  const endOfCycle = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 0, 0, 0, 0);
  
  const diffTime = endOfCycle.getTime() - startOfToday.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}

export interface CategorySpendSummary {
  categoryId: string;
  name: string;
  spent: number;
  limit: number;
  percentage: number;
  remaining: number;
  isOver: boolean;
}

export interface BudgetWarning {
  categoryId: string;
  categoryName: string;
  type: 'gentle' | 'attention' | 'strong' | 'danger';
  message: string;
}

export interface BudgetSummary {
  cycleStart: string;
  cycleEnd: string;
  daysLeft: number;
  monthlyIncome: number;
  overallLimit: number;
  overallSpent: number;
  safeToSpend: number | null;
  categories: CategorySpendSummary[];
  warnings: BudgetWarning[];
}

/**
 * Main budget calculations engine.
 */
export function calculateBudgetSummary(
  budget: { cycleStartDay: number; monthlyIncome: number; currency: string } | null,
  transactions: {
    amount: number;
    type: string;
    status: string;
    date: string;
    categoryId: string | null;
    subcategoryId?: string | null;
  }[],
  categories: { id: string; name: string; type: string; parentCategoryId?: string | null }[],
  limits: { categoryId: string; monthlyLimit: number }[],
  currentDate: Date = new Date()
): BudgetSummary {
  // If no budget, return default empty
  if (!budget) {
    return {
      cycleStart: '',
      cycleEnd: '',
      daysLeft: 30,
      monthlyIncome: 0,
      overallLimit: 0,
      overallSpent: 0,
      safeToSpend: null,
      categories: [],
      warnings: [],
    };
  }

  const { startDate, endDate } = getCycleRange(currentDate, budget.cycleStartDay);
  const daysLeft = getRemainingDays(currentDate, endDate);

  // Filter confirmed expense transactions in this cycle
  const activeTx = transactions.filter((tx) => {
    if (tx.type !== 'expense' || tx.status !== 'confirmed' || !tx.date) return false;
    const txDate = parseLocalDate(tx.date);
    return txDate >= startDate && txDate <= endDate;
  });

  // Build a map of category limits
  const limitsMap = new Map<string, number>();
  let overallLimit = 0;
  for (const lim of limits) {
    limitsMap.set(lim.categoryId, lim.monthlyLimit);
    overallLimit += lim.monthlyLimit;
  }

  const parentMap = buildParentMap(categories);

  // Sum spending per category, rolling up to parent categories via hierarchy
  const spendMap = new Map<string, number>();
  let overallSpent = 0;
  for (const tx of activeTx) {
    const attributedIds = getTransactionCategoryAttribution(tx, parentMap);
    if (attributedIds.length === 0) continue;

    overallSpent += tx.amount;
    for (const categoryId of attributedIds) {
      const current = spendMap.get(categoryId) || 0;
      spendMap.set(categoryId, current + tx.amount);
    }
  }

  // Format date range strings
  const formatDateString = (d: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  };

  // Compile category details
  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const catSummaries: CategorySpendSummary[] = expenseCategories.map((cat) => {
    const spent = spendMap.get(cat.id) || 0;
    const limit = limitsMap.get(cat.id) || 0;
    const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    const remaining = limit - spent;
    return {
      categoryId: cat.id,
      name: cat.name,
      spent,
      limit,
      percentage,
      remaining,
      isOver: remaining < 0,
    };
  });

  // Calculate dynamic Safe-to-Spend
  let safeToSpend: number | null = null;
  if (limits.length > 0 && overallLimit > 0) {
    const remainingPlanned = overallLimit - overallSpent;
    safeToSpend = Math.max(0, remainingPlanned / daysLeft);
  }

  // Derived Warnings
  const warnings: BudgetWarning[] = [];
  for (const cat of catSummaries) {
    if (cat.limit > 0) {
      if (cat.percentage >= 100) {
        const overAmt = Math.abs(cat.remaining);
        warnings.push({
          categoryId: cat.categoryId,
          categoryName: cat.name,
          type: 'danger',
          message: `${cat.name} is over budget by ${formatCurrency(overAmt, budget.currency)}.`,
        });
      } else if (cat.percentage >= 85) {
        warnings.push({
          categoryId: cat.categoryId,
          categoryName: cat.name,
          type: 'strong',
          message: `${cat.name} is ${cat.percentage}% used with ${daysLeft} days left in your cycle.`,
        });
      } else if (cat.percentage >= 75) {
        warnings.push({
          categoryId: cat.categoryId,
          categoryName: cat.name,
          type: 'attention',
          message: `${cat.name} is ${cat.percentage}% used with ${daysLeft} days left in your cycle.`,
        });
      } else if (cat.percentage >= 50) {
        warnings.push({
          categoryId: cat.categoryId,
          categoryName: cat.name,
          type: 'gentle',
          message: `${cat.name} is ${cat.percentage}% used with ${daysLeft} days left in your cycle.`,
        });
      }
    }
  }

  return {
    cycleStart: formatDateString(startDate),
    cycleEnd: formatDateString(endDate),
    daysLeft,
    monthlyIncome: budget.monthlyIncome,
    overallLimit,
    overallSpent,
    safeToSpend,
    categories: catSummaries,
    warnings,
  };
}
