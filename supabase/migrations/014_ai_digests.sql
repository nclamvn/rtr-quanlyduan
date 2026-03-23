-- ═══════════════════════════════════════════════════════════
-- MIGRATION 014: AI Daily Digest + Snapshots
-- Stores AI-generated daily summaries and state snapshots
-- ═══════════════════════════════════════════════════════════

-- Daily AI digest (one per day)
CREATE TABLE IF NOT EXISTS public.ai_digests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  digest_date DATE UNIQUE NOT NULL,
  content JSONB NOT NULL,
  model TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_digests_date ON public.ai_digests(digest_date DESC);

-- State snapshots for trend comparison
CREATE TABLE IF NOT EXISTS public.ai_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_date DATE NOT NULL,
  snapshot_type TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(snapshot_date, snapshot_type)
);

CREATE INDEX IF NOT EXISTS idx_ai_snapshots_date ON public.ai_snapshots(snapshot_date DESC, snapshot_type);

-- RLS
ALTER TABLE public.ai_digests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read digests" ON public.ai_digests FOR SELECT USING (true);
CREATE POLICY "Service can manage digests" ON public.ai_digests FOR ALL USING (true);

ALTER TABLE public.ai_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read snapshots" ON public.ai_snapshots FOR SELECT USING (true);
CREATE POLICY "Service can manage snapshots" ON public.ai_snapshots FOR ALL USING (true);

-- Cleanup: keep last 90 days
CREATE OR REPLACE FUNCTION cleanup_ai_digests()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_digests WHERE digest_date < CURRENT_DATE - INTERVAL '90 days';
  DELETE FROM ai_snapshots WHERE snapshot_date < CURRENT_DATE - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
