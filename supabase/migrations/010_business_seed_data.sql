-- ═══════════════════════════════════════════════════════════
-- SEED DATA 010: Business Operations
-- Run AFTER migration 009_business_operations.sql
-- ~173 rows across 9 tables
-- ═══════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════
-- 1. CUSTOMERS (8 rows)
-- ══════════════════════════════════════════════
INSERT INTO public.customers (id, code, name, type, country, contact_name, contact_email, contact_phone, payment_terms, notes) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'CUST-001', 'US Army PEO Aviation', 'GOVERNMENT', 'US', 'Col. James Mitchell', 'j.mitchell@army.mil', '+1-256-876-5432', 'NET60', 'Primary defense contract — Hera X7 program'),
  ('c0000001-0000-0000-0000-000000000002', 'CUST-002', 'RMUS (Robotics & More US)', 'DISTRIBUTOR', 'US', 'Sarah Chen', 'sarah@rmus.com', '+1-408-555-1234', 'NET30', 'West Coast distributor — commercial drones'),
  ('c0000001-0000-0000-0000-000000000003', 'CUST-003', 'UC Davis AgTech Lab', 'UNIVERSITY', 'US', 'Dr. Maria Gonzalez', 'mgonzalez@ucdavis.edu', '+1-530-752-0100', 'NET30', 'Research partnership — agricultural survey'),
  ('c0000001-0000-0000-0000-000000000004', 'CUST-004', 'DHS CBP Air & Marine', 'GOVERNMENT', 'US', 'Agent Robert Kim', 'r.kim@cbp.dhs.gov', '+1-202-325-8000', 'NET60', 'Border surveillance contract'),
  ('c0000001-0000-0000-0000-000000000005', 'CUST-005', 'LAPD Air Support Division', 'GOVERNMENT', 'US', 'Lt. David Park', 'd.park@lapd.online', '+1-213-473-9800', 'NET30', 'Law enforcement drone program'),
  ('c0000001-0000-0000-0000-000000000006', 'CUST-006', 'RJM International', 'ENTERPRISE', 'AU', 'Michael Torres', 'mtorres@rjm.com.au', '+61-2-9876-5432', 'NET30', 'Mining inspection drones — APAC region'),
  ('c0000001-0000-0000-0000-000000000007', 'CUST-007', 'Korea DAPA (Defense Agency)', 'MILITARY', 'KR', 'Major Park Jun-ho', 'jpark@dapa.go.kr', '+82-2-2079-6000', 'NET90', 'Military reconnaissance RFQ'),
  ('c0000001-0000-0000-0000-000000000008', 'CUST-008', 'Saudi Aramco Inspection Div.', 'ENTERPRISE', 'SA', 'Ahmed Al-Rashidi', 'a.rashidi@aramco.com', '+966-13-880-0000', 'NET60', 'Oil infrastructure aerial inspection');

-- ══════════════════════════════════════════════
-- 2. ORDERS (12 rows)
-- ══════════════════════════════════════════════
INSERT INTO public.orders (id, order_number, customer_id, project_id, status, priority, order_date, po_number, po_date, required_delivery_date, promised_delivery_date, actual_delivery_date, shipping_method, total_amount, currency, payment_status, paid_amount, notes) VALUES
  -- 3 QUOTE
  ('d0000001-0000-0000-0000-000000000001', 'ORD-2026-001', 'c0000001-0000-0000-0000-000000000007', 'PRJ-003', 'QUOTE', 'HIGH', '2026-02-28', NULL, NULL, '2026-06-30', NULL, NULL, NULL, 850000.00, 'USD', 'UNPAID', 0, 'Korea DAPA recon drone RFQ — 5 units Hera X7 Recon'),
  ('d0000001-0000-0000-0000-000000000002', 'ORD-2026-002', 'c0000001-0000-0000-0000-000000000008', 'PRJ-002', 'QUOTE', 'NORMAL', '2026-03-01', NULL, NULL, '2026-08-15', NULL, NULL, NULL, 420000.00, 'USD', 'UNPAID', 0, 'Aramco inspection fleet — 3 units Hera X5 Survey'),
  ('d0000001-0000-0000-0000-000000000003', 'ORD-2026-003', 'c0000001-0000-0000-0000-000000000003', 'PRJ-002', 'QUOTE', 'LOW', '2026-03-05', NULL, NULL, '2026-09-01', NULL, NULL, NULL, 95000.00, 'USD', 'UNPAID', 0, 'UC Davis research — 1 unit + training package'),
  -- 2 PO_RECEIVED
  ('d0000001-0000-0000-0000-000000000004', 'ORD-2026-004', 'c0000001-0000-0000-0000-000000000001', 'PRJ-001', 'PO_RECEIVED', 'URGENT', '2026-01-15', 'W911QY-26-C-0042', '2026-01-20', '2026-04-30', '2026-05-15', NULL, 'AIR', 1200000.00, 'USD', 'UNPAID', 0, 'US Army — 10 Hera X7 Surveyor + spare kits'),
  ('d0000001-0000-0000-0000-000000000005', 'ORD-2026-005', 'c0000001-0000-0000-0000-000000000004', 'PRJ-001', 'PO_RECEIVED', 'HIGH', '2026-02-01', 'HSBP-26-D-00138', '2026-02-05', '2026-05-31', '2026-06-15', NULL, 'AIR', 360000.00, 'USD', 'UNPAID', 0, 'DHS — 3 Hera X7 Border Kit'),
  -- 2 IN_PRODUCTION
  ('d0000001-0000-0000-0000-000000000006', 'ORD-2025-010', 'c0000001-0000-0000-0000-000000000002', 'PRJ-001', 'IN_PRODUCTION', 'NORMAL', '2025-11-10', 'RMUS-PO-2025-087', '2025-11-15', '2026-03-15', '2026-03-20', NULL, 'GROUND', 240000.00, 'USD', 'PARTIAL', 120000.00, 'RMUS — 2 Hera X7 Commercial + training'),
  ('d0000001-0000-0000-0000-000000000007', 'ORD-2025-011', 'c0000001-0000-0000-0000-000000000005', 'PRJ-001', 'IN_PRODUCTION', 'HIGH', '2025-12-01', 'LAPD-AIR-2025-003', '2025-12-05', '2026-03-31', '2026-04-10', NULL, 'HAND_CARRY', 180000.00, 'USD', 'UNPAID', 0, 'LAPD — 1 Hera X7 LE Kit + operator training'),
  -- 2 SHIPPED
  ('d0000001-0000-0000-0000-000000000008', 'ORD-2025-008', 'c0000001-0000-0000-0000-000000000002', 'PRJ-001', 'SHIPPED', 'NORMAL', '2025-09-15', 'RMUS-PO-2025-062', '2025-09-20', '2025-12-15', '2025-12-10', NULL, 'GROUND', 120000.00, 'USD', 'PAID', 120000.00, 'RMUS — 1 Hera X7 demo unit'),
  ('d0000001-0000-0000-0000-000000000009', 'ORD-2025-009', 'c0000001-0000-0000-0000-000000000006', 'PRJ-002', 'SHIPPED', 'NORMAL', '2025-10-01', 'RJM-INT-2025-044', '2025-10-05', '2026-01-20', '2026-01-18', '2026-01-18', 'AIR', 280000.00, 'USD', 'PARTIAL', 140000.00, 'RJM — 2 Hera X5 Mining Inspection'),
  -- 2 DELIVERED
  ('d0000001-0000-0000-0000-000000000010', 'ORD-2025-005', 'c0000001-0000-0000-0000-000000000003', 'PRJ-002', 'DELIVERED', 'NORMAL', '2025-06-01', 'UCD-PO-2025-112', '2025-06-10', '2025-09-30', '2025-09-25', '2025-09-25', 'GROUND', 85000.00, 'USD', 'PAID', 85000.00, 'UC Davis — 1 research unit delivered'),
  ('d0000001-0000-0000-0000-000000000011', 'ORD-2025-006', 'c0000001-0000-0000-0000-000000000005', 'PRJ-001', 'DELIVERED', 'HIGH', '2025-07-15', 'LAPD-AIR-2025-001', '2025-07-20', '2025-11-30', '2025-11-28', '2025-11-28', 'HAND_CARRY', 175000.00, 'USD', 'PAID', 175000.00, 'LAPD — 1 pilot unit + training completed'),
  -- 1 PAID (fully complete)
  ('d0000001-0000-0000-0000-000000000012', 'ORD-2025-003', 'c0000001-0000-0000-0000-000000000001', 'PRJ-001', 'PAID', 'NORMAL', '2025-03-01', 'W911QY-25-C-0018', '2025-03-10', '2025-08-30', '2025-08-15', '2025-08-15', 'AIR', 520000.00, 'USD', 'PAID', 520000.00, 'US Army initial order — 4 Hera X7 eval units');

