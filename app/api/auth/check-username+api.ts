import { ExpoRequest } from 'expo-router/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: ExpoRequest): Promise<Response> {
  try {
    const body = await request.json();
    const username = body.username;

    if (!username || typeof username !== 'string') {
      return Response.json({ error: 'Username is required' }, { status: 400 });
    }

    const normalizedUsername = username.trim().toLowerCase();

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const serverSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { data, error } = await serverSupabase
      .from('profiles')
      .select('id')
      .eq('username', normalizedUsername)
      .maybeSingle();

    if (error) {
      return Response.json({ error: 'Database error' }, { status: 500 });
    }

    return Response.json({ available: !data });
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
