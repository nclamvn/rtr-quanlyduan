-- ═══════════════════════════════════════════════════════════
-- MIGRATION 003: BOM & Suppliers
-- ═══════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────
-- 9. SUPPLIERS
-- ──────────────────────────────────────────────
CREATE TABLE public.suppliers (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_vi TEXT,
  country TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  quality_rating NUMERIC(3,1),
  delivery_on_time_rate NUMERIC(5,2),
  defect_rate NUMERIC(5,2),
  total_orders INTEGER DEFAULT 0,
  late_deliveries INTEGER DEFAULT 0,
  qualification_status TEXT CHECK (qualification_status IN ('QUALIFIED', 'PENDING', 'PROBATION', 'DISQUALIFIED')) DEFAULT 'PENDING',
  certifications TEXT[],
  last_audit_date DATE,
  next_audit_date DATE,
  payment_terms TEXT,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  notes_vi TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- 10. BOM PARTS
-- ──────────────────────────────────────────────
CREATE TABLE public.bom_parts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES public.bom_parts(id),
  name TEXT NOT NULL,
  name_vi TEXT,
  part_number TEXT,
  category TEXT,
  level INTEGER DEFAULT 0,
  quantity INTEGER DEFAULT 1,
  unit_cost NUMERIC(12,2),
  total_cost NUMERIC(12,2),
  currency TEXT DEFAULT 'USD',
  supplier_id TEXT REFERENCES public.suppliers(id),
  lifecycle TEXT CHECK (lifecycle IN ('ACTIVE', 'NRND', 'EOL', 'OBSOLETE')) DEFAULT 'ACTIVE',
  lead_time_days INTEGER,
  weight_grams NUMERIC(10,2),
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bom_project ON public.bom_parts(project_id);
CREATE INDEX idx_bom_parent ON public.bom_parts(parent_id);
CREATE INDEX idx_bom_supplier ON public.bom_parts(supplier_id);

-- ──────────────────────────────────────────────
-- 11. SUPPLIER DELIVERY RECORDS
-- ──────────────────────────────────────────────
CREATE TABLE public.delivery_records (
  id TEXT PRIMARY KEY,
  supplier_id TEXT NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  bom_part_id TEXT REFERENCES public.bom_parts(id),
  bom_part_name TEXT,
  order_date DATE,
  promised_date DATE,
  actual_date DATE,
  quantity INTEGER,
  unit_price NUMERIC(12,2),
  status TEXT CHECK (status IN ('ORDERED', 'IN_TRANSIT', 'DELIVERED_ON_TIME', 'DELIVERED_LATE', 'CANCELLED')) DEFAULT 'ORDERED',
  delay_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_delivery_supplier ON public.delivery_records(supplier_id);
