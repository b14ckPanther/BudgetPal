-- Phase 8.5: persisted app appearance preference.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme_preference text NOT NULL DEFAULT 'dark';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_theme_preference;
ALTER TABLE public.profiles
  ADD CONSTRAINT check_theme_preference
  CHECK (theme_preference IN ('dark', 'light'));