-- ══════════════════════════════════════════════
-- 3. ORDER ITEMS (20 rows)
-- ══════════════════════════════════════════════
INSERT INTO public.order_items (order_id, product_name, product_sku, description, quantity, unit_price, discount_percent) VALUES
  -- ORD-2026-001 (Korea — 5 recon)
  ('d0000001-0000-0000-0000-000000000001', 'Hera X7 Recon Kit', 'HERA-X7-RCN-KIT', 'Complete recon package with EO/IR gimbal', 5, 145000.00, 0),
  ('d0000001-0000-0000-0000-000000000001', 'Operator Training Package', 'TRN-OPR-5DAY', '5-day on-site training per unit', 5, 8000.00, 10),
  ('d0000001-0000-0000-0000-000000000001', 'Spare Propeller Set', 'SPR-PROP-X7', 'Set of 4 spare propellers', 10, 1200.00, 0),
  -- ORD-2026-004 (US Army — 10 surveyor)
  ('d0000001-0000-0000-0000-000000000004', 'Hera X7 Surveyor Kit', 'HERA-X7-SVY-KIT', 'Survey package with LiDAR + multispectral', 10, 98000.00, 5),
  ('d0000001-0000-0000-0000-000000000004', 'Field Maintenance Kit', 'MNT-FIELD-X7', 'Tools + common spare parts', 10, 4500.00, 0),
  ('d0000001-0000-0000-0000-000000000004', 'Annual Support Contract', 'SVC-ANNUAL-X7', '12-month support + firmware updates', 10, 12000.00, 0),
  -- ORD-2026-005 (DHS — 3 border)
  ('d0000001-0000-0000-0000-000000000005', 'Hera X7 Border Kit', 'HERA-X7-BDR-KIT', 'Night vision + thermal + long range', 3, 108000.00, 0),
  ('d0000001-0000-0000-0000-000000000005', 'GCS Station Upgrade', 'GCS-UPG-V2', 'Ruggedized ground control station', 3, 8500.00, 0),
  -- ORD-2025-010 (RMUS — 2 commercial)
  ('d0000001-0000-0000-0000-000000000006', 'Hera X7 Commercial', 'HERA-X7-COM', 'Standard commercial drone kit', 2, 85000.00, 0),
  ('d0000001-0000-0000-0000-000000000006', 'Operator Training (Remote)', 'TRN-OPR-REMOTE', '3-day remote training', 2, 5000.00, 0),
  ('d0000001-0000-0000-0000-000000000006', 'Extended Warranty 2yr', 'WRT-EXT-2YR', '2-year extended warranty', 2, 15000.00, 0),
  -- ORD-2025-011 (LAPD — 1 LE)
  ('d0000001-0000-0000-0000-000000000007', 'Hera X7 Law Enforcement Kit', 'HERA-X7-LE-KIT', 'Spotlight + speaker + thermal', 1, 135000.00, 0),
  ('d0000001-0000-0000-0000-000000000007', 'On-site Training 5-day', 'TRN-OPR-ONSITE', 'Customized LE operator training', 1, 12000.00, 0),
  ('d0000001-0000-0000-0000-000000000007', 'Spare Battery Pack (4x)', 'SPR-BATT-X7-4PK', '4 additional flight batteries', 2, 3200.00, 0),
  -- ORD-2025-008 (RMUS demo)
  ('d0000001-0000-0000-0000-000000000008', 'Hera X7 Demo Unit', 'HERA-X7-DEMO', 'Pre-production demo unit', 1, 95000.00, 15),
  ('d0000001-0000-0000-0000-000000000008', 'Demo Support Package', 'SVC-DEMO-3MO', '3-month demo support', 1, 8000.00, 0),
  -- ORD-2025-009 (RJM mining)
  ('d0000001-0000-0000-0000-000000000009', 'Hera X5 Mining Inspector', 'HERA-X5-MNG', 'Dust-resistant + thermal mapping', 2, 125000.00, 0),
  ('d0000001-0000-0000-0000-000000000009', 'Maintenance Contract 1yr', 'SVC-MNT-1YR', 'Annual maintenance + calibration', 2, 15000.00, 0),
  -- ORD-2025-005 (UC Davis research)
  ('d0000001-0000-0000-0000-000000000010', 'Hera X5 Research Package', 'HERA-X5-RSH', 'Custom payload bay + API access', 1, 78000.00, 0),
  ('d0000001-0000-0000-0000-000000000010', 'Academic License', 'LIC-ACADEMIC', 'Research use license + SDK', 1, 7000.00, 0);

