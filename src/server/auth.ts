/**
 * BudgetPal — Server-Side Auth Helper
 * Extracts bearer token from request, verifies user identity, and returns
 * an authenticated Supabase client + userId.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { createUserClient } from './supabaseServer';

export interface AuthenticatedContext {
  supabase: SupabaseClient<Database>;
  userId: string;
  accessToken: string;
}

/**
 * Authenticate an incoming API request.
 * Extracts Bearer token, verifies it with Supabase, returns userId + authenticated client.
 * Throws if auth fails.
 */
export async function authenticateRequest(request: Request): Promise<AuthenticatedContext> {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    throw new AuthError('Missing authorization token', 401);
  }

  const supabase = createUserClient(token);

  // Verify the token is valid by getting the user
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new AuthError('Invalid or expired token', 401);
  }

  return {
    supabase,
    userId: user.id,
    accessToken: token,
  };
}

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}
