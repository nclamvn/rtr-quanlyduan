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

## Causal Agent

**Type:** LLM-powered (Anthropic Claude).
**Schedule:** Every 2 hours (`0 */2 * * *`).
**Runner:** `node src/intelligence/runCausal.js`

### How it works

1. Fetch high/urgent MRP signals from last 2 hours
2. Skip signals that already have an open causal alert (24h dedup)
3. For each signal, build context (same project entities, related parts, orders)
4. Call Haiku for causal chain analysis
5. If `needs_deep_analysis` → escalate to Sonnet
6. Persist alert via alertSink

### Model routing

| Model | When | Cost (approx) |
|-------|------|----------------|
| Haiku | Default for all signals | ~$0.001/signal |
| Sonnet | Cascade > 3 hops, multi-project, low confidence | ~$0.01/signal |

### Cost control

- Max 20 signals per run (configurable in `runCausal.js`)
- At worst: 20 signals × $0.01 (all Sonnet) = **$0.20/run**
- Typical: 5-10 signals × $0.001 (mostly Haiku) = **$0.005-0.01/run**
- Monthly estimate at 12 runs/day: **$1.80-3.60**

### Tuning

- `MAX_SIGNALS_PER_RUN` in runCausal.js (default 20)
- Temperature in llmRouter.js (default 0.3)
- Escalation: controlled by LLM's `needs_deep_analysis` field

### Failure modes

- **API key invalid/expired**: fails fast, logs to sync_runs
- **API rate limit**: individual signal errors logged, others continue
- **Parse error**: alert created with `parse_error: true`, severity info

### Deploy

```bash
# Crontab — every 2 hours
0 */2 * * * set -a && . /path/to/.env && node /path/to/src/intelligence/runCausal.js >> /var/log/causal.log 2>&1
```

Env vars needed: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `ANTHROPIC_API_KEY`

## LLM Router

Shared utility (`llmRouter.js`) for all LLM-powered agents:
- `callLLM(system, user, options)` — single call with cost tracking
- `callWithEscalation(system, user, deepSuffix)` — Haiku → Sonnet auto-escalation

## Planned Agents

- **Allocation Agent** (TIP-L2-03): LLM-powered assignee + deadline suggestion.
- **Dispatch Agent** (TIP-L2-04): Notification routing via email/Telegram.
