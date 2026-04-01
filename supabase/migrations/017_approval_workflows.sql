-- ═══════════════════════════════════════════════════════════
-- Migration 017: Approval Workflow Engine
-- ═══════════════════════════════════════════════════════════

-- Workflow templates (e.g., "Gate Transition", "Issue Closure")
CREATE TABLE IF NOT EXISTS approval_workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_vi TEXT,
  trigger_type TEXT NOT NULL,  -- 'gate_transition', 'issue_closure', 'phase_change', 'custom'
  is_active BOOLEAN DEFAULT true,
  require_all BOOLEAN DEFAULT true,  -- true = all must approve, false = any one
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Steps within a workflow (ordered by step_order)
CREATE TABLE IF NOT EXISTS approval_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  role TEXT NOT NULL,           -- 'admin', 'pm', or specific user ID
  label TEXT NOT NULL,
  label_vi TEXT,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Approval requests (instances of a workflow running)
CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES approval_workflows(id),
  entity_type TEXT NOT NULL,   -- 'gate', 'issue', 'phase'
  entity_id TEXT NOT NULL,
  project_id TEXT,
  requested_by UUID REFERENCES auth.users(id),
  requested_by_name TEXT,
  status TEXT DEFAULT 'PENDING',  -- PENDING, APPROVED, REJECTED, CANCELLED
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Individual approvals within a request
CREATE TABLE IF NOT EXISTS approval_decisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES approval_steps(id),
  approver_id UUID REFERENCES auth.users(id),
  approver_name TEXT,
  decision TEXT,  -- 'APPROVED', 'REJECTED', null (pending)
  comment TEXT,
  decided_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_approval_requests_entity ON approval_requests(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_decisions_request ON approval_decisions(request_id);

-- RLS
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read workflows" ON approval_workflows FOR SELECT USING (true);
CREATE POLICY "Admins can manage workflows" ON approval_workflows FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Anyone can read steps" ON approval_steps FOR SELECT USING (true);
CREATE POLICY "Admins can manage steps" ON approval_steps FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Anyone can read requests" ON approval_requests FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create requests" ON approval_requests FOR INSERT WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Anyone can read decisions" ON approval_decisions FOR SELECT USING (true);
CREATE POLICY "Approvers can decide" ON approval_decisions FOR UPDATE USING (auth.uid() = approver_id);

-- Seed default workflows
INSERT INTO approval_workflows (id, name, name_vi, trigger_type) VALUES
  ('wf-gate-01', 'Gate Transition Approval', 'Phê duyệt chuyển giai đoạn', 'gate_transition'),
  ('wf-close-01', 'Issue Closure Approval', 'Phê duyệt đóng vấn đề', 'issue_closure')
ON CONFLICT DO NOTHING;

INSERT INTO approval_steps (workflow_id, step_order, role, label, label_vi, is_required) VALUES
  ('wf-gate-01', 1, 'pm', 'Project Manager Review', 'PM xem xét', true),
  ('wf-gate-01', 2, 'admin', 'Director Approval', 'Giám đốc phê duyệt', true),
  ('wf-close-01', 1, 'pm', 'PM Verification', 'PM xác minh', true)
ON CONFLICT DO NOTHING;
