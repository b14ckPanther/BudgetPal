-- ====================================================
-- CORRECTIVE DATABASE SCHEMA MIGRATION: FIX SEEDER OVERLOAD (PHASE 2.1)
-- ====================================================

-- ── 1. Create integer overload for get_or_create_category to prevent casting failure ──
CREATE OR REPLACE FUNCTION public.get_or_create_category(
  p_user_id uuid,
  p_name text,
  p_type text,
  p_parent_id uuid,
  p_limit integer,
  p_is_default boolean
) RETURNS uuid AS $$
BEGIN
  RETURN public.get_or_create_category(
    p_user_id,
    p_name,
    p_type,
    p_parent_id,
    p_limit::numeric,
    p_is_default
  );
END;
$$ LANGUAGE plpgsql;

-- ── 2. Restore handle_new_user_profile trigger to raise exceptions normally (removing debug rollback bypass) ──
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
