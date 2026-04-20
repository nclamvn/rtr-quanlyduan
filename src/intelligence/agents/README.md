# Agent Layer — RtR Control Tower Intelligence

Lớp agent chạy batch trên cross_app_data, phát hiện pattern và tạo alert.
Tách biệt với SignalHub kernel (chạy real-time trong browser).

## Architecture

```
cross_app_data (Supabase)
       │
       ▼
  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐    ┌──────────────┐
  │ Convergence  │    │   Causal     │    │  Allocation   │    │   Dispatch   │
  │ (statistical)│    │  (LLM trace) │    │ (LLM suggest) │    │ (notify)     │
  └──────┬───────┘    └──────┬───────┘    └───────┬───────┘    └──────┬───────┘
         │                   │                    │                   │
         ▼                   ▼                    ▼                   ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                        alertSink.js (dedup + persist)                 │
  └──────────────────────────────┬─────────────────────────────────────────┘
                                 ▼
                        alerts table (Supabase)
```

## Convergence Agent

**Type:** Statistical, no LLM.
**Schedule:** Every hour (`0 * * * *`).
**Runner:** `node src/intelligence/runConvergence.js`

### 3 Rules

| Rule | Trigger | Severity |
|------|---------|----------|
| **A — Project cluster** | ≥3 high/urgent signals on same project in 7 days | warning (≥3), critical (≥5) |
| **B — Welford anomaly** | Today's signal count > mean + 2σ for (source_app, entity_type) over 30 days | warning (z≥2), critical (z≥3) |
| **C — Stalled entity** | Work order past planned_end >14 days but not completed | warning |

### Tuning thresholds

Edit constants in `convergenceAgent.js`:
- Rule A: change `>= 3` / `>= 5` for warning/critical signal counts
- Rule B: change `z >= 2` / `z >= 3` for anomaly z-score thresholds, `count < 7` for minimum baseline days
- Rule C: change `14 * 24 * 3600 * 1000` for stall window

### Deploy

Same pattern as MRP sync (see DEPLOYMENT.md § MRP Sync Deployment):

```bash
# Crontab — every hour
0 * * * * set -a && . /path/to/.env && node /path/to/src/intelligence/runConvergence.js >> /var/log/convergence.log 2>&1
```

Env vars needed: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`

## Alert Sink

Shared persistence layer for all agents. Key behavior:
- **Dedup:** max 1 open alert per (agent, entity_ref) within 24h
- **Severity upgrade:** if new alert has higher severity than existing, severity is upgraded
- **No spam:** duplicate alerts within dedup window are skipped

## Planned Agents

- **Causal Agent** (TIP-L2-02): LLM-powered root cause tracing. Input: single signal. Output: causal chain.
- **Allocation Agent** (TIP-L2-03): LLM-powered assignee + deadline suggestion.
- **Dispatch Agent** (TIP-L2-04): Notification routing via email/Telegram.
