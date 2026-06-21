/**
 * Display labels for built-in default categories (DB names stay English).
 */

import { t } from './i18n';

const BUILTIN_CATEGORY_KEYS: Record<string, string> = {
  'Food & Drinks': 'builtinCategories.foodAndDrinks',
  Groceries: 'builtinCategories.groceries',
  Restaurants: 'builtinCategories.restaurants',
  Delivery: 'builtinCategories.delivery',
  Coffee: 'builtinCategories.coffee',
  Transport: 'builtinCategories.transport',
  Bus: 'builtinCategories.bus',
  Taxi: 'builtinCategories.taxi',
  Fuel: 'builtinCategories.fuel',
  Train: 'builtinCategories.train',
  Shopping: 'builtinCategories.shopping',
  Bills: 'builtinCategories.bills',
  Rent: 'builtinCategories.rent',
  Phone: 'builtinCategories.phone',
  Electricity: 'builtinCategories.electricity',
  Water: 'builtinCategories.water',
  Internet: 'builtinCategories.internet',
  Subscriptions: 'builtinCategories.subscriptions',
  Streaming: 'builtinCategories.streaming',
  Software: 'builtinCategories.software',
  Apps: 'builtinCategories.apps',
  'Cloud services': 'builtinCategories.cloudServices',
  Health: 'builtinCategories.health',
  Education: 'builtinCategories.education',
  Entertainment: 'builtinCategories.entertainment',
  Car: 'builtinCategories.car',
  Maintenance: 'builtinCategories.maintenance',
  Parking: 'builtinCategories.parking',
  Insurance: 'builtinCategories.insurance',
  Washing: 'builtinCategories.washing',
  Income: 'builtinCategories.income',
  Salary: 'builtinCategories.salary',
  Gift: 'builtinCategories.gift',
  Refund: 'builtinCategories.refund',
  'Side income': 'builtinCategories.sideIncome',
  Savings: 'builtinCategories.savings',
  Other: 'builtinCategories.other',
};

export function getCategoryDisplayName(name: string): string {
  const key = BUILTIN_CATEGORY_KEYS[name];
  if (!key) return name;
  const translated = t(key);
  return translated.startsWith('[') ? name : translated;
}
