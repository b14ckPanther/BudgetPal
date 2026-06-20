import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/api';
import { Database } from '@/types/database';
import { mapProfile } from '../mapper';

export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !data) {
    return null;
  }

  return mapProfile(data);
}

export async function updateProfile(profile: Partial<Profile>): Promise<Profile> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('User not authenticated');

  const dbUpdate: Database['public']['Tables']['profiles']['Update'] = {};
  if (profile.firstName !== undefined) dbUpdate.first_name = profile.firstName;
  if (profile.lastName !== undefined) dbUpdate.last_name = profile.lastName;
  if (profile.displayName !== undefined) dbUpdate.display_name = profile.displayName;
  if (profile.dateOfBirth !== undefined) dbUpdate.date_of_birth = profile.dateOfBirth;
  if (profile.preferredLanguage !== undefined) dbUpdate.preferred_language = profile.preferredLanguage;
  if (profile.currency !== undefined) dbUpdate.currency = profile.currency;
  if (profile.budgetStyle !== undefined) dbUpdate.budget_style = profile.budgetStyle;
  if (profile.monthlyIncome !== undefined) dbUpdate.monthly_income = profile.monthlyIncome;
  if (profile.startingBalance !== undefined) dbUpdate.starting_balance = profile.startingBalance;
  if (profile.budgetCycleStartDay !== undefined) dbUpdate.budget_cycle_start_day = profile.budgetCycleStartDay;
  if (profile.mainFinancialGoal !== undefined) dbUpdate.main_financial_goal = profile.mainFinancialGoal;
  if (profile.onboardingCompleted !== undefined) dbUpdate.onboarding_completed = profile.onboardingCompleted;
  if (profile.notificationsEnabled !== undefined) dbUpdate.notifications_enabled = profile.notificationsEnabled;

  const { data, error } = await supabase
    .from('profiles')
    .update(dbUpdate)
    .eq('id', user.id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update profile');
  }

  return mapProfile(data);
}

export async function markOnboardingCompleted(): Promise<Profile> {
  return updateProfile({ onboardingCompleted: true });
}
