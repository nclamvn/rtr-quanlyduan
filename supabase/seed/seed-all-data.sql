-- ===================================================================
-- RtR Control Tower — Complete Seed Data
-- Run in Supabase SQL Editor
-- Generated 2026-02-25
-- ===================================================================

-- ===================================================================
-- 1. PROJECTS (5 records)
-- ===================================================================
INSERT INTO projects (id, name, description, description_vi, phase, phase_owner_name, start_date, target_mp, phase_owner_id)
VALUES
  ('PRJ-001', 'RTR-X7 Surveyor', 'Enterprise survey drone with RTK GPS', 'Drone khảo sát doanh nghiệp với RTK GPS', 'DVT', 'Minh Tuấn', '2025-06-01', '2026-06-01', NULL),
  ('PRJ-002', 'RTR-A3 Agri Sprayer', 'Agricultural spraying drone 20L payload', 'Drone phun thuốc nông nghiệp tải 20L', 'EVT', 'Hồng Phúc', '2025-09-01', '2026-09-01', NULL),
  ('PRJ-003', 'RTR-D1 Delivery', 'Urban delivery drone 5kg payload, autonomous landing on rooftop pads', 'Drone giao hàng đô thị tải 5kg, hạ cánh tự động trên sân thượng', 'CONCEPT', 'Quỳnh Anh', '2026-01-15', '2027-06-01', NULL),
  ('PRJ-004', 'RTR-I2 Inspector', 'Industrial inspection drone with thermal camera, LiDAR, and IP67 rating', 'Drone kiểm tra công nghiệp với camera nhiệt, LiDAR, chuẩn IP67', 'PVT', 'Phạm Thu Trang', '2025-03-01', '2026-04-15', NULL),
  ('PRJ-005', 'RTR-M3 Mapper', 'High-precision photogrammetry mapping drone with RTK and oblique camera', 'Drone lập bản đồ trắc địa độ chính xác cao với RTK và camera xiên', 'EVT', 'Phạm Thu Trang', '2025-11-01', '2026-12-01', NULL)
ON CONFLICT (id) DO NOTHING;

-- ===================================================================
-- 2. MILESTONES (25 records = 5 projects x 5 phases)
-- ===================================================================
INSERT INTO milestones (project_id, phase, target_date, actual_date, status)
VALUES
  -- PRJ-001
  ('PRJ-001', 'CONCEPT', '2025-06-30', '2025-06-28', 'DONE'),
  ('PRJ-001', 'EVT', '2025-09-30', '2025-10-15', 'DONE'),
  ('PRJ-001', 'DVT', '2026-01-31', NULL, 'IN_PROGRESS'),
  ('PRJ-001', 'PVT', '2026-04-15', NULL, 'PLANNED'),
  ('PRJ-001', 'MP', '2026-06-01', NULL, 'PLANNED'),
  -- PRJ-002
  ('PRJ-002', 'CONCEPT', '2025-09-30', '2025-09-25', 'DONE'),
  ('PRJ-002', 'EVT', '2026-01-15', NULL, 'IN_PROGRESS'),
  ('PRJ-002', 'DVT', '2026-04-01', NULL, 'PLANNED'),
  ('PRJ-002', 'PVT', '2026-07-01', NULL, 'PLANNED'),
  ('PRJ-002', 'MP', '2026-09-01', NULL, 'PLANNED'),
  -- PRJ-003
  ('PRJ-003', 'CONCEPT', '2026-04-15', NULL, 'IN_PROGRESS'),
  ('PRJ-003', 'EVT', '2026-08-01', NULL, 'PLANNED'),
  ('PRJ-003', 'DVT', '2026-12-01', NULL, 'PLANNED'),
  ('PRJ-003', 'PVT', '2027-03-01', NULL, 'PLANNED'),
  ('PRJ-003', 'MP', '2027-06-01', NULL, 'PLANNED'),
  -- PRJ-004
  ('PRJ-004', 'CONCEPT', '2025-05-01', '2025-04-28', 'DONE'),
  ('PRJ-004', 'EVT', '2025-08-01', '2025-08-15', 'DONE'),
  ('PRJ-004', 'DVT', '2025-12-01', '2026-01-10', 'DONE'),
  ('PRJ-004', 'PVT', '2026-03-01', NULL, 'IN_PROGRESS'),
  ('PRJ-004', 'MP', '2026-04-15', NULL, 'PLANNED'),
  -- PRJ-005
  ('PRJ-005', 'CONCEPT', '2026-01-01', '2025-12-20', 'DONE'),
  ('PRJ-005', 'EVT', '2026-04-01', NULL, 'IN_PROGRESS'),
  ('PRJ-005', 'DVT', '2026-07-01', NULL, 'PLANNED'),
  ('PRJ-005', 'PVT', '2026-10-01', NULL, 'PLANNED'),
  ('PRJ-005', 'MP', '2026-12-01', NULL, 'PLANNED')
ON CONFLICT DO NOTHING;

