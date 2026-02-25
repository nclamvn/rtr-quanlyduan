-- ═══════════════════════════════════════════════════════════
-- RtR Control Tower — Post-Auth Seed Data
-- Run AFTER creating 15 users in Supabase Auth
-- AND running migration 007 (update_user_roles)
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- 1. PROJECT_MEMBERS
-- Maps team members to projects using profiles.email lookup
-- ═══════════════════════════════════════════════════════════
INSERT INTO project_members (project_id, user_id, role_in_project)

-- PRJ-001: RTR-X7 Surveyor
SELECT 'PRJ-001', id, 'lead' FROM profiles WHERE email = 'minhtuan@rtr.vn'
UNION ALL SELECT 'PRJ-001', id, 'member' FROM profiles WHERE email = 'ducanh@rtr.vn'
UNION ALL SELECT 'PRJ-001', id, 'member' FROM profiles WHERE email = 'thanhha@rtr.vn'
UNION ALL SELECT 'PRJ-001', id, 'member' FROM profiles WHERE email = 'vanhung@rtr.vn'
UNION ALL SELECT 'PRJ-001', id, 'member' FROM profiles WHERE email = 'dinhtoan@rtr.vn'
UNION ALL SELECT 'PRJ-001', id, 'member' FROM profiles WHERE email = 'quocviet@rtr.vn'
UNION ALL SELECT 'PRJ-001', id, 'admin' FROM profiles WHERE email = 'quynhanh@rtr.vn'

-- PRJ-002: RTR-A3 Agri Sprayer
UNION ALL SELECT 'PRJ-002', id, 'lead' FROM profiles WHERE email = 'hongphuc@rtr.vn'
UNION ALL SELECT 'PRJ-002', id, 'member' FROM profiles WHERE email = 'vanhung@rtr.vn'
UNION ALL SELECT 'PRJ-002', id, 'member' FROM profiles WHERE email = 'hoangson@rtr.vn'
UNION ALL SELECT 'PRJ-002', id, 'admin' FROM profiles WHERE email = 'quynhanh@rtr.vn'

-- PRJ-003: RTR-D1 Delivery
UNION ALL SELECT 'PRJ-003', id, 'lead' FROM profiles WHERE email = 'quynhanh@rtr.vn'
UNION ALL SELECT 'PRJ-003', id, 'member' FROM profiles WHERE email = 'minhkhoa@rtr.vn'
UNION ALL SELECT 'PRJ-003', id, 'member' FROM profiles WHERE email = 'hainam@rtr.vn'
UNION ALL SELECT 'PRJ-003', id, 'member' FROM profiles WHERE email = 'quocviet@rtr.vn'

-- PRJ-004: RTR-I2 Inspector
UNION ALL SELECT 'PRJ-004', id, 'lead' FROM profiles WHERE email = 'thutrang@rtr.vn'
UNION ALL SELECT 'PRJ-004', id, 'member' FROM profiles WHERE email = 'thiphuong@rtr.vn'
UNION ALL SELECT 'PRJ-004', id, 'member' FROM profiles WHERE email = 'dinhtoan@rtr.vn'

-- PRJ-005: RTR-M3 Mapper
UNION ALL SELECT 'PRJ-005', id, 'lead' FROM profiles WHERE email = 'thutrang@rtr.vn'
UNION ALL SELECT 'PRJ-005', id, 'member' FROM profiles WHERE email = 'minhkhoa@rtr.vn'
UNION ALL SELECT 'PRJ-005', id, 'member' FROM profiles WHERE email = 'hoangson@rtr.vn'

-- Viewers: assigned to all 5 projects
UNION ALL
SELECT p.id, pr.id, 'viewer'
FROM profiles pr
CROSS JOIN projects p
WHERE pr.email IN ('lehuong@rtr.vn', 'thanhmai@rtr.vn')

