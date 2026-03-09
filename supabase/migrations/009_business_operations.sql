-- ═══════════════════════════════════════════════════════════
-- MIGRATION 009: Business Operations — Orders, Production, Inventory, Finance
-- Sprint B3 | 10 new tables + 1 view
-- Run AFTER migrations 001-008
--
-- ⚠️ FK TYPE NOTES:
--   projects.id = TEXT ('PRJ-001')
--   suppliers.id = TEXT ('SUP-001')
--   bom_parts.id = TEXT ('BOM-xxx')
--   profiles.id = UUID (from auth.users)
--   New tables use UUID PKs, but FK columns match parent type.
-- ═══════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════
-- DOMAIN: ORDERS (3 tables)
-- ══════════════════════════════════════════════

-- 1. Customers / Partners
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'GOVERNMENT'
    CHECK (type IN ('GOVERNMENT', 'ENTERPRISE', 'UNIVERSITY', 'DISTRIBUTOR', 'MILITARY', 'OTHER')),
  country TEXT DEFAULT 'US',
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  billing_address TEXT,
  shipping_address TEXT,
  payment_terms TEXT DEFAULT 'NET30'
    CHECK (payment_terms IN ('NET30', 'NET60', 'NET90', 'PREPAID', 'COD')),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Orders (header)
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id),
  project_id TEXT REFERENCES public.projects(id),
  status TEXT DEFAULT 'QUOTE'
    CHECK (status IN (
      'QUOTE', 'PO_RECEIVED', 'CONFIRMED', 'IN_PRODUCTION', 'QC_PASSED',
      'PACKED', 'SHIPPED', 'DELIVERED', 'INVOICED', 'PAID', 'CLOSED',
      'CANCELLED', 'ON_HOLD'
    )),
  priority TEXT DEFAULT 'NORMAL'
    CHECK (priority IN ('URGENT', 'HIGH', 'NORMAL', 'LOW')),
  order_date DATE,
  po_number TEXT,
  po_date DATE,
  required_delivery_date DATE,
  promised_delivery_date DATE,
  actual_delivery_date DATE,
  shipping_method TEXT
    CHECK (shipping_method IS NULL OR shipping_method IN ('AIR', 'SEA', 'GROUND', 'HAND_CARRY')),
  tracking_number TEXT,
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_rate DECIMAL(5,4) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  payment_status TEXT DEFAULT 'UNPAID'
    CHECK (payment_status IN ('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'REFUNDED')),
  paid_amount DECIMAL(12,2) DEFAULT 0,
  invoice_number TEXT,
  invoice_date DATE,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_project ON public.orders(project_id);
CREATE INDEX idx_orders_status ON public.orders(status);

-- 3. Order line items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_sku TEXT,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  line_total DECIMAL(12,2) GENERATED ALWAYS AS (
    quantity * unit_price * (1 - discount_percent / 100)
  ) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- ══════════════════════════════════════════════
-- DOMAIN: PRODUCTION (2 tables)
-- ══════════════════════════════════════════════

-- 4. Production / Work Orders
CREATE TABLE public.production_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wo_number TEXT NOT NULL UNIQUE,
  order_id UUID REFERENCES public.orders(id),
  project_id TEXT REFERENCES public.projects(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'PLANNED'
    CHECK (status IN (
      'PLANNED', 'MATERIAL_READY', 'IN_PROGRESS', 'QC', 'COMPLETED', 'SHIPPED',
      'ON_HOLD', 'CANCELLED'
    )),
  priority TEXT DEFAULT 'NORMAL'
    CHECK (priority IN ('URGENT', 'HIGH', 'NORMAL', 'LOW')),
  planned_start DATE,
  planned_end DATE,
  actual_start DATE,
  actual_end DATE,
  current_station TEXT
    CHECK (current_station IS NULL OR current_station IN (
      'SMT', 'ASSEMBLY', 'FIRMWARE', 'CALIBRATION', 'FLIGHT_TEST', 'QC', 'PACKING'
    )),
  assigned_to TEXT,
  yield_quantity INTEGER DEFAULT 0,
  defect_quantity INTEGER DEFAULT 0,
  defect_notes TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_production_project ON public.production_orders(project_id);
CREATE INDEX idx_production_order ON public.production_orders(order_id);
CREATE INDEX idx_production_status ON public.production_orders(status);

-- 5. Production Logs (per-station activity)
CREATE TABLE public.production_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id UUID NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
  station TEXT NOT NULL,
  action TEXT NOT NULL
    CHECK (action IN ('STARTED', 'COMPLETED', 'ISSUE_FOUND', 'REWORK', 'PASSED_QC', 'FAILED_QC')),
  quantity_processed INTEGER DEFAULT 0,
  quantity_passed INTEGER DEFAULT 0,
  quantity_failed INTEGER DEFAULT 0,
  operator TEXT,
  duration_minutes INTEGER,
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prod_logs_wo ON public.production_logs(production_order_id);

-- ══════════════════════════════════════════════
-- DOMAIN: INVENTORY (2 tables)
-- ══════════════════════════════════════════════

-- 6. Inventory (stock levels per part per warehouse)
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id TEXT REFERENCES public.bom_parts(id),
  part_number TEXT NOT NULL,
  part_name TEXT NOT NULL,
  category TEXT
    CHECK (category IS NULL OR category IN ('MECHANICAL', 'ELECTRICAL', 'SOFTWARE', 'CONSUMABLE')),
  warehouse TEXT DEFAULT 'HCM-MAIN'
    CHECK (warehouse IN ('HCM-MAIN', 'HCM-LAB', 'CA-OFFICE')),
  location TEXT,
  quantity_on_hand INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,
  quantity_on_order INTEGER DEFAULT 0,
  quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
  unit TEXT DEFAULT 'pcs',
  unit_cost DECIMAL(10,2) DEFAULT 0,
  total_value DECIMAL(12,2) GENERATED ALWAYS AS (quantity_on_hand * unit_cost) STORED,
  min_stock INTEGER DEFAULT 0,
  max_stock INTEGER DEFAULT 0,
  reorder_quantity INTEGER DEFAULT 0,
  lead_time_days INTEGER DEFAULT 0,
  last_counted_at TIMESTAMPTZ,
  supplier_id TEXT REFERENCES public.suppliers(id),
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_part ON public.inventory(part_id);
CREATE INDEX idx_inventory_warehouse ON public.inventory(warehouse);
CREATE INDEX idx_inventory_supplier ON public.inventory(supplier_id);

-- 7. Inventory Transactions (IN/OUT/ADJUST history)
CREATE TABLE public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID REFERENCES public.inventory(id),
  type TEXT NOT NULL
    CHECK (type IN ('IN', 'OUT', 'ADJUST', 'RETURN', 'SCRAP')),
  quantity INTEGER NOT NULL,
  reference_type TEXT
    CHECK (reference_type IS NULL OR reference_type IN ('PO', 'WO', 'ADJUSTMENT', 'SCRAP', 'RETURN')),
  reference_id TEXT,
  reason TEXT,
  performed_by TEXT,
  transaction_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_txn_inventory ON public.inventory_transactions(inventory_id);

-- ══════════════════════════════════════════════
-- DOMAIN: FINANCE (2 tables + 1 view)
-- ══════════════════════════════════════════════

-- 8. Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  order_id UUID REFERENCES public.orders(id),
  customer_id UUID REFERENCES public.customers(id),
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED')),
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_order ON public.invoices(order_id);
CREATE INDEX idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);

-- 9. Cost Entries (production costs by category)
CREATE TABLE public.cost_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id UUID REFERENCES public.production_orders(id),
  project_id TEXT REFERENCES public.projects(id),
  category TEXT NOT NULL
    CHECK (category IN ('MATERIAL', 'LABOR', 'OVERHEAD', 'TOOLING', 'SHIPPING', 'OTHER')),
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  date DATE DEFAULT CURRENT_DATE,
  vendor TEXT,
  receipt_ref TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_costs_project ON public.cost_entries(project_id);
CREATE INDEX idx_costs_wo ON public.cost_entries(production_order_id);

-- 10. Finance Summary View (CTE-based — avoids cartesian product)
CREATE OR REPLACE VIEW public.finance_summary AS
WITH rev AS (
  SELECT
    project_id,
    SUM(total_amount) FILTER (WHERE status NOT IN ('CANCELLED', 'QUOTE')) AS total_revenue,
    SUM(paid_amount) AS total_collected,
    SUM(total_amount - paid_amount) FILTER (WHERE payment_status IN ('UNPAID', 'PARTIAL', 'OVERDUE')) AS outstanding_ar,
    COUNT(*) FILTER (WHERE status NOT IN ('CANCELLED', 'QUOTE')) AS order_count,
    COUNT(*) FILTER (WHERE payment_status = 'OVERDUE') AS overdue_count
  FROM public.orders
  GROUP BY project_id
),
costs AS (
  SELECT project_id, SUM(amount) AS total_costs
  FROM public.cost_entries
  GROUP BY project_id
)
SELECT
  p.id AS project_id,
  p.name AS project_name,
  COALESCE(r.total_revenue, 0) AS total_revenue,
  COALESCE(r.total_collected, 0) AS total_collected,
  COALESCE(r.outstanding_ar, 0) AS outstanding_ar,
  COALESCE(c.total_costs, 0) AS total_costs,
  COALESCE(r.total_revenue, 0) - COALESCE(c.total_costs, 0) AS gross_margin,
  COALESCE(r.order_count, 0) AS order_count,
  COALESCE(r.overdue_count, 0) AS overdue_count
FROM public.projects p
LEFT JOIN rev r ON r.project_id = p.id
LEFT JOIN costs c ON c.project_id = p.id;

-- ══════════════════════════════════════════════
-- ENABLE REALTIME (orders, production_orders, inventory)
-- ══════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.production_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;

-- ══════════════════════════════════════════════
-- RLS POLICIES — Business Operations
-- Pattern: authenticated SELECT, admin/pm INSERT/UPDATE/DELETE
-- ══════════════════════════════════════════════

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_entries ENABLE ROW LEVEL SECURITY;

-- SELECT: all authenticated users
CREATE POLICY "select_all" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_all" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_all" ON public.order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_all" ON public.production_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_all" ON public.production_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_all" ON public.inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_all" ON public.inventory_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_all" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_all" ON public.cost_entries FOR SELECT TO authenticated USING (true);

-- INSERT: admin/pm only
CREATE POLICY "admin_pm_insert" ON public.customers FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('admin', 'pm'));
CREATE POLICY "admin_pm_insert" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('admin', 'pm'));
CREATE POLICY "admin_pm_insert" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('admin', 'pm'));
CREATE POLICY "admin_pm_insert" ON public.production_orders FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('admin', 'pm'));
CREATE POLICY "admin_pm_insert" ON public.production_logs FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('admin', 'pm', 'engineer'));
CREATE POLICY "admin_pm_insert" ON public.inventory FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('admin', 'pm'));
CREATE POLICY "admin_pm_insert" ON public.inventory_transactions FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('admin', 'pm', 'engineer'));
CREATE POLICY "admin_pm_insert" ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('admin', 'pm'));
CREATE POLICY "admin_pm_insert" ON public.cost_entries FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('admin', 'pm'));

-- UPDATE: admin/pm only
CREATE POLICY "admin_pm_update" ON public.customers FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('admin', 'pm'));
CREATE POLICY "admin_pm_update" ON public.orders FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('admin', 'pm'));
CREATE POLICY "admin_pm_update" ON public.production_orders FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('admin', 'pm'));
CREATE POLICY "admin_pm_update" ON public.inventory FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('admin', 'pm'));
CREATE POLICY "admin_pm_update" ON public.invoices FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('admin', 'pm'));

-- DELETE: admin only
CREATE POLICY "admin_delete" ON public.customers FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');
CREATE POLICY "admin_delete" ON public.orders FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');
CREATE POLICY "admin_delete" ON public.order_items FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');
CREATE POLICY "admin_delete" ON public.production_orders FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');
CREATE POLICY "admin_delete" ON public.inventory FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');
CREATE POLICY "admin_delete" ON public.invoices FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');
CREATE POLICY "admin_delete" ON public.cost_entries FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');
