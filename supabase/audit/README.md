# RLS Audit Runbook

## When to run
- After any security incident (key leak, repo exposure)
- After adding new tables or migrations
- Monthly as routine check

## How to run

1. Open Supabase Dashboard → SQL Editor
2. Paste contents of `rls_status.sql`
3. Run each query (4 sections)
4. Review output:

### What to look for

| Query | Expected | Action if unexpected |
|-------|----------|---------------------|
| **1. RLS status** | All tables `rls_enabled = true` | Enable RLS immediately on any `false` table |
| **2. RLS ON, no policies** | Empty result | Add policies or data is blocked entirely |
| **3. RLS OFF** | Empty result | CRITICAL: these tables are fully open to anon key |
| **4. Overly permissive** | Review each — `qual = true` on SELECT is often OK, on INSERT/UPDATE/DELETE needs justification | Tighten policy or add role checks |

### Severity guide

- **RLS OFF on any table with user data** → Fix within 1 hour
- **RLS OFF on system/config tables** → Fix within 24 hours
- **Overly permissive INSERT/UPDATE** → Review within 48 hours
- **Overly permissive SELECT** → Acceptable for read-only public data

### After fixing

Re-run `rls_status.sql` to verify. All 4 queries should show clean results.

## Tables expected in rtr-quanlyduan (22+)

Core: profiles, projects, milestones, project_members
Issues: issues, issue_impacts, issue_updates
BOM: bom_parts, suppliers, delivery_records
Flight: flight_tests, flight_anomalies, flight_attachments
System: decisions, notifications, audit_log, email_preferences
Data: cross_app_data, sync_runs
Intelligence: alerts, dispatch_log
