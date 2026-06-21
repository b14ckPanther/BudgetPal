/**
 * Race-safe auth routing — resolves session + profile before navigation.
 */

import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { mapProfile } from '@/services/mapper';
import { Profile } from '@/types/api';

export type AuthDestination = 'login' | 'onboarding' | 'app' | 'profile_error';

export interface AuthRoutingResult {
  destination: AuthDestination;
  profile: Profile | null;
}

export async function resolveAuthDestination(session: Session | null): Promise<AuthRoutingResult> {
  if (!session?.user) {
    return { destination: 'login', profile: null };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error) {
    return { destination: 'profile_error', profile: null };
  }

  if (!data) {
    return { destination: 'onboarding', profile: null };
  }

  const profile = mapProfile(data);
  if (!profile.onboardingCompleted) {
    return { destination: 'onboarding', profile };
  }

  return { destination: 'app', profile };
}