-- ══════════════════════════════════════════════
-- 4. PRODUCTION ORDERS (10 rows)
-- ══════════════════════════════════════════════
INSERT INTO public.production_orders (id, wo_number, order_id, project_id, product_name, quantity, status, priority, planned_start, planned_end, actual_start, actual_end, current_station, assigned_to, yield_quantity, defect_quantity, defect_notes, notes) VALUES
  ('e0000001-0000-0000-0000-000000000001', 'WO-2026-001', 'd0000001-0000-0000-0000-000000000004', 'PRJ-001', 'Hera X7 Surveyor', 10, 'PLANNED', 'URGENT', '2026-03-15', '2026-04-30', NULL, NULL, NULL, 'Team Alpha', 0, 0, NULL, 'US Army batch — 10 units'),
  ('e0000001-0000-0000-0000-000000000002', 'WO-2026-002', 'd0000001-0000-0000-0000-000000000005', 'PRJ-001', 'Hera X7 Border', 3, 'MATERIAL_READY', 'HIGH', '2026-03-10', '2026-04-15', NULL, NULL, NULL, 'Team Alpha', 0, 0, NULL, 'DHS border kit — 3 units'),
  ('e0000001-0000-0000-0000-000000000003', 'WO-2025-010', 'd0000001-0000-0000-0000-000000000006', 'PRJ-001', 'Hera X7 Commercial', 2, 'IN_PROGRESS', 'NORMAL', '2026-01-15', '2026-03-10', '2026-01-18', NULL, 'CALIBRATION', 'Team Beta', 1, 0, NULL, 'RMUS commercial — 2 units, 1 at calibration'),
  ('e0000001-0000-0000-0000-000000000004', 'WO-2025-011', 'd0000001-0000-0000-0000-000000000007', 'PRJ-001', 'Hera X7 LE Kit', 1, 'IN_PROGRESS', 'HIGH', '2026-01-20', '2026-03-25', '2026-01-22', NULL, 'FIRMWARE', 'Team Beta', 0, 0, NULL, 'LAPD LE kit — firmware customization'),
  ('e0000001-0000-0000-0000-000000000005', 'WO-2025-008', 'd0000001-0000-0000-0000-000000000008', 'PRJ-001', 'Hera X7 Demo', 1, 'COMPLETED', 'NORMAL', '2025-10-01', '2025-11-30', '2025-10-05', '2025-11-25', NULL, 'Team Alpha', 1, 0, NULL, 'RMUS demo — completed early'),
  ('e0000001-0000-0000-0000-000000000006', 'WO-2025-009', 'd0000001-0000-0000-0000-000000000009', 'PRJ-002', 'Hera X5 Mining', 2, 'COMPLETED', 'NORMAL', '2025-10-15', '2025-12-30', '2025-10-18', '2026-01-05', NULL, 'Team Gamma', 2, 0, NULL, 'RJM mining — 2 units completed'),
  ('e0000001-0000-0000-0000-000000000007', 'WO-2025-005', 'd0000001-0000-0000-0000-000000000010', 'PRJ-002', 'Hera X5 Research', 1, 'COMPLETED', 'NORMAL', '2025-07-01', '2025-09-15', '2025-07-05', '2025-09-10', NULL, 'Team Gamma', 1, 0, NULL, 'UC Davis research unit — delivered'),
  ('e0000001-0000-0000-0000-000000000008', 'WO-2025-006', 'd0000001-0000-0000-0000-000000000011', 'PRJ-001', 'Hera X7 LE Pilot', 1, 'SHIPPED', 'HIGH', '2025-08-15', '2025-11-15', '2025-08-20', '2025-11-10', NULL, 'Team Alpha', 1, 0, NULL, 'LAPD pilot unit — shipped'),
  ('e0000001-0000-0000-0000-000000000009', 'WO-2025-003', 'd0000001-0000-0000-0000-000000000012', 'PRJ-001', 'Hera X7 Eval', 4, 'SHIPPED', 'NORMAL', '2025-04-01', '2025-07-30', '2025-04-05', '2025-08-02', NULL, 'Team Alpha', 4, 0, NULL, 'US Army eval — 4 units, slight delay'),
  ('e0000001-0000-0000-0000-000000000010', 'WO-2026-003', NULL, 'PRJ-004', 'Hera X9 Prototype', 2, 'QC', 'URGENT', '2026-02-01', '2026-03-15', '2026-02-03', NULL, 'QC', 'Team Alpha', 1, 1, 'Unit #2 gimbal vibration at high altitude', 'X9 prototype — 1/2 passed QC');

