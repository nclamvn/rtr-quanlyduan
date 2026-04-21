-- ═══════════════════════════════════════════════════════════
-- RLS Audit — Run in Supabase Dashboard → SQL Editor
-- Checks all public tables for RLS status and policy gaps
-- ═══════════════════════════════════════════════════════════

-- 1. RLS status per table (sorted: OFF first = most urgent)
SELECT
  tablename,
  rowsecurity AS rls_enabled,
  (SELECT count(*) FROM pg_policies p
   WHERE p.schemaname = t.schemaname AND p.tablename = t.tablename) AS policy_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY rls_enabled ASC, tablename;

-- 2. Tables with RLS ON but NO policies (blocks all access — potentially broken)
SELECT tablename AS rls_on_but_no_policies
FROM pg_tables t
WHERE schemaname = 'public'
  AND rowsecurity = true
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = t.schemaname AND p.tablename = t.tablename
  );

-- 3. Tables with RLS OFF (fully open to anyone with anon key)
SELECT tablename AS rls_off_open_tables
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;

-- 4. Overly permissive policies (qual = true means no row filtering)
SELECT tablename, policyname, cmd, permissive, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND permissive = 'PERMISSIVE'
  AND (qual IS NULL OR qual::text = 'true')
ORDER BY tablename, policyname;
