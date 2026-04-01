-- ═══════════════════════════════════════════════════════════
-- Migration 018: Performance Indexes
-- Composite indexes for common query patterns
-- ═══════════════════════════════════════════════════════════

-- Issues: filter by project + status (most common query)
CREATE INDEX IF NOT EXISTS idx_issues_project_status ON issues(project_id, status);

-- Issues: filter by severity for critical alerts
CREATE INDEX IF NOT EXISTS idx_issues_severity_status ON issues(severity, status) WHERE status != 'CLOSED';

-- Issues: owner lookup for team workload
CREATE INDEX IF NOT EXISTS idx_issues_owner_status ON issues(owner_name, status);

-- Issues: due date for overdue detection
CREATE INDEX IF NOT EXISTS idx_issues_due_date ON issues(due_date) WHERE due_date IS NOT NULL AND status != 'CLOSED';

-- Gate conditions: project + phase lookup
CREATE INDEX IF NOT EXISTS idx_gate_conditions_project_phase ON gate_conditions(project_id, phase);

-- Notifications: user + read status (inbox query)
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- Audit logs: timestamp for recent activity
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(created_at DESC);

-- Orders: project + status
CREATE INDEX IF NOT EXISTS idx_orders_project_status ON orders(project_id, status);

-- Production orders: project + status
CREATE INDEX IF NOT EXISTS idx_production_project_status ON production_orders(project_id, status);

-- Inventory: stock alerts (low/critical)
CREATE INDEX IF NOT EXISTS idx_inventory_stock ON inventory(quantity_on_hand, min_stock) WHERE quantity_on_hand <= min_stock;

-- BOM parts: project hierarchy
CREATE INDEX IF NOT EXISTS idx_bom_project_parent ON bom_parts(project_id, parent_id);

-- Flight tests: project + date
CREATE INDEX IF NOT EXISTS idx_flights_project_date ON flight_tests(project_id, date DESC);

-- Comments: issue lookup
CREATE INDEX IF NOT EXISTS idx_comments_issue_created ON issue_comments(issue_id, created_at);

-- Attachments: entity lookup
CREATE INDEX IF NOT EXISTS idx_attachments_entity ON file_attachments(entity_type, entity_id);

-- Approval requests: status for pending queue
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approval_requests(status) WHERE status = 'PENDING';
