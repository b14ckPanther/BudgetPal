-- Repair Noor presentation demo baseline: replaces seed_demo_noor_baseline with a
-- cycle-aware, validated version that matches Budget / Agent / Reports query logic.
-- Does not modify migration 20260620000011; reset + provision call the same RPC name.

CREATE OR REPLACE FUNCTION public.demo_noor_cycle_start(p_cycle_day integer DEFAULT 1)
RETURNS date
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_year int := extract(year FROM current_date)::int;
  v_month int := extract(month FROM current_date)::int;
  v_capped int;
  v_candidate date;
  v_prev_month int;
  v_prev_year int;
BEGIN
  v_capped := LEAST(
    p_cycle_day,
    extract(day FROM (date_trunc('month', current_date) + interval '1 month' - interval '1 day'))::int
  );
  v_candidate := make_date(v_year, v_month, v_capped);
  IF current_date >= v_candidate THEN
    RETURN v_candidate;
  END IF;
  v_prev_month := CASE WHEN v_month = 1 THEN 12 ELSE v_month - 1 END;
  v_prev_year := CASE WHEN v_month = 1 THEN v_year - 1 ELSE v_year END;
  v_capped := LEAST(
    p_cycle_day,
    extract(day FROM (
      date_trunc('month', make_date(v_prev_year, v_prev_month, 1))
      + interval '1 month' - interval '1 day'
    ))::int
  );
  RETURN make_date(v_prev_year, v_prev_month, v_capped);
END;
$$;

CREATE OR REPLACE FUNCTION public.demo_noor_tx_date(p_cycle_start date, p_offset integer)
RETURNS date
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT LEAST(p_cycle_start + p_offset, current_date);
$$;