-- ══════════════════════════════════════════════
-- 5. PRODUCTION LOGS (30 rows)
-- ══════════════════════════════════════════════
INSERT INTO public.production_logs (production_order_id, station, action, quantity_processed, quantity_passed, quantity_failed, operator, duration_minutes, notes, logged_at) VALUES
  -- WO-2025-010 (2 commercial units — in progress)
  ('e0000001-0000-0000-0000-000000000003', 'SMT', 'STARTED', 2, 0, 0, 'Nguyễn Văn A', 0, 'PCB SMT started', '2026-01-18 08:00:00+07'),
  ('e0000001-0000-0000-0000-000000000003', 'SMT', 'COMPLETED', 2, 2, 0, 'Nguyễn Văn A', 480, 'All boards passed AOI', '2026-01-20 16:00:00+07'),
  ('e0000001-0000-0000-0000-000000000003', 'ASSEMBLY', 'STARTED', 2, 0, 0, 'Trần Thị B', 0, 'Mechanical assembly started', '2026-01-22 08:00:00+07'),
  ('e0000001-0000-0000-0000-000000000003', 'ASSEMBLY', 'COMPLETED', 2, 2, 0, 'Trần Thị B', 960, 'Frame + motor + ESC installed', '2026-02-01 16:00:00+07'),
  ('e0000001-0000-0000-0000-000000000003', 'FIRMWARE', 'STARTED', 2, 0, 0, 'Lê Văn C', 0, 'Firmware flash + config', '2026-02-03 08:00:00+07'),
  ('e0000001-0000-0000-0000-000000000003', 'FIRMWARE', 'COMPLETED', 2, 2, 0, 'Lê Văn C', 240, 'v2.4.1 flashed, telemetry OK', '2026-02-05 12:00:00+07'),
  ('e0000001-0000-0000-0000-000000000003', 'CALIBRATION', 'STARTED', 2, 0, 0, 'Phạm Thị D', 0, 'IMU + compass calibration', '2026-02-06 08:00:00+07'),
  ('e0000001-0000-0000-0000-000000000003', 'CALIBRATION', 'COMPLETED', 1, 1, 0, 'Phạm Thị D', 180, 'Unit 1 calibrated, unit 2 pending', '2026-02-07 14:00:00+07'),
  -- WO-2025-011 (1 LAPD LE — in progress at firmware)
  ('e0000001-0000-0000-0000-000000000004', 'SMT', 'STARTED', 1, 0, 0, 'Nguyễn Văn A', 0, NULL, '2026-01-22 08:00:00+07'),
  ('e0000001-0000-0000-0000-000000000004', 'SMT', 'COMPLETED', 1, 1, 0, 'Nguyễn Văn A', 240, NULL, '2026-01-23 16:00:00+07'),
  ('e0000001-0000-0000-0000-000000000004', 'ASSEMBLY', 'STARTED', 1, 0, 0, 'Trần Thị B', 0, 'LE custom payload mount', '2026-01-25 08:00:00+07'),
  ('e0000001-0000-0000-0000-000000000004', 'ASSEMBLY', 'COMPLETED', 1, 1, 0, 'Trần Thị B', 600, 'Spotlight + speaker brackets installed', '2026-02-05 16:00:00+07'),
  ('e0000001-0000-0000-0000-000000000004', 'FIRMWARE', 'STARTED', 1, 0, 0, 'Lê Văn C', 0, 'LE mode firmware customization', '2026-02-10 08:00:00+07'),
  -- WO-2025-008 (demo — completed)
  ('e0000001-0000-0000-0000-000000000005', 'SMT', 'COMPLETED', 1, 1, 0, 'Nguyễn Văn A', 240, NULL, '2025-10-08 16:00:00+07'),
  ('e0000001-0000-0000-0000-000000000005', 'ASSEMBLY', 'COMPLETED', 1, 1, 0, 'Trần Thị B', 480, NULL, '2025-10-18 16:00:00+07'),
  ('e0000001-0000-0000-0000-000000000005', 'FIRMWARE', 'COMPLETED', 1, 1, 0, 'Lê Văn C', 120, NULL, '2025-10-21 16:00:00+07'),
  ('e0000001-0000-0000-0000-000000000005', 'CALIBRATION', 'COMPLETED', 1, 1, 0, 'Phạm Thị D', 180, NULL, '2025-10-24 16:00:00+07'),
  ('e0000001-0000-0000-0000-000000000005', 'FLIGHT_TEST', 'COMPLETED', 1, 1, 0, 'Hải Nam', 300, 'All tests passed', '2025-11-01 16:00:00+07'),
  ('e0000001-0000-0000-0000-000000000005', 'QC', 'PASSED_QC', 1, 1, 0, 'QC Team', 120, 'Final inspection passed', '2025-11-05 16:00:00+07'),
  ('e0000001-0000-0000-0000-000000000005', 'PACKING', 'COMPLETED', 1, 1, 0, 'Logistics', 60, 'Packed and ready for shipping', '2025-11-08 16:00:00+07'),
  -- WO-2026-003 (X9 prototype — QC with 1 defect)
  ('e0000001-0000-0000-0000-000000000010', 'SMT', 'COMPLETED', 2, 2, 0, 'Nguyễn Văn A', 600, 'X9 new board design', '2026-02-08 16:00:00+07'),
  ('e0000001-0000-0000-0000-000000000010', 'ASSEMBLY', 'COMPLETED', 2, 2, 0, 'Trần Thị B', 1200, 'Prototype assembly — custom jigs', '2026-02-20 16:00:00+07'),
  ('e0000001-0000-0000-0000-000000000010', 'FIRMWARE', 'COMPLETED', 2, 2, 0, 'Lê Văn C', 480, 'X9 firmware v0.9-beta', '2026-02-26 16:00:00+07'),
  ('e0000001-0000-0000-0000-000000000010', 'CALIBRATION', 'COMPLETED', 2, 2, 0, 'Phạm Thị D', 360, NULL, '2026-03-01 16:00:00+07'),
  ('e0000001-0000-0000-0000-000000000010', 'FLIGHT_TEST', 'COMPLETED', 2, 2, 0, 'Hải Nam', 600, 'Both units flew, unit 2 gimbal issue noted', '2026-03-05 16:00:00+07'),
  ('e0000001-0000-0000-0000-000000000010', 'QC', 'PASSED_QC', 1, 1, 0, 'QC Team', 120, 'Unit 1 passed all checks', '2026-03-07 10:00:00+07'),
  ('e0000001-0000-0000-0000-000000000010', 'QC', 'FAILED_QC', 1, 0, 1, 'QC Team', 120, 'Unit 2: gimbal vibration > spec at 400m AGL', '2026-03-07 14:00:00+07'),
  -- WO-2025-009 (RJM mining — completed)
  ('e0000001-0000-0000-0000-000000000006', 'ASSEMBLY', 'COMPLETED', 2, 2, 0, 'Team Gamma', 960, 'Dust-sealed assembly', '2025-11-15 16:00:00+07'),
  ('e0000001-0000-0000-0000-000000000006', 'QC', 'PASSED_QC', 2, 2, 0, 'QC Team', 240, 'IP55 test passed', '2025-12-10 16:00:00+07'),
  ('e0000001-0000-0000-0000-000000000006', 'PACKING', 'COMPLETED', 2, 2, 0, 'Logistics', 120, 'Export packaging for AU', '2025-12-20 16:00:00+07');

