-- ═══════════════════════════════════════════════════════════
-- MIGRATION 002: Issues & Gates
-- ═══════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────
-- 5. ISSUES
-- ──────────────────────────────────────────────
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

-- ──────────────────────────────────────────────
-- 6. ISSUE IMPACTS (cascade delays)
-- ──────────────────────────────────────────────
CREATE TABLE public.issue_impacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id TEXT NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  affected_phase TEXT NOT NULL,
  delay_weeks INTEGER DEFAULT 0,
  description TEXT,
  description_vi TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- 7. ISSUE ACTIVITY LOG
-- ──────────────────────────────────────────────
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

-- ──────────────────────────────────────────────
-- 8. GATE CONDITIONS
-- ──────────────────────────────────────────────
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
