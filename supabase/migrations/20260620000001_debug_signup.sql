-- ====================================================
-- TEMPORARY DEBUG MIGRATION: LOG SIGNUP TRIGGERS (PHASE 2.1)
-- ====================================================

-- ── 1. Create debug logs table ──
CREATE TABLE IF NOT EXISTS public.debug_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  message text
);

-- Enable RLS and allow public/service-role access for debugging
ALTER TABLE public.debug_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY debug_logs_policy ON public.debug_logs FOR SELECT TO anon, authenticated, service_role USING (true);
CREATE POLICY debug_logs_insert_policy ON public.debug_logs FOR INSERT TO anon, authenticated, service_role WITH CHECK (true);

-- ── 2. Redefine handle_new_user_profile with catch-all logging ──
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  v_username text;
BEGIN
  -- Log start
  INSERT INTO public.debug_logs (message) VALUES ('Trigger started for user ID: ' || NEW.id || ', Email: ' || coalesce(NEW.email, 'NULL'));

  v_username := lower(trim(coalesce(NEW.raw_user_meta_data->>'username', '')));
  INSERT INTO public.debug_logs (message) VALUES ('Extracted username: ' || coalesce(v_username, 'NULL'));

  IF v_username = '' THEN
    INSERT INTO public.debug_logs (message) VALUES ('Validation failed: Username is empty');
    RAISE EXCEPTION 'Username is required';
  END IF;
  
  IF NOT v_username ~ '^[a-z][a-z0-9_]{2,23}$' THEN
    INSERT INTO public.debug_logs (message) VALUES ('Validation failed: Username format invalid: ' || v_username);
    RAISE EXCEPTION 'Username must be 3-24 characters, start with a letter, and contain only lowercase letters, numbers, and underscores';
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    username,
    first_name,
    last_name,
    display_name,
    date_of_birth,
    preferred_language,
    currency,
    budget_style,
    onboarding_completed
  ) VALUES (
    NEW.id,
    NEW.email,
    v_username,
    coalesce(NEW.raw_user_meta_data->>'first_name', ''),
    coalesce(NEW.raw_user_meta_data->>'last_name', ''),
    coalesce(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    CASE 
      WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL AND NEW.raw_user_meta_data->>'date_of_birth' <> ''
      THEN (NEW.raw_user_meta_data->>'date_of_birth')::date 
      ELSE NULL 
    END,
    coalesce(NEW.raw_user_meta_data->>'preferred_language', 'en'),
    coalesce(NEW.raw_user_meta_data->>'currency', 'ILS'),
    coalesce(NEW.raw_user_meta_data->>'budget_style', 'balanced'),
    false
  );

  INSERT INTO public.debug_logs (message) VALUES ('Profiles table insertion completed. Seeding default categories...');

  -- Seed default categories immediately on signup
  PERFORM public.create_default_categories_for_user(NEW.id);

  INSERT INTO public.debug_logs (message) VALUES ('Default categories seeded successfully.');

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the exact SQLSTATE and SQLERRM and commit the user without aborting so we can read this log!
  INSERT INTO public.debug_logs (message) VALUES ('EXCEPTION CAUGHT: SQLSTATE ' || SQLSTATE || ' - ' || SQLERRM);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
