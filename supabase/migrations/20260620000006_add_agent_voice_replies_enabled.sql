-- Phase 5: optional agent voice replies preference (default off)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS agent_voice_replies_enabled boolean NOT NULL DEFAULT false;
