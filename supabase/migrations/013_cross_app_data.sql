-- ═══════════════════════════════════════════════════════════
-- MIGRATION 013: Cross-App Data Bridge
-- Stores synced data from MRP, HRM, CRM for unified dashboard
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.cross_app_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_app TEXT NOT NULL,          -- 'MRP', 'HRM', 'CRM', 'IP'
  entity_type TEXT NOT NULL,         -- 'work_order', 'inventory_alert', 'sales_order', 'production_summary'
  entity_id TEXT NOT NULL,           -- original ID from source app
  title TEXT,                        -- human-readable title
  status TEXT,                       -- entity status
  priority TEXT,                     -- normal, high, urgent
  data JSONB NOT NULL DEFAULT '{}',  -- full entity data
  project_link TEXT,                 -- link to CT project ID (e.g., PRJ-HERA)
  owner TEXT,                        -- responsible person
  due_date DATE,                     -- deadline if applicable
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_app, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_cross_app_source ON public.cross_app_data(source_app, entity_type);
CREATE INDEX IF NOT EXISTS idx_cross_app_project ON public.cross_app_data(project_link);
CREATE INDEX IF NOT EXISTS idx_cross_app_synced ON public.cross_app_data(synced_at DESC);

-- Summary view for dashboard KPIs
CREATE OR REPLACE VIEW public.cross_app_summary AS
SELECT
  source_app,
  entity_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status IN ('in_production', 'confirmed', 'pending')) as active,
  COUNT(*) FILTER (WHERE status IN ('completed', 'delivered', 'shipped')) as completed,
  COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status NOT IN ('completed', 'delivered', 'shipped', 'cancelled')) as overdue,
  COUNT(*) FILTER (WHERE priority IN ('high', 'urgent')) as high_priority,
  MAX(synced_at) as last_synced
FROM public.cross_app_data
GROUP BY source_app, entity_type;

-- RLS
ALTER TABLE public.cross_app_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read cross-app data" ON public.cross_app_data FOR SELECT USING (true);
CREATE POLICY "Service can manage cross-app data" ON public.cross_app_data FOR ALL USING (true);
