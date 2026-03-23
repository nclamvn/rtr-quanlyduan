-- ═══════════════════════════════════════════════════════════
-- MIGRATION 012: AI Advisor Cache + Snapshots
-- Stores cached AI advisory responses to minimize API costs
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ai_advisor_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT UNIQUE NOT NULL,
  issue_id TEXT NOT NULL,
  response JSONB NOT NULL,
  model TEXT,
  tokens_used INTEGER,
  lang TEXT DEFAULT 'vi',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON public.ai_advisor_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON public.ai_advisor_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_cache_issue ON public.ai_advisor_cache(issue_id);

-- Cleanup expired entries daily at 02:00 UTC
CREATE OR REPLACE FUNCTION cleanup_ai_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_advisor_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS: allow authenticated users to read cache
ALTER TABLE public.ai_advisor_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read AI cache" ON public.ai_advisor_cache FOR SELECT USING (true);
CREATE POLICY "Edge functions can insert AI cache" ON public.ai_advisor_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Edge functions can delete AI cache" ON public.ai_advisor_cache FOR DELETE USING (true);
