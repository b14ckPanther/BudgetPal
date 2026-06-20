import { ExpoRequest } from 'expo-router/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const loginSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function POST(request: ExpoRequest): Promise<Response> {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return Response.json({ error: 'Invalid credentials' }, { status: 400 });
    }

    const { identifier, password } = result.data;
    
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // 1. Determine if the identifier is an email or a username
    const isEmail = identifier.includes('@');
    let email = identifier.trim();

    if (!isEmail) {
      // Normalize username to lowercase and trimmed
      const normalizedUsername = identifier.trim().toLowerCase();
      
      // Look up username-to-email mapping using server-only Supabase service client
      if (!supabaseServiceKey) {
        return Response.json({ error: 'Server auth configuration missing' }, { status: 500 });
      }

      const serverSupabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false }
      });

      const { data: profile, error: lookupError } = await serverSupabase
        .from('profiles')
        .select('email')
        .eq('username', normalizedUsername)
        .maybeSingle();

      if (lookupError || !profile || !profile.email) {
        // Return generic invalid credentials error to prevent enumeration
        return Response.json({ error: 'Invalid credentials' }, { status: 400 });
      }

      email = profile.email;
    }

    // 2. Authenticate through Supabase using email/password via a standard client
    const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });

    const { data: authData, error: authError } = await authSupabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData || !authData.session) {
      return Response.json({ error: 'Invalid credentials' }, { status: 400 });
    }

    // Return minimal safe session data needed for the client
    return Response.json({
      session: authData.session,
      user: authData.user,
    });
  } catch {
    return Response.json({ error: 'Invalid credentials' }, { status: 400 });
  }
}
