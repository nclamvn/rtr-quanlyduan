-- ═══════════════════════════════════════════════════════════
-- MIGRATION 025: Briefs table for CEO/PM weekly reports
-- AI-generated executive summaries with decision capture
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_type TEXT NOT NULL CHECK (brief_type IN ('ceo_weekly', 'ceo_monthly', 'pm_weekly', 'custom')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  executive_summary TEXT NOT NULL,
  highlights JSONB DEFAULT '[]',
  scenarios JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  risk_summary JSONB DEFAULT '{}',
  metrics_snapshot JSONB DEFAULT '{}',

  generated_at TIMESTAMPTZ DEFAULT now(),
  model_used TEXT,
  cost_estimate_usd NUMERIC(6,4),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  ceo_decision JSONB DEFAULT NULL,
  decided_by UUID,
  decided_at TIMESTAMPTZ,

  UNIQUE(brief_type, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_briefs_type_period
  ON public.briefs (brief_type, period_end DESC);

CREATE INDEX IF NOT EXISTS idx_briefs_status
  ON public.briefs (status, generated_at DESC);

-- RLS
ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read briefs"
  ON public.briefs FOR SELECT USING (true);

CREATE POLICY "Service can manage briefs"
  ON public.briefs FOR ALL USING (true);
