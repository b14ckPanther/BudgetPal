-- ====================================================
-- SEQUENTIAL DATABASE SCHEMA MIGRATION: ADD USERNAME (PHASE 2.1)
-- ====================================================

-- ── 1. Add username column to profiles table ──
ALTER TABLE public.profiles 
  ADD COLUMN username text CONSTRAINT check_username_format CHECK (username IS NULL OR username ~ '^[a-z][a-z0-9_]{2,23}$');

-- ── 2. Add case-insensitive unique index ──
CREATE UNIQUE INDEX idx_profiles_username_case_insensitive ON public.profiles (lower(username));

-- ── 3. Normalization function & trigger before insert/update ──
CREATE OR REPLACE FUNCTION normalize_username()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.username IS NOT NULL THEN
    NEW.username = lower(trim(NEW.username));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_normalize_username
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION normalize_username();

-- ── 4. Re-define handle_new_user_profile to extract and check username ──
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  v_username text;
BEGIN
  v_username := lower(trim(coalesce(NEW.raw_user_meta_data->>'username', '')));
  
  IF v_username = '' THEN
    RAISE EXCEPTION 'Username is required';
  END IF;
  
  IF NOT v_username ~ '^[a-z][a-z0-9_]{2,23}$' THEN
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

  -- Seed default categories immediately on signup
  PERFORM public.create_default_categories_for_user(NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