-- ══════════════════════════════════════════════
-- 6. INVENTORY (25 rows)
-- ══════════════════════════════════════════════
INSERT INTO public.inventory (id, part_number, part_name, category, warehouse, location, quantity_on_hand, quantity_reserved, quantity_on_order, unit, unit_cost, min_stock, max_stock, reorder_quantity, lead_time_days, supplier_id, notes) VALUES
  -- Motors & Propulsion
  ('f0000001-0000-0000-0000-000000000001', 'RTR-MOT-001', 'T-Motor U8II KV100', 'ELECTRICAL', 'HCM-MAIN', 'A1-B2', 48, 24, 0, 'pcs', 185.00, 20, 100, 40, 21, 'SUP-001', 'Main propulsion motor'),
  ('f0000001-0000-0000-0000-000000000002', 'RTR-ESC-001', 'Flame 80A HV ESC', 'ELECTRICAL', 'HCM-MAIN', 'A1-C3', 52, 24, 0, 'pcs', 95.00, 20, 100, 40, 14, 'SUP-001', 'ESC for T-Motor U8II'),
  ('f0000001-0000-0000-0000-000000000003', 'RTR-PROP-001', 'T28x9.2 CF Propeller', 'MECHANICAL', 'HCM-MAIN', 'A2-A1', 120, 40, 60, 'pcs', 42.00, 40, 200, 80, 14, 'SUP-001', 'Pair: CW + CCW'),
  -- Flight Controller & Sensors
  ('f0000001-0000-0000-0000-000000000004', 'RTR-FC-001', 'Cube Orange+ FC', 'ELECTRICAL', 'HCM-MAIN', 'B1-A1', 15, 10, 5, 'pcs', 320.00, 5, 30, 10, 28, 'SUP-002', 'Primary flight controller'),
  ('f0000001-0000-0000-0000-000000000005', 'RTR-GPS-001', 'Here3+ RTK GPS', 'ELECTRICAL', 'HCM-MAIN', 'B1-A2', 18, 10, 0, 'pcs', 280.00, 5, 30, 10, 28, 'SUP-002', 'RTK-capable GPS module'),
  ('f0000001-0000-0000-0000-000000000006', 'RTR-IMU-001', 'ICM-42688-P IMU', 'ELECTRICAL', 'HCM-MAIN', 'B1-B1', 30, 10, 0, 'pcs', 18.50, 10, 50, 20, 42, 'SUP-004', 'Triple redundant IMU'),
  -- Frame & Structure
  ('f0000001-0000-0000-0000-000000000007', 'RTR-FRM-001', 'X7 Carbon Frame Kit', 'MECHANICAL', 'HCM-MAIN', 'C1-A1', 8, 5, 10, 'sets', 450.00, 5, 20, 10, 35, NULL, 'Custom CF frame — in-house design'),
  ('f0000001-0000-0000-0000-000000000008', 'RTR-ARM-001', 'X7 Folding Arm Assy', 'MECHANICAL', 'HCM-MAIN', 'C1-B1', 32, 20, 0, 'pcs', 85.00, 12, 60, 24, 35, NULL, '4 per drone, folding mechanism'),
  ('f0000001-0000-0000-0000-000000000009', 'RTR-LDG-001', 'X7 Landing Gear', 'MECHANICAL', 'HCM-MAIN', 'C1-C1', 20, 10, 0, 'sets', 65.00, 5, 30, 10, 21, NULL, 'Retractable landing gear set'),
  -- Batteries & Power
  ('f0000001-0000-0000-0000-000000000010', 'RTR-BAT-001', 'Tattu 22000mAh 6S', 'ELECTRICAL', 'HCM-MAIN', 'D1-A1', 24, 12, 12, 'pcs', 320.00, 10, 40, 15, 14, 'SUP-003', 'Main flight battery'),
  ('f0000001-0000-0000-0000-000000000011', 'RTR-CHG-001', 'iSDT Q8 Max Charger', 'ELECTRICAL', 'HCM-MAIN', 'D1-B1', 10, 2, 0, 'pcs', 185.00, 3, 15, 5, 14, 'SUP-003', 'Dual-channel smart charger'),
  ('f0000001-0000-0000-0000-000000000012', 'RTR-PDB-001', 'Custom PDB v3.2', 'ELECTRICAL', 'HCM-MAIN', 'B2-A1', 25, 10, 0, 'pcs', 45.00, 10, 40, 15, 7, NULL, 'In-house power distribution board'),
  -- Cameras & Payloads
  ('f0000001-0000-0000-0000-000000000013', 'RTR-CAM-001', 'Sony A7R IV Body', 'ELECTRICAL', 'HCM-LAB', 'LAB-A1', 5, 3, 2, 'pcs', 2800.00, 2, 8, 3, 14, 'SUP-006', 'Survey camera — 61MP'),
  ('f0000001-0000-0000-0000-000000000014', 'RTR-GMB-001', 'Gremsy T7 Gimbal', 'MECHANICAL', 'HCM-LAB', 'LAB-A2', 6, 3, 0, 'pcs', 1950.00, 2, 10, 4, 28, 'SUP-005', '3-axis stabilized gimbal'),
  ('f0000001-0000-0000-0000-000000000015', 'RTR-LDR-001', 'Livox Avia LiDAR', 'ELECTRICAL', 'HCM-LAB', 'LAB-B1', 3, 2, 2, 'pcs', 8500.00, 1, 5, 2, 42, 'SUP-007', 'Point cloud mapping'),
  -- Comms & Telemetry
  ('f0000001-0000-0000-0000-000000000016', 'RTR-TEL-001', 'RFD900x Telemetry', 'ELECTRICAL', 'HCM-MAIN', 'B2-B1', 20, 10, 0, 'pcs', 210.00, 5, 30, 10, 21, 'SUP-002', 'Long-range telemetry radio'),
  ('f0000001-0000-0000-0000-000000000017', 'RTR-VTX-001', 'DJI O3 Air Unit', 'ELECTRICAL', 'HCM-MAIN', 'B2-B2', 15, 5, 10, 'pcs', 180.00, 5, 25, 10, 14, NULL, 'HD video transmission'),
  -- Connectors & Consumables
  ('f0000001-0000-0000-0000-000000000018', 'RTR-CON-001', 'XT90 Connector Pair', 'ELECTRICAL', 'HCM-MAIN', 'E1-A1', 200, 40, 0, 'pcs', 2.50, 50, 300, 100, 7, NULL, 'Main battery connector'),
  ('f0000001-0000-0000-0000-000000000019', 'RTR-WIR-001', '12AWG Silicone Wire (red)', 'CONSUMABLE', 'HCM-MAIN', 'E1-B1', 150, 20, 0, 'meters', 1.80, 30, 200, 50, 7, NULL, 'Power wire'),
  ('f0000001-0000-0000-0000-000000000020', 'RTR-WIR-002', '12AWG Silicone Wire (black)', 'CONSUMABLE', 'HCM-MAIN', 'E1-B2', 150, 20, 0, 'meters', 1.80, 30, 200, 50, 7, NULL, 'Power wire'),
  ('f0000001-0000-0000-0000-000000000021', 'RTR-HSK-001', 'Heat Shrink Tubing Kit', 'CONSUMABLE', 'HCM-MAIN', 'E1-C1', 80, 10, 0, 'sets', 5.50, 20, 100, 30, 7, NULL, 'Assorted sizes'),
  ('f0000001-0000-0000-0000-000000000022', 'RTR-SCR-001', 'M3 Stainless Screw Kit', 'MECHANICAL', 'HCM-MAIN', 'E2-A1', 500, 50, 0, 'pcs', 0.15, 100, 1000, 200, 7, NULL, 'M3x8, M3x12, M3x16 assorted'),
  ('f0000001-0000-0000-0000-000000000023', 'RTR-LOC-001', 'Loctite 243 (50ml)', 'CONSUMABLE', 'HCM-MAIN', 'E2-B1', 12, 0, 0, 'bottles', 18.00, 3, 20, 5, 7, NULL, 'Medium-strength threadlocker'),
  -- LOW STOCK items (for testing alerts)
  ('f0000001-0000-0000-0000-000000000024', 'RTR-ANT-001', 'GPS Antenna Patch', 'ELECTRICAL', 'HCM-MAIN', 'B1-C1', 3, 3, 5, 'pcs', 35.00, 5, 20, 10, 28, 'SUP-002', 'LOW STOCK — waiting for shipment'),
  ('f0000001-0000-0000-0000-000000000025', 'RTR-BRG-001', 'Motor Bearing 6205', 'MECHANICAL', 'HCM-MAIN', 'A1-D1', 2, 4, 10, 'pcs', 12.00, 8, 40, 20, 21, NULL, 'CRITICAL — reserved > on hand');

