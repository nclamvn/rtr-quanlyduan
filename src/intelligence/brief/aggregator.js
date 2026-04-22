// ═══════════════════════════════════════════════════════════
// Weekly Data Aggregator — collects all context for CEO brief
// Pure data fetch, no LLM, no side effects
// ═══════════════════════════════════════════════════════════

/**
 * Aggregate one week of data for brief generation.
 *
 * @param {string} supabaseUrl
 * @param {string} supabaseKey
 * @param {string} periodStart - ISO date (Monday)
 * @param {string} periodEnd - ISO date (Sunday)
 * @returns {object} structured context for LLM (~3-5KB JSON)
 */
export async function aggregateWeekData(supabaseUrl, supabaseKey, periodStart, periodEnd) {
  const headers = {
    "Content-Type": "application/json",
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  const [alertsSummary, forecasts, dispatchSummary, projectStatus, signalVolume, topRiskEntities] = await Promise.all([
    fetchAlertsSummary(supabaseUrl, headers, periodStart, periodEnd),
    fetchLatestForecasts(supabaseUrl, headers),
    fetchDispatchSummary(supabaseUrl, headers, periodStart, periodEnd),
    fetchProjectStatus(supabaseUrl, headers),
    fetchSignalVolume(supabaseUrl, headers, periodStart, periodEnd),
    fetchTopRiskEntities(supabaseUrl, headers, periodStart, periodEnd),
  ]);

  return {
    period: { start: periodStart, end: periodEnd },
    alerts: alertsSummary,
    forecasts,
    dispatch: dispatchSummary,
    projects: projectStatus,
    signals: signalVolume,
    top_risks: topRiskEntities,
  };
}

async function fetchAlertsSummary(url, headers, start, end) {
  const alerts = await fetchJson(
    `${url}/rest/v1/alerts?created_at=gte.${start}&created_at=lte.${end}T23:59:59&select=id,agent,severity,status,entity_ref`,
    headers,
  );

  const bySeverity = { critical: 0, warning: 0, info: 0 };
  const byAgent = {};
  const byProject = {};
  let resolved = 0;

  for (const a of alerts) {
    bySeverity[a.severity] = (bySeverity[a.severity] || 0) + 1;
    byAgent[a.agent] = (byAgent[a.agent] || 0) + 1;
    if (a.entity_ref) byProject[a.entity_ref] = (byProject[a.entity_ref] || 0) + 1;
    if (a.status === "resolved" || a.status === "acknowledged") resolved++;
  }

  return {
    total: alerts.length,
    by_severity: bySeverity,
    by_agent: byAgent,
    by_project: byProject,
    resolved,
    open: alerts.length - resolved,
    resolution_rate: alerts.length > 0 ? Math.round((resolved / alerts.length) * 100) : 0,
  };
}

async function fetchLatestForecasts(url, headers) {
  const forecasts = await fetchJson(
    `${url}/rest/v1/latest_forecasts?select=forecast_type,entity_ref,prediction,methodology`,
    headers,
  );

  const milestoneSlips = forecasts
    .filter((f) => f.forecast_type === "milestone_slip")
    .map((f) => ({
      project: f.entity_ref,
      risk: f.prediction?.overall_project_risk,
      worst_milestone: f.prediction?.milestones?.[0],
    }));

  const eolRisks = forecasts
    .filter((f) => f.forecast_type === "part_eol")
    .map((f) => ({
      part: f.entity_ref,
      severity: f.prediction?.severity,
      days_to_reorder: f.prediction?.days_to_must_reorder,
      part_name: f.prediction?.part_name,
    }));

  return { milestone_slips: milestoneSlips, eol_risks: eolRisks };
}

async function fetchDispatchSummary(url, headers, start, end) {
  const logs = await fetchJson(
    `${url}/rest/v1/dispatch_log?sent_at=gte.${start}&sent_at=lte.${end}T23:59:59&select=channel,status`,
    headers,
  );

  const byChannel = {};
  let sent = 0,
    failed = 0;
  for (const l of logs) {
    byChannel[l.channel] = (byChannel[l.channel] || 0) + 1;
    if (l.status === "sent") sent++;
    else if (l.status === "failed") failed++;
  }

  return { total: logs.length, sent, failed, by_channel: byChannel };
}

async function fetchProjectStatus(url, headers) {
  const projects = await fetchJson(`${url}/rest/v1/projects?is_archived=eq.false&select=id,name,phase,health`, headers);

  const milestones = await fetchJson(
    `${url}/rest/v1/milestones?select=id,project_id,phase,status,target_date,actual_date`,
    headers,
  );

  return projects.map((p) => {
    const pm = milestones.filter((m) => m.project_id === p.id);
    const done = pm.filter((m) => m.status === "DONE").length;
    const delayed = pm.filter((m) => m.status === "DELAYED").length;
    return {
      id: p.id,
      name: p.name,
      phase: p.phase,
      health: p.health,
      milestones_done: done,
      milestones_total: pm.length,
      milestones_delayed: delayed,
    };
  });
}

async function fetchSignalVolume(url, headers, start, end) {
  const signals = await fetchJson(
    `${url}/rest/v1/cross_app_data?source_app=eq.MRP&synced_at=gte.${start}&synced_at=lte.${end}T23:59:59&select=entity_type`,
    headers,
  );

  const byType = {};
  for (const s of signals) {
    byType[s.entity_type] = (byType[s.entity_type] || 0) + 1;
  }

  return { total: signals.length, by_type: byType };
}

async function fetchTopRiskEntities(url, headers, start, end) {
  const alerts = await fetchJson(
    `${url}/rest/v1/alerts?severity=in.(critical,warning)&created_at=gte.${start}&created_at=lte.${end}T23:59:59&select=entity_ref,severity,summary&order=created_at.desc&limit=10`,
    headers,
  );

  // Group by entity_ref, count alerts
  const entityMap = {};
  for (const a of alerts) {
    const ref = a.entity_ref || "unknown";
    if (!entityMap[ref]) entityMap[ref] = { entity: ref, count: 0, severities: [], summaries: [] };
    entityMap[ref].count++;
    entityMap[ref].severities.push(a.severity);
    if (entityMap[ref].summaries.length < 3) entityMap[ref].summaries.push(a.summary);
  }

  return Object.values(entityMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

async function fetchJson(url, headers) {
  try {
    const res = await fetch(url, { headers });
    return res.ok ? await res.json() : [];
  } catch {
    return [];
  }
}
