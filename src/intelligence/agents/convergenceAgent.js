// ═══════════════════════════════════════════════════════════
// Convergence Agent — Statistical multi-signal detector
// Operates on cross_app_data rows, no LLM required
// ═══════════════════════════════════════════════════════════

/**
 * Detect convergence patterns in cross_app_data.
 *
 * @param {Array} rows - cross_app_data rows with synced_at, source_app, entity_type, entity_id, project_link, priority, status, data
 * @param {number} lookbackHours - window for Rule A (default 168 = 7 days)
 * @returns {Array} alerts - [{agent, severity, entity_ref, summary, details}]
 */
export function detectConvergence(rows, lookbackHours = 168) {
  const alerts = [];
  const now = Date.now();
  const lookbackMs = lookbackHours * 3600 * 1000;

  alerts.push(...ruleProjectCluster(rows, now, lookbackMs));
  alerts.push(...ruleWelfordAnomaly(rows, now));
  alerts.push(...ruleStalledEntity(rows, now));

  return alerts;
}

// ── Rule A: Same project cluster ─────────────────────────────────────
// ≥3 high/urgent signals on same project_link in lookback → warning
// ≥5 → critical
function ruleProjectCluster(rows, now, lookbackMs) {
  const cutoff = now - lookbackMs;
  const byProject = new Map();

  for (const row of rows) {
    if (!row.project_link) continue;
    const ts = new Date(row.synced_at).getTime();
    if (ts < cutoff) continue;
    if (row.priority !== "high" && row.priority !== "urgent") continue;

    if (!byProject.has(row.project_link)) {
      byProject.set(row.project_link, []);
    }
    byProject.get(row.project_link).push(row);
  }

  const alerts = [];
  for (const [project, signals] of byProject) {
    if (signals.length >= 5) {
      alerts.push({
        agent: "convergence",
        severity: "critical",
        entity_ref: project,
        summary: `${signals.length} high/urgent signals on ${project} in ${lookbackMs / 3600000}h — critical convergence`,
        details: {
          rule: "project_cluster",
          signalCount: signals.length,
          entityTypes: [...new Set(signals.map((s) => s.entity_type))],
          samples: signals.slice(0, 5).map((s) => ({ id: s.entity_id, type: s.entity_type, title: s.title })),
        },
      });
    } else if (signals.length >= 3) {
      alerts.push({
        agent: "convergence",
        severity: "warning",
        entity_ref: project,
        summary: `${signals.length} high/urgent signals on ${project} in ${lookbackMs / 3600000}h — warning convergence`,
        details: {
          rule: "project_cluster",
          signalCount: signals.length,
          entityTypes: [...new Set(signals.map((s) => s.entity_type))],
          samples: signals.slice(0, 5).map((s) => ({ id: s.entity_id, type: s.entity_type, title: s.title })),
        },
      });
    }
  }

  return alerts;
}

// ── Rule B: Welford anomaly ──────────────────────────────────────────
// For each (source_app, entity_type), compute mean+stdev of signals/day over 30d.
// If today > mean + 2*stdev → warning, > mean + 3*stdev → critical.
function ruleWelfordAnomaly(rows, now) {
  const thirtyDaysMs = 30 * 24 * 3600 * 1000;
  const cutoff = now - thirtyDaysMs;
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();

  // Group rows by (source_app, entity_type) and by day
  const groups = new Map();

  for (const row of rows) {
    const ts = new Date(row.synced_at).getTime();
    if (ts < cutoff) continue;

    const key = `${row.source_app}:${row.entity_type}`;
    if (!groups.has(key)) groups.set(key, new Map());

    const dayKey = new Date(ts).toISOString().slice(0, 10);
    const dayMap = groups.get(key);
    dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + 1);
  }

  const alerts = [];
  const todayKey = new Date(now).toISOString().slice(0, 10);

  for (const [groupKey, dayMap] of groups) {
    const todayCount = dayMap.get(todayKey) || 0;
    if (todayCount === 0) continue;

    // Welford online on all days except today
    let count = 0;
    let mean = 0;
    let m2 = 0;

    for (const [day, c] of dayMap) {
      if (day === todayKey) continue;
      count++;
      const delta = c - mean;
      mean += delta / count;
      m2 += delta * (c - mean);
    }

    if (count < 7) continue; // need baseline
    const stdev = Math.sqrt(m2 / (count - 1));
    if (stdev === 0) continue;

    const z = (todayCount - mean) / stdev;

    if (z >= 3) {
      alerts.push({
        agent: "convergence",
        severity: "critical",
        entity_ref: groupKey,
        summary: `${groupKey}: ${todayCount} today vs baseline ${mean.toFixed(1)}±${stdev.toFixed(1)} (z=${z.toFixed(1)}) — anomaly`,
        details: { rule: "welford_anomaly", todayCount, mean, stdev, zScore: z, baselineDays: count },
      });
    } else if (z >= 2) {
      alerts.push({
        agent: "convergence",
        severity: "warning",
        entity_ref: groupKey,
        summary: `${groupKey}: ${todayCount} today vs baseline ${mean.toFixed(1)}±${stdev.toFixed(1)} (z=${z.toFixed(1)}) — elevated`,
        details: { rule: "welford_anomaly", todayCount, mean, stdev, zScore: z, baselineDays: count },
      });
    }
  }

  return alerts;
}

// ── Rule C: Stalled entity ───────────────────────────────────────────
// work_order with same status for >14 days but synced_at keeps updating → stalled
function ruleStalledEntity(rows, now) {
  const fourteenDaysMs = 14 * 24 * 3600 * 1000;
  const cutoff = now - fourteenDaysMs;

  // Only look at work orders
  const workOrders = rows.filter((r) => r.entity_type === "work_order");

  // Group by entity_id, find ones synced recently but status unchanged
  const byEntity = new Map();
  for (const wo of workOrders) {
    const existing = byEntity.get(wo.entity_id);
    if (!existing || new Date(wo.synced_at) > new Date(existing.synced_at)) {
      byEntity.set(wo.entity_id, wo);
    }
  }

  const alerts = [];
  for (const [entityId, wo] of byEntity) {
    const syncedAt = new Date(wo.synced_at).getTime();
    // Recently synced but status is in-progress type and hasn't changed
    if (syncedAt < cutoff) continue;
    if (!wo.status || wo.status === "completed" || wo.status === "cancelled") continue;

    // Check data for staleness signals
    const data = wo.data || {};
    const plannedEnd = data.plannedEnd ? new Date(data.plannedEnd).getTime() : null;

    // If planned end was >14 days ago and still not completed → stalled
    if (plannedEnd && plannedEnd < cutoff && wo.status !== "completed") {
      alerts.push({
        agent: "convergence",
        severity: "warning",
        entity_ref: `MRP:work_order:${entityId}`,
        summary: `WO ${wo.title || entityId} planned end ${new Date(plannedEnd).toISOString().slice(0, 10)} but still "${wo.status}" — stalled`,
        details: {
          rule: "stalled_entity",
          entityId,
          title: wo.title,
          status: wo.status,
          plannedEnd: data.plannedEnd,
          daysPastDue: Math.round((now - plannedEnd) / 86400000),
        },
      });
    }
  }

  return alerts;
}