-- ══════════════════════════════════════════════
-- 7. INVENTORY TRANSACTIONS (40 rows)
-- ══════════════════════════════════════════════
INSERT INTO public.inventory_transactions (inventory_id, type, quantity, reference_type, reference_id, reason, performed_by, transaction_date) VALUES
  -- Motors IN
  ('f0000001-0000-0000-0000-000000000001', 'IN', 40, 'PO', 'PO-SUP001-2025-08', 'Restock from T-Motor', 'Warehouse Team', '2025-10-15 09:00:00+07'),
  ('f0000001-0000-0000-0000-000000000001', 'IN', 20, 'PO', 'PO-SUP001-2026-01', 'Q1 2026 order', 'Warehouse Team', '2026-01-20 09:00:00+07'),
  ('f0000001-0000-0000-0000-000000000001', 'OUT', -6, 'WO', 'WO-2025-008', 'Demo unit production', 'Trần Thị B', '2025-10-10 10:00:00+07'),
  ('f0000001-0000-0000-0000-000000000001', 'OUT', -6, 'WO', 'WO-2025-010', 'RMUS commercial', 'Trần Thị B', '2026-01-22 10:00:00+07'),
  -- ESCs
  ('f0000001-0000-0000-0000-000000000002', 'IN', 40, 'PO', 'PO-SUP001-2025-08', 'Restock', 'Warehouse Team', '2025-10-15 09:00:00+07'),
  ('f0000001-0000-0000-0000-000000000002', 'IN', 20, 'PO', 'PO-SUP001-2026-01', 'Q1 order', 'Warehouse Team', '2026-01-20 09:00:00+07'),
  ('f0000001-0000-0000-0000-000000000002', 'OUT', -4, 'WO', 'WO-2025-008', 'Demo', 'Trần Thị B', '2025-10-10 10:00:00+07'),
  ('f0000001-0000-0000-0000-000000000002', 'OUT', -4, 'WO', 'WO-2025-010', 'RMUS', 'Trần Thị B', '2026-01-22 10:00:00+07'),
  -- Batteries
  ('f0000001-0000-0000-0000-000000000010', 'IN', 20, 'PO', 'PO-SUP003-2025-09', 'Tattu restock', 'Warehouse Team', '2025-09-25 09:00:00+07'),
  ('f0000001-0000-0000-0000-000000000010', 'IN', 12, 'PO', 'PO-SUP003-2026-01', 'Q1 batteries', 'Warehouse Team', '2026-01-15 09:00:00+07'),
  ('f0000001-0000-0000-0000-000000000010', 'OUT', -4, 'WO', 'WO-2025-008', 'Demo batteries', 'Trần Thị B', '2025-11-01 10:00:00+07'),
  ('f0000001-0000-0000-0000-000000000010', 'OUT', -4, 'WO', 'WO-2025-010', 'RMUS batteries', 'Trần Thị B', '2026-01-25 10:00:00+07'),
  -- Flight Controllers
  ('f0000001-0000-0000-0000-000000000004', 'IN', 10, 'PO', 'PO-SUP002-2025-08', 'CubeOrange+ restock', 'Warehouse Team', '2025-09-10 09:00:00+07'),
  ('f0000001-0000-0000-0000-000000000004', 'IN', 5, 'PO', 'PO-SUP002-2026-02', 'Emergency order', 'Warehouse Team', '2026-02-28 09:00:00+07'),
  ('f0000001-0000-0000-0000-000000000004', 'OUT', -1, 'WO', 'WO-2025-008', NULL, 'Lê Văn C', '2025-10-05 10:00:00+07'),
  ('f0000001-0000-0000-0000-000000000004', 'OUT', -2, 'WO', 'WO-2025-010', NULL, 'Lê Văn C', '2026-01-18 10:00:00+07'),
  -- Cameras
  ('f0000001-0000-0000-0000-000000000013', 'IN', 3, 'PO', 'PO-SUP006-2025-07', 'Sony A7R IV', 'Warehouse Team', '2025-08-01 09:00:00+07'),
  ('f0000001-0000-0000-0000-000000000013', 'IN', 2, 'PO', 'PO-SUP006-2025-11', NULL, 'Warehouse Team', '2025-12-01 09:00:00+07'),
  ('f0000001-0000-0000-0000-000000000013', 'OUT', -1, 'WO', 'WO-2025-008', 'Demo camera', 'Hải Nam', '2025-10-20 10:00:00+07'),
  -- LiDAR
  ('f0000001-0000-0000-0000-000000000015', 'IN', 2, 'PO', 'PO-SUP007-2025-06', 'Livox Avia initial', 'Warehouse Team', '2025-07-15 09:00:00+07'),
  ('f0000001-0000-0000-0000-000000000015', 'IN', 1, 'PO', 'PO-SUP007-2025-10', NULL, 'Warehouse Team', '2025-11-20 09:00:00+07'),
  ('f0000001-0000-0000-0000-000000000015', 'OUT', -1, 'WO', 'WO-2025-005', 'UC Davis LiDAR', 'Hải Nam', '2025-07-20 10:00:00+07'),
  -- Propellers
  ('f0000001-0000-0000-0000-000000000003', 'IN', 80, 'PO', 'PO-SUP001-2025-08', NULL, 'Warehouse Team', '2025-10-15 09:00:00+07'),
  ('f0000001-0000-0000-0000-000000000003', 'IN', 60, 'PO', 'PO-SUP001-2026-02', 'Q1 props', 'Warehouse Team', '2026-02-10 09:00:00+07'),
  ('f0000001-0000-0000-0000-000000000003', 'OUT', -8, 'WO', 'WO-2025-008', 'Demo props', 'Team Alpha', '2025-10-12 10:00:00+07'),
  ('f0000001-0000-0000-0000-000000000003', 'OUT', -16, 'WO', 'WO-2025-003', 'Army eval 4 units', 'Team Alpha', '2025-04-10 10:00:00+07'),
  ('f0000001-0000-0000-0000-000000000003', 'OUT', -16, 'WO', 'WO-2025-009', 'RJM mining', 'Team Gamma', '2025-10-20 10:00:00+07'),
  -- GPS Antenna (LOW STOCK)
  ('f0000001-0000-0000-0000-000000000024', 'IN', 10, 'PO', 'PO-SUP002-2025-08', NULL, 'Warehouse Team', '2025-09-10 09:00:00+07'),
  ('f0000001-0000-0000-0000-000000000024', 'OUT', -5, 'WO', 'WO-2025-003', 'Army eval', 'Lê Văn C', '2025-04-08 10:00:00+07'),
  ('f0000001-0000-0000-0000-000000000024', 'OUT', -2, 'WO', 'WO-2025-010', 'RMUS', 'Lê Văn C', '2026-01-20 10:00:00+07'),
  -- Motor Bearings (CRITICAL)
  ('f0000001-0000-0000-0000-000000000025', 'IN', 20, 'PO', 'PO-MISC-2025-03', NULL, 'Warehouse Team', '2025-04-01 09:00:00+07'),
  ('f0000001-0000-0000-0000-000000000025', 'OUT', -8, 'WO', 'WO-2025-003', NULL, 'Trần Thị B', '2025-04-10 10:00:00+07'),
  ('f0000001-0000-0000-0000-000000000025', 'OUT', -4, 'WO', 'WO-2025-008', NULL, 'Trần Thị B', '2025-10-10 10:00:00+07'),
  ('f0000001-0000-0000-0000-000000000025', 'OUT', -4, 'WO', 'WO-2025-009', NULL, 'Team Gamma', '2025-10-18 10:00:00+07'),
  ('f0000001-0000-0000-0000-000000000025', 'OUT', -2, 'WO', 'WO-2025-010', NULL, 'Trần Thị B', '2026-01-22 10:00:00+07'),
  -- Connectors (bulk)
  ('f0000001-0000-0000-0000-000000000018', 'IN', 200, 'PO', 'PO-MISC-2025-01', 'XT90 bulk order', 'Warehouse Team', '2025-03-01 09:00:00+07'),
  ('f0000001-0000-0000-0000-000000000018', 'OUT', -20, 'WO', 'WO-2025-003', NULL, 'Team Alpha', '2025-04-08 10:00:00+07'),
  ('f0000001-0000-0000-0000-000000000018', 'OUT', -10, 'WO', 'WO-2025-008', NULL, 'Trần Thị B', '2025-10-10 10:00:00+07'),
  -- Screws
  ('f0000001-0000-0000-0000-000000000022', 'IN', 500, 'PO', 'PO-MISC-2025-01', 'M3 assorted', 'Warehouse Team', '2025-03-01 09:00:00+07'),
  ('f0000001-0000-0000-0000-000000000022', 'OUT', -100, 'WO', 'WO-2025-003', NULL, 'Team Alpha', '2025-04-08 10:00:00+07');

