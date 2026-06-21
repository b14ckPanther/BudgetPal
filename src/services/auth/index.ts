import { supabase } from '@/lib/supabase';
import { getApiBaseUrl } from '@/lib/apiFetch';

export async function signUpWithEmail(
  email: string,
  password: string,
  metadata: {
    first_name: string;
    last_name: string;
    display_name: string;
    date_of_birth: string;
    username: string;
  }
) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password: password.trim(),
    options: {
      data: metadata,
    },
  });

  if (error) throw error;
  return data;
}

export async function signInWithIdentifier(identifier: string, password: string) {
  const isEmail = identifier.includes('@');

  if (isEmail) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: identifier.trim(),
      password,
    });
    if (error) throw error;
    return data;
  } else {
    const normalizedUsername = identifier.trim().toLowerCase();
    const url = `${getApiBaseUrl()}/api/auth/login`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: normalizedUsername, password }),
    });

    const resBody = await response.json();

    if (!response.ok || resBody.error) {
      throw new Error(resBody.error || 'Invalid credentials');
    }

    const { session } = resBody;
    const { data, error: setSessionError } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    if (setSessionError) throw setSessionError;
    return data;
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
