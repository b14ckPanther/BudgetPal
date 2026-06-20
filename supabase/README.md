# Supabase Database & Auth Setup for BudgetPal

This directory contains the database migration scripts and schema guidelines for **BudgetPal**.

## 1. Environment Variables

Create a local `.env` file in the root of the project with:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> [!WARNING]
> Do NOT expose `SUPABASE_SERVICE_ROLE_KEY` or any backend secret keys in client-side bundles. The `SUPABASE_SERVICE_ROLE_KEY` is loaded **strictly server-side** inside Metro API routes (e.g. `app/api/auth/login+api.ts`) to resolve username-to-email mappings securely.

---

## 2. Linking Supabase Project

To link this project with your Supabase remote instance:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
```

---

## 3. Running Migrations

To apply the database schema (tables, foreign keys, triggers, constraints, RLS policies, and triggers) to your linked database:

```bash
# Push migrations to the remote database
npx supabase db push
```

---

## 4. TypeScript Schema Generation

To generate TypeScript types directly from your live Supabase database structure, run:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_REF --schema public > src/types/database.ts
```

This updates the `src/types/database.ts` schema configurations with precise types.

---

## 5. Architecture Summary

### Row Level Security (RLS)
RLS is enabled on every single table. All policies are constrained via `auth.uid() = user_id` (or `auth.uid() = id` on the `profiles` table). No authenticated user can access, insert, update, or delete rows belonging to another user.

### Username Signup & Login (Phase 2.1)
- **Database Rules**: Username is stored in the `profiles` table, subject to a CHECK format constraint `^[a-z][a-z0-9_]{2,23}$`. A case-insensitive UNIQUE index is defined on `lower(username)`. A database trigger (`trigger_normalize_username`) automatically trims and lowercases username inputs.
- **Trigger Profile Creation**: The `handle_new_user_profile()` function extracts the username from signup metadata (`auth.users.raw_user_meta_data`), validates it, and sets it on profile creation.
- **Server API Route (`POST /api/auth/login`)**: Performs a secure lookup of username-to-email mapping using the service role client and maps username logins to Supabase Auth's email/password authentication. It utilizes Zod schema validation and returns generic invalid credential errors to prevent account enumeration.

### Default Categories Seeding
The trigger automatically executes `create_default_categories_for_user(user_id)` upon profile creation. This function initializes parent categories and subcategories (such as Food & Drinks, Transport, Bills, Subscriptions, Income) and tags them with `is_default = true` and `ai_created = false`, checking for duplicates if run again.

### Initial Budget Setup
The Budgets service calls the database function `create_initial_budget_for_user(user_id)` during the onboarding completion flow, configuring a default "Main Budget" in `ILS` using a `balanced` style starting on the `1st` of the month.