-- ══════════════════════════════════════════════
-- 8. INVOICES (8 rows)
-- ══════════════════════════════════════════════
INSERT INTO public.invoices (id, invoice_number, order_id, customer_id, issue_date, due_date, subtotal, tax_amount, total_amount, paid_amount, status, notes) VALUES
  -- PAID invoices (matching delivered/paid orders)
  ('a1000001-0000-0000-0000-000000000001', 'INV-2025-001', 'd0000001-0000-0000-0000-000000000012', 'c0000001-0000-0000-0000-000000000001', '2025-08-20', '2025-10-20', 520000.00, 0, 520000.00, 520000.00, 'PAID', 'US Army eval — fully paid'),
  ('a1000001-0000-0000-0000-000000000002', 'INV-2025-002', 'd0000001-0000-0000-0000-000000000010', 'c0000001-0000-0000-0000-000000000003', '2025-09-30', '2025-10-30', 85000.00, 0, 85000.00, 85000.00, 'PAID', 'UC Davis research — paid on time'),
  ('a1000001-0000-0000-0000-000000000003', 'INV-2025-003', 'd0000001-0000-0000-0000-000000000011', 'c0000001-0000-0000-0000-000000000005', '2025-12-01', '2025-12-31', 175000.00, 0, 175000.00, 175000.00, 'PAID', 'LAPD pilot — paid'),
  ('a1000001-0000-0000-0000-000000000004', 'INV-2025-004', 'd0000001-0000-0000-0000-000000000008', 'c0000001-0000-0000-0000-000000000002', '2025-12-15', '2026-01-15', 120000.00, 0, 120000.00, 120000.00, 'PAID', 'RMUS demo — paid'),
  -- PARTIAL / SENT
  ('a1000001-0000-0000-0000-000000000005', 'INV-2026-001', 'd0000001-0000-0000-0000-000000000009', 'c0000001-0000-0000-0000-000000000006', '2026-01-20', '2026-02-20', 280000.00, 0, 280000.00, 140000.00, 'PARTIAL', 'RJM mining — 50% deposit paid'),
  ('a1000001-0000-0000-0000-000000000006', 'INV-2026-002', 'd0000001-0000-0000-0000-000000000006', 'c0000001-0000-0000-0000-000000000002', '2026-02-01', '2026-03-01', 240000.00, 0, 240000.00, 120000.00, 'PARTIAL', 'RMUS commercial — 50% milestone'),
  -- OVERDUE
  ('a1000001-0000-0000-0000-000000000007', 'INV-2026-003', 'd0000001-0000-0000-0000-000000000009', 'c0000001-0000-0000-0000-000000000006', '2026-01-25', '2026-02-25', 140000.00, 0, 140000.00, 0, 'OVERDUE', 'RJM mining balance — 12 days overdue'),
  -- DRAFT
  ('a1000001-0000-0000-0000-000000000008', 'INV-2026-004', 'd0000001-0000-0000-0000-000000000007', 'c0000001-0000-0000-0000-000000000005', '2026-03-09', '2026-04-09', 180000.00, 0, 180000.00, 0, 'DRAFT', 'LAPD LE kit — draft pending completion');

