-- ═══════════════════════════════════════════════════════════
-- MIGRATION 022: Dispatch tracking on alerts + dispatch audit log
-- Supports multi-channel notification with confidence-based gating
-- ═══════════════════════════════════════════════════════════

-- Extend alerts with dispatch tracking
ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dispatch_channels TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dispatch_gate TEXT;

-- Audit log for every dispatch attempt
CREATE TABLE IF NOT EXISTS public.dispatch_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'telegram', 'in_app')),
  recipient TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
  response JSONB DEFAULT '{}',
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dispatch_log_alert
  ON public.dispatch_log(alert_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_dispatch_pending
  ON public.alerts(created_at DESC)
  WHERE status = 'open' AND suggested_assignee IS NOT NULL AND dispatched_at IS NULL;

-- RLS
ALTER TABLE public.dispatch_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read dispatch_log"
  ON public.dispatch_log FOR SELECT USING (true);

CREATE POLICY "Service can manage dispatch_log"
  ON public.dispatch_log FOR ALL USING (true);
