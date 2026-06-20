/**
 * Category hierarchy helpers shared by budget roll-up and agent parsing.
 */

export interface HierarchyCategory {
  id: string;
  name: string;
  type: string;
  parentCategoryId?: string | null;
}

export function buildParentMap(
  categories: HierarchyCategory[]
): Map<string, string | null> {
  const parentMap = new Map<string, string | null>();
  for (const cat of categories) {
    parentMap.set(cat.id, cat.parentCategoryId ?? null);
  }
  return parentMap;
}

/**
 * Returns every category ID a transaction should count toward, including ancestors.
 */
export function getTransactionCategoryAttribution(
  tx: { categoryId: string | null; subcategoryId?: string | null },
  parentMap: Map<string, string | null>
): string[] {
  const ids = new Set<string>();

  for (const startId of [tx.categoryId, tx.subcategoryId ?? null]) {
    if (!startId) continue;
    let current: string | null = startId;
    while (current) {
      ids.add(current);
      current = parentMap.get(current) ?? null;
    }
  }

  return Array.from(ids);
}

export function formatCategoryLabel(
  categoryName?: string | null,
  subcategoryName?: string | null
): string {
  if (!categoryName) return 'Uncategorized';
  if (subcategoryName && subcategoryName !== categoryName) {
    return `${categoryName} · ${subcategoryName}`;
  }
  return categoryName;
}

const PLACEHOLDER_MERCHANTS = new Set([
  'merchant',
  'unknown',
  'n/a',
  'none',
  'store',
  'shop',
]);

export function sanitizeMerchant(merchant?: string | null): string | null {
  if (!merchant) return null;
  const trimmed = merchant.trim();
  if (!trimmed || PLACEHOLDER_MERCHANTS.has(trimmed.toLowerCase())) {
    return null;
  }
  return trimmed;
}

function typeMatchesCategory(
  txType: string,
  categoryType: string
): boolean {
  return (
    (txType === 'expense' && categoryType === 'expense') ||
    (txType === 'income' && categoryType === 'income') ||
    (txType === 'transfer' && categoryType === 'transfer')
  );
}

function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s*&\s*/g, ' and ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

export function normalizeCategoryTerm(term: string): string {
  return normalizeName(term);
}

/** All category IDs in a subtree (root + descendants). */
export function getDescendantCategoryIds(
  rootId: string,
  categories: HierarchyCategory[]
): string[] {
  const ids = new Set<string>([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const cat of categories) {
      if (cat.parentCategoryId && ids.has(cat.parentCategoryId) && !ids.has(cat.id)) {
        ids.add(cat.id);
        changed = true;
      }
    }
  }
  return Array.from(ids);
}

export type CategoryFilterResult =
  | { ok: true; categoryIds: string[]; label: string }
  | { ok: false; clarification: string };

/**
 * Resolves user category terms to owned category IDs.
 * Car and Transport are never merged. Fuel/gas aggregates all Fuel subcategories.
 */
export function resolveCategoryTerms(
  terms: string[],
  categories: HierarchyCategory[]
): CategoryFilterResult {
  if (!terms.length) {
    return { ok: true, categoryIds: [], label: 'All categories' };
  }

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const allIds = new Set<string>();
  const labels: string[] = [];

  for (const rawTerm of terms) {
    const term = normalizeName(rawTerm);
    if (!term) continue;

    if (term === 'fuel' || term === 'gas' || term === 'gasoline') {
      const fuelCats = expenseCategories.filter((c) => normalizeName(c.name) === 'fuel');
      if (fuelCats.length === 0) {
        return {
          ok: false,
          clarification: `I could not find a Fuel category in your budget. Try naming a parent category like Transport or Car.`,
        };
      }
      for (const f of fuelCats) {
        allIds.add(f.id);
      }
      labels.push('Fuel');
      continue;
    }

    const exactMatches = expenseCategories.filter((c) => normalizeName(c.name) === term);
    const parentMatches = exactMatches.filter((c) => !c.parentCategoryId);
    const childMatches = exactMatches.filter((c) => c.parentCategoryId);

    if (parentMatches.length > 1) {
      return {
        ok: false,
        clarification: `"${rawTerm}" matches multiple categories (${parentMatches.map((c) => c.name).join(', ')}). Please be more specific.`,
      };
    }

    if (parentMatches.length === 1) {
      const parent = parentMatches[0];
      for (const id of getDescendantCategoryIds(parent.id, expenseCategories)) {
        allIds.add(id);
      }
      labels.push(parent.name);
      continue;
    }

    if (childMatches.length === 1) {
      allIds.add(childMatches[0].id);
      labels.push(childMatches[0].name);
      continue;
    }

    if (childMatches.length > 1) {
      return {
        ok: false,
        clarification: `"${rawTerm}" matches multiple subcategories (${childMatches.map((c) => c.name).join(', ')}). Please specify the parent category.`,
      };
    }

    const partialParents = expenseCategories.filter(
      (c) => !c.parentCategoryId && normalizeName(c.name).includes(term)
    );
    if (partialParents.length > 1) {
      return {
        ok: false,
        clarification: `"${rawTerm}" is ambiguous. Did you mean ${partialParents.map((c) => c.name).join(' or ')}?`,
      };
    }
    if (partialParents.length === 1) {
      for (const id of getDescendantCategoryIds(partialParents[0].id, expenseCategories)) {
        allIds.add(id);
      }
      labels.push(partialParents[0].name);
      continue;
    }

    return {
      ok: false,
      clarification: `I could not find a category matching "${rawTerm}" in your budget. Try one of your existing category names.`,
    };
  }

  return {
    ok: true,
    categoryIds: Array.from(allIds),
    label: labels.length ? labels.join(', ') : 'All categories',
  };
}

