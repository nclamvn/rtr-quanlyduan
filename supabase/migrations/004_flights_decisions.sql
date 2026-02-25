-- ═══════════════════════════════════════════════════════════
-- MIGRATION 004: Flight Tests & Decisions
-- ═══════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────
-- 12. FLIGHT TESTS
-- ──────────────────────────────────────────────
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

-- ──────────────────────────────────────────────
-- 13. FLIGHT TEST ANOMALIES
-- ──────────────────────────────────────────────
CREATE TABLE public.flight_anomalies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flight_test_id TEXT NOT NULL REFERENCES public.flight_tests(id) ON DELETE CASCADE,
  timestamp_seconds INTEGER,
  description TEXT NOT NULL,
  description_vi TEXT,
  severity TEXT CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- 14. FLIGHT TEST ATTACHMENTS
-- ──────────────────────────────────────────────
CREATE TABLE public.flight_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flight_test_id TEXT NOT NULL REFERENCES public.flight_tests(id) ON DELETE CASCADE,
  file_type TEXT CHECK (file_type IN ('VIDEO', 'LOG', 'PHOTO', 'DOCUMENT')),
  file_name TEXT NOT NULL,
  file_url TEXT,
  file_size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- 15. DECISIONS (ADR)
-- ──────────────────────────────────────────────
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
