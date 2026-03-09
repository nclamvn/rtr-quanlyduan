-- ═══════════════════════════════════════════════════════════════════
-- RtR Control Tower — UPDATE PROFILES (roles, names, departments)
-- ⚠️ Chạy SAU khi đã tạo 15 users trong Authentication → Users
-- Paste vào: Supabase Dashboard → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════════

-- ── ADMIN (1) ──
UPDATE public.profiles SET
  role = 'admin',
  full_name = 'Quỳnh Anh',
  full_name_vi = 'Quỳnh Anh',
  avatar_initials = 'QA',
  department = 'AI'
WHERE email = 'quynhanh@rtr.vn';

-- ── PROJECT MANAGERS (3) ──
UPDATE public.profiles SET
  role = 'pm',
  full_name = 'Minh Tuấn',
  full_name_vi = 'Minh Tuấn',
  avatar_initials = 'MT',
  department = 'R&D'
WHERE email = 'minhtuan@rtr.vn';

UPDATE public.profiles SET
  role = 'pm',
  full_name = 'Thu Trang',
  full_name_vi = 'Phạm Thu Trang',
  avatar_initials = 'TT',
  department = 'R&D'
WHERE email = 'thutrang@rtr.vn';

UPDATE public.profiles SET
  role = 'pm',
  full_name = 'Hồng Phúc',
  full_name_vi = 'Hồng Phúc',
  avatar_initials = 'HP',
  department = 'Operations'
WHERE email = 'hongphuc@rtr.vn';

-- ── ENGINEERS (9) ──
UPDATE public.profiles SET
  role = 'engineer',
  full_name = 'Đức Anh',
  full_name_vi = 'Đức Anh',
  avatar_initials = 'DA',
  department = 'Mechanical'
WHERE email = 'ducanh@rtr.vn';

UPDATE public.profiles SET
  role = 'engineer',
  full_name = 'Thanh Hà',
  full_name_vi = 'Thanh Hà',
  avatar_initials = 'TH',
  department = 'Electrical'
WHERE email = 'thanhha@rtr.vn';

UPDATE public.profiles SET
  role = 'engineer',
  full_name = 'Minh Khoa',
  full_name_vi = 'Minh Khoa',
  avatar_initials = 'MK',
  department = 'Software'
WHERE email = 'minhkhoa@rtr.vn';

UPDATE public.profiles SET
  role = 'engineer',
  full_name = 'Thị Phương',
  full_name_vi = 'Thị Phương',
  avatar_initials = 'TP',
  department = 'Avionics'
WHERE email = 'thiphuong@rtr.vn';

UPDATE public.profiles SET
  role = 'engineer',
  full_name = 'Hải Nam',
  full_name_vi = 'Hải Nam',
  avatar_initials = 'HN',
  department = 'Flight Test'
WHERE email = 'hainam@rtr.vn';

UPDATE public.profiles SET
  role = 'engineer',
  full_name = 'Đình Toàn',
  full_name_vi = 'Đình Toàn',
  avatar_initials = 'DT',
  department = 'Mechanical'
WHERE email = 'dinhtoan@rtr.vn';

UPDATE public.profiles SET
  role = 'engineer',
  full_name = 'Hoàng Sơn',
  full_name_vi = 'Hoàng Sơn',
  avatar_initials = 'HS',
  department = 'Quality'
WHERE email = 'hoangson@rtr.vn';

UPDATE public.profiles SET
  role = 'engineer',
  full_name = 'Quốc Việt',
  full_name_vi = 'Quốc Việt',
  avatar_initials = 'QV',
  department = 'Software'
WHERE email = 'quocviet@rtr.vn';

UPDATE public.profiles SET
  role = 'engineer',
  full_name = 'Văn Hùng',
  full_name_vi = 'Văn Hùng',
  avatar_initials = 'VH',
  department = 'Electrical'
WHERE email = 'vanhung@rtr.vn';

-- ── VIEWERS (2) ──
UPDATE public.profiles SET
  role = 'viewer',
  full_name = 'Lệ Hương',
  full_name_vi = 'Lệ Hương',
  avatar_initials = 'LH',
  department = 'Finance'
WHERE email = 'lehuong@rtr.vn';

UPDATE public.profiles SET
  role = 'viewer',
  full_name = 'Thanh Mai',
  full_name_vi = 'Thanh Mai',
  avatar_initials = 'TM',
  department = 'HR'
WHERE email = 'thanhmai@rtr.vn';

-- ═══════════════════════════════════════════════════════════════════
-- VERIFY — Chạy query này để kiểm tra kết quả
-- ═══════════════════════════════════════════════════════════════════

SELECT email, full_name, role, department, avatar_initials
FROM public.profiles
ORDER BY
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'pm' THEN 2
    WHEN 'engineer' THEN 3
    WHEN 'viewer' THEN 4
  END,
  full_name;

-- Kết quả mong đợi: 1 admin, 3 pm, 9 engineer, 2 viewer = 15 rows
-- ═══════════════════════════════════════════════════════════════════