CREATE OR REPLACE FUNCTION public.seed_demo_noor_baseline(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_budget_id uuid := '6e6f6f72-b001-4000-8000-000000000001'::uuid;
  v_receipt_id uuid := '6e6f6f72-b002-4000-8000-000000000001'::uuid;
  v_voice_id uuid := '6e6f6f72-b003-4000-8000-000000000001'::uuid;
  v_cycle_start date;
  v_month_start date;
  v_i int;
  v_food uuid;
  v_car uuid;
  v_transport uuid;
  v_shopping uuid;
  v_bills uuid;
  v_ent uuid;
  v_subs uuid;
  v_health uuid;
  v_income uuid;
  v_groceries uuid;
  v_restaurants uuid;
  v_coffee uuid;
  v_delivery uuid;
  v_car_fuel uuid;
  v_car_parking uuid;
  v_car_maint uuid;
  v_rent uuid;
  v_internet uuid;
  v_phone uuid;
  v_electricity uuid;
  v_streaming uuid;
  v_apps uuid;
  v_salary uuid;
  v_side uuid;
BEGIN
  PERFORM public.assert_demo_noor_user(p_user_id);

  PERFORM public.create_default_categories_for_user(p_user_id);

  UPDATE public.profiles
  SET
    email = 'noor@gmail.com',
    username = 'noor',
    first_name = 'Noor',
    last_name = 'Demo',
    display_name = 'Noor',
    preferred_language = 'en',
    currency = 'ILS',
    budget_style = 'balanced',
    theme_preference = COALESCE(theme_preference, 'dark'),
    monthly_income = 18000,
    starting_balance = 4200,
    budget_cycle_start_day = 1,
    main_financial_goal = 'Build savings while keeping everyday spending under control',
    onboarding_completed = true,
    notifications_enabled = true,
    agent_voice_replies_enabled = false
  WHERE id = p_user_id;

  INSERT INTO public.budgets (
    id, user_id, name, currency, monthly_income, starting_balance,
    cycle_start_day, savings_goal, budget_style, is_active
  ) VALUES (
    v_budget_id, p_user_id, 'Main Budget', 'ILS', 18000, 4200,
    1, 2500, 'balanced', true
  )
  ON CONFLICT (id) DO UPDATE SET
    monthly_income = EXCLUDED.monthly_income,
    starting_balance = EXCLUDED.starting_balance,
    cycle_start_day = EXCLUDED.cycle_start_day,
    savings_goal = EXCLUDED.savings_goal,
    budget_style = EXCLUDED.budget_style,
    is_active = true,
    currency = 'ILS',
    updated_at = now();

  UPDATE public.budgets
  SET is_active = false, updated_at = now()
  WHERE user_id = p_user_id AND id <> v_budget_id AND is_active = true;

  v_food := public.demo_category_id(p_user_id, 'Food & Drinks');
  v_car := public.demo_category_id(p_user_id, 'Car');
  v_transport := public.demo_category_id(p_user_id, 'Transport');
  v_shopping := public.demo_category_id(p_user_id, 'Shopping');
  v_bills := public.demo_category_id(p_user_id, 'Bills');
  v_ent := public.demo_category_id(p_user_id, 'Entertainment');
  v_subs := public.demo_category_id(p_user_id, 'Subscriptions');
  v_health := public.demo_category_id(p_user_id, 'Health');
  v_income := public.demo_category_id(p_user_id, 'Income');
  v_groceries := public.demo_category_id(p_user_id, 'Groceries', v_food);
  v_restaurants := public.demo_category_id(p_user_id, 'Restaurants', v_food);
  v_coffee := public.demo_category_id(p_user_id, 'Coffee', v_food);
  v_delivery := public.demo_category_id(p_user_id, 'Delivery', v_food);
  v_car_fuel := public.demo_category_id(p_user_id, 'Fuel', v_car);
  v_car_parking := public.demo_category_id(p_user_id, 'Parking', v_car);
  v_car_maint := public.demo_category_id(p_user_id, 'Maintenance', v_car);
  v_rent := public.demo_category_id(p_user_id, 'Rent', v_bills);
  v_internet := public.demo_category_id(p_user_id, 'Internet', v_bills);
  v_phone := public.demo_category_id(p_user_id, 'Phone', v_bills);
  v_electricity := public.demo_category_id(p_user_id, 'Electricity', v_bills);
  v_streaming := public.demo_category_id(p_user_id, 'Streaming', v_subs);
  v_apps := public.demo_category_id(p_user_id, 'Apps', v_subs);
  v_salary := public.demo_category_id(p_user_id, 'Salary', v_income);
  v_side := public.demo_category_id(p_user_id, 'Side income', v_income);

  IF v_food IS NULL OR v_car IS NULL OR v_transport IS NULL OR v_shopping IS NULL
     OR v_bills IS NULL OR v_ent IS NULL OR v_subs IS NULL OR v_health IS NULL
     OR v_income IS NULL OR v_groceries IS NULL OR v_car_fuel IS NULL OR v_rent IS NULL
     OR v_streaming IS NULL OR v_salary IS NULL THEN
    RAISE EXCEPTION 'Demo seed missing required categories for user %', p_user_id;
  END IF;

  DELETE FROM public.budget_category_limits WHERE user_id = p_user_id AND budget_id = v_budget_id;

  INSERT INTO public.budget_category_limits (user_id, budget_id, category_id, monthly_limit) VALUES
    (p_user_id, v_budget_id, v_food, 2200),
    (p_user_id, v_budget_id, v_car, 1200),
    (p_user_id, v_budget_id, v_transport, 500),
    (p_user_id, v_budget_id, v_shopping, 800),
    (p_user_id, v_budget_id, v_bills, 5000),
    (p_user_id, v_budget_id, v_ent, 600),
    (p_user_id, v_budget_id, v_subs, 400),
    (p_user_id, v_budget_id, v_health, 500);

  v_cycle_start := public.demo_noor_cycle_start(1);

  -- Income (current cycle, up to today)
  INSERT INTO public.transactions (
    user_id, amount, currency, type, merchant, title, category_id, subcategory_id, date, source, status
  ) VALUES
    (p_user_id, 18000, 'ILS', 'income', 'Acme Studio', 'Monthly salary', v_income, v_salary, v_cycle_start, 'manual', 'confirmed'),
    (p_user_id, 2500, 'ILS', 'income', 'Freelance client', 'Design project', v_income, v_side, public.demo_noor_tx_date(v_cycle_start, 11), 'manual', 'confirmed');

  -- Food & Drinks ~80% of 2200 (caution)
  INSERT INTO public.transactions (
    user_id, amount, currency, type, merchant, title, category_id, subcategory_id, date, source, status
  ) VALUES
    (p_user_id, 318, 'ILS', 'expense', 'Shufersal', 'Weekly groceries', v_food, v_groceries, public.demo_noor_tx_date(v_cycle_start, 2), 'manual', 'confirmed'),
    (p_user_id, 276, 'ILS', 'expense', 'Rami Levy', 'Groceries', v_food, v_groceries, public.demo_noor_tx_date(v_cycle_start, 8), 'manual', 'confirmed'),
    (p_user_id, 24, 'ILS', 'expense', 'Aroma', 'Morning coffee', v_food, v_coffee, public.demo_noor_tx_date(v_cycle_start, 3), 'text', 'confirmed'),
    (p_user_id, 22, 'ILS', 'expense', 'Cafeneto', 'Coffee', v_food, v_coffee, public.demo_noor_tx_date(v_cycle_start, 6), 'voice', 'confirmed'),
    (p_user_id, 94, 'ILS', 'expense', 'Wolt', 'Dinner delivery', v_food, v_delivery, public.demo_noor_tx_date(v_cycle_start, 5), 'manual', 'confirmed'),
    (p_user_id, 86, 'ILS', 'expense', 'Wolt', 'Lunch delivery', v_food, v_delivery, public.demo_noor_tx_date(v_cycle_start, 12), 'manual', 'confirmed'),
    (p_user_id, 62, 'ILS', 'expense', 'McDonald''s', 'Quick lunch', v_food, v_restaurants, public.demo_noor_tx_date(v_cycle_start, 4), 'manual', 'confirmed'),
    (p_user_id, 118, 'ILS', 'expense', 'Miznon', 'Dinner out', v_food, v_restaurants, public.demo_noor_tx_date(v_cycle_start, 9), 'manual', 'confirmed'),
    (p_user_id, 204, 'ILS', 'expense', 'Tiv Taam', 'Groceries', v_food, v_groceries, public.demo_noor_tx_date(v_cycle_start, 14), 'manual', 'confirmed'),
    (p_user_id, 198, 'ILS', 'expense', 'Super Yuda', 'Groceries', v_food, v_groceries, public.demo_noor_tx_date(v_cycle_start, 17), 'manual', 'confirmed'),
    (p_user_id, 21, 'ILS', 'expense', 'Aroma', 'Coffee', v_food, v_coffee, public.demo_noor_tx_date(v_cycle_start, 15), 'text', 'confirmed'),
    (p_user_id, 74, 'ILS', 'expense', 'Landwer', 'Breakfast', v_food, v_restaurants, public.demo_noor_tx_date(v_cycle_start, 18), 'manual', 'confirmed'),
    (p_user_id, 167, 'ILS', 'expense', 'Shufersal', 'Groceries', v_food, v_groceries, current_date - 1, 'manual', 'confirmed'),
    (p_user_id, 96, 'ILS', 'expense', 'Victory', 'Groceries', v_food, v_groceries, public.demo_noor_tx_date(v_cycle_start, 10), 'manual', 'confirmed');

  -- Car ~106% of 1200 (over)
  INSERT INTO public.transactions (
    user_id, amount, currency, type, merchant, title, category_id, subcategory_id, date, source, status
  ) VALUES
    (p_user_id, 285, 'ILS', 'expense', 'Paz', 'Fuel', v_car, v_car_fuel, public.demo_noor_tx_date(v_cycle_start, 1), 'manual', 'confirmed'),
    (p_user_id, 268, 'ILS', 'expense', 'Sonol', 'Fuel', v_car, v_car_fuel, public.demo_noor_tx_date(v_cycle_start, 10), 'manual', 'confirmed'),
    (p_user_id, 312, 'ILS', 'expense', 'Delek', 'Fuel', v_car, v_car_fuel, public.demo_noor_tx_date(v_cycle_start, 16), 'manual', 'confirmed'),
    (p_user_id, 28, 'ILS', 'expense', 'Pango', 'Parking', v_car, v_car_parking, public.demo_noor_tx_date(v_cycle_start, 7), 'manual', 'confirmed'),
    (p_user_id, 32, 'ILS', 'expense', 'Pango', 'Parking', v_car, v_car_parking, public.demo_noor_tx_date(v_cycle_start, 13), 'manual', 'confirmed'),
    (p_user_id, 348, 'ILS', 'expense', 'Auto Care', 'Oil change', v_car, v_car_maint, public.demo_noor_tx_date(v_cycle_start, 6), 'manual', 'confirmed');

  -- Shopping ~44% of 800 (healthy/moderate)
  INSERT INTO public.transactions (
    user_id, amount, currency, type, merchant, title, category_id, date, source, status
  ) VALUES
    (p_user_id, 129, 'ILS', 'expense', 'H&M', 'Clothing', v_shopping, public.demo_noor_tx_date(v_cycle_start, 4), 'manual', 'confirmed'),
    (p_user_id, 89, 'ILS', 'expense', 'KSP', 'Phone accessory', v_shopping, public.demo_noor_tx_date(v_cycle_start, 11), 'manual', 'confirmed'),
    (p_user_id, 80, 'ILS', 'expense', 'Zara', 'Shirt', v_shopping, public.demo_noor_tx_date(v_cycle_start, 19), 'manual', 'confirmed'),
    (p_user_id, 52, 'ILS', 'expense', 'IKEA', 'Home item', v_shopping, public.demo_noor_tx_date(v_cycle_start, 12), 'manual', 'confirmed');

  -- Bills predictable
  INSERT INTO public.transactions (
    user_id, amount, currency, type, merchant, title, category_id, subcategory_id, date, source, status
  ) VALUES
    (p_user_id, 3500, 'ILS', 'expense', 'Landlord', 'Rent', v_bills, v_rent, public.demo_noor_tx_date(v_cycle_start, 1), 'manual', 'confirmed'),
    (p_user_id, 119, 'ILS', 'expense', 'Bezeq', 'Internet', v_bills, v_internet, public.demo_noor_tx_date(v_cycle_start, 2), 'manual', 'confirmed'),
    (p_user_id, 89, 'ILS', 'expense', 'Cellcom', 'Mobile plan', v_bills, v_phone, public.demo_noor_tx_date(v_cycle_start, 2), 'manual', 'confirmed'),
    (p_user_id, 198, 'ILS', 'expense', 'IEC', 'Electricity', v_bills, v_electricity, public.demo_noor_tx_date(v_cycle_start, 5), 'manual', 'confirmed');

  -- Subscriptions (recurring signals)
  INSERT INTO public.transactions (
    user_id, amount, currency, type, merchant, title, category_id, subcategory_id, date, source, status
  ) VALUES
    (p_user_id, 49.90, 'ILS', 'expense', 'Netflix', 'Streaming', v_subs, v_streaming, public.demo_noor_tx_date(v_cycle_start, 3), 'manual', 'confirmed'),
    (p_user_id, 19.90, 'ILS', 'expense', 'Spotify', 'Music', v_subs, v_streaming, public.demo_noor_tx_date(v_cycle_start, 3), 'manual', 'confirmed'),
    (p_user_id, 32, 'ILS', 'expense', 'Apple', 'iCloud', v_subs, v_apps, public.demo_noor_tx_date(v_cycle_start, 4), 'manual', 'confirmed');

  -- Entertainment, Health, Transport
  INSERT INTO public.transactions (
    user_id, amount, currency, type, merchant, title, category_id, date, source, status
  ) VALUES
    (p_user_id, 156, 'ILS', 'expense', 'Cinema City', 'Movies', v_ent, public.demo_noor_tx_date(v_cycle_start, 8), 'manual', 'confirmed'),
    (p_user_id, 124, 'ILS', 'expense', 'Ticketmaster', 'Concert tickets', v_ent, public.demo_noor_tx_date(v_cycle_start, 15), 'manual', 'confirmed'),
    (p_user_id, 145, 'ILS', 'expense', 'Super-Pharm', 'Pharmacy', v_health, public.demo_noor_tx_date(v_cycle_start, 7), 'manual', 'confirmed'),
    (p_user_id, 86, 'ILS', 'expense', 'Gett', 'Taxi', v_transport, public.demo_noor_tx_date(v_cycle_start, 5), 'manual', 'confirmed'),
    (p_user_id, 62, 'ILS', 'expense', 'Rav-Kav', 'Transit pass', v_transport, public.demo_noor_tx_date(v_cycle_start, 1), 'manual', 'confirmed'),
    (p_user_id, 97, 'ILS', 'expense', 'Gett', 'Taxi', v_transport, public.demo_noor_tx_date(v_cycle_start, 14), 'manual', 'confirmed');

  -- Receipt + voice showcase (current cycle, no fake storage paths)
  INSERT INTO public.receipts (
    id, user_id, file_url, merchant, receipt_date, total_amount, currency,
    extracted_items, confidence, status
  ) VALUES (
    v_receipt_id, p_user_id, NULL, 'Super-Pharm', current_date - 3, 87.50, 'ILS',
    '[{"name":"Toiletries","amount":87.50}]'::jsonb, 0.92, 'confirmed'
  )
  ON CONFLICT (id) DO UPDATE SET
    file_url = NULL,
    merchant = EXCLUDED.merchant,
    receipt_date = EXCLUDED.receipt_date,
    total_amount = EXCLUDED.total_amount,
    status = 'confirmed';

  INSERT INTO public.transactions (
    user_id, amount, currency, type, merchant, title, category_id, subcategory_id,
    date, source, status, receipt_id
  ) VALUES (
    p_user_id, 87.50, 'ILS', 'expense', 'Super-Pharm', 'Pharmacy supplies', v_health, NULL,
    current_date - 3, 'receipt', 'confirmed', v_receipt_id
  );

  INSERT INTO public.voice_entries (
    id, user_id, audio_url, transcription, interpreted_payload, confidence, status
  ) VALUES (
    v_voice_id, p_user_id, NULL, 'Coffee at Cafeneto twenty two shekels',
    '{"amount":22,"merchant":"Cafeneto","title":"Coffee"}'::jsonb, 0.94, 'confirmed'
  )
  ON CONFLICT (id) DO UPDATE SET
    audio_url = NULL,
    transcription = EXCLUDED.transcription,
    status = 'confirmed';

  UPDATE public.transactions t
  SET voice_entry_id = v_voice_id
  WHERE t.user_id = p_user_id
    AND t.merchant = 'Cafeneto'
    AND t.amount = 22
    AND t.source = 'voice'
    AND t.date = public.demo_noor_tx_date(v_cycle_start, 6);

  -- One rejected expense for lifecycle coverage
  INSERT INTO public.transactions (
    user_id, amount, currency, type, merchant, title, category_id, date, source, status
  ) VALUES (
    p_user_id, 640, 'ILS', 'expense', 'Online Store', 'Cancelled order', v_shopping,
    (date_trunc('month', current_date) - interval '2 months')::date + 9, 'manual', 'rejected'
  );

  -- Historical months: salary + recurring + varied spending (5 prior months)
  FOR v_i IN 1..5 LOOP
    v_month_start := (date_trunc('month', current_date) - (v_i || ' months')::interval)::date;

    INSERT INTO public.transactions (
      user_id, amount, currency, type, merchant, title, category_id, subcategory_id, date, source, status
    ) VALUES
      (p_user_id, 18000, 'ILS', 'income', 'Acme Studio', 'Monthly salary', v_income, v_salary, v_month_start, 'manual', 'confirmed'),
      (p_user_id, 3500, 'ILS', 'expense', 'Landlord', 'Rent', v_bills, v_rent, v_month_start + 1, 'manual', 'confirmed'),
      (p_user_id, 49.90, 'ILS', 'expense', 'Netflix', 'Streaming', v_subs, v_streaming, v_month_start + 3, 'manual', 'confirmed'),
      (p_user_id, 19.90, 'ILS', 'expense', 'Spotify', 'Music', v_subs, v_streaming, v_month_start + 3, 'manual', 'confirmed'),
      (p_user_id, 89, 'ILS', 'expense', 'Cellcom', 'Mobile plan', v_bills, v_phone, v_month_start + 2, 'manual', 'confirmed'),
      (p_user_id, 285, 'ILS', 'expense', 'Paz', 'Fuel', v_car, v_car_fuel, v_month_start + 5, 'manual', 'confirmed'),
      (p_user_id, 268, 'ILS', 'expense', 'Sonol', 'Fuel', v_car, v_car_fuel, v_month_start + 18, 'manual', 'confirmed'),
      (p_user_id, 312, 'ILS', 'expense', 'Shufersal', 'Groceries', v_food, v_groceries, v_month_start + 7, 'manual', 'confirmed'),
      (p_user_id, 245, 'ILS', 'expense', 'Rami Levy', 'Groceries', v_food, v_groceries, v_month_start + 14, 'manual', 'confirmed'),
      (p_user_id, 96, 'ILS', 'expense', 'Wolt', 'Delivery', v_food, v_delivery, v_month_start + 10, 'manual', 'confirmed'),
      (p_user_id, 142, 'ILS', 'expense', 'Miznon', 'Dinner', v_food, v_restaurants, v_month_start + 12, 'manual', 'confirmed'),
      (p_user_id, 118, 'ILS', 'expense', 'KSP', 'Electronics', v_shopping, NULL, v_month_start + 8, 'manual', 'confirmed'),
      (p_user_id, 175, 'ILS', 'expense', 'Cinema City', 'Movies', v_ent, NULL, v_month_start + 16, 'manual', 'confirmed');

    IF v_i = 2 THEN
      INSERT INTO public.transactions (
        user_id, amount, currency, type, merchant, title, category_id, subcategory_id, date, source, status
      ) VALUES (
        p_user_id, 1800, 'ILS', 'income', 'Freelance client', 'Side project', v_income, v_side,
        v_month_start + 20, 'manual', 'confirmed'
      );
    END IF;
  END LOOP;

  -- Agent history intentionally empty for fresh demo interactions.
END;
$$;

GRANT EXECUTE ON FUNCTION public.demo_noor_cycle_start(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.demo_noor_tx_date(date, integer) TO service_role;
REVOKE ALL ON FUNCTION public.seed_demo_noor_baseline(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seed_demo_noor_baseline(uuid) TO service_role;