-- ===================================================================
-- 3. GATE_CONDITIONS (GATE_CONFIG x 5 projects)
-- ===================================================================
INSERT INTO gate_conditions (project_id, phase, label, label_vi, is_required, category, is_checked)
VALUES
  -- PRJ-001 CONCEPT
  ('PRJ-001', 'CONCEPT', 'Product requirements defined', 'Yêu cầu sản phẩm đã xác định', true, 'general', true),
  ('PRJ-001', 'CONCEPT', 'Feasibility study completed', 'Nghiên cứu khả thi hoàn tất', true, 'general', true),
  ('PRJ-001', 'CONCEPT', 'Initial BOM estimated', 'BOM ước lượng ban đầu', false, 'general', true),
  -- PRJ-001 EVT
  ('PRJ-001', 'EVT', 'Schematic review passed', 'Review sơ đồ mạch đạt', true, 'design', true),
  ('PRJ-001', 'EVT', 'PCB layout DRC clean', 'PCB layout DRC sạch', true, 'design', true),
  ('PRJ-001', 'EVT', 'BOM finalized & sourced', 'BOM đã chốt & tìm nguồn', true, 'supply', true),
  ('PRJ-001', 'EVT', 'First power-on successful', 'Bật nguồn lần đầu OK', true, 'test', true),
  ('PRJ-001', 'EVT', 'Basic flight test passed', 'Bay test cơ bản đạt', false, 'test', true),
  -- PRJ-001 DVT
  ('PRJ-001', 'DVT', 'All EVT issues closed', 'Mọi vấn đề EVT đã đóng', true, 'prerequisite', false),
  ('PRJ-001', 'DVT', 'Flight endurance validated', 'Thời gian bay xác nhận', true, 'flight_test', false),
  ('PRJ-001', 'DVT', 'Stability test passed', 'Test ổn định đạt', true, 'flight_test', false),
  ('PRJ-001', 'DVT', 'Thermal test passed', 'Test nhiệt đạt', true, 'env_test', true),
  ('PRJ-001', 'DVT', 'Humidity test passed', 'Test ẩm đạt', true, 'env_test', true),
  ('PRJ-001', 'DVT', 'Dust ingress test passed', 'Test bụi đạt', true, 'env_test', false),
  ('PRJ-001', 'DVT', 'EMC pre-scan passed', 'EMC pre-scan đạt', true, 'emc_test', false),
  ('PRJ-001', 'DVT', 'EMI certification submitted', 'Đã nộp chứng nhận EMI', true, 'emc_test', false),
  ('PRJ-001', 'DVT', 'Drop test passed', 'Test rơi đạt', true, 'mech_test', true),
  ('PRJ-001', 'DVT', 'Vibration test passed', 'Test rung đạt', true, 'mech_test', true),
  ('PRJ-001', 'DVT', 'Design freeze approved', 'Đã phê duyệt đóng băng thiết kế', true, 'prerequisite', false),
  -- PRJ-001 PVT (all unchecked)
  ('PRJ-001', 'PVT', 'All DVT issues closed', 'Mọi vấn đề DVT đã đóng', true, 'prerequisite', false),
  ('PRJ-001', 'PVT', 'Production line validated', 'Dây chuyền sản xuất đã xác nhận', true, 'production', false),
  ('PRJ-001', 'PVT', 'QC process documented', 'Quy trình QC đã tài liệu hóa', true, 'production', false),
  ('PRJ-001', 'PVT', 'Yield > 95%', 'Yield > 95%', true, 'production', false),
  ('PRJ-001', 'PVT', 'Regulatory certification', 'Chứng nhận pháp quy', true, 'compliance', false),
  -- PRJ-001 MP (all unchecked)
  ('PRJ-001', 'MP', 'All PVT issues closed', 'Mọi vấn đề PVT đã đóng', true, 'prerequisite', false),
  ('PRJ-001', 'MP', 'Mass production BOM locked', 'BOM sản xuất hàng loạt đã khóa', true, 'production', false),
  ('PRJ-001', 'MP', 'Supply chain confirmed', 'Chuỗi cung ứng đã xác nhận', true, 'supply', false),

  -- PRJ-002 CONCEPT
  ('PRJ-002', 'CONCEPT', 'Product requirements defined', 'Yêu cầu sản phẩm đã xác định', true, 'general', true),
  ('PRJ-002', 'CONCEPT', 'Feasibility study completed', 'Nghiên cứu khả thi hoàn tất', true, 'general', true),
  ('PRJ-002', 'CONCEPT', 'Initial BOM estimated', 'BOM ước lượng ban đầu', false, 'general', true),
  -- PRJ-002 EVT
  ('PRJ-002', 'EVT', 'Schematic review passed', 'Review sơ đồ mạch đạt', true, 'design', true),
  ('PRJ-002', 'EVT', 'PCB layout DRC clean', 'PCB layout DRC sạch', true, 'design', true),
  ('PRJ-002', 'EVT', 'BOM finalized & sourced', 'BOM đã chốt & tìm nguồn', true, 'supply', false),
  ('PRJ-002', 'EVT', 'First power-on successful', 'Bật nguồn lần đầu OK', true, 'test', false),
  ('PRJ-002', 'EVT', 'Basic flight test passed', 'Bay test cơ bản đạt', false, 'test', false),
  -- PRJ-002 DVT (all unchecked)
  ('PRJ-002', 'DVT', 'All EVT issues closed', 'Mọi vấn đề EVT đã đóng', true, 'prerequisite', false),
  ('PRJ-002', 'DVT', 'Flight endurance validated', 'Thời gian bay xác nhận', true, 'flight_test', false),
  ('PRJ-002', 'DVT', 'Stability test passed', 'Test ổn định đạt', true, 'flight_test', false),
  ('PRJ-002', 'DVT', 'Thermal test passed', 'Test nhiệt đạt', true, 'env_test', false),
  ('PRJ-002', 'DVT', 'Humidity test passed', 'Test ẩm đạt', true, 'env_test', false),
  ('PRJ-002', 'DVT', 'Dust ingress test passed', 'Test bụi đạt', true, 'env_test', false),
  ('PRJ-002', 'DVT', 'EMC pre-scan passed', 'EMC pre-scan đạt', true, 'emc_test', false),
  ('PRJ-002', 'DVT', 'EMI certification submitted', 'Đã nộp chứng nhận EMI', true, 'emc_test', false),
  ('PRJ-002', 'DVT', 'Drop test passed', 'Test rơi đạt', true, 'mech_test', false),
  ('PRJ-002', 'DVT', 'Vibration test passed', 'Test rung đạt', true, 'mech_test', false),
  ('PRJ-002', 'DVT', 'Design freeze approved', 'Đã phê duyệt đóng băng thiết kế', true, 'prerequisite', false),
  -- PRJ-002 PVT (all unchecked)
  ('PRJ-002', 'PVT', 'All DVT issues closed', 'Mọi vấn đề DVT đã đóng', true, 'prerequisite', false),
  ('PRJ-002', 'PVT', 'Production line validated', 'Dây chuyền sản xuất đã xác nhận', true, 'production', false),
  ('PRJ-002', 'PVT', 'QC process documented', 'Quy trình QC đã tài liệu hóa', true, 'production', false),
  ('PRJ-002', 'PVT', 'Yield > 95%', 'Yield > 95%', true, 'production', false),
  ('PRJ-002', 'PVT', 'Regulatory certification', 'Chứng nhận pháp quy', true, 'compliance', false),
  -- PRJ-002 MP (all unchecked)
  ('PRJ-002', 'MP', 'All PVT issues closed', 'Mọi vấn đề PVT đã đóng', true, 'prerequisite', false),
  ('PRJ-002', 'MP', 'Mass production BOM locked', 'BOM sản xuất hàng loạt đã khóa', true, 'production', false),
  ('PRJ-002', 'MP', 'Supply chain confirmed', 'Chuỗi cung ứng đã xác nhận', true, 'supply', false),

  -- PRJ-003 CONCEPT
  ('PRJ-003', 'CONCEPT', 'Product requirements defined', 'Yêu cầu sản phẩm đã xác định', true, 'general', true),
  ('PRJ-003', 'CONCEPT', 'Feasibility study completed', 'Nghiên cứu khả thi hoàn tất', true, 'general', true),
  ('PRJ-003', 'CONCEPT', 'Initial BOM estimated', 'BOM ước lượng ban đầu', false, 'general', false),
  -- PRJ-003 EVT (all unchecked)
  ('PRJ-003', 'EVT', 'Schematic review passed', 'Review sơ đồ mạch đạt', true, 'design', false),
  ('PRJ-003', 'EVT', 'PCB layout DRC clean', 'PCB layout DRC sạch', true, 'design', false),
  ('PRJ-003', 'EVT', 'BOM finalized & sourced', 'BOM đã chốt & tìm nguồn', true, 'supply', false),
  ('PRJ-003', 'EVT', 'First power-on successful', 'Bật nguồn lần đầu OK', true, 'test', false),
  ('PRJ-003', 'EVT', 'Basic flight test passed', 'Bay test cơ bản đạt', false, 'test', false),
  -- PRJ-003 DVT (all unchecked)
  ('PRJ-003', 'DVT', 'All EVT issues closed', 'Mọi vấn đề EVT đã đóng', true, 'prerequisite', false),
  ('PRJ-003', 'DVT', 'Flight endurance validated', 'Thời gian bay xác nhận', true, 'flight_test', false),
  ('PRJ-003', 'DVT', 'Stability test passed', 'Test ổn định đạt', true, 'flight_test', false),
  ('PRJ-003', 'DVT', 'Thermal test passed', 'Test nhiệt đạt', true, 'env_test', false),
  ('PRJ-003', 'DVT', 'Humidity test passed', 'Test ẩm đạt', true, 'env_test', false),
  ('PRJ-003', 'DVT', 'Dust ingress test passed', 'Test bụi đạt', true, 'env_test', false),
  ('PRJ-003', 'DVT', 'EMC pre-scan passed', 'EMC pre-scan đạt', true, 'emc_test', false),
  ('PRJ-003', 'DVT', 'EMI certification submitted', 'Đã nộp chứng nhận EMI', true, 'emc_test', false),
  ('PRJ-003', 'DVT', 'Drop test passed', 'Test rơi đạt', true, 'mech_test', false),
  ('PRJ-003', 'DVT', 'Vibration test passed', 'Test rung đạt', true, 'mech_test', false),
  ('PRJ-003', 'DVT', 'Design freeze approved', 'Đã phê duyệt đóng băng thiết kế', true, 'prerequisite', false),
  -- PRJ-003 PVT (all unchecked)
  ('PRJ-003', 'PVT', 'All DVT issues closed', 'Mọi vấn đề DVT đã đóng', true, 'prerequisite', false),
  ('PRJ-003', 'PVT', 'Production line validated', 'Dây chuyền sản xuất đã xác nhận', true, 'production', false),
  ('PRJ-003', 'PVT', 'QC process documented', 'Quy trình QC đã tài liệu hóa', true, 'production', false),
  ('PRJ-003', 'PVT', 'Yield > 95%', 'Yield > 95%', true, 'production', false),
  ('PRJ-003', 'PVT', 'Regulatory certification', 'Chứng nhận pháp quy', true, 'compliance', false),
  -- PRJ-003 MP (all unchecked)
  ('PRJ-003', 'MP', 'All PVT issues closed', 'Mọi vấn đề PVT đã đóng', true, 'prerequisite', false),
  ('PRJ-003', 'MP', 'Mass production BOM locked', 'BOM sản xuất hàng loạt đã khóa', true, 'production', false),
  ('PRJ-003', 'MP', 'Supply chain confirmed', 'Chuỗi cung ứng đã xác nhận', true, 'supply', false),

  -- PRJ-004 CONCEPT
  ('PRJ-004', 'CONCEPT', 'Product requirements defined', 'Yêu cầu sản phẩm đã xác định', true, 'general', true),
  ('PRJ-004', 'CONCEPT', 'Feasibility study completed', 'Nghiên cứu khả thi hoàn tất', true, 'general', true),
  ('PRJ-004', 'CONCEPT', 'Initial BOM estimated', 'BOM ước lượng ban đầu', false, 'general', true),
  -- PRJ-004 EVT
  ('PRJ-004', 'EVT', 'Schematic review passed', 'Review sơ đồ mạch đạt', true, 'design', true),
  ('PRJ-004', 'EVT', 'PCB layout DRC clean', 'PCB layout DRC sạch', true, 'design', true),
  ('PRJ-004', 'EVT', 'BOM finalized & sourced', 'BOM đã chốt & tìm nguồn', true, 'supply', true),
  ('PRJ-004', 'EVT', 'First power-on successful', 'Bật nguồn lần đầu OK', true, 'test', true),
  ('PRJ-004', 'EVT', 'Basic flight test passed', 'Bay test cơ bản đạt', false, 'test', true),
  -- PRJ-004 DVT (all checked)
  ('PRJ-004', 'DVT', 'All EVT issues closed', 'Mọi vấn đề EVT đã đóng', true, 'prerequisite', true),
  ('PRJ-004', 'DVT', 'Flight endurance validated', 'Thời gian bay xác nhận', true, 'flight_test', true),
  ('PRJ-004', 'DVT', 'Stability test passed', 'Test ổn định đạt', true, 'flight_test', true),
  ('PRJ-004', 'DVT', 'Thermal test passed', 'Test nhiệt đạt', true, 'env_test', true),
  ('PRJ-004', 'DVT', 'Humidity test passed', 'Test ẩm đạt', true, 'env_test', true),
  ('PRJ-004', 'DVT', 'Dust ingress test passed', 'Test bụi đạt', true, 'env_test', true),
  ('PRJ-004', 'DVT', 'EMC pre-scan passed', 'EMC pre-scan đạt', true, 'emc_test', true),
  ('PRJ-004', 'DVT', 'EMI certification submitted', 'Đã nộp chứng nhận EMI', true, 'emc_test', true),
  ('PRJ-004', 'DVT', 'Drop test passed', 'Test rơi đạt', true, 'mech_test', true),
  ('PRJ-004', 'DVT', 'Vibration test passed', 'Test rung đạt', true, 'mech_test', true),
  ('PRJ-004', 'DVT', 'Design freeze approved', 'Đã phê duyệt đóng băng thiết kế', true, 'prerequisite', true),
  -- PRJ-004 PVT (p1=true, p2=true, p3-p5=false)
  ('PRJ-004', 'PVT', 'All DVT issues closed', 'Mọi vấn đề DVT đã đóng', true, 'prerequisite', true),
  ('PRJ-004', 'PVT', 'Production line validated', 'Dây chuyền sản xuất đã xác nhận', true, 'production', true),
  ('PRJ-004', 'PVT', 'QC process documented', 'Quy trình QC đã tài liệu hóa', true, 'production', false),
  ('PRJ-004', 'PVT', 'Yield > 95%', 'Yield > 95%', true, 'production', false),
  ('PRJ-004', 'PVT', 'Regulatory certification', 'Chứng nhận pháp quy', true, 'compliance', false),
  -- PRJ-004 MP (all unchecked)
  ('PRJ-004', 'MP', 'All PVT issues closed', 'Mọi vấn đề PVT đã đóng', true, 'prerequisite', false),
  ('PRJ-004', 'MP', 'Mass production BOM locked', 'BOM sản xuất hàng loạt đã khóa', true, 'production', false),
  ('PRJ-004', 'MP', 'Supply chain confirmed', 'Chuỗi cung ứng đã xác nhận', true, 'supply', false),

  -- PRJ-005 CONCEPT
  ('PRJ-005', 'CONCEPT', 'Product requirements defined', 'Yêu cầu sản phẩm đã xác định', true, 'general', true),
  ('PRJ-005', 'CONCEPT', 'Feasibility study completed', 'Nghiên cứu khả thi hoàn tất', true, 'general', true),
  ('PRJ-005', 'CONCEPT', 'Initial BOM estimated', 'BOM ước lượng ban đầu', false, 'general', true),
  -- PRJ-005 EVT
  ('PRJ-005', 'EVT', 'Schematic review passed', 'Review sơ đồ mạch đạt', true, 'design', true),
  ('PRJ-005', 'EVT', 'PCB layout DRC clean', 'PCB layout DRC sạch', true, 'design', true),
  ('PRJ-005', 'EVT', 'BOM finalized & sourced', 'BOM đã chốt & tìm nguồn', true, 'supply', false),
  ('PRJ-005', 'EVT', 'First power-on successful', 'Bật nguồn lần đầu OK', true, 'test', true),
  ('PRJ-005', 'EVT', 'Basic flight test passed', 'Bay test cơ bản đạt', false, 'test', false),
  -- PRJ-005 DVT (all unchecked)
  ('PRJ-005', 'DVT', 'All EVT issues closed', 'Mọi vấn đề EVT đã đóng', true, 'prerequisite', false),
  ('PRJ-005', 'DVT', 'Flight endurance validated', 'Thời gian bay xác nhận', true, 'flight_test', false),
  ('PRJ-005', 'DVT', 'Stability test passed', 'Test ổn định đạt', true, 'flight_test', false),
  ('PRJ-005', 'DVT', 'Thermal test passed', 'Test nhiệt đạt', true, 'env_test', false),
  ('PRJ-005', 'DVT', 'Humidity test passed', 'Test ẩm đạt', true, 'env_test', false),
  ('PRJ-005', 'DVT', 'Dust ingress test passed', 'Test bụi đạt', true, 'env_test', false),
  ('PRJ-005', 'DVT', 'EMC pre-scan passed', 'EMC pre-scan đạt', true, 'emc_test', false),
  ('PRJ-005', 'DVT', 'EMI certification submitted', 'Đã nộp chứng nhận EMI', true, 'emc_test', false),
  ('PRJ-005', 'DVT', 'Drop test passed', 'Test rơi đạt', true, 'mech_test', false),
  ('PRJ-005', 'DVT', 'Vibration test passed', 'Test rung đạt', true, 'mech_test', false),
  ('PRJ-005', 'DVT', 'Design freeze approved', 'Đã phê duyệt đóng băng thiết kế', true, 'prerequisite', false),
  -- PRJ-005 PVT (all unchecked)
  ('PRJ-005', 'PVT', 'All DVT issues closed', 'Mọi vấn đề DVT đã đóng', true, 'prerequisite', false),
  ('PRJ-005', 'PVT', 'Production line validated', 'Dây chuyền sản xuất đã xác nhận', true, 'production', false),
  ('PRJ-005', 'PVT', 'QC process documented', 'Quy trình QC đã tài liệu hóa', true, 'production', false),
  ('PRJ-005', 'PVT', 'Yield > 95%', 'Yield > 95%', true, 'production', false),
  ('PRJ-005', 'PVT', 'Regulatory certification', 'Chứng nhận pháp quy', true, 'compliance', false),
  -- PRJ-005 MP (all unchecked)
  ('PRJ-005', 'MP', 'All PVT issues closed', 'Mọi vấn đề PVT đã đóng', true, 'prerequisite', false),
  ('PRJ-005', 'MP', 'Mass production BOM locked', 'BOM sản xuất hàng loạt đã khóa', true, 'production', false),
  ('PRJ-005', 'MP', 'Supply chain confirmed', 'Chuỗi cung ứng đã xác nhận', true, 'supply', false)
ON CONFLICT DO NOTHING;

-- ===================================================================
-- 4. SUPPLIERS (8 records)
-- ===================================================================
INSERT INTO suppliers (id, code, name, name_vi, country, contact_name, contact_email, contact_phone, website, quality_rating, delivery_on_time_rate, total_orders, late_deliveries, defect_rate, qualification_status, certifications, last_audit_date, next_audit_date, payment_terms, currency)
VALUES
  ('SUP-001', 'ACM', 'ACM Composites Ltd.', 'Cty TNHH ACM Composites', 'VN', 'Nguyễn Văn Bình', 'binh@acm.vn', '+84 28 1234 5678', 'https://acm-composites.vn', 4.2, 87, 12, 2, 1.5, 'QUALIFIED', ARRAY['ISO 9001', 'IATF 16949'], '2025-11-15', '2026-05-15', 'Net 30', 'VND'),
  ('SUP-002', 'DJX', 'DJX Motor Technology', 'Cty CP DJX Motor', 'VN', 'Trần Minh Đức', 'duc@djxmotor.vn', '+84 28 2345 6789', 'https://djxmotor.vn', 4.5, 93, 18, 1, 0.8, 'QUALIFIED', ARRAY['ISO 9001', 'UL'], '2025-12-01', '2026-06-01', 'Net 45', 'USD'),
  ('SUP-003', 'SZE', 'SZ Electronics Co.', 'Cty SZ Electronics', 'CN', 'Li Wei', 'liwei@sze.cn', '+86 755 1234 5678', 'https://sze-electronics.cn', 3.8, 78, 24, 5, 2.3, 'PROBATION', ARRAY['ISO 9001'], '2025-09-20', '2026-03-20', 'Net 30', 'USD'),
  ('SUP-004', 'RBR', 'RBR Vietnam Rubber', 'Cty TNHH RBR Cao Su VN', 'VN', 'Phạm Thị Lan', 'lan@rbr.vn', '+84 28 3456 7890', 'https://rbr-vietnam.vn', 4.0, 95, 8, 0, 1.0, 'QUALIFIED', ARRAY['ISO 9001'], '2025-10-10', '2026-04-10', 'Net 15', 'VND'),
  ('SUP-005', 'UBX', 'u-blox AG (Distributor VN)', 'u-blox AG (NPP Việt Nam)', 'CH', 'Nguyễn Hoàng Sơn', 'son@ublox-vn.com', '+84 28 4567 8901', 'https://ublox.com', 4.8, 91, 6, 1, 0.2, 'QUALIFIED', ARRAY['ISO 9001', 'ISO 14001', 'IATF 16949'], '2025-08-01', '2026-08-01', 'Net 60', 'USD'),
  ('SUP-006', 'SAT', 'Shenzhen AeroTech Co., Ltd.', 'Công ty TNHH Shenzhen AeroTech', 'CN', 'David Chen (陈大伟)', 'david.chen@szaerotech.cn', '+86 755 8832 4567', 'https://szaerotech.cn', 3.8, 72, 18, 5, 3.2, 'PROBATION', ARRAY['ISO 9001'], '2025-09-10', '2026-03-10', 'TT 50/50', 'USD'),
  ('SUP-007', 'NNX', 'Nông Nghiệp Xanh JSC', 'CTCP Nông Nghiệp Xanh', 'VN', 'Trần Văn Đạt', 'dat.tv@nongxanh.vn', '+84 28 6262 7890', 'https://nongxanh.vn', 4.5, 95, 8, 0, 0.5, 'QUALIFIED', ARRAY['ISO 9001', 'VietGAP Compatible'], '2025-12-01', '2026-06-01', 'Net 30', 'VND'),
  ('SUP-008', 'FLR', 'FLIR Systems Vietnam LLC', 'Công ty TNHH FLIR Systems Việt Nam', 'VN', 'Nguyễn Hoàng Minh', 'hminh@flir.com', '+84 28 3822 5678', 'https://flir.com', 4.8, 90, 6, 1, 0.2, 'QUALIFIED', ARRAY['ISO 9001', 'ISO 14001', 'ITAR Exempt (Lepton)'], '2025-10-15', '2026-04-15', 'Net 45', 'USD')
ON CONFLICT (id) DO NOTHING;

