-- ═══════════════════════════════════════════════════════════════════
-- RtR Control Tower — SCHEMA (18 tables)
-- Paste vào: Supabase Dashboard → SQL Editor → New Query → Run
-- Thời gian: ~5 giây
-- ═══════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ══════════════════════════════════════════════════════════════
-- MIGRATION 001: Core Tables (profiles, projects, milestones, project_members)
-- ══════════════════════════════════════════════════════════════

-- 1. PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  full_name_vi TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'pm', 'engineer', 'viewer')),
  avatar_initials TEXT,
  phone TEXT,
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'viewer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. PROJECTS
CREATE TABLE public.projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_vi TEXT,
  description TEXT,
  description_vi TEXT,
  phase TEXT NOT NULL CHECK (phase IN ('CONCEPT', 'EVT', 'DVT', 'PVT', 'MP')),
  phase_index INTEGER NOT NULL DEFAULT 0,
  phase_owner_id UUID REFERENCES public.profiles(id),
  phase_owner_name TEXT,
  start_date DATE,
  target_mp DATE,
  health TEXT CHECK (health IN ('ON_TRACK', 'AT_RISK', 'DELAYED', 'BLOCKED')) DEFAULT 'ON_TRACK',
  cascade_alerts INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MILESTONES
CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('CONCEPT', 'EVT', 'DVT', 'PVT', 'MP')),
  target_date DATE,
  actual_date DATE,
  status TEXT CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'DONE', 'DELAYED')) DEFAULT 'PLANNED',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, phase)
);

-- 4. PROJECT MEMBERS
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_in_project TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- ══════════════════════════════════════════════════════════════
-- MIGRATION 002: Issues & Gates
-- ══════════════════════════════════════════════════════════════

-- 5. ISSUES
CREATE TABLE public.issues (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_vi TEXT,
  description TEXT,
  description_vi TEXT,
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'OPEN', 'IN_PROGRESS', 'BLOCKED', 'CLOSED')) DEFAULT 'DRAFT',
  severity TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  source TEXT CHECK (source IN ('INTERNAL', 'EXTERNAL', 'CROSS_TEAM')) DEFAULT 'INTERNAL',
  owner_id UUID REFERENCES public.profiles(id),
  owner_name TEXT,
  phase TEXT,
  root_cause TEXT,
  root_cause_vi TEXT,
  due_date DATE,
  closed_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_issues_project ON public.issues(project_id);
CREATE INDEX idx_issues_status ON public.issues(status);
CREATE INDEX idx_issues_severity ON public.issues(severity);
CREATE INDEX idx_issues_owner ON public.issues(owner_id);

-- 6. ISSUE IMPACTS
CREATE TABLE public.issue_impacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id TEXT NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  affected_phase TEXT NOT NULL,
  delay_weeks INTEGER DEFAULT 0,
  description TEXT,
  description_vi TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ISSUE UPDATES
CREATE TABLE public.issue_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id TEXT NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id),
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  content_vi TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_issue_updates_issue ON public.issue_updates(issue_id);

-- 8. GATE CONDITIONS
CREATE TABLE public.gate_conditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  category TEXT,
  label TEXT NOT NULL,
  label_vi TEXT,
  is_required BOOLEAN DEFAULT false,
  is_checked BOOLEAN DEFAULT false,
  checked_by UUID REFERENCES public.profiles(id),
  checked_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gates_project_phase ON public.gate_conditions(project_id, phase);

-- ══════════════════════════════════════════════════════════════
-- MIGRATION 003: BOM & Suppliers
-- ══════════════════════════════════════════════════════════════

-- 9. SUPPLIERS
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

-- 10. BOM PARTS
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

-- 11. DELIVERY RECORDS
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

-- ══════════════════════════════════════════════════════════════
-- MIGRATION 004: Flight Tests & Decisions
-- ══════════════════════════════════════════════════════════════

-- 12. FLIGHT TESTS
CREATE TABLE public.flight_tests (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  test_number INTEGER,
  date DATE NOT NULL,
  location TEXT,
  location_vi TEXT,
  pilot_id UUID REFERENCES public.profiles(id),
  pilot_name TEXT,
  drone_unit TEXT,
  test_type TEXT CHECK (test_type IN ('STABILITY', 'ENDURANCE', 'SPEED', 'PAYLOAD', 'ENVIRONMENTAL', 'RANGE', 'INTEGRATION')),
  test_phase TEXT,
  result TEXT CHECK (result IN ('PASS', 'FAIL', 'PARTIAL', 'ABORTED')) NOT NULL,
  duration_seconds INTEGER,
  sensor_data JSONB,
  notes TEXT,
  notes_vi TEXT,
  auto_issue_id TEXT REFERENCES public.issues(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_flights_project ON public.flight_tests(project_id);
CREATE INDEX idx_flights_result ON public.flight_tests(result);

-- 13. FLIGHT ANOMALIES
CREATE TABLE public.flight_anomalies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flight_test_id TEXT NOT NULL REFERENCES public.flight_tests(id) ON DELETE CASCADE,
  timestamp_seconds INTEGER,
  description TEXT NOT NULL,
  description_vi TEXT,
  severity TEXT CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. FLIGHT ATTACHMENTS
CREATE TABLE public.flight_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flight_test_id TEXT NOT NULL REFERENCES public.flight_tests(id) ON DELETE CASCADE,
  file_type TEXT CHECK (file_type IN ('VIDEO', 'LOG', 'PHOTO', 'DOCUMENT')),
  file_name TEXT NOT NULL,
  file_url TEXT,
  file_size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. DECISIONS
CREATE TABLE public.decisions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_vi TEXT,
  date DATE,
  decision_maker_id UUID REFERENCES public.profiles(id),
  decision_maker_name TEXT,
  phase TEXT,
  options JSONB,
  chosen_option TEXT,
  rationale TEXT,
  rationale_vi TEXT,
  impact_phase TEXT,
  impact_description TEXT,
  cost_impact TEXT,
  status TEXT CHECK (status IN ('PROPOSED', 'APPROVED', 'SUPERSEDED', 'REJECTED')) DEFAULT 'PROPOSED',
  linked_issue_ids TEXT[],
  linked_flight_test_ids TEXT[],
  linked_gate_condition_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_decisions_project ON public.decisions(project_id);

-- ══════════════════════════════════════════════════════════════
-- MIGRATION 005: System Tables
-- ══════════════════════════════════════════════════════════════

-- 16. AUDIT LOG
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  user_name TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  entity_title TEXT,
  old_value TEXT,
  new_value TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON public.audit_log(user_id);
CREATE INDEX idx_audit_action ON public.audit_log(action);
CREATE INDEX idx_audit_created ON public.audit_log(created_at DESC);

-- 17. NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  title_vi TEXT,
  body TEXT,
  project_id TEXT REFERENCES public.projects(id),
  entity_type TEXT,
  entity_id TEXT,
  is_read BOOLEAN DEFAULT false,
  is_emailed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- 18. EMAIL PREFERENCES
CREATE TABLE public.email_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  frequency TEXT CHECK (frequency IN ('REALTIME', 'DIGEST')) DEFAULT 'REALTIME',
  UNIQUE(user_id, event_type)
);

-- ══════════════════════════════════════════════════════════════
-- TRIGGERS: Auto-update updated_at timestamps
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.issues FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.bom_parts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.flight_tests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.decisions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════════════
-- ✅ DONE — 18 tables, 14 indexes, 2 functions, 8 triggers created
-- ═══════════════════════════════════════════════════════════════════
