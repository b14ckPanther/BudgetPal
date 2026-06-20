/**
 * BudgetPal — Server-Side Supabase Client
 * Creates authenticated Supabase clients from bearer tokens for API routes.
 * NEVER expose service role key to the client.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Create a Supabase client authenticated as the user via their access token.
 * This enforces RLS — the user can only access their own data.
 */
export function createUserClient(accessToken: string): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '', {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

/**
 * Create a service-role Supabase client that bypasses RLS.
 * Use only for server-side operations that need full access (e.g., creating transactions on behalf of confirmed agent actions).
 */
export function createServiceClient(): SupabaseClient<Database> {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
