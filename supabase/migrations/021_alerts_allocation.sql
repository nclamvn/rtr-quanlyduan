-- ═══════════════════════════════════════════════════════════
-- MIGRATION 021: Allocation fields on alerts table
-- Supports AI-suggested assignee + deadline, human override
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS suggested_assignee UUID,
  ADD COLUMN IF NOT EXISTS suggested_deadline DATE,
  ADD COLUMN IF NOT EXISTS allocation_rationale TEXT,
  ADD COLUMN IF NOT EXISTS allocation_confidence NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS actual_assignee UUID,
  ADD COLUMN IF NOT EXISTS actual_deadline DATE;

CREATE INDEX IF NOT EXISTS idx_alerts_suggested_assignee
  ON public.alerts(suggested_assignee) WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_alerts_needs_allocation
  ON public.alerts(status, created_at DESC) WHERE suggested_assignee IS NULL;
