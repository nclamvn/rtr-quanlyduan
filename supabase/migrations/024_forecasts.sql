-- ═══════════════════════════════════════════════════════════
-- MIGRATION 024: Forecasts table for Lớp 3 prediction layer
-- Stores statistical + LLM forecasts with validity windows
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_type TEXT NOT NULL CHECK (forecast_type IN ('milestone_slip', 'part_eol', 'budget_burn', 'team_velocity')),
  entity_ref TEXT NOT NULL,
  horizon_days INTEGER NOT NULL,
  prediction JSONB NOT NULL,
  methodology TEXT NOT NULL,
  inputs_summary JSONB DEFAULT '{}',
  generated_at TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  generated_by TEXT DEFAULT 'forecast_agent'
);

CREATE INDEX IF NOT EXISTS idx_forecasts_type_entity
  ON public.forecasts (forecast_type, entity_ref, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_forecasts_valid
  ON public.forecasts (valid_until) WHERE valid_until > now();

-- Latest forecast per (type, entity) — avoids querying all history
CREATE OR REPLACE VIEW public.latest_forecasts AS
SELECT DISTINCT ON (forecast_type, entity_ref)
  id, forecast_type, entity_ref, horizon_days, prediction, methodology,
  generated_at, valid_until, generated_by
FROM public.forecasts
WHERE valid_until IS NULL OR valid_until > now()
ORDER BY forecast_type, entity_ref, generated_at DESC;

-- RLS
ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read forecasts"
  ON public.forecasts FOR SELECT USING (true);

CREATE POLICY "Service can manage forecasts"
  ON public.forecasts FOR ALL USING (true);