-- ===================================================================
-- 5. ISSUES (21 records)
-- Note: created_at column omitted — defaults to NOW()
-- ===================================================================
INSERT INTO issues (id, project_id, title, title_vi, description, root_cause, status, severity, source, owner_name, phase, due_date, owner_id)
VALUES
  ('ISS-001', 'PRJ-001', 'FC board brownout during high-G maneuver', 'Board FC mất nguồn khi cơ động G cao', 'Flight controller loses power during aggressive banking at >2G', 'Voltage regulator insufficient current capacity under transient load', 'IN_PROGRESS', 'CRITICAL', 'INTERNAL', 'Đức Anh', 'DVT', '2026-02-28', NULL),
  ('ISS-002', 'PRJ-001', 'GPS module cold start >45s', 'Module GPS khởi động lạnh >45 giây', 'RTK GPS takes too long for first fix in cold conditions', 'Antenna placement near motor EMI source', 'OPEN', 'HIGH', 'CROSS_TEAM', 'Thanh Hà', 'DVT', '2026-03-10', NULL),
  ('ISS-003', 'PRJ-001', 'Battery connector arcing', 'Đầu nối pin phóng tia lửa', 'XT60 connector arcing after 50 connect cycles', 'Contact resistance increasing due to plating wear', 'CLOSED', 'MEDIUM', 'EXTERNAL', 'Văn Hùng', 'EVT', '2025-10-25', NULL),
  ('ISS-004', 'PRJ-001', 'ESC firmware CAN bus timeout', 'ESC firmware CAN bus hết thời gian', 'CAN messages from ESC #4 drop intermittently', 'Pending investigation', 'OPEN', 'CRITICAL', 'INTERNAL', 'Đức Anh', 'DVT', '2026-03-05', NULL),
  ('ISS-005', 'PRJ-001', 'Thermal throttling at 45°C ambient', 'Giảm hiệu năng nhiệt ở 45°C', 'Processor thermal throttles in hot climate conditions', 'Heat sink undersized for tropical operation', 'DRAFT', 'HIGH', 'INTERNAL', 'Đức Anh', 'DVT', '2026-03-15', NULL),
  ('ISS-006', 'PRJ-002', 'Spray nozzle clogging at low flow', 'Vòi phun tắc ở lưu lượng thấp', 'Nozzle clogs when flow rate drops below 0.5L/min', 'Nozzle mesh filter too fine for pesticide viscosity', 'IN_PROGRESS', 'HIGH', 'EXTERNAL', 'Bảo Trâm', 'EVT', '2026-02-28', NULL),
  ('ISS-007', 'PRJ-002', 'Frame vibration at 40% throttle resonance', 'Khung rung cộng hưởng ở 40% ga', 'Structural resonance causes excessive vibration', 'Motor mount natural frequency matches prop RPM at 40%', 'BLOCKED', 'HIGH', 'INTERNAL', 'Hồng Phúc', 'EVT', '2026-03-01', NULL),
  ('ISS-008', 'PRJ-002', 'Radar altimeter drift at low altitude', 'Cao kế radar trôi ở độ cao thấp', 'Terrain-following radar shows 30cm drift at <3m altitude over vegetation', 'Radar signal scatter on dense crop canopy', 'OPEN', 'MEDIUM', 'INTERNAL', 'Bảo Trâm', 'EVT', '2026-03-15', NULL),
  ('ISS-009', 'PRJ-002', 'Pump pressure loss after 10min continuous spray', 'Bơm mất áp sau 10 phút phun liên tục', 'Diaphragm pump output drops 20% after sustained operation', 'Diaphragm fatigue under continuous chemical exposure', 'IN_PROGRESS', 'HIGH', 'EXTERNAL', 'Bảo Trâm', 'EVT', '2026-03-10', NULL),
  ('ISS-010', 'PRJ-002', 'Battery connector overheating at 60A continuous', 'Đầu nối pin quá nhiệt ở 60A liên tục', 'XT90 connector reaches 85°C after 8 minutes at full load', 'Connector rated for 90A peak but only 60A continuous', 'OPEN', 'CRITICAL', 'INTERNAL', 'Văn Hùng', 'EVT', '2026-03-05', NULL),
  ('ISS-011', 'PRJ-001', 'Telemetry radio 915MHz EOL replacement', 'Thay thế radio telemetry 915MHz EOL', 'Current telemetry module TELEM-915 has been marked EOL by manufacturer', 'Component end-of-life, manufacturer discontinued', 'OPEN', 'MEDIUM', 'EXTERNAL', 'Thanh Hà', 'DVT', '2026-03-20', NULL),
  ('ISS-012', 'PRJ-003', 'Payload release mechanism design review needed', 'Cần review thiết kế cơ cấu thả hàng', 'Three payload release mechanisms identified. Electromagnetic is simplest but limited to ferrous containers. Servo-actuated hook is most versatile. Need weight/reliability trade study.', 'Multiple release mechanism options (electromagnetic, servo, pneumatic) need trade study before EVT', 'DRAFT', 'LOW', 'INTERNAL', 'Trần Minh Khoa', 'CONCEPT', '2026-03-15', NULL),
  ('ISS-013', 'PRJ-003', 'Urban GPS multipath interference study required', 'Cần nghiên cứu nhiễu GPS đa đường trong đô thị', 'Delivery drone must land autonomously on rooftop pads in urban environment. Standard GPS insufficient. Need RTK + visual landing system study.', 'Urban canyon environment causes GPS multipath errors up to 5m, exceeding landing pad accuracy requirement of 0.5m', 'OPEN', 'HIGH', 'CROSS_TEAM', 'Nguyễn Hải Nam', 'CONCEPT', '2026-04-01', NULL),
  ('ISS-014', 'PRJ-003', 'Noise regulation compliance for urban operation', 'Tuân thủ quy định tiếng ồn cho bay đô thị', 'Need to establish noise targets before propulsion system design freeze. Current estimate: 72dBA at 10m. Target: <65dBA for residential zones.', 'Vietnam noise regulations for urban UAV operations unclear. EU drone noise standard (EN 4709-005) may apply for export market.', 'OPEN', 'MEDIUM', 'EXTERNAL', 'Bùi Quốc Việt', 'CONCEPT', '2026-03-30', NULL),
  ('ISS-015', 'PRJ-004', 'Thermal camera calibration drift after 1hr continuous operation', 'Camera nhiệt bị lệch hiệu chuẩn sau 1 giờ hoạt động liên tục', 'During PVT field trials, thermal camera accuracy degrades from ±2°C to ±8°C after 60 minutes of continuous capture. FLIR confirmed known issue.', 'FLIR Lepton 3.5 module internal NUC fails to compensate after prolonged use in ambient >35°C', 'IN_PROGRESS', 'HIGH', 'EXTERNAL', 'Lê Thị Phương', 'PVT', '2026-03-10', NULL),
  ('ISS-016', 'PRJ-004', 'LiDAR point cloud processing latency exceeds real-time requirement', 'Độ trễ xử lý point cloud LiDAR vượt yêu cầu real-time', 'Current processing latency: 180ms. Requirement: <100ms for real-time obstacle avoidance. Options: reduce point density, upgrade to Jetson Orin Nano, or offload thermal processing.', 'Onboard Jetson Nano cannot process 300K points/sec while running obstacle avoidance + thermal overlay simultaneously', 'IN_PROGRESS', 'MEDIUM', 'INTERNAL', 'Vũ Đình Toàn', 'PVT', '2026-03-05', NULL),
  ('ISS-017', 'PRJ-004', 'IP67 seal failure — water ingress at USB-C diagnostic port', 'Seal IP67 lỗi — nước vào cổng USB-C chẩn đoán', 'Critical blocker for PVT sign-off. Industrial inspection drones MUST be IP67. Supplier evaluating silicone vs EPDM gasket materials. Blocked until new gasket samples arrive.', 'USB-C port gasket deforms under thermal cycling (-10°C to 60°C). After 50 cycles, IP67 seal fails at 0.5m submersion test.', 'BLOCKED', 'CRITICAL', 'INTERNAL', 'Lê Thị Phương', 'PVT', '2026-02-28', NULL),
  ('ISS-018', 'PRJ-004', 'Production jig alignment tolerance causes PCB connector stress', 'Dung sai jig sản xuất gây ứng suất connector PCB', 'During PVT batch of 10 units, 3 units had intermittent sensor board connection. Need to redesign jig with better alignment pins or switch to more tolerant connector type.', 'Production assembly jig has ±0.8mm tolerance. FPC connector between main PCB and sensor board requires ±0.3mm alignment.', 'OPEN', 'MEDIUM', 'INTERNAL', 'Vũ Đình Toàn', 'PVT', '2026-03-15', NULL),
  ('ISS-019', 'PRJ-005', 'Camera trigger sync delay >10ms affects photogrammetry accuracy', 'Độ trễ đồng bộ trigger camera >10ms ảnh hưởng độ chính xác trắc địa', 'Photogrammetry mapping requires <5ms trigger sync for cm-level accuracy. Need mid-exposure feedback signal from camera or hardware trigger with deterministic latency.', 'Hot shoe trigger signal has variable latency 8-25ms. At 15m/s cruise speed, 25ms delay = 37.5cm position error per image.', 'OPEN', 'HIGH', 'INTERNAL', 'Đỗ Hoàng Sơn', 'EVT', '2026-03-20', NULL),
  ('ISS-020', 'PRJ-005', 'IMU/GPS time synchronization drift on missions >30 min', 'Trôi đồng bộ thời gian IMU/GPS trong bay dài >30 phút', 'Not critical for standard mapping but affects high-precision corridor surveys. Can be mitigated by PPS-based re-sync every 10 seconds.', 'IMU internal clock drifts 2.5ppm. Over 30-minute mission, accumulated drift = 4.5ms, causing position interpolation error.', 'DRAFT', 'MEDIUM', 'INTERNAL', 'Trần Minh Khoa', 'EVT', '2026-04-01', NULL),
  ('ISS-021', 'PRJ-005', 'SD card write speed insufficient for 4K 60fps raw capture', 'Tốc độ ghi thẻ SD không đủ cho quay RAW 4K 60fps', 'Need to upgrade to V60 or V90 SD card, or switch to CFexpress. Also evaluating NVMe SSD module. Cost impact: $30-80 per unit increase.', 'Current V30 SD card sustained write: 30MB/s. 4K RAW 60fps requires 45MB/s minimum. Frame drops after 90 seconds.', 'OPEN', 'HIGH', 'EXTERNAL', 'Đỗ Hoàng Sơn', 'EVT', '2026-03-15', NULL)
ON CONFLICT (id) DO NOTHING;

-- ===================================================================
-- 6. ISSUE_IMPACTS
-- ===================================================================
INSERT INTO issue_impacts (issue_id, affected_phase, description, description_vi, delay_weeks)
VALUES
  -- ISS-001
  ('ISS-001', 'DVT', 'Delay design freeze by 2 weeks', 'Trì hoãn đóng băng thiết kế 2 tuần', 2),
  ('ISS-001', 'PVT', 'Auto-shift PVT start by 2 weeks', 'PVT tự động dịch 2 tuần', 2),
  -- ISS-002
  ('ISS-002', 'DVT', 'May require PCB respin', 'Có thể cần làm lại PCB', 3),
  -- ISS-004
  ('ISS-004', 'DVT', 'Flight test program halted', 'Chương trình bay test dừng', 2),
  ('ISS-004', 'PVT', 'Cannot proceed without stable CAN', 'Không thể tiến hành nếu CAN chưa ổn', 2),
  -- ISS-005
  ('ISS-005', 'DVT', 'Environmental test may fail', 'Test môi trường có thể fail', 1),
  -- ISS-006
  ('ISS-006', 'EVT', 'Spray system redesign needed', 'Cần thiết kế lại hệ thống phun', 2),
  -- ISS-007
  ('ISS-007', 'EVT', 'Cannot validate flight endurance', 'Không thể xác nhận thời gian bay', 2),
  ('ISS-007', 'DVT', 'May delay DVT entry by 2 weeks', 'Có thể trì hoãn bắt đầu DVT 2 tuần', 2),
  -- ISS-008
  ('ISS-008', 'EVT', 'Spray height inconsistency may affect efficacy', 'Độ cao phun không đều có thể ảnh hưởng hiệu quả', 1),
  -- ISS-009
  ('ISS-009', 'EVT', 'May need pump redesign/upgrade', 'Có thể cần thiết kế lại/nâng cấp bơm', 2),
  -- ISS-010
  ('ISS-010', 'EVT', 'Safety concern, blocks full-load testing', 'Nguy cơ an toàn, chặn test tải đầy', 1),
  ('ISS-010', 'DVT', 'May delay DVT if connector redesign needed', 'Có thể trì hoãn DVT nếu cần thiết kế lại đầu nối', 2),
  -- ISS-011
  ('ISS-011', 'PVT', 'Must validate new telemetry before PVT', 'Phải xác nhận telemetry mới trước PVT', 1),
  -- ISS-013
  ('ISS-013', 'EVT', 'Must resolve before EVT flight tests', 'Phải giải quyết trước khi bay test EVT', 0),
  -- ISS-015
  ('ISS-015', 'PVT', 'Firmware update needed, PVT retest +1 week', 'Cần cập nhật firmware, test lại PVT +1 tuần', 1),
  -- ISS-017
  ('ISS-017', 'PVT', 'PVT sign-off blocked until seal redesign verified', 'Nghiệm thu PVT bị chặn cho đến khi seal mới được xác nhận', 3),
  ('ISS-017', 'MP', 'MP pushed back 3 weeks due to PVT delay', 'MP đẩy lùi 3 tuần do PVT trễ', 3),
  -- ISS-019
  ('ISS-019', 'EVT', 'Camera integration redesign +1 week', 'Thiết kế lại tích hợp camera +1 tuần', 1)
ON CONFLICT DO NOTHING;

