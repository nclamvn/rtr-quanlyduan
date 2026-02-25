-- ═══════════════════════════════════════════════════════════
-- RLS POLICIES — Role-Based Access Control
-- Run AFTER migrations 001-005
-- ═══════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_impacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bom_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

-- Helper function: get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ══════════════════════════════════════════════
-- PROFILES
-- ══════════════════════════════════════════════
CREATE POLICY "Profiles: viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Profiles: users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Profiles: admin can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- ══════════════════════════════════════════════
-- PROJECTS (read: all, write: admin/pm)
-- ══════════════════════════════════════════════
CREATE POLICY "Projects: viewable by authenticated"
  ON public.projects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Projects: admin/pm can insert"
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('admin', 'pm'));

CREATE POLICY "Projects: admin/pm can update"
  ON public.projects FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('admin', 'pm'));

-- ══════════════════════════════════════════════
-- ISSUES (read: all, create: all, update: owner/pm/admin)
-- ══════════════════════════════════════════════
CREATE POLICY "Issues: viewable by authenticated"
  ON public.issues FOR SELECT TO authenticated USING (true);

CREATE POLICY "Issues: authenticated can create"
  ON public.issues FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Issues: owner/pm/admin can update"
  ON public.issues FOR UPDATE TO authenticated
  USING (
    owner_id = auth.uid()
    OR created_by = auth.uid()
    OR public.get_user_role() IN ('admin', 'pm')
  );

-- ══════════════════════════════════════════════
-- GATE CONDITIONS (read: all, toggle: engineer/pm/admin)
-- ══════════════════════════════════════════════
CREATE POLICY "Gates: viewable by authenticated"
  ON public.gate_conditions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gates: engineer/pm/admin can update"
  ON public.gate_conditions FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('admin', 'pm', 'engineer'));

-- ══════════════════════════════════════════════
-- Read-all policies for reference tables
-- ══════════════════════════════════════════════
CREATE POLICY "select_all" ON public.milestones FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_all" ON public.project_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_all" ON public.issue_impacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_all" ON public.issue_updates FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_all" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_all" ON public.bom_parts FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_all" ON public.delivery_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_all" ON public.flight_tests FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_all" ON public.flight_anomalies FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_all" ON public.flight_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_all" ON public.decisions FOR SELECT TO authenticated USING (true);

-- ══════════════════════════════════════════════
-- Write policies for admin/pm
-- ══════════════════════════════════════════════
CREATE POLICY "admin_pm_insert" ON public.milestones FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('admin', 'pm'));
CREATE POLICY "admin_pm_insert" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('admin', 'pm'));
CREATE POLICY "admin_pm_insert" ON public.bom_parts FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('admin', 'pm', 'engineer'));
CREATE POLICY "admin_pm_insert" ON public.decisions FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('admin', 'pm'));
CREATE POLICY "admin_pm_insert" ON public.gate_conditions FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('admin', 'pm'));

-- Write for all authenticated (issue updates, flight tests)
CREATE POLICY "auth_insert" ON public.issue_updates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_insert" ON public.issue_impacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_insert" ON public.flight_tests FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('admin', 'pm', 'engineer'));
CREATE POLICY "auth_insert" ON public.flight_anomalies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_insert" ON public.flight_attachments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_insert" ON public.delivery_records FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('admin', 'pm'));

-- ══════════════════════════════════════════════
-- AUDIT LOG (read: admin only, insert: system)
-- ══════════════════════════════════════════════
CREATE POLICY "Audit: admin can read"
  ON public.audit_log FOR SELECT TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Audit: authenticated can insert"
  ON public.audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- ══════════════════════════════════════════════
-- NOTIFICATIONS (user sees own)
-- ══════════════════════════════════════════════
CREATE POLICY "Notifications: user sees own"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Notifications: system can insert"
  ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Notifications: user can update own (mark read)"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ══════════════════════════════════════════════
-- EMAIL PREFERENCES (user manages own)
-- ══════════════════════════════════════════════
CREATE POLICY "Email prefs: user sees own"
  ON public.email_preferences FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Email prefs: user manages own"
  ON public.email_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid());