function findCategoryByName(
  categories: HierarchyCategory[],
  name: string,
  txType?: string
): HierarchyCategory | undefined {
  const normalized = normalizeName(name);
  const typeFiltered = txType
    ? categories.filter((c) => typeMatchesCategory(txType, c.type))
    : categories;

  return (
    typeFiltered.find((c) => normalizeName(c.name) === normalized) ||
    categories.find((c) => normalizeName(c.name) === normalized)
  );
}

function categoryById(
  categories: HierarchyCategory[],
  id?: string | null
): HierarchyCategory | undefined {
  if (!id) return undefined;
  return categories.find((c) => c.id === id);
}

export interface ResolvedCategoryAssignment {
  categoryId?: string;
  categoryName: string;
  subcategoryId?: string;
  subcategoryName?: string;
}

/**
 * Ensures child categories are stored on subcategory_id with parent on category_id.
 */
export function normalizeCategoryAssignment(
  categories: HierarchyCategory[],
  categoryId?: string | null,
  subcategoryId?: string | null
): ResolvedCategoryAssignment | null {
  const sub = categoryById(categories, subcategoryId);
  if (sub?.parentCategoryId) {
    const parent = categoryById(categories, sub.parentCategoryId);
    if (parent) {
      return {
        categoryId: parent.id,
        categoryName: parent.name,
        subcategoryId: sub.id,
        subcategoryName: sub.name,
      };
    }
  }

  const cat = categoryById(categories, categoryId);
  if (cat?.parentCategoryId) {
    const parent = categoryById(categories, cat.parentCategoryId);
    if (parent) {
      return {
        categoryId: parent.id,
        categoryName: parent.name,
        subcategoryId: cat.id,
        subcategoryName: cat.name,
      };
    }
  }

  if (sub) {
    return {
      categoryId: sub.id,
      categoryName: sub.name,
    };
  }

  if (cat) {
    return {
      categoryId: cat.id,
      categoryName: cat.name,
    };
  }

  return null;
}

/**
 * Resolves AI-suggested names to parent category + optional subcategory IDs.
 */
export function resolveCategoryAssignment(
  categories: HierarchyCategory[],
  categoryName: string,
  subcategoryName: string | undefined,
  txType: string,
  categoryId?: string,
  subcategoryId?: string
): ResolvedCategoryAssignment {
  const fromIds = normalizeCategoryAssignment(categories, categoryId, subcategoryId);
  if (fromIds?.categoryId) {
    return fromIds;
  }

  let matchedSub = subcategoryName
    ? findCategoryByName(categories, subcategoryName, txType)
    : undefined;
  let matchedParent = findCategoryByName(categories, categoryName, txType);

  if (!matchedParent && categoryId) {
    matchedParent = categoryById(categories, categoryId);
  }
  if (!matchedSub && subcategoryId) {
    matchedSub = categoryById(categories, subcategoryId);
  }

  if (matchedParent?.parentCategoryId && !matchedSub) {
    matchedSub = matchedParent;
    matchedParent =
      categories.find((c) => c.id === matchedParent!.parentCategoryId) || matchedParent;
  }

  if (matchedSub) {
    const parent = matchedSub.parentCategoryId
      ? categories.find((c) => c.id === matchedSub!.parentCategoryId)
      : matchedParent;

    if (parent && parent.id !== matchedSub.id) {
      const normalized = normalizeCategoryAssignment(categories, parent.id, matchedSub.id);
      if (normalized) return normalized;

      return {
        categoryId: parent.id,
        categoryName: parent.name,
        subcategoryId: matchedSub.id,
        subcategoryName: matchedSub.name,
      };
    }

    return {
      categoryId: matchedSub.id,
      categoryName: matchedSub.name,
    };
  }

  if (matchedParent) {
    const normalized = normalizeCategoryAssignment(categories, matchedParent.id, undefined);
    if (normalized) return normalized;

    return {
      categoryId: matchedParent.id,
      categoryName: matchedParent.name,
    };
  }

  const fallback = categories.find(
    (c) => typeMatchesCategory(txType, c.type) && !c.parentCategoryId
  ) || categories.find((c) => typeMatchesCategory(txType, c.type));

  return {
    categoryId: fallback?.id,
    categoryName: fallback?.name || categoryName || 'Uncategorized',
  };
}