-- ===================================================================
-- 7. ISSUE_UPDATES
-- ===================================================================
INSERT INTO issue_updates (issue_id, author_name, content, created_at)
VALUES
  -- ISS-001
  ('ISS-001', 'Đức Anh', 'Identified brownout during flight test #47', '2026-01-15 00:00:00+07'),
  ('ISS-001', 'Đức Anh', 'Root cause: LDO max 500mA, peak draw 720mA', '2026-01-20 00:00:00+07'),
  ('ISS-001', 'Minh Tuấn', 'New regulator TPS62A02 sampled, testing next week', '2026-02-10 00:00:00+07'),
  -- ISS-002
  ('ISS-002', 'Thanh Hà', 'Measured TTFF consistently >45s in field', '2026-01-22 00:00:00+07'),
  ('ISS-002', 'Thanh Hà', 'EMC scan shows noise at 1.575GHz from motor driver', '2026-02-01 00:00:00+07'),
  -- ISS-003
  ('ISS-003', 'Văn Hùng', 'Arcing observed on unit #3', '2025-10-05 00:00:00+07'),
  ('ISS-003', 'Văn Hùng', 'Switched to gold-plated XT60H from supplier B', '2025-10-12 00:00:00+07'),
  ('ISS-003', 'Văn Hùng', '100 cycle test passed. Closed.', '2025-10-20 00:00:00+07'),
  -- ISS-004
  ('ISS-004', 'Đức Anh', 'CAN timeout errors in flight log, motor #4 stutter', '2026-02-18 00:00:00+07'),
  -- ISS-005
  ('ISS-005', 'Đức Anh', 'Observed CPU freq drop from 1.8GHz to 1.2GHz at 45°C ambient in chamber', '2026-02-22 00:00:00+07'),
  -- ISS-006
  ('ISS-006', 'Bảo Trâm', 'Clogging after 5 minutes of low-rate spray', '2026-01-10 00:00:00+07'),
  ('ISS-006', 'Bảo Trâm', 'Testing 200-mesh filter from supplier C', '2026-01-18 00:00:00+07'),
  -- ISS-007
  ('ISS-007', 'Hồng Phúc', 'Vibration spike at 40% throttle on accelerometer', '2026-02-05 00:00:00+07'),
  ('ISS-007', 'Hồng Phúc', 'FEA analysis confirms resonance. Waiting for damper samples.', '2026-02-12 00:00:00+07'),
  -- ISS-008
  ('ISS-008', 'Bảo Trâm', 'Measured altitude drift of ±30cm over rice paddy at 2m AGL', '2026-02-10 00:00:00+07'),
  ('ISS-008', 'Bảo Trâm', 'Testing Kalman filter fusion with barometer to compensate', '2026-02-18 00:00:00+07'),
  -- ISS-009
  ('ISS-009', 'Bảo Trâm', 'Flow rate drops from 2.5L/min to 2.0L/min after 10min', '2026-02-15 00:00:00+07'),
  ('ISS-009', 'Hồng Phúc', 'Ordered PTFE-coated diaphragm from alternative supplier', '2026-02-20 00:00:00+07'),
  -- ISS-010
  ('ISS-010', 'Văn Hùng', 'Thermal camera shows XT90 at 85°C after 8min at 55A average draw', '2026-02-20 00:00:00+07'),
  -- ISS-011
  ('ISS-011', 'Thanh Hà', 'Evaluating SiK radio V3 and RFD900x as replacements', '2026-02-20 00:00:00+07'),
  -- ISS-012
  ('ISS-012', 'Trần Minh Khoa', 'Created initial trade study document with 3 options', '2026-02-10 00:00:00+07'),
  ('ISS-012', 'Quỳnh Anh', 'Requested weight budget from system engineering team', '2026-02-15 00:00:00+07'),
  -- ISS-013
  ('ISS-013', 'Nguyễn Hải Nam', 'Initial literature review — RTK + AprilTag combo shows promise', '2026-02-05 00:00:00+07'),
  ('ISS-013', 'Nguyễn Hải Nam', 'Contacted DJI SDK team about visual landing API compatibility', '2026-02-12 00:00:00+07'),
  ('ISS-013', 'Quỳnh Anh', 'Approved budget for RTK base station + ArUco marker landing pad prototype', '2026-02-20 00:00:00+07'),
  -- ISS-014
  ('ISS-014', 'Bùi Quốc Việt', 'Contacted CAAV for UAV noise regulation guidance', '2026-02-08 00:00:00+07'),
  ('ISS-014', 'Bùi Quốc Việt', 'CAAV confirmed no specific UAV noise standard yet. Referencing EU EN 4709-005.', '2026-02-18 00:00:00+07'),
  -- ISS-015
  ('ISS-015', 'Lê Thị Phương', 'Issue discovered during PVT-007 field trial at Bình Dương solar farm', '2026-01-25 00:00:00+07'),
  ('ISS-015', 'Lê Thị Phương', 'FLIR support ticket #FL-28841 opened', '2026-02-01 00:00:00+07'),
  ('ISS-015', 'Lê Thị Phương', 'FLIR confirmed — sending firmware v3.2.1 with improved NUC algorithm', '2026-02-10 00:00:00+07'),
  ('ISS-015', 'Phạm Thu Trang', 'Firmware v3.2.1 received, scheduling retest', '2026-02-18 00:00:00+07'),
  -- ISS-016
  ('ISS-016', 'Vũ Đình Toàn', 'Profiling results: 60% CPU on point cloud, 30% on thermal', '2026-02-01 00:00:00+07'),
  ('ISS-016', 'Vũ Đình Toàn', 'Tested point cloud decimation (50%) → 95ms latency ✅ but obstacle detection accuracy drops 15%', '2026-02-08 00:00:00+07'),
  ('ISS-016', 'Vũ Đình Toàn', 'Ordered Jetson Orin Nano eval kit for benchmarking. Delivery: Feb 28', '2026-02-16 00:00:00+07'),
  -- ISS-017
  ('ISS-017', 'Lê Thị Phương', 'Water ingress detected during PVT environmental test #12', '2026-02-05 00:00:00+07'),
  ('ISS-017', 'Phạm Thu Trang', 'Escalated to CRITICAL. Contacted gasket supplier Seal-Tech JSC', '2026-02-07 00:00:00+07'),
  ('ISS-017', 'Lê Thị Phương', 'Root cause: EPDM gasket shore hardness drops from 60A to 45A after thermal cycling', '2026-02-12 00:00:00+07'),
  ('ISS-017', 'Phạm Thu Trang', 'BLOCKED — Seal-Tech sending silicone samples, ETA March 5. Cannot proceed until tested.', '2026-02-20 00:00:00+07'),
  -- ISS-018
  ('ISS-018', 'Vũ Đình Toàn', 'Identified during PVT unit #4 assembly — connector partially unseated', '2026-02-15 00:00:00+07'),
  ('ISS-018', 'Vũ Đình Toàn', 'Requesting jig redesign quote from CNC shop. Also evaluating ZIF connector alternative.', '2026-02-20 00:00:00+07'),
  -- ISS-019
  ('ISS-019', 'Đỗ Hoàng Sơn', 'Measured trigger latency with oscilloscope — 8-25ms range, non-deterministic', '2026-02-12 00:00:00+07'),
  ('ISS-019', 'Đỗ Hoàng Sơn', 'Sony A7R mid-exposure feedback available via hot shoe pin 4. Designing detection circuit.', '2026-02-19 00:00:00+07'),
  -- ISS-020
  ('ISS-020', 'Trần Minh Khoa', 'Drift measured across 5 flights — consistent 2.5ppm pattern', '2026-02-18 00:00:00+07'),
  -- ISS-021
  ('ISS-021', 'Đỗ Hoàng Sơn', 'Tested 3 SD cards: Samsung PRO Plus V30, SanDisk Extreme V30, Lexar V60', '2026-02-10 00:00:00+07'),
  ('ISS-021', 'Đỗ Hoàng Sơn', 'Lexar V60 sustained 55MB/s — passes requirement. Cost +$35/unit', '2026-02-17 00:00:00+07'),
  ('ISS-021', 'Phạm Thu Trang', 'Approved V60 upgrade. Updating BOM.', '2026-02-22 00:00:00+07')
ON CONFLICT DO NOTHING;