-- ══════════════════════════════════════════════
-- 9. COST ENTRIES (20 rows)
-- ══════════════════════════════════════════════
INSERT INTO public.cost_entries (production_order_id, project_id, category, description, amount, currency, date, vendor, notes) VALUES
  -- WO-2025-003 (Army eval — 4 units)
  ('e0000001-0000-0000-0000-000000000009', 'PRJ-001', 'MATERIAL', 'Motors + ESCs + Props (4 units)', 8400.00, 'USD', '2025-04-10', 'T-Motor', NULL),
  ('e0000001-0000-0000-0000-000000000009', 'PRJ-001', 'MATERIAL', 'Flight controllers + GPS (4 units)', 4800.00, 'USD', '2025-04-10', 'CubePilot', NULL),
  ('e0000001-0000-0000-0000-000000000009', 'PRJ-001', 'MATERIAL', 'Cameras + Gimbals (4 units)', 19000.00, 'USD', '2025-04-15', 'Sony / Gremsy', NULL),
  ('e0000001-0000-0000-0000-000000000009', 'PRJ-001', 'LABOR', 'Assembly labor (4 units × 40h)', 12800.00, 'USD', '2025-07-30', NULL, '4 units × 40h × $80/h'),
  ('e0000001-0000-0000-0000-000000000009', 'PRJ-001', 'OVERHEAD', 'Facility + utilities allocation', 3200.00, 'USD', '2025-07-30', NULL, NULL),
  ('e0000001-0000-0000-0000-000000000009', 'PRJ-001', 'SHIPPING', 'Air freight to Fort Novosel, AL', 4500.00, 'USD', '2025-08-10', 'DHL Express', NULL),
  -- WO-2025-008 (RMUS demo — 1 unit)
  ('e0000001-0000-0000-0000-000000000005', 'PRJ-001', 'MATERIAL', 'Full BOM for 1 demo unit', 12500.00, 'USD', '2025-10-15', 'Various', NULL),
  ('e0000001-0000-0000-0000-000000000005', 'PRJ-001', 'LABOR', 'Assembly + calibration', 4800.00, 'USD', '2025-11-25', NULL, NULL),
  ('e0000001-0000-0000-0000-000000000005', 'PRJ-001', 'SHIPPING', 'Ground ship to San Jose', 850.00, 'USD', '2025-12-01', 'FedEx', NULL),
  -- WO-2025-009 (RJM mining — 2 units)
  ('e0000001-0000-0000-0000-000000000006', 'PRJ-002', 'MATERIAL', 'X5 BOM × 2 + dust sealing', 18200.00, 'USD', '2025-11-01', 'Various', 'Extra IP55 sealing material'),
  ('e0000001-0000-0000-0000-000000000006', 'PRJ-002', 'LABOR', 'Assembly + dust-proof modification', 7200.00, 'USD', '2025-12-30', NULL, NULL),
  ('e0000001-0000-0000-0000-000000000006', 'PRJ-002', 'SHIPPING', 'Air freight to Sydney', 3800.00, 'USD', '2026-01-10', 'DHL Express', NULL),
  -- WO-2025-005 (UC Davis — 1 research)
  ('e0000001-0000-0000-0000-000000000007', 'PRJ-002', 'MATERIAL', 'X5 BOM + custom payload bay', 14500.00, 'USD', '2025-07-10', 'Various', NULL),
  ('e0000001-0000-0000-0000-000000000007', 'PRJ-002', 'LABOR', 'Custom integration + API setup', 5600.00, 'USD', '2025-09-10', NULL, NULL),
  ('e0000001-0000-0000-0000-000000000007', 'PRJ-002', 'TOOLING', 'Custom jigs for payload mount', 2200.00, 'USD', '2025-07-05', NULL, NULL),
  -- WO-2025-010 (RMUS commercial — 2 units, in progress)
  ('e0000001-0000-0000-0000-000000000003', 'PRJ-001', 'MATERIAL', 'Full BOM × 2 commercial units', 22000.00, 'USD', '2026-01-20', 'Various', NULL),
  ('e0000001-0000-0000-0000-000000000003', 'PRJ-001', 'LABOR', 'Assembly labor (in progress)', 6400.00, 'USD', '2026-02-28', NULL, 'Partial — still in calibration'),
  -- WO-2026-003 (X9 prototype — 2 units)
  ('e0000001-0000-0000-0000-000000000010', 'PRJ-004', 'MATERIAL', 'X9 prototype BOM × 2', 35000.00, 'USD', '2026-02-05', 'Various', 'New X9 design — higher cost'),
  ('e0000001-0000-0000-0000-000000000010', 'PRJ-004', 'LABOR', 'Prototype assembly + custom jigs', 14400.00, 'USD', '2026-03-05', NULL, '2 units × 60h × $120/h prototype rate'),
  ('e0000001-0000-0000-0000-000000000010', 'PRJ-004', 'TOOLING', 'X9-specific assembly fixtures', 8500.00, 'USD', '2026-02-01', 'In-house', 'CNC machined custom jigs');

-- ══════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ══════════════════════════════════════════════
-- Run these after migration to verify:
-- SELECT 'customers' AS tbl, COUNT(*) FROM customers
-- UNION ALL SELECT 'orders', COUNT(*) FROM orders
-- UNION ALL SELECT 'order_items', COUNT(*) FROM order_items
-- UNION ALL SELECT 'production_orders', COUNT(*) FROM production_orders
-- UNION ALL SELECT 'production_logs', COUNT(*) FROM production_logs
-- UNION ALL SELECT 'inventory', COUNT(*) FROM inventory
-- UNION ALL SELECT 'inventory_transactions', COUNT(*) FROM inventory_transactions
-- UNION ALL SELECT 'invoices', COUNT(*) FROM invoices
-- UNION ALL SELECT 'cost_entries', COUNT(*) FROM cost_entries;
-- Expected: 8 + 12 + 20 + 10 + 30 + 25 + 40 + 8 + 20 = 173 rows
--
-- SELECT * FROM finance_summary;
-- Should return 5 project rows with revenue/cost/margin data