ON CONFLICT (project_id, user_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- 2. LINK ISSUES TO REAL OWNER UUIDs
-- Updates owner_id from NULL to actual profile UUIDs
-- ═══════════════════════════════════════════════════════════
UPDATE issues SET owner_id = (SELECT id FROM profiles WHERE email = 'ducanh@rtr.vn')
  WHERE owner_name = 'Đức Anh';
UPDATE issues SET owner_id = (SELECT id FROM profiles WHERE email = 'thanhha@rtr.vn')
  WHERE owner_name = 'Thanh Hà';
UPDATE issues SET owner_id = (SELECT id FROM profiles WHERE email = 'vanhung@rtr.vn')
  WHERE owner_name = 'Văn Hùng';
UPDATE issues SET owner_id = (SELECT id FROM profiles WHERE email = 'hongphuc@rtr.vn')
  WHERE owner_name = 'Hồng Phúc';
UPDATE issues SET owner_id = (SELECT id FROM profiles WHERE email = 'thiphuong@rtr.vn')
  WHERE owner_name = 'Lê Thị Phương';
UPDATE issues SET owner_id = (SELECT id FROM profiles WHERE email = 'dinhtoan@rtr.vn')
  WHERE owner_name = 'Vũ Đình Toàn';
UPDATE issues SET owner_id = (SELECT id FROM profiles WHERE email = 'hoangson@rtr.vn')
  WHERE owner_name = 'Đỗ Hoàng Sơn';
UPDATE issues SET owner_id = (SELECT id FROM profiles WHERE email = 'minhkhoa@rtr.vn')
  WHERE owner_name = 'Trần Minh Khoa';
UPDATE issues SET owner_id = (SELECT id FROM profiles WHERE email = 'quocviet@rtr.vn')
  WHERE owner_name = 'Bùi Quốc Việt';
UPDATE issues SET owner_id = (SELECT id FROM profiles WHERE email = 'hainam@rtr.vn')
  WHERE owner_name = 'Nguyễn Hải Nam';

-- Bảo Trâm — not in 15 core users, skip (owner_id stays NULL)
-- Trần Minh Khoa mapped to minhkhoa@rtr.vn

-- ═══════════════════════════════════════════════════════════
-- 3. LINK PROJECTS TO REAL PHASE_OWNER UUIDs
-- ═══════════════════════════════════════════════════════════
UPDATE projects SET phase_owner_id = (SELECT id FROM profiles WHERE email = 'minhtuan@rtr.vn')
  WHERE phase_owner_name = 'Minh Tuấn';
UPDATE projects SET phase_owner_id = (SELECT id FROM profiles WHERE email = 'hongphuc@rtr.vn')
  WHERE phase_owner_name = 'Hồng Phúc';
UPDATE projects SET phase_owner_id = (SELECT id FROM profiles WHERE email = 'quynhanh@rtr.vn')
  WHERE phase_owner_name = 'Quỳnh Anh';
UPDATE projects SET phase_owner_id = (SELECT id FROM profiles WHERE email = 'thutrang@rtr.vn')
  WHERE phase_owner_name = 'Phạm Thu Trang';

-- ═══════════════════════════════════════════════════════════
-- 4. SAMPLE NOTIFICATIONS (for pilot testing)
-- ═══════════════════════════════════════════════════════════
INSERT INTO notifications (user_id, type, title, title_vi, project_id, entity_type, entity_id, is_read, created_at)

-- Quỳnh Anh (admin) — critical alerts
SELECT id, 'CRITICAL_ISSUE_CREATED',
  'New CRITICAL: ESC CAN bus timeout', 'CRITICAL mới: ESC CAN bus timeout',
  'PRJ-001', 'issue', 'ISS-004', false, '2026-02-25 08:00:00+07'
FROM profiles WHERE email = 'quynhanh@rtr.vn'

UNION ALL SELECT id, 'CRITICAL_ISSUE_CREATED',
  'ISS-017: IP67 seal failure (PRJ-004)', 'ISS-017: Lỗi seal IP67 (PRJ-004)',
  'PRJ-004', 'issue', 'ISS-017', false, '2026-02-21 10:00:00+07'
FROM profiles WHERE email = 'quynhanh@rtr.vn'

UNION ALL SELECT id, 'CRITICAL_ISSUE_CREATED',
  'Battery connector overheating (PRJ-002)', 'Đầu nối pin quá nhiệt (PRJ-002)',
  'PRJ-002', 'issue', 'ISS-010', false, '2026-02-25 06:00:00+07'
FROM profiles WHERE email = 'quynhanh@rtr.vn'

-- Minh Tuấn (pm PRJ-001) — project updates
UNION ALL SELECT id, 'CASCADE_DELAY_DETECTED',
  'DVT milestone shifted +2 weeks (PRJ-001)', 'DVT milestone dịch +2 tuần (PRJ-001)',
  'PRJ-001', 'project', 'PRJ-001', false, '2026-02-25 05:00:00+07'
FROM profiles WHERE email = 'minhtuan@rtr.vn'

UNION ALL SELECT id, 'PHASE_TRANSITION',
  'PRJ-004: DVT → PVT completed', 'PRJ-004: DVT → PVT hoàn thành',
  'PRJ-004', 'project', 'PRJ-004', true, '2026-01-11 10:00:00+07'
FROM profiles WHERE email = 'minhtuan@rtr.vn'

UNION ALL SELECT id, 'ISSUE_OVERDUE',
  'ISS-006 overdue by 3 days', 'ISS-006 quá hạn 3 ngày',
  'PRJ-002', 'issue', 'ISS-006', true, '2026-02-24 10:00:00+07'
FROM profiles WHERE email = 'minhtuan@rtr.vn'

-- Đức Anh (engineer) — issue assignments
UNION ALL SELECT id, 'ISSUE_ASSIGNED',
  'ISS-004 assigned to you', 'ISS-004 giao cho bạn',
  'PRJ-001', 'issue', 'ISS-004', false, '2026-02-18 09:00:00+07'
FROM profiles WHERE email = 'ducanh@rtr.vn'

UNION ALL SELECT id, 'ISSUE_OVERDUE',
  'ISS-001 overdue by 3 days', 'ISS-001 quá hạn 3 ngày',
  'PRJ-001', 'issue', 'ISS-001', true, '2026-02-24 10:00:00+07'
FROM profiles WHERE email = 'ducanh@rtr.vn'

-- Phạm Thu Trang (pm PRJ-004) — PVT blocked
UNION ALL SELECT id, 'CRITICAL_ISSUE_CREATED',
  'ISS-017: IP67 seal failure blocks PVT', 'ISS-017: Lỗi seal IP67 chặn PVT',
  'PRJ-004', 'issue', 'ISS-017', false, '2026-02-05 10:00:00+07'
FROM profiles WHERE email = 'thutrang@rtr.vn'

UNION ALL SELECT id, 'CASCADE_DELAY_DETECTED',
  'PRJ-004: PVT +3 weeks cascade', 'PRJ-004: PVT +3 tuần cascade',
  'PRJ-004', 'project', 'PRJ-004', true, '2026-02-21 10:00:00+07'
FROM profiles WHERE email = 'thutrang@rtr.vn'

-- Hồng Phúc (pm PRJ-002) — flight test fail
UNION ALL SELECT id, 'FLIGHT_TEST_FAIL',
  'FLT-010: Stability test FAIL', 'FLT-010: Test ổn định FAIL',
  'PRJ-002', 'flight_test', 'FLT-010', false, '2026-02-05 14:00:00+07'
FROM profiles WHERE email = 'hongphuc@rtr.vn'

UNION ALL SELECT id, 'ISSUE_OVERDUE',
  'ISS-009 pump pressure — testing fix', 'ISS-009 mất áp bơm — đang test sửa',
  'PRJ-002', 'issue', 'ISS-009', false, '2026-02-25 07:00:00+07'
FROM profiles WHERE email = 'hongphuc@rtr.vn'

ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════
SELECT 'project_members' AS "table", COUNT(*) AS row_count FROM project_members
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'issues_with_owner', COUNT(*) FROM issues WHERE owner_id IS NOT NULL
UNION ALL SELECT 'projects_with_owner', COUNT(*) FROM projects WHERE phase_owner_id IS NOT NULL
ORDER BY "table";

-- Expected:
-- project_members:     ~30 (20 named + 10 viewers)
-- notifications:       ~13
-- issues_with_owner:   ~18 (10 owner_names matched)
-- projects_with_owner:  5