-- ===================================================================
-- 8. BOM_PARTS (48 records)
-- Maps: description->name, descriptionVi->name_vi, lifecycleStatus->lifecycle
-- Removed: unit, alternate_part_ids, designator (not in schema)
-- ===================================================================
INSERT INTO bom_parts (id, project_id, parent_id, level, part_number, name, name_vi, category, quantity, unit_cost, currency, supplier_id, lead_time_days, lifecycle)
VALUES
  -- PRJ-001 Top-level
  ('BOM-001', 'PRJ-001', NULL, 0, 'RTR-X7-ASY', 'RTR-X7 Surveyor Drone Assembly', 'Bộ Drone RTR-X7 Surveyor hoàn chỉnh', 'MECHANICAL', 1, NULL, 'USD', NULL, NULL, 'ACTIVE'),
  -- PRJ-001 Sub-assemblies (Level 1)
  ('BOM-002', 'PRJ-001', 'BOM-001', 1, 'RTR-X7-FRAME-ASY', 'Frame Assembly', 'Bộ khung', 'MECHANICAL', 1, NULL, 'USD', NULL, NULL, 'ACTIVE'),
  ('BOM-003', 'PRJ-001', 'BOM-001', 1, 'RTR-X7-PWR-ASY', 'Power Assembly', 'Bộ nguồn', 'ELECTRICAL', 1, NULL, 'USD', NULL, NULL, 'ACTIVE'),
  ('BOM-004', 'PRJ-001', 'BOM-001', 1, 'RTR-X7-AVI-ASY', 'Avionics Assembly', 'Bộ điện tử hàng không', 'ELECTRICAL', 1, NULL, 'USD', NULL, NULL, 'ACTIVE'),
  ('BOM-005', 'PRJ-001', 'BOM-001', 1, 'RTR-X7-HARNESS', 'Wiring Harness', 'Bộ dây điện', 'ELECTRICAL', 1, NULL, 'USD', NULL, NULL, 'ACTIVE'),
  -- PRJ-001 Frame Assembly components (Level 2)
  ('BOM-006', 'PRJ-001', 'BOM-002', 2, 'CF-TUBE-500', 'Carbon fiber tube 500mm', 'Ống carbon 500mm', 'MECHANICAL', 4, 30.00, 'USD', 'SUP-001', 14, 'ACTIVE'),
  ('BOM-007', 'PRJ-001', 'BOM-002', 2, 'MTR-MNT-AL', 'Motor mount aluminum', 'Giá đỡ motor nhôm', 'MECHANICAL', 4, 20.00, 'USD', 'SUP-001', 14, 'ACTIVE'),
  ('BOM-008', 'PRJ-001', 'BOM-002', 2, 'LG-SET-01', 'Landing gear set', 'Bộ chân đáp', 'MECHANICAL', 1, 45.00, 'USD', 'SUP-002', 21, 'ACTIVE'),
  ('BOM-009', 'PRJ-001', 'BOM-002', 2, 'CNTR-PLT-CF', 'Center plate carbon fiber', 'Tấm trung tâm carbon', 'MECHANICAL', 1, 95.00, 'USD', 'SUP-001', 14, 'ACTIVE'),
  ('BOM-010', 'PRJ-001', 'BOM-002', 2, 'DAMP-RBR-4', 'Vibration damper rubber', 'Đệm chống rung cao su', 'MECHANICAL', 4, 11.25, 'USD', 'SUP-004', 7, 'ACTIVE'),
  -- PRJ-001 Power Assembly components (Level 2)
  ('BOM-011', 'PRJ-001', 'BOM-003', 2, 'MOT-2810-KV920', 'Motor 2810 920KV', 'Motor 2810 920KV', 'ELECTRICAL', 4, 70.00, 'USD', 'SUP-002', 14, 'ACTIVE'),
  ('BOM-012', 'PRJ-001', 'BOM-003', 2, 'ESC-40A-BL', 'ESC 40A BLHeli', 'ESC 40A BLHeli', 'ELECTRICAL', 4, 40.00, 'USD', 'SUP-002', 14, 'ACTIVE'),
  ('BOM-013', 'PRJ-001', 'BOM-003', 2, 'PROP-1555-CF', 'Propeller 15x5.5 CF', 'Cánh quạt 15x5.5 CF', 'MECHANICAL', 4, 25.00, 'USD', 'SUP-002', 7, 'ACTIVE'),
  ('BOM-014', 'PRJ-001', 'BOM-003', 2, 'BAT-6S-10AH', 'Battery 6S 10000mAh', 'Pin 6S 10000mAh', 'ELECTRICAL', 1, 220.00, 'USD', 'SUP-003', 21, 'ACTIVE'),
  ('BOM-015', 'PRJ-001', 'BOM-003', 2, 'PDB-V2', 'Power distribution board', 'Board phân phối nguồn', 'ELECTRICAL', 1, 45.00, 'USD', 'SUP-003', 14, 'NRND'),
  ('BOM-016', 'PRJ-001', 'BOM-003', 2, 'CONN-XT60H', 'XT60H Connector', 'Đầu nối XT60H', 'ELECTRICAL', 2, 7.50, 'USD', 'SUP-003', 7, 'ACTIVE'),
  -- PRJ-001 Avionics Assembly components (Level 2)
  ('BOM-017', 'PRJ-001', 'BOM-004', 2, 'FC-H7-V3', 'Flight controller H7 V3', 'Bộ điều khiển bay H7 V3', 'ELECTRICAL', 1, 180.00, 'USD', 'SUP-003', 21, 'ACTIVE'),
  ('BOM-018', 'PRJ-001', 'BOM-004', 2, 'GPS-RTK-F9P', 'RTK GPS module u-blox F9P', 'Module GPS RTK u-blox F9P', 'ELECTRICAL', 1, 320.00, 'USD', 'SUP-005', 28, 'ACTIVE'),
  ('BOM-019', 'PRJ-001', 'BOM-004', 2, 'GPS-ANT-L1L2', 'GPS antenna L1/L2', 'Anten GPS L1/L2', 'ELECTRICAL', 1, 85.00, 'USD', 'SUP-005', 14, 'ACTIVE'),
  ('BOM-020', 'PRJ-001', 'BOM-004', 2, 'RC-RX-ELRS', 'ELRS receiver', 'Bộ thu ELRS', 'ELECTRICAL', 1, 25.00, 'USD', 'SUP-003', 7, 'ACTIVE'),
  ('BOM-021', 'PRJ-001', 'BOM-004', 2, 'TELEM-915', 'Telemetry radio 915MHz', 'Radio telemetry 915MHz', 'ELECTRICAL', 1, 65.00, 'USD', 'SUP-003', 10, 'EOL'),
  ('BOM-022', 'PRJ-001', 'BOM-004', 2, 'CAM-SONY-20MP', 'Survey camera 20MP', 'Camera khảo sát 20MP', 'ELECTRICAL', 1, 480.00, 'USD', 'SUP-003', 14, 'ACTIVE'),
  ('BOM-023', 'PRJ-001', 'BOM-004', 2, 'SD-128GB', 'SD card 128GB industrial', 'Thẻ SD 128GB công nghiệp', 'ELECTRICAL', 1, 35.00, 'USD', 'SUP-003', 5, 'ACTIVE'),
  -- PRJ-001 Wiring Harness components (Level 2)
  ('BOM-024', 'PRJ-001', 'BOM-005', 2, 'WIRE-14AWG-2M', '14AWG silicone wire 2m', 'Dây silicone 14AWG 2m', 'ELECTRICAL', 4, 8.00, 'USD', 'SUP-004', 5, 'ACTIVE'),
  ('BOM-025', 'PRJ-001', 'BOM-005', 2, 'WIRE-22AWG-5M', '22AWG signal wire 5m', 'Dây tín hiệu 22AWG 5m', 'ELECTRICAL', 1, 18.00, 'USD', 'SUP-004', 5, 'ACTIVE'),
  ('BOM-026', 'PRJ-001', 'BOM-005', 2, 'CONN-JST-10', 'JST connector set', 'Bộ đầu nối JST', 'ELECTRICAL', 10, 2.20, 'USD', 'SUP-003', 7, 'ACTIVE'),
  ('BOM-027', 'PRJ-001', 'BOM-005', 2, 'SHRINK-KIT', 'Heat shrink kit', 'Bộ ống co nhiệt', 'CONSUMABLE', 1, 10.00, 'USD', 'SUP-004', 3, 'ACTIVE'),

  -- PRJ-002 Top-level
  ('BOM-A01', 'PRJ-002', NULL, 0, 'RTR-A3-ASY', 'RTR-A3 Agri Sprayer Drone Assembly', 'Bộ Drone RTR-A3 Phun Nông Nghiệp hoàn chỉnh', 'MECHANICAL', 1, NULL, 'USD', NULL, NULL, 'ACTIVE'),
  -- PRJ-002 Sub-assemblies (Level 1)
  ('BOM-A02', 'PRJ-002', 'BOM-A01', 1, 'RTR-A3-FRAME', 'Hexa-Frame Assembly', 'Bộ khung Hexa', 'MECHANICAL', 1, NULL, 'USD', NULL, NULL, 'ACTIVE'),
  ('BOM-A03', 'PRJ-002', 'BOM-A01', 1, 'RTR-A3-PWR', 'Power System', 'Hệ thống nguồn', 'ELECTRICAL', 1, NULL, 'USD', NULL, NULL, 'ACTIVE'),
  ('BOM-A04', 'PRJ-002', 'BOM-A01', 1, 'RTR-A3-SPRAY', 'Spray System', 'Hệ thống phun', 'MECHANICAL', 1, NULL, 'USD', NULL, NULL, 'ACTIVE'),
  ('BOM-A05', 'PRJ-002', 'BOM-A01', 1, 'RTR-A3-AVI', 'Avionics & Navigation', 'Điện tử hàng không & Dẫn đường', 'ELECTRICAL', 1, NULL, 'USD', NULL, NULL, 'ACTIVE'),
  -- PRJ-002 Frame Assembly components (Level 2)
  ('BOM-A06', 'PRJ-002', 'BOM-A02', 2, 'CF-ARM-680', 'Carbon fiber arm 680mm', 'Cánh tay carbon 680mm', 'MECHANICAL', 6, 38.00, 'USD', 'SUP-001', 14, 'ACTIVE'),
  ('BOM-A07', 'PRJ-002', 'BOM-A02', 2, 'CNTR-PLT-A3', 'Center plate assembly', 'Bộ tấm trung tâm', 'MECHANICAL', 1, 120.00, 'USD', 'SUP-001', 14, 'ACTIVE'),
  ('BOM-A08', 'PRJ-002', 'BOM-A02', 2, 'LG-AGRI-01', 'Folding landing gear 400mm', 'Chân đáp gập 400mm', 'MECHANICAL', 1, 65.00, 'USD', 'SUP-001', 21, 'ACTIVE'),
  ('BOM-A09', 'PRJ-002', 'BOM-A02', 2, 'MTR-MNT-A3', 'Motor mount w/ damper', 'Giá đỡ motor có đệm chống rung', 'MECHANICAL', 6, 22.00, 'USD', 'SUP-001', 14, 'ACTIVE'),
  ('BOM-A10', 'PRJ-002', 'BOM-A02', 2, 'TANK-MNT-20L', 'Tank mounting bracket 20L', 'Bracket gắn bình 20L', 'MECHANICAL', 1, 35.00, 'USD', 'SUP-001', 10, 'ACTIVE'),
  -- PRJ-002 Power System components (Level 2)
  ('BOM-A11', 'PRJ-002', 'BOM-A03', 2, 'MOT-4008-KV620', 'Motor 4008 620KV', 'Motor 4008 620KV', 'ELECTRICAL', 6, 95.00, 'USD', 'SUP-002', 14, 'ACTIVE'),
  ('BOM-A12', 'PRJ-002', 'BOM-A03', 2, 'ESC-60A-FD', 'ESC 60A FOC drive', 'ESC 60A điều khiển FOC', 'ELECTRICAL', 6, 55.00, 'USD', 'SUP-002', 14, 'ACTIVE'),
  ('BOM-A13', 'PRJ-002', 'BOM-A03', 2, 'PROP-2170-AGRI', 'Propeller 21x7.0 agricultural', 'Cánh quạt 21x7.0 nông nghiệp', 'MECHANICAL', 6, 18.00, 'USD', 'SUP-002', 7, 'ACTIVE'),
  ('BOM-A14', 'PRJ-002', 'BOM-A03', 2, 'BAT-12S-16AH', 'Battery 12S 16000mAh', 'Pin 12S 16000mAh', 'ELECTRICAL', 2, 420.00, 'USD', 'SUP-003', 21, 'ACTIVE'),
  ('BOM-A15', 'PRJ-002', 'BOM-A03', 2, 'PDB-120A-HV', 'Power distribution board 120A HV', 'Board phân phối nguồn 120A HV', 'ELECTRICAL', 1, 68.00, 'USD', 'SUP-003', 14, 'ACTIVE'),
  -- PRJ-002 Spray System components (Level 2)
  ('BOM-A16', 'PRJ-002', 'BOM-A04', 2, 'TANK-PE-20L', 'PE spray tank 20L', 'Bình phun PE 20L', 'MECHANICAL', 1, 85.00, 'USD', 'SUP-004', 10, 'ACTIVE'),
  ('BOM-A17', 'PRJ-002', 'BOM-A04', 2, 'PUMP-BR-12V', 'Brushless diaphragm pump 12V', 'Bơm màng không chổi than 12V', 'ELECTRICAL', 1, 145.00, 'USD', 'SUP-002', 14, 'ACTIVE'),
  ('BOM-A18', 'PRJ-002', 'BOM-A04', 2, 'NOZZLE-FAN-4', 'Fan nozzle set (4 nozzles)', 'Bộ vòi phun quạt (4 vòi)', 'CONSUMABLE', 1, 32.00, 'USD', 'SUP-004', 7, 'ACTIVE'),
  ('BOM-A19', 'PRJ-002', 'BOM-A04', 2, 'FLOW-SENS-01', 'Flow rate sensor', 'Cảm biến lưu lượng', 'ELECTRICAL', 1, 45.00, 'USD', 'SUP-003', 10, 'ACTIVE'),
  ('BOM-A20', 'PRJ-002', 'BOM-A04', 2, 'TUBE-SILI-6MM', 'Silicone tubing 6mm 3m kit', 'Bộ ống silicone 6mm 3m', 'CONSUMABLE', 1, 12.00, 'USD', 'SUP-004', 3, 'ACTIVE'),
  ('BOM-A21', 'PRJ-002', 'BOM-A04', 2, 'FILTER-100M', 'Inline filter 100-mesh', 'Bộ lọc inline 100-mesh', 'CONSUMABLE', 2, 8.50, 'USD', 'SUP-004', 5, 'NRND'),
  -- PRJ-002 Avionics & Navigation (Level 2)
  ('BOM-A22', 'PRJ-002', 'BOM-A05', 2, 'FC-A3-V1', 'Flight controller agri-grade', 'Bộ điều khiển bay cấp nông nghiệp', 'ELECTRICAL', 1, 210.00, 'USD', 'SUP-003', 21, 'ACTIVE'),
  ('BOM-A23', 'PRJ-002', 'BOM-A05', 2, 'GPS-RTK-M9N', 'RTK GPS u-blox M9N', 'Module GPS RTK u-blox M9N', 'ELECTRICAL', 1, 180.00, 'USD', 'SUP-005', 28, 'ACTIVE'),
  ('BOM-A24', 'PRJ-002', 'BOM-A05', 2, 'RADAR-ALT-01', 'Radar altimeter (terrain follow)', 'Cao kế radar (theo địa hình)', 'ELECTRICAL', 1, 120.00, 'USD', 'SUP-003', 14, 'ACTIVE'),
  ('BOM-A25', 'PRJ-002', 'BOM-A05', 2, 'RC-RX-ELRS-A3', 'ELRS receiver long-range', 'Bộ thu ELRS tầm xa', 'ELECTRICAL', 1, 35.00, 'USD', 'SUP-003', 7, 'ACTIVE'),
  ('BOM-A26', 'PRJ-002', 'BOM-A05', 2, 'TELEM-4G-01', '4G telemetry module', 'Module telemetry 4G', 'ELECTRICAL', 1, 95.00, 'USD', 'SUP-003', 14, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- ===================================================================
-- 9. DELIVERY_RECORDS (27 records)
-- Removed: project_id (not in schema)
-- ===================================================================
INSERT INTO delivery_records (id, supplier_id, bom_part_id, bom_part_name, order_date, promised_date, actual_date, quantity, unit_price, status, delay_days)
VALUES
  ('DEL-001', 'SUP-001', 'BOM-006', 'Carbon fiber tube 500mm', '2026-01-15', '2026-01-29', '2026-02-02', 16, 7.50, 'DELIVERED_LATE', 4),
  ('DEL-002', 'SUP-001', 'BOM-009', 'Center plate carbon fiber', '2025-12-20', '2026-01-03', '2026-01-03', 2, 95.00, 'DELIVERED_ON_TIME', 0),
  ('DEL-003', 'SUP-001', 'BOM-007', 'Motor mount aluminum', '2025-12-01', '2025-12-15', '2025-12-15', 8, 20.00, 'DELIVERED_ON_TIME', 0),
  ('DEL-004', 'SUP-001', 'BOM-006', 'Carbon fiber tube 500mm', '2025-11-01', '2025-11-15', '2025-11-17', 8, 7.50, 'DELIVERED_LATE', 2),
  ('DEL-005', 'SUP-002', 'BOM-011', 'Motor 2810 920KV', '2026-01-05', '2026-01-19', '2026-01-18', 4, 70.00, 'DELIVERED_ON_TIME', 0),
  ('DEL-006', 'SUP-002', 'BOM-012', 'ESC 40A BLHeli', '2026-01-05', '2026-01-19', '2026-01-19', 4, 40.00, 'DELIVERED_ON_TIME', 0),
  ('DEL-007', 'SUP-003', 'BOM-016', 'XT60H Connector', '2026-01-10', '2026-01-31', '2026-02-05', 2, 180.00, 'DELIVERED_LATE', 5),
  ('DEL-008', 'SUP-005', 'BOM-017', 'Flight controller H7 V3', '2025-12-15', '2026-01-15', '2026-01-12', 2, 320.00, 'DELIVERED_ON_TIME', 0),
  ('DEL-009', 'SUP-004', 'BOM-010', 'Vibration damper rubber', '2026-02-01', '2026-02-08', '2026-02-07', 8, 2.80, 'DELIVERED_ON_TIME', 0),
  ('DEL-010', 'SUP-003', 'BOM-019', 'GPS antenna L1/L2', '2026-02-10', '2026-02-28', NULL, 4, 25.00, 'IN_TRANSIT', 0),
  -- PRJ-002 deliveries
  ('DEL-011', 'SUP-001', 'BOM-A06', 'Carbon fiber arm 680mm', '2025-12-01', '2025-12-15', '2025-12-14', 6, 38.00, 'DELIVERED_ON_TIME', 0),
  ('DEL-012', 'SUP-001', 'BOM-A07', 'Center plate assembly', '2025-12-01', '2025-12-15', '2025-12-16', 1, 120.00, 'DELIVERED_LATE', 1),
  ('DEL-013', 'SUP-002', 'BOM-A11', 'Motor 4008 620KV', '2025-12-10', '2025-12-24', '2025-12-23', 6, 95.00, 'DELIVERED_ON_TIME', 0),
  ('DEL-014', 'SUP-002', 'BOM-A12', 'ESC 60A FOC drive', '2025-12-10', '2025-12-24', '2025-12-24', 6, 55.00, 'DELIVERED_ON_TIME', 0),
  ('DEL-015', 'SUP-003', 'BOM-A14', 'Battery 12S 16000mAh', '2025-12-15', '2026-01-05', '2026-01-08', 2, 420.00, 'DELIVERED_LATE', 3),
  ('DEL-016', 'SUP-004', 'BOM-A16', 'PE spray tank 20L', '2025-12-20', '2025-12-30', '2025-12-29', 1, 85.00, 'DELIVERED_ON_TIME', 0),
  ('DEL-017', 'SUP-005', 'BOM-A23', 'RTK GPS u-blox M9N', '2026-01-10', '2026-02-07', '2026-02-05', 1, 180.00, 'DELIVERED_ON_TIME', 0),
  ('DEL-018', 'SUP-002', 'BOM-A17', 'Brushless diaphragm pump 12V', '2026-02-01', '2026-02-15', NULL, 1, 145.00, 'IN_TRANSIT', 0),
  -- SUP-006 (SAT — Shenzhen AeroTech) deliveries
  ('DEL-020', 'SUP-006', 'BOM-A11', 'Motor 4008 620KV', '2025-10-01', '2025-10-21', '2025-10-28', 24, 32.00, 'DELIVERED_LATE', 7),
  ('DEL-021', 'SUP-006', 'BOM-A12', 'ESC 60A FOC drive', '2025-10-15', '2025-11-05', '2025-11-12', 24, 18.50, 'DELIVERED_LATE', 7),
  ('DEL-022', 'SUP-006', 'BOM-A11', 'Motor 4008 620KV', '2025-12-01', '2025-12-21', '2025-12-29', 12, 31.50, 'DELIVERED_LATE', 8),
  ('DEL-023', 'SUP-006', 'BOM-A12', 'ESC 60A FOC drive', '2026-01-10', '2026-01-30', '2026-01-29', 12, 18.50, 'DELIVERED_ON_TIME', 0),
  -- SUP-007 (NNX — Nong Nghiep Xanh) deliveries
  ('DEL-030', 'SUP-007', 'BOM-A16', 'PE spray tank 20L', '2025-11-01', '2025-11-10', '2025-11-09', 5, 45.00, 'DELIVERED_ON_TIME', 0),
  ('DEL-031', 'SUP-007', 'BOM-A17', 'Brushless diaphragm pump 12V', '2025-11-15', '2025-12-01', '2025-11-29', 5, 85.00, 'DELIVERED_ON_TIME', 0),
  ('DEL-032', 'SUP-007', 'BOM-A18', 'Fan nozzle set (4 nozzles)', '2025-12-10', '2025-12-18', '2025-12-17', 20, 12.00, 'DELIVERED_ON_TIME', 0),
  -- SUP-008 (FLR — FLIR Systems) deliveries for PRJ-004
  ('DEL-040', 'SUP-008', 'BOM-017', 'Flight controller H7 V3', '2025-07-01', '2025-08-15', '2025-08-12', 3, 250.00, 'DELIVERED_ON_TIME', 0),
  ('DEL-041', 'SUP-008', 'BOM-017', 'Flight controller H7 V3', '2025-10-01', '2025-11-15', '2025-11-22', 5, 245.00, 'DELIVERED_LATE', 7),
  ('DEL-042', 'SUP-008', 'BOM-017', 'Flight controller H7 V3', '2026-01-10', '2026-02-25', NULL, 10, 240.00, 'IN_TRANSIT', 0)
ON CONFLICT (id) DO NOTHING;

-- ===================================================================
-- 10. FLIGHT_TESTS (14 records)
-- Removed: related_gate_condition, created_by (not in schema)
-- ===================================================================
INSERT INTO flight_tests (id, project_id, test_number, date, location, location_vi, pilot_name, drone_unit, test_type, test_phase, result, duration_seconds, sensor_data, notes, notes_vi, auto_issue_id)
VALUES
  ('FLT-047', 'PRJ-001', 47, '2026-02-20', 'RtR Test Field Alpha', 'Bãi bay RtR Alpha', 'Đức Anh', 'X7-DVT-003', 'ENDURANCE', 'DVT', 'FAIL', 1847,
   '{"batteryStart":25.2,"batteryEnd":21.8,"batteryMinCell":3.45,"maxCurrent":42.5,"avgCurrent":18.3,"maxVibration":28.5,"gpsAccuracy":0.02,"maxWind":8.2,"ambientTemp":35,"maxAltitude":120,"maxSpeed":15.2,"distanceCovered":4500}'::jsonb,
   'Test aborted at 30min due to ESC #4 overtemp. Motor mount showed vibration marks.',
   'Test dừng ở phút 30 do ESC #4 quá nhiệt. Giá đỡ motor có dấu hiệu rung.',
   'ISS-004'),

  ('FLT-046', 'PRJ-001', 46, '2026-02-18', 'RtR Test Field Alpha', 'Bãi bay RtR Alpha', 'Đức Anh', 'X7-DVT-003', 'STABILITY', 'DVT', 'PASS', 1335,
   '{"batteryStart":25.1,"batteryEnd":23.2,"batteryMinCell":3.82,"maxCurrent":22.0,"avgCurrent":14.5,"maxVibration":12.3,"gpsAccuracy":0.015,"maxWind":5.1,"ambientTemp":30,"maxAltitude":80,"maxSpeed":12.0,"distanceCovered":2100}'::jsonb,
   'Stable hover and waypoint navigation. All parameters nominal.',
   'Bay treo và điều hướng waypoint ổn định. Mọi thông số bình thường.',
   NULL),

  ('FLT-045', 'PRJ-001', 45, '2026-02-15', 'RtR Test Field Bravo', 'Bãi bay RtR Bravo', 'Thanh Hà', 'X7-DVT-002', 'PAYLOAD', 'DVT', 'PASS', 1110,
   '{"batteryStart":25.0,"batteryEnd":22.1,"batteryMinCell":3.62,"maxCurrent":28.0,"avgCurrent":20.1,"maxVibration":15.0,"gpsAccuracy":0.018,"maxWind":4.0,"ambientTemp":28,"maxAltitude":60,"maxSpeed":8.5,"distanceCovered":1800}'::jsonb,
   'Full payload test at 2.5kg. Flight time 18:30. Within spec.',
   'Test đầy tải 2.5kg. Thời gian bay 18:30. Trong spec.',
   NULL),

  ('FLT-044', 'PRJ-001', 44, '2026-02-12', 'RtR Test Field Alpha', 'Bãi bay RtR Alpha', 'Đức Anh', 'X7-DVT-003', 'ENDURANCE', 'DVT', 'PASS', 2702,
   '{"batteryStart":25.2,"batteryEnd":20.5,"batteryMinCell":3.38,"maxCurrent":25.0,"avgCurrent":16.8,"maxVibration":11.0,"gpsAccuracy":0.012,"maxWind":6.5,"ambientTemp":32,"maxAltitude":100,"maxSpeed":14.0,"distanceCovered":8200}'::jsonb,
   '45-minute endurance flight. Battery to 20.5V. Clean flight.',
   'Bay 45 phút. Pin còn 20.5V. Bay sạch.',
   NULL),

  ('FLT-043', 'PRJ-001', 43, '2026-02-10', 'RtR Test Field Alpha', 'Bãi bay RtR Alpha', 'Thanh Hà', 'X7-DVT-002', 'SPEED', 'DVT', 'PARTIAL', 525,
   '{"batteryStart":25.0,"batteryEnd":23.8,"batteryMinCell":3.90,"maxCurrent":38.0,"avgCurrent":25.0,"maxVibration":22.0,"gpsAccuracy":0.025,"maxWind":3.2,"ambientTemp":29,"maxAltitude":50,"maxSpeed":22.5,"distanceCovered":3500}'::jsonb,
   'Max speed achieved 22.5m/s but GPS cold start took 48s. Speed test passed but GPS issue noted.',
   'Tốc độ tối đa 22.5m/s nhưng GPS khởi động lạnh mất 48 giây. Test tốc độ đạt nhưng ghi nhận vấn đề GPS.',
   'ISS-002'),

  ('FLT-042', 'PRJ-001', 42, '2026-02-08', 'RtR Test Field Alpha', 'Bãi bay RtR Alpha', 'Đức Anh', 'X7-DVT-001', 'INTEGRATION', 'DVT', 'PASS', 900,
   '{"batteryStart":25.1,"batteryEnd":24.0,"batteryMinCell":3.95,"maxCurrent":18.0,"avgCurrent":12.0,"maxVibration":8.5,"gpsAccuracy":0.01,"maxWind":2.0,"ambientTemp":27,"maxAltitude":50,"maxSpeed":10.0,"distanceCovered":1200}'::jsonb,
   'Camera integration test. Trigger + geotag working correctly.',
   'Test tích hợp camera. Trigger + geotag hoạt động đúng.',
   NULL),

  ('FLT-048', 'PRJ-001', 48, '2026-02-22', 'RtR Alpha Field', 'Bãi bay RtR Alpha', 'Thanh Hà', 'X7-DVT-003', 'ENVIRONMENTAL', 'DVT', 'FAIL', 1020,
   '{"batteryStart":25.2,"batteryEnd":22.1,"batteryMinCell":3.38,"maxCurrent":38.0,"avgCurrent":22.0,"maxVibration":15.0,"gpsAccuracy":0.03,"maxWind":6.5,"ambientTemp":46,"maxAltitude":80,"maxSpeed":12.0,"distanceCovered":2800}'::jsonb,
   'Environmental test at peak heat. CPU throttled after 13min, battery imbalance triggered RTL.',
   'Test môi trường ở đỉnh nóng. CPU giảm xung sau 13 phút, mất cân bằng pin kích hoạt RTL.',
   NULL),

  ('FLT-010', 'PRJ-002', 10, '2026-02-05', 'Nông trại Bình Dương', 'Nông trại Bình Dương', 'Hồng Phúc', 'A3-EVT-001', 'STABILITY', 'EVT', 'FAIL', 600,
   '{"batteryStart":50.4,"batteryEnd":48.2,"batteryMinCell":3.85,"maxCurrent":55.0,"avgCurrent":30.0,"maxVibration":45.0,"gpsAccuracy":1.2,"maxWind":4.5,"ambientTemp":33,"maxAltitude":15,"maxSpeed":6.0,"distanceCovered":800}'::jsonb,
   'Severe frame resonance at 40% throttle. Had to land early. Spray nozzle also clogged.',
   'Cộng hưởng khung nghiêm trọng ở 40% ga. Phải hạ cánh sớm. Vòi phun cũng bị tắc.',
   'ISS-007'),

  ('FLT-009', 'PRJ-002', 9, '2026-02-01', 'Nông trại Bình Dương', 'Nông trại Bình Dương', 'Bảo Trâm', 'A3-EVT-001', 'PAYLOAD', 'EVT', 'PASS', 780,
   '{"batteryStart":50.4,"batteryEnd":46.8,"batteryMinCell":3.72,"maxCurrent":48.0,"avgCurrent":28.0,"maxVibration":18.0,"gpsAccuracy":0.8,"maxWind":3.0,"ambientTemp":31,"maxAltitude":10,"maxSpeed":5.5,"distanceCovered":1200}'::jsonb,
   'Full 20L payload test. Flight time 13min at cruise. Stable at low altitude. Spray coverage acceptable.',
   'Test tải 20L đầy. Thời gian bay 13 phút ở tốc độ cruise. Ổn định ở độ cao thấp. Diện tích phun chấp nhận được.',
   NULL),

  ('FLT-008', 'PRJ-002', 8, '2026-01-28', 'Nông trại Long An', 'Nông trại Long An', 'Hồng Phúc', 'A3-EVT-001', 'ENDURANCE', 'EVT', 'PARTIAL', 1020,
   '{"batteryStart":50.4,"batteryEnd":43.1,"batteryMinCell":3.40,"maxCurrent":52.0,"avgCurrent":32.0,"maxVibration":14.0,"gpsAccuracy":0.9,"maxWind":5.8,"ambientTemp":34,"maxAltitude":8,"maxSpeed":4.5,"distanceCovered":2200}'::jsonb,
   '17min flight with 15L payload. Endurance target 20min not reached. Battery imbalance triggered early RTL.',
   'Bay 17 phút với tải 15L. Mục tiêu bay 20 phút chưa đạt. Mất cân bằng pin kích hoạt RTL sớm.',
   NULL),

  ('FLT-007', 'PRJ-002', 7, '2026-01-22', 'Nông trại Bình Dương', 'Nông trại Bình Dương', 'Bảo Trâm', 'A3-EVT-001', 'INTEGRATION', 'EVT', 'PASS', 540,
   '{"batteryStart":50.4,"batteryEnd":49.0,"batteryMinCell":3.92,"maxCurrent":35.0,"avgCurrent":20.0,"maxVibration":10.0,"gpsAccuracy":0.5,"maxWind":2.0,"ambientTemp":29,"maxAltitude":12,"maxSpeed":3.0,"distanceCovered":600}'::jsonb,
   'First integrated spray test. Pump, nozzle, flow sensor all functional. Terrain-following radar OK.',
   'Test phun tích hợp đầu tiên. Bơm, vòi, cảm biến lưu lượng đều hoạt động. Radar theo địa hình OK.',
   NULL),

  ('FLT-006', 'PRJ-002', 6, '2026-01-15', 'RtR Test Field Alpha', 'Bãi bay RtR Alpha', 'Hồng Phúc', 'A3-EVT-001', 'SPEED', 'EVT', 'PASS', 420,
   '{"batteryStart":50.4,"batteryEnd":49.2,"batteryMinCell":3.95,"maxCurrent":58.0,"avgCurrent":22.0,"maxVibration":12.0,"gpsAccuracy":0.4,"maxWind":2.5,"ambientTemp":28,"maxAltitude":20,"maxSpeed":8.2,"distanceCovered":1500}'::jsonb,
   'Speed test empty payload. Max 8.2m/s meets agri cruise spec of 6m/s with margin.',
   'Test tốc độ không tải. Tốc độ max 8.2m/s đạt spec cruise nông nghiệp 6m/s với biên dự.',
   NULL),

  -- PRJ-004: RTR-I2 Inspector
  ('FLT-101', 'PRJ-004', 101, '2026-01-15', 'Bình Dương Solar Farm', 'Trang trại điện mặt trời Bình Dương', 'Lê Thị Phương', 'I2-PVT-002', 'INTEGRATION', 'PVT', 'PASS', 1500,
   '{"batteryStart":25.1,"batteryEnd":22.3,"batteryMinCell":3.58,"maxCurrent":28.5,"avgCurrent":14.2,"maxVibration":15.3,"gpsAccuracy":0.015,"maxWind":6.5,"ambientTemp":32,"maxAltitude":80,"maxSpeed":12.0,"distanceCovered":3200}'::jsonb,
   'Successful integration test. Thermal + LiDAR simultaneous capture. Solar panel hotspot detection verified.',
   'Test tích hợp thành công. Camera nhiệt + LiDAR chụp đồng thời. Xác nhận phát hiện điểm nóng pin mặt trời.',
   NULL),

  ('FLT-102', 'PRJ-004', 102, '2026-01-22', 'RtR Test Field Bravo', 'Bãi bay RtR Bravo', 'Vũ Đình Toàn', 'I2-PVT-003', 'ENDURANCE', 'PVT', 'PASS', 2550,
   '{"batteryStart":25.2,"batteryEnd":21.1,"batteryMinCell":3.42,"maxCurrent":32.0,"avgCurrent":15.8,"maxVibration":18.2,"gpsAccuracy":0.018,"maxWind":8.0,"ambientTemp":30,"maxAltitude":100,"maxSpeed":14.0,"distanceCovered":6500}'::jsonb,
   '42.5 min flight time achieved with full sensor payload (thermal + LiDAR + onboard compute). Exceeds 40 min requirement.',
   'Đạt 42.5 phút bay với tải đầy đủ (camera nhiệt + LiDAR + máy tính onboard). Vượt yêu cầu 40 phút.',
   NULL),

  ('FLT-103', 'PRJ-004', 103, '2026-02-05', 'RtR Test Field Alpha', 'Bãi bay RtR Alpha', 'Lê Thị Phương', 'I2-PVT-001', 'ENVIRONMENTAL', 'PVT', 'FAIL', 1080,
   '{"batteryStart":25.0,"batteryEnd":23.5,"batteryMinCell":3.62,"maxCurrent":22.0,"avgCurrent":12.5,"maxVibration":12.8,"gpsAccuracy":0.02,"maxWind":4.2,"ambientTemp":28,"maxAltitude":50,"maxSpeed":8.0,"distanceCovered":1500}'::jsonb,
   'FAIL — water ingress detected at USB-C port during rain simulation. Camera lens also affected. Test aborted at 18 min.',
   'FAIL — phát hiện nước vào cổng USB-C trong mô phỏng mưa. Ống kính camera cũng bị ảnh hưởng. Dừng test ở phút 18.',
   'ISS-017'),

  ('FLT-104', 'PRJ-004', 104, '2026-02-12', 'Bà Rịa Power Plant', 'Nhà máy điện Bà Rịa', 'Lê Thị Phương', 'I2-PVT-002', 'PAYLOAD', 'PVT', 'PASS', 1215,
   '{"batteryStart":25.1,"batteryEnd":22.8,"batteryMinCell":3.55,"maxCurrent":35.0,"avgCurrent":16.5,"maxVibration":20.1,"gpsAccuracy":0.02,"maxWind":7.5,"ambientTemp":34,"maxAltitude":60,"maxSpeed":10.0,"distanceCovered":2800}'::jsonb,
   'Full payload test at real industrial site. Thermal + LiDAR + 4G telemetry all operational. Client (EVN) satisfied with demo.',
   'Test tải đầy đủ tại nhà máy thực tế. Camera nhiệt + LiDAR + 4G telemetry đều hoạt động. Khách hàng (EVN) hài lòng với demo.',
   NULL),

  -- PRJ-005: RTR-M3 Mapper
  ('FLT-201', 'PRJ-005', 201, '2026-02-01', 'Đồng Nai Survey Site', 'Bãi khảo sát Đồng Nai', 'Đỗ Hoàng Sơn', 'M3-EVT-001', 'INTEGRATION', 'EVT', 'PARTIAL', 1650,
   '{"batteryStart":25.2,"batteryEnd":21.5,"batteryMinCell":3.45,"maxCurrent":30.0,"avgCurrent":15.0,"maxVibration":14.5,"gpsAccuracy":0.025,"maxWind":5.8,"ambientTemp":31,"maxAltitude":100,"maxSpeed":15.0,"distanceCovered":5200}'::jsonb,
   'Mapping flight completed but image quality affected by trigger sync delay. GCP accuracy: 4.2cm (target: 2cm). SD card buffer insufficient for 4K RAW.',
   'Bay lập bản đồ hoàn thành nhưng chất lượng ảnh bị ảnh hưởng bởi trễ đồng bộ trigger. Độ chính xác GCP: 4.2cm (mục tiêu: 2cm).',
   NULL),

  ('FLT-202', 'PRJ-005', 202, '2026-02-15', 'RtR Test Field Alpha', 'Bãi bay RtR Alpha', 'Trần Minh Khoa', 'M3-EVT-001', 'ENDURANCE', 'EVT', 'PASS', 2280,
   '{"batteryStart":25.0,"batteryEnd":21.0,"batteryMinCell":3.40,"maxCurrent":28.0,"avgCurrent":14.0,"maxVibration":16.0,"gpsAccuracy":0.02,"maxWind":6.0,"ambientTemp":29,"maxAltitude":120,"maxSpeed":16.0,"distanceCovered":7500}'::jsonb,
   '38 min flight time with camera payload. Exceeds 35 min target. Battery healthy after landing, min cell 3.40V at cutoff.',
   '38 phút bay với tải camera. Vượt mục tiêu 35 phút. Pin khỏe mạnh sau hạ cánh, cell thấp nhất 3.40V.',
   NULL)
ON CONFLICT (id) DO NOTHING;

-- ===================================================================
-- 11. FLIGHT_ANOMALIES (from flight_tests.anomalies)
-- NO CHANGES — already matches schema
-- ===================================================================
INSERT INTO flight_anomalies (flight_test_id, timestamp_seconds, description, description_vi, severity)
VALUES
  -- FLT-047
  ('FLT-047', 1234, 'Motor #4 current spike to 42A', 'Motor #4 dòng tăng vọt 42A', 'HIGH'),
  ('FLT-047', 1567, 'GPS fix lost for 3 seconds', 'Mất tín hiệu GPS 3 giây', 'MEDIUM'),
  -- FLT-043
  ('FLT-043', 420, 'GPS TTFF 48s on cold start', 'GPS TTFF 48 giây khi khởi động lạnh', 'HIGH'),
  -- FLT-048
  ('FLT-048', 780, 'CPU thermal throttle triggered at 46°C ambient', 'CPU giảm xung do nhiệt ở 46°C', 'HIGH'),
  ('FLT-048', 900, 'Battery cell voltage imbalance >0.15V', 'Chênh lệch điện áp cell pin >0.15V', 'MEDIUM'),
  -- FLT-010
  ('FLT-010', 360, 'Excessive vibration at 40% throttle', 'Rung quá mức ở 40% ga', 'HIGH'),
  ('FLT-010', 480, 'Spray system pressure drop', 'Áp suất hệ thống phun giảm', 'MEDIUM'),
  -- FLT-008
  ('FLT-008', 840, 'Battery cell imbalance >0.2V at 15% SoC', 'Chênh lệch cell pin >0.2V ở 15% SoC', 'MEDIUM'),
  -- FLT-103
  ('FLT-103', 900, 'Water droplets detected on thermal camera lens after simulated rain exposure', 'Phát hiện giọt nước trên ống kính camera nhiệt sau mô phỏng mưa', 'HIGH'),
  ('FLT-103', 1020, 'USB-C port area moisture alarm triggered', 'Cảnh báo ẩm khu vực cổng USB-C kích hoạt', 'CRITICAL'),
  -- FLT-201
  ('FLT-201', 600, 'Camera trigger sync delay measured 18ms (requirement: <5ms)', 'Độ trễ đồng bộ trigger camera đo được 18ms (yêu cầu: <5ms)', 'HIGH'),
  ('FLT-201', 1200, 'SD card buffer overflow — 12 frames dropped in 5 seconds', 'Tràn buffer thẻ SD — mất 12 frame trong 5 giây', 'MEDIUM')
ON CONFLICT DO NOTHING;

-- ===================================================================
-- 12. FLIGHT_ATTACHMENTS (from flight_tests.attachments)
-- NO CHANGES — already matches schema
-- ===================================================================
INSERT INTO flight_attachments (flight_test_id, file_type, file_name)
VALUES
  -- FLT-047
  ('FLT-047', 'VIDEO', 'FLT47-onboard.mp4'),
  ('FLT-047', 'LOG', 'FLT47-blackbox.bin'),
  ('FLT-047', 'PHOTO', 'FLT47-damage-esc4.jpg'),
  -- FLT-046
  ('FLT-046', 'LOG', 'FLT46-blackbox.bin'),
  -- FLT-045
  ('FLT-045', 'LOG', 'FLT45-blackbox.bin'),
  ('FLT-045', 'PHOTO', 'FLT45-payload-config.jpg'),
  -- FLT-044
  ('FLT-044', 'LOG', 'FLT44-blackbox.bin'),
  -- FLT-043
  ('FLT-043', 'LOG', 'FLT43-blackbox.bin'),
  -- FLT-042
  ('FLT-042', 'LOG', 'FLT42-blackbox.bin'),
  -- FLT-048
  ('FLT-048', 'LOG', 'FLT48-blackbox.bin'),
  ('FLT-048', 'PHOTO', 'FLT48-thermal-camera.jpg'),
  -- FLT-010
  ('FLT-010', 'LOG', 'FLT10-blackbox.bin'),
  ('FLT-010', 'VIDEO', 'FLT10-vibration.mp4'),
  -- FLT-009
  ('FLT-009', 'LOG', 'FLT09-blackbox.bin'),
  ('FLT-009', 'PHOTO', 'FLT09-spray-pattern.jpg'),
  -- FLT-008
  ('FLT-008', 'LOG', 'FLT08-blackbox.bin'),
  -- FLT-007
  ('FLT-007', 'LOG', 'FLT07-blackbox.bin'),
  ('FLT-007', 'VIDEO', 'FLT07-spray-test.mp4'),
  -- FLT-006
  ('FLT-006', 'LOG', 'FLT06-blackbox.bin'),
  -- FLT-101
  ('FLT-101', 'VIDEO', 'FLT101-thermal-scan.mp4'),
  ('FLT-101', 'LOG', 'FLT101-blackbox.bin'),
  -- FLT-102
  ('FLT-102', 'LOG', 'FLT102-blackbox.bin'),
  ('FLT-102', 'PHOTO', 'FLT102-battery-after.jpg'),
  -- FLT-103
  ('FLT-103', 'VIDEO', 'FLT103-rain-test.mp4'),
  ('FLT-103', 'PHOTO', 'FLT103-water-ingress.jpg'),
  ('FLT-103', 'LOG', 'FLT103-blackbox.bin'),
  -- FLT-104
  ('FLT-104', 'VIDEO', 'FLT104-inspection-demo.mp4'),
  ('FLT-104', 'LOG', 'FLT104-blackbox.bin'),
  ('FLT-104', 'PHOTO', 'FLT104-thermal-output.jpg'),
  -- FLT-201
  ('FLT-201', 'LOG', 'FLT201-blackbox.bin'),
  ('FLT-201', 'PHOTO', 'FLT201-gcp-test.jpg'),
  -- FLT-202
  ('FLT-202', 'LOG', 'FLT202-blackbox.bin')
ON CONFLICT DO NOTHING;

-- ===================================================================
-- 13. DECISIONS (10 records)
-- Removed: impact_description_vi, created_by (not in schema)
-- ===================================================================
INSERT INTO decisions (id, project_id, title, title_vi, date, decision_maker_name, phase, options, chosen_option, rationale, rationale_vi, impact_description, cost_impact, linked_issue_ids, linked_flight_test_ids, status)
VALUES
  ('DEC-001', 'PRJ-001',
   'Replace LDO regulator with buck converter',
   'Thay thế LDO regulator bằng buck converter',
   '2026-02-10', 'Minh Tuấn', 'DVT',
   '[{"label":"A: Keep LDO, add capacitor bank","pros":"Simple, cheap","prosVi":"Đơn giản, rẻ","cons":"May not solve peak current","consVi":"Có thể không giải quyết dòng đỉnh"},{"label":"B: Switch to TPS62A02 buck converter","pros":"Handles 2A peak, 95% efficient","prosVi":"Xử lý dòng đỉnh 2A, hiệu suất 95%","cons":"$2.50 more per unit, PCB respin","consVi":"Thêm $2.50/đơn vị, phải respin PCB"},{"label":"C: Dual LDO parallel","pros":"No PCB change","prosVi":"Không thay đổi PCB","cons":"Thermal concern, reliability","consVi":"Lo ngại nhiệt, độ tin cậy"}]'::jsonb,
   'B',
   'Peak current requirement 720mA exceeds LDO spec. Buck converter is proper solution despite PCB respin cost. Long-term reliability is worth the investment.',
   'Yêu cầu dòng đỉnh 720mA vượt quá spec LDO. Buck converter là giải pháp đúng dù tốn thêm chi phí respin PCB. Độ tin cậy dài hạn xứng đáng đầu tư.',
   'PCB respin adds 2 weeks to DVT timeline',
   '+$2.50/unit BOM, +$500 PCB respin NRE',
   ARRAY['ISS-001'], ARRAY['FLT-047'],
   'APPROVED'),

  ('DEC-002', 'PRJ-001',
   'Relocate GPS antenna to top plate',
   'Di chuyển anten GPS lên tấm trên',
   '2026-02-05', 'Minh Tuấn', 'DVT',
   '[{"label":"A: Add EMI shielding to current position","pros":"No mechanical change","prosVi":"Không thay đổi cơ khí","cons":"Shielding adds 15g weight","consVi":"Tấm chắn thêm 15g"},{"label":"B: Relocate antenna to top plate center","pros":"Best GPS reception, clear sky view","prosVi":"Thu GPS tốt nhất, tầm nhìn trời rõ","cons":"Requires new mounting bracket","consVi":"Cần bracket gắn mới"},{"label":"C: Use active antenna with built-in filter","pros":"Works in current position","prosVi":"Hoạt động ở vị trí hiện tại","cons":"Expensive ($45 more), power draw","consVi":"Đắt ($45 thêm), tiêu thụ điện"}]'::jsonb,
   'B',
   'GPS antenna needs clear sky view. Top plate relocation is cleanest solution. Bracket cost is minimal ($8) vs ongoing signal issues.',
   'Anten GPS cần tầm nhìn trời rõ. Di chuyển lên tấm trên là giải pháp sạch nhất. Chi phí bracket rất nhỏ ($8) so với vấn đề tín hiệu liên tục.',
   'Minor frame assembly change, 1 day rework',
   '+$8/unit for bracket',
   ARRAY['ISS-002'], ARRAY['FLT-043'],
   'APPROVED'),

  ('DEC-003', 'PRJ-001',
   'Switch to gold-plated XT60H connectors',
   'Chuyển sang đầu nối XT60H mạ vàng',
   '2025-10-12', 'Văn Hùng', 'EVT',
   '[{"label":"A: Continue with standard XT60","pros":"Cheapest option","prosVi":"Rẻ nhất","cons":"Arcing will worsen","consVi":"Hiện tượng phóng tia sẽ nặng hơn"},{"label":"B: Gold-plated XT60H","pros":"Low contact resistance, long life","prosVi":"Điện trở tiếp xúc thấp, bền","cons":"$5 more per connector","consVi":"Thêm $5/đầu nối"}]'::jsonb,
   'B',
   'Safety critical — arcing on power connector is unacceptable for field deployment. Gold plating eliminates the issue.',
   'An toàn quan trọng — phóng tia trên đầu nối nguồn không chấp nhận được khi triển khai thực địa. Mạ vàng loại bỏ vấn đề.',
   'BOM cost increase minimal, no timeline impact',
   '+$5/unit for gold-plated connectors',
   ARRAY['ISS-003'], ARRAY[]::TEXT[],
   'APPROVED'),

  ('DEC-004', 'PRJ-002',
   'Add vibration dampers to motor mounts',
   'Thêm đệm chống rung cho giá đỡ motor',
   '2026-02-12', 'Hồng Phúc', 'EVT',
   '[{"label":"A: Stiffen frame arms","pros":"Moves resonance freq higher","prosVi":"Dịch tần số cộng hưởng lên cao","cons":"Heavier frame, may not fix","consVi":"Khung nặng hơn, có thể không sửa được"},{"label":"B: Add rubber dampers to mounts","pros":"Isolates motor vibration","prosVi":"Cách ly rung motor","cons":"Slight motor alignment concern","consVi":"Lo ngại căn chỉnh motor nhẹ"},{"label":"C: Change propeller to different pitch","pros":"Avoids resonance RPM","prosVi":"Tránh RPM cộng hưởng","cons":"Reduces efficiency at cruise","consVi":"Giảm hiệu suất khi bay cruise"}]'::jsonb,
   'B',
   'FEA analysis confirms motor mount is the vibration path. Rubber dampers are proven solution from X7 project. Quick to implement.',
   'Phân tích FEA xác nhận giá đỡ motor là đường truyền rung. Đệm cao su là giải pháp đã chứng minh từ dự án X7. Triển khai nhanh.',
   '2 days for prototyping and test, minimal BOM impact',
   '+$3/unit for damper set',
   ARRAY['ISS-007'], ARRAY['FLT-010'],
   'PROPOSED'),

  ('DEC-005', 'PRJ-001',
   'Upgrade GPS module from u-blox M8 to F9P',
   'Nâng cấp GPS từ u-blox M8 lên F9P',
   '2025-09-15', 'Minh Tuấn', 'EVT',
   '[{"label":"A: Keep u-blox M8N","pros":"Cheap ($15), proven, sufficient for most survey","prosVi":"Rẻ ($15), đã chứng minh, đủ cho hầu hết khảo sát","cons":"2.5m accuracy, no RTK capability","consVi":"Độ chính xác 2.5m, không có RTK"},{"label":"B: u-blox F9P with RTK","pros":"2cm accuracy with RTK, future-proof","prosVi":"Độ chính xác 2cm với RTK, sẵn sàng tương lai","cons":"$320/unit, needs RTK base station","consVi":"$320/đơn vị, cần trạm RTK"},{"label":"C: Trimble BD940","pros":"Best accuracy (1cm), dual antenna heading","prosVi":"Độ chính xác tốt nhất (1cm), heading kép","cons":"$2,400/unit, overkill","consVi":"$2,400/đơn vị, quá mức cần"}]'::jsonb,
   'B',
   'Survey market trending toward cm-level accuracy. F9P at $320 is cost-effective for professional survey drones. RTK base station is one-time investment shared across fleet.',
   'Thị trường khảo sát hướng đến độ chính xác cm. F9P với $320 là hiệu quả chi phí cho drone khảo sát. Trạm RTK đầu tư 1 lần dùng chung.',
   'BOM cost +$305/unit. GPS mount redesign needed.',
   '+$305/unit BOM, +$3,500 RTK base station (one-time)',
   ARRAY[]::TEXT[], ARRAY['FLT-046'],
   'APPROVED'),

  ('DEC-006', 'PRJ-001',
   'Frame material: aluminum 6061 to carbon fiber composite',
   'Vật liệu khung: nhôm 6061 sang composite carbon fiber',
   '2025-06-20', 'Quỳnh Anh', 'CONCEPT',
   '[{"label":"A: Aluminum 6061-T6","pros":"Low tooling cost, easy to machine, repairable","prosVi":"Chi phí khuôn thấp, dễ gia công, sửa được","cons":"Heavy (1.2kg frame), vibration transmission","consVi":"Nặng (1.2kg khung), truyền rung"},{"label":"B: Carbon fiber composite","pros":"Light (0.65kg frame), vibration damping, professional look","prosVi":"Nhẹ (0.65kg khung), giảm rung, chuyên nghiệp","cons":"3x material cost, harder to repair","consVi":"3x chi phí vật liệu, khó sửa"},{"label":"C: Hybrid (CF arms + Al center)","pros":"Good compromise on weight and repairability","prosVi":"Thỏa hiệp tốt giữa trọng lượng và sửa chữa","cons":"Complex assembly, mixed thermal expansion","consVi":"Lắp ráp phức tạp, giãn nở nhiệt hỗn hợp"}]'::jsonb,
   'B',
   'For professional survey drone, weight directly impacts flight time and payload capacity. 550g savings = +15% flight time. CF also provides natural vibration damping critical for camera stability.',
   'Cho drone khảo sát chuyên nghiệp, trọng lượng ảnh hưởng trực tiếp đến thời gian bay. Giảm 550g = +15% thời gian bay. CF giảm rung tự nhiên, quan trọng cho camera.',
   'Frame supplier change. Need CF manufacturing capability.',
   '+$120/unit BOM',
   ARRAY[]::TEXT[], ARRAY[]::TEXT[],
   'APPROVED'),

  ('DEC-007', 'PRJ-002',
   'Select spray nozzle supplier: Nông Nghiệp Xanh over TeeJet import',
   'Chọn NCC đầu phun: Nông Nghiệp Xanh thay vì TeeJet nhập khẩu',
   '2025-12-05', 'Minh Tuấn', 'EVT',
   '[{"label":"A: TeeJet XR11004 (imported)","pros":"Industry standard, wide droplet range","prosVi":"Tiêu chuẩn ngành, dải giọt rộng","cons":"$28/nozzle, 4-6 week lead time from US","consVi":"$28/vòi, lead time 4-6 tuần từ Mỹ"},{"label":"B: Nông Nghiệp Xanh NX-110 (domestic)","pros":"$12/nozzle, 1 week lead time, Vietnamese support","prosVi":"$12/vòi, lead time 1 tuần, hỗ trợ tiếng Việt","cons":"Less brand recognition","consVi":"Ít được biết đến"}]'::jsonb,
   'B',
   'NX-110 tested equivalent to TeeJet for our flow rate range. 57% cost saving per nozzle x 4 nozzles = $64/drone saved. Lead time 4x faster. Domestic support critical for agricultural season deadlines.',
   'NX-110 test tương đương TeeJet. Tiết kiệm 57% mỗi đầu phun x 4 = $64/drone. Lead time nhanh gấp 4. Hỗ trợ nội địa quan trọng cho deadline mùa vụ.',
   'BOM cost -$64/unit. Supplier risk: single source',
   '-$64/unit BOM savings',
   ARRAY[]::TEXT[], ARRAY[]::TEXT[],
   'APPROVED'),

  ('DEC-008', 'PRJ-001',
   'Adopt MAVLink v2 as standard communication protocol',
   'Áp dụng MAVLink v2 làm giao thức truyền thông chuẩn',
   '2025-08-10', 'Quỳnh Anh', 'CONCEPT',
   '[{"label":"A: Custom protocol","pros":"Optimized for our hardware, minimal overhead","prosVi":"Tối ưu cho phần cứng của ta, overhead tối thiểu","cons":"Development cost, no ecosystem","consVi":"Chi phí phát triển, không hệ sinh thái"},{"label":"B: MAVLink v2","pros":"Industry standard, huge ecosystem, GCS compatibility","prosVi":"Tiêu chuẩn ngành, hệ sinh thái lớn, tương thích GCS","cons":"Some overhead, learning curve","consVi":"Một số overhead, đường cong học hỏi"},{"label":"C: DroneCAN/UAVCAN","pros":"Modern, CAN-bus native, type-safe","prosVi":"Hiện đại, CAN-bus native, type-safe","cons":"Smaller ecosystem, limited GCS","consVi":"Hệ sinh thái nhỏ hơn, GCS hạn chế"}]'::jsonb,
   'B',
   'MAVLink v2 is de facto standard. Ecosystem value (QGroundControl, Mission Planner) outweighs any protocol overhead. Applies to all RtR products.',
   'MAVLink v2 là tiêu chuẩn thực tế. Giá trị hệ sinh thái vượt xa overhead. Áp dụng cho tất cả sản phẩm RtR.',
   'Cross-project decision affecting all RtR drone platforms',
   '$0 (MAVLink is open source)',
   ARRAY['ISS-004'], ARRAY[]::TEXT[],
   'APPROVED'),

  ('DEC-009', 'PRJ-004',
   'IP67 seal redesign: silicone gasket replacing EPDM',
   'Thiết kế lại seal IP67: gasket silicone thay EPDM',
   '2026-02-20', 'Phạm Thu Trang', 'PVT',
   '[{"label":"A: Keep EPDM, add thermal shield","pros":"No gasket change, low cost","prosVi":"Không thay gasket, chi phí thấp","cons":"Doesn''t address root cause","consVi":"Không giải quyết nguyên nhân gốc"},{"label":"B: Switch to silicone (VMQ) gasket","pros":"Wider temp range (-60 to +230°C), no degradation","prosVi":"Dải nhiệt rộng hơn, không suy giảm","cons":"+$1.20/unit, 3 week lead time","consVi":"+$1.20/đơn vị, lead time 3 tuần"},{"label":"C: O-ring seal replacing gasket","pros":"Better compression set, standard sizes","prosVi":"Nén tốt hơn, kích thước chuẩn","cons":"Requires housing redesign, adds 4 weeks","consVi":"Cần thiết kế lại vỏ, thêm 4 tuần"}]'::jsonb,
   'B',
   'Silicone gasket is drop-in replacement — same dimensions as EPDM. Temp range covers all operating conditions. Minimal cost impact. Fastest path to unblocking PVT.',
   'Gasket silicone thay thế trực tiếp — cùng kích thước EPDM. Dải nhiệt bao phủ mọi điều kiện. Chi phí tăng tối thiểu. Nhanh nhất để mở khóa PVT.',
   'Unblocks ISS-017 (IP67 seal failure). PVT retest +1 week after sample arrival.',
   '+$1.20/unit BOM',
   ARRAY['ISS-017'], ARRAY[]::TEXT[],
   'PROPOSED'),

  ('DEC-010', 'PRJ-004',
   'Thermal camera selection: FLIR Lepton 3.5 over Boson 320',
   'Chọn camera nhiệt: FLIR Lepton 3.5 thay vì Boson 320',
   '2025-07-15', 'Phạm Thu Trang', 'EVT',
   '[{"label":"A: FLIR Lepton 3.5 (160x120)","pros":"ITAR-exempt, small, $240, SPI interface","prosVi":"Miễn ITAR, nhỏ gọn, $240, giao tiếp SPI","cons":"Lower resolution, ±5°C accuracy","consVi":"Độ phân giải thấp hơn, độ chính xác ±5°C"},{"label":"B: FLIR Boson 320 (320x256)","pros":"Higher resolution, ±3°C accuracy","prosVi":"Độ phân giải cao hơn, độ chính xác ±3°C","cons":"$800/unit, ITAR restricted, larger module","consVi":"$800/đơn vị, giới hạn ITAR, module lớn hơn"},{"label":"C: InfiRay Tiny1-C (256x192)","pros":"No ITAR, good resolution, $180","prosVi":"Không ITAR, độ phân giải tốt, $180","cons":"Chinese brand, limited SDK","consVi":"Thương hiệu TQ, SDK hạn chế"}]'::jsonb,
   'A',
   'ITAR exemption critical for Vietnamese manufacturing and potential export to ASEAN markets. Lepton 3.5 meets inspection requirements. Cost savings allow inclusion in standard configuration.',
   'Miễn ITAR quan trọng cho sản xuất tại Việt Nam và xuất khẩu ASEAN. Lepton 3.5 đáp ứng yêu cầu kiểm tra. Tiết kiệm cho cấu hình tiêu chuẩn.',
   'Camera module integration complete. ITAR compliance ensured.',
   '-$560/unit vs Boson option',
   ARRAY['ISS-015'], ARRAY[]::TEXT[],
   'APPROVED')
ON CONFLICT (id) DO NOTHING;

-- ===================================================================
-- 14. NOTIFICATIONS — SKIPPED
-- Requires user_id UUID referencing auth.users.
-- Seed notifications AFTER real Auth users are created.
-- ===================================================================

-- ===================================================================
-- 15. PROJECT_MEMBERS — SKIPPED
-- Schema: project_id, user_id (NOT NULL UUID), role_in_project
-- Cannot seed without real auth.users UUIDs.
-- Seed project_members AFTER real Auth users are created.
-- ===================================================================

-- ===================================================================
-- VERIFICATION QUERIES
-- ===================================================================
SELECT 'projects' AS "table", COUNT(*) AS row_count FROM projects
UNION ALL SELECT 'milestones', COUNT(*) FROM milestones
UNION ALL SELECT 'gate_conditions', COUNT(*) FROM gate_conditions
UNION ALL SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL SELECT 'issues', COUNT(*) FROM issues
UNION ALL SELECT 'issue_impacts', COUNT(*) FROM issue_impacts
UNION ALL SELECT 'issue_updates', COUNT(*) FROM issue_updates
UNION ALL SELECT 'bom_parts', COUNT(*) FROM bom_parts
UNION ALL SELECT 'delivery_records', COUNT(*) FROM delivery_records
UNION ALL SELECT 'flight_tests', COUNT(*) FROM flight_tests
UNION ALL SELECT 'flight_anomalies', COUNT(*) FROM flight_anomalies
UNION ALL SELECT 'flight_attachments', COUNT(*) FROM flight_attachments
UNION ALL SELECT 'decisions', COUNT(*) FROM decisions
ORDER BY "table";

-- Expected counts:
-- bom_parts:          53 (27 PRJ-001 + 26 PRJ-002)
-- decisions:          10
-- delivery_records:   28
-- flight_anomalies:   12
-- flight_attachments: 32
-- flight_tests:       18
-- gate_conditions:   135 (27 conditions x 5 projects)
-- issue_impacts:      19
-- issue_updates:      46
-- issues:             21
-- milestones:         25
-- projects:            5
-- suppliers:           8

-- ===================================================================
-- NOTE: The following tables require auth.users UUIDs and must be
-- seeded separately after Supabase Auth users are created:
--
--   notifications    — needs user_id (UUID) referencing auth.users
--   project_members  — needs user_id (NOT NULL UUID) referencing auth.users
--
-- See seed-after-auth.sql (to be created) for these inserts.
-- ===================================================================
