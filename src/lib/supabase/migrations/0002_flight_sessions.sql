-- Migration 0002 — Flight sessions + push subscriptions
-- References auth.users (Supabase built-in) instead of a custom profiles table.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. flight_sessions — every recorded drone flight
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.flight_sessions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at          TIMESTAMPTZ,
  duration_seconds  INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  profile           TEXT    NOT NULL DEFAULT 'dron',
  status            TEXT    NOT NULL CHECK (status IN ('GO', 'CAUTION', 'NO-GO')),
  latitude          DOUBLE PRECISION,
  longitude         DOUBLE PRECISION,
  conditions        JSONB   NOT NULL DEFAULT '{}'::jsonb,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.flight_sessions.conditions IS
  'JSON snapshot of weather + telemetry at flight time: temp, wind, gusts, rain, clouds, kp, visibility';

CREATE INDEX IF NOT EXISTS flight_sessions_user_started_idx
  ON public.flight_sessions (user_id, started_at DESC);

ALTER TABLE public.flight_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "flight_sessions_select_own" ON public.flight_sessions;
DROP POLICY IF EXISTS "flight_sessions_insert_own" ON public.flight_sessions;
DROP POLICY IF EXISTS "flight_sessions_update_own" ON public.flight_sessions;
DROP POLICY IF EXISTS "flight_sessions_delete_own" ON public.flight_sessions;

CREATE POLICY "flight_sessions_select_own" ON public.flight_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "flight_sessions_insert_own" ON public.flight_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "flight_sessions_update_own" ON public.flight_sessions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "flight_sessions_delete_own" ON public.flight_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. push_subscriptions — web push endpoints (multi-device per user)
--    last_lat / last_lon   → coordinates used by cron evaluator
--    last_status           → previous GO/CAUTION/NO-GO to detect changes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint      TEXT NOT NULL UNIQUE,
  p256dh        TEXT NOT NULL,
  auth          TEXT NOT NULL,
  user_agent    TEXT,
  last_lat      DOUBLE PRECISION,
  last_lon      DOUBLE PRECISION,
  last_status   TEXT CHECK (last_status IN ('GO', 'CAUTION', 'NO-GO')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx
  ON public.push_subscriptions (user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subs_select_own" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subs_insert_own" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subs_delete_own" ON public.push_subscriptions;
-- Service role (used by cron) bypasses RLS automatically.

CREATE POLICY "push_subs_select_own" ON public.push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "push_subs_insert_own" ON public.push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "push_subs_delete_own" ON public.push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Helper view — recent sessions per user (last 200, ordered)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.flight_sessions_recent AS
  SELECT *
  FROM public.flight_sessions
  ORDER BY started_at DESC
  LIMIT 200;

GRANT SELECT ON public.flight_sessions_recent TO authenticated;
