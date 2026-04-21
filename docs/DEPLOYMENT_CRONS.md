# Cron Deployment Runbook

## Overview — 6 cron jobs across 2 repos

| Job | Repo | Schedule | Env vars needed |
|-----|------|----------|-----------------|
| MRP Sync | RtR-ControlTower | `*/30 * * * *` | MRP_DB_*, SUPABASE_URL, SUPABASE_SERVICE_KEY |
| MRP Healthcheck | RtR-ControlTower | `*/15 * * * *` | SUPABASE_URL, SUPABASE_SERVICE_KEY |
| Convergence Agent | rtr-quanlyduan | `0 * * * *` | SUPABASE_URL, SUPABASE_SERVICE_KEY |
| Causal Agent | rtr-quanlyduan | `0 */2 * * *` | SUPABASE_URL, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY |
| Allocation Agent | rtr-quanlyduan | `30 * * * *` | SUPABASE_URL, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY |
| Dispatch Agent | rtr-quanlyduan | `*/15 * * * *` | SUPABASE_URL, SUPABASE_SERVICE_KEY |

Schedule stagger: Convergence at :00, Allocation at :30 — avoids concurrent alert writes.

## Render.com Setup

### Step 1: Connect repos

1. Go to [render.com](https://render.com) → New → **Blueprint**
2. Connect GitHub account if not already connected
3. Select repo: `nclamvn/rtr-quanlyduan`
4. Render detects `render.yaml` → shows 4 cron services
5. Click "Apply" to create all services
6. Repeat for `Real-Time-Robotics/RtR-ControlTower` (2 cron services)

### Step 2: Set environment variables

Each service has `sync: false` env vars — must be set manually in Render UI.

**For rtr-quanlyduan services:**

| Key | Where to find | Used by |
|-----|--------------|---------|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL | All 4 agents |
| `SUPABASE_SERVICE_KEY` | Supabase Dashboard → Settings → API → service_role key | All 4 agents |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys | Causal + Allocation only |

**For RtR-ControlTower services:**

| Key | Where to find | Used by |
|-----|--------------|---------|
| `MRP_DB_HOST` | MRP server address | MRP Sync |
| `MRP_DB_PORT` | Usually `5432` | MRP Sync |
| `MRP_DB_NAME` | Usually `rtr_mrp` | MRP Sync |
| `MRP_DB_USER` | MRP DB credentials | MRP Sync |
| `MRP_DB_PASSWORD` | MRP DB credentials | MRP Sync |
| `SUPABASE_URL` | Same as above | Both |
| `SUPABASE_SERVICE_KEY` | Same as above | Both |

### Step 3: Deploy

- Render builds + deploys each cron automatically after env vars are set
- First run: wait for next scheduled time, or click **"Trigger Run"** in Render dashboard
- Check logs: Render dashboard → select service → **Logs** tab

### Step 4: Verify (after 2-3 hours)

Run in Supabase SQL Editor:

```sql
SELECT source_app, status, entities_synced, duration_ms, started_at
FROM sync_runs
ORDER BY started_at DESC
LIMIT 20;
```

Expected `source_app` values:
- `MRP` — from MRP sync
- `convergence_agent` — from convergence
- `causal_agent` — from causal
- `allocation_agent` — from allocation
- `dispatch_agent` — from dispatch

All `status` should be `success` or `partial` (never all `failed`).

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Build fails | Verify `package.json` exists at repo root, `npm install` succeeds |
| Cron never triggers | Check Render plan supports cron, verify schedule syntax |
| All runs `failed` | Check env vars set correctly, check Supabase service_key valid |
| Causal/Allocation errors | Check `ANTHROPIC_API_KEY` set, check API quota at console.anthropic.com |
| Dispatch sends nothing | Normal if no alerts with `suggested_assignee` yet — pipeline needs upstream agents to run first |
| Cost spike on Anthropic | Check `sync_runs` for `sonnet_escalations` count, adjust `MAX_SIGNALS_PER_RUN` in runner |

## Pipeline dependency order

```
MRP Sync (every 30m)
  → cross_app_data populated
    → Convergence (every 1h at :00) detects patterns → alerts created
    → Causal (every 2h) traces root cause → alerts created
      → Allocation (every 1h at :30) suggests assignee → alerts updated
        → Dispatch (every 15m) sends notifications → alerts marked dispatched
```

First-run bootstrap: MRP sync must run at least once before agents produce useful output.
