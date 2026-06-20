-- ====================================================
-- database schema migration: fix schema search paths for onboarding
-- ====================================================

-- 1. Redefine get_or_create_category with explicit search_path and security definer
CREATE OR REPLACE FUNCTION public.get_or_create_category(
  p_user_id uuid,
  p_name text,
  p_type text,
  p_parent_id uuid,
  p_limit integer,
  p_is_default boolean
) RETURNS uuid AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id 
  FROM public.categories 
  WHERE user_id = p_user_id 
    AND name = p_name 
    AND (
      (parent_category_id IS NULL AND p_parent_id IS NULL) 
      OR (parent_category_id = p_parent_id)
    );
    
  IF v_id IS NULL THEN
    INSERT INTO public.categories (
      user_id,
      name,
      type,
      parent_category_id,
      monthly_limit,
      ai_created,
      is_default
    ) VALUES (
      p_user_id,
      p_name,
      p_type,
      p_parent_id,
      p_limit::numeric,
      false,
      p_is_default
    ) RETURNING id INTO v_id;
  END IF;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Redefine create_default_categories_for_user with explicit search_path and security definer
CREATE OR REPLACE FUNCTION public.create_default_categories_for_user(target_user_id uuid)
RETURNS void AS $$
DECLARE
  food_id uuid;
  transport_id uuid;
  car_id uuid;
  bills_id uuid;
  subs_id uuid;
  income_id uuid;
BEGIN
  -- Food & Drinks
  food_id := public.get_or_create_category(target_user_id, 'Food & Drinks', 'expense', NULL, 0, true);
  PERFORM public.get_or_create_category(target_user_id, 'Groceries', 'expense', food_id, 0, true);
  PERFORM public.get_or_create_category(target_user_id, 'Restaurants', 'expense', food_id, 0, true);
  PERFORM public.get_or_create_category(target_user_id, 'Delivery', 'expense', food_id, 0, true);
  PERFORM public.get_or_create_category(target_user_id, 'Coffee', 'expense', food_id, 0, true);

  -- Transport
  transport_id := public.get_or_create_category(target_user_id, 'Transport', 'expense', NULL, 0, true);
  PERFORM public.get_or_create_category(target_user_id, 'Bus', 'expense', transport_id, 0, true);
  PERFORM public.get_or_create_category(target_user_id, 'Taxi', 'expense', transport_id, 0, true);
  PERFORM public.get_or_create_category(target_user_id, 'Fuel', 'expense', transport_id, 0, true);
  PERFORM public.get_or_create_category(target_user_id, 'Train', 'expense', transport_id, 0, true);

  -- Shopping
  PERFORM public.get_or_create_category(target_user_id, 'Shopping', 'expense', NULL, 0, true);

  -- Bills
  bills_id := public.get_or_create_category(target_user_id, 'Bills', 'expense', NULL, 0, true);
  PERFORM public.get_or_create_category(target_user_id, 'Rent', 'expense', bills_id, 0, true);
  PERFORM public.get_or_create_category(target_user_id, 'Phone', 'expense', bills_id, 0, true);
  PERFORM public.get_or_create_category(target_user_id, 'Electricity', 'expense', bills_id, 0, true);
  PERFORM public.get_or_create_category(target_user_id, 'Water', 'expense', bills_id, 0, true);
  PERFORM public.get_or_create_category(target_user_id, 'Internet', 'expense', bills_id, 0, true);

  -- Subscriptions
  subs_id := public.get_or_create_category(target_user_id, 'Subscriptions', 'expense', NULL, 0, true);
  PERFORM public.get_or_create_category(target_user_id, 'Streaming', 'expense', subs_id, 0, true);
  PERFORM public.get_or_create_category(target_user_id, 'Software', 'expense', subs_id, 0, true);
  PERFORM public.get_or_create_category(target_user_id, 'Apps', 'expense', subs_id, 0, true);
  PERFORM public.get_or_create_category(target_user_id, 'Cloud services', 'expense', subs_id, 0, true);

  -- Health
  PERFORM public.get_or_create_category(target_user_id, 'Health', 'expense', NULL, 0, true);

  -- Education
  PERFORM public.get_or_create_category(target_user_id, 'Education', 'expense', NULL, 0, true);

  -- Entertainment
  PERFORM public.get_or_create_category(target_user_id, 'Entertainment', 'expense', NULL, 0, true);

  -- Car
  car_id := public.get_or_create_category(target_user_id, 'Car', 'expense', NULL, 0, true);
  PERFORM public.get_or_create_category(target_user_id, 'Fuel', 'expense', car_id, 0, true);
  PERFORM public.get_or_create_category(target_user_id, 'Maintenance', 'expense', car_id, 0, true);
  PERFORM public.get_or_create_category(target_user_id, 'Parking', 'expense', car_id, 0, true);
  PERFORM public.get_or_create_category(target_user_id, 'Insurance', 'expense', car_id, 0, true);
  PERFORM public.get_or_create_category(target_user_id, 'Washing', 'expense', car_id, 0, true);

  -- Income
  income_id := public.get_or_create_category(target_user_id, 'Income', 'income', NULL, 0, true);
  PERFORM public.get_or_create_category(target_user_id, 'Salary', 'income', income_id, 0, true);
  PERFORM public.get_or_create_category(target_user_id, 'Gift', 'income', income_id, 0, true);
  PERFORM public.get_or_create_category(target_user_id, 'Refund', 'income', income_id, 0, true);
  PERFORM public.get_or_create_category(target_user_id, 'Side income', 'income', income_id, 0, true);

  -- Savings
  PERFORM public.get_or_create_category(target_user_id, 'Savings', 'savings', NULL, 0, true);

  -- Other
  PERFORM public.get_or_create_category(target_user_id, 'Other', 'expense', NULL, 0, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Redefine handle_new_user_profile to throw exceptions cleanly and search in public schema
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
