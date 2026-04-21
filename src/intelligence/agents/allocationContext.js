// ═══════════════════════════════════════════════════════════
// Allocation Context Builder
// Queries Supabase for team candidates, workload, project context,
// and historical assignment patterns.
// ═══════════════════════════════════════════════════════════

/**
 * Build allocation context for an alert.
 * Gracefully degrades if tables are missing.
 *
 * @param {object} alert - row from alerts table
 * @param {string} supabaseUrl
 * @param {string} supabaseKey
 * @returns {{ candidates, project_context, urgency_hint, similar_alerts_history, insufficient_data }}
 */
export async function buildAllocationContext(alert, supabaseUrl, supabaseKey) {
  const headers = {
    "Content-Type": "application/json",
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  const context = {
    candidates: [],
    project_context: null,
    urgency_hint: mapSeverityToUrgency(alert.severity),
    similar_alerts_history: [],
    insufficient_data: false,
  };

  // 1. Get project context + team members if alert has entity_ref (project_link)
  if (alert.entity_ref) {
    context.project_context = await fetchProjectContext(alert.entity_ref, supabaseUrl, headers);
    const projectMembers = await fetchProjectMembers(alert.entity_ref, supabaseUrl, headers);
    if (projectMembers.length > 0) {
      context.candidates = projectMembers;
    }
  }

  // 2. If no project members, fall back to all active profiles with pm/engineer role
  if (context.candidates.length === 0) {
    context.candidates = await fetchAllCandidates(supabaseUrl, headers);
  }

  // 3. Enrich candidates with current workload (open issues + open alerts assigned)
  context.candidates = await enrichWithWorkload(context.candidates, supabaseUrl, headers);

  // 4. Historical patterns: similar alerts and who resolved them
  context.similar_alerts_history = await fetchSimilarAlertHistory(alert, supabaseUrl, headers);

  // Flag if we have no candidates at all
  if (context.candidates.length === 0) {
    context.insufficient_data = true;
  }

  return context;
}

function mapSeverityToUrgency(severity) {
  if (severity === "critical") return "critical";
  if (severity === "warning") return "high";
  return "low";
}

async function fetchProjectContext(projectLink, supabaseUrl, headers) {
  try {
    const params = new URLSearchParams({
      id: `eq.${projectLink}`,
      select: "id,name,phase,phase_owner_id,phase_owner_name,health",
      limit: "1",
    });
    const res = await fetch(`${supabaseUrl}/rest/v1/projects?${params}`, { headers });
    if (!res.ok) return null;
    const rows = await res.json();
    if (rows.length === 0) return null;
    const p = rows[0];
    return {
      lead: p.phase_owner_id,
      lead_name: p.phase_owner_name,
      phase: p.phase,
      health: p.health,
    };
  } catch {
    return null;
  }
}

async function fetchProjectMembers(projectLink, supabaseUrl, headers) {
  try {
    const params = new URLSearchParams({
      project_id: `eq.${projectLink}`,
      select: "user_id,role_in_project,profiles(id,full_name,role,department,is_active)",
    });
    const res = await fetch(`${supabaseUrl}/rest/v1/project_members?${params}`, { headers });
    if (!res.ok) return [];
    const rows = await res.json();
    return rows
      .filter((r) => r.profiles?.is_active !== false)
      .map((r) => ({
        id: r.user_id,
        name: r.profiles?.full_name || "Unknown",
        role: r.profiles?.role || "engineer",
        department: r.profiles?.department || null,
        role_in_project: r.role_in_project || "member",
        current_load: 0,
        past_success_rate: null,
      }));
  } catch {
    return [];
  }
}

async function fetchAllCandidates(supabaseUrl, headers) {
  try {
    const params = new URLSearchParams({
      is_active: "eq.true",
      role: "in.(pm,engineer,admin)",
      select: "id,full_name,role,department",
      limit: "50",
    });
    const res = await fetch(`${supabaseUrl}/rest/v1/profiles?${params}`, { headers });
    if (!res.ok) return [];
    const rows = await res.json();
    return rows.map((r) => ({
      id: r.id,
      name: r.full_name,
      role: r.role,
      department: r.department,
      role_in_project: null,
      current_load: 0,
      past_success_rate: null,
    }));
  } catch {
    return [];
  }
}

async function enrichWithWorkload(candidates, supabaseUrl, headers) {
  if (candidates.length === 0) return candidates;

  // Count open issues per assignee in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  for (const c of candidates) {
    try {
      // Open issues assigned
      const issueParams = new URLSearchParams({
        assigned_to: `eq.${c.id}`,
        status: "in.(OPEN,IN_PROGRESS)",
        select: "id",
      });
      const issueRes = await fetch(`${supabaseUrl}/rest/v1/issues?${issueParams}`, { headers });
      const issues = issueRes.ok ? await issueRes.json() : [];

      // Open alerts already suggested to this person
      const alertParams = new URLSearchParams({
        suggested_assignee: `eq.${c.id}`,
        status: "eq.open",
        select: "id",
      });
      const alertRes = await fetch(`${supabaseUrl}/rest/v1/alerts?${alertParams}`, { headers });
      const alerts = alertRes.ok ? await alertRes.json() : [];

      c.current_load = issues.length + alerts.length;
    } catch {
      // Keep default 0
    }
  }

  return candidates;
}

async function fetchSimilarAlertHistory(alert, supabaseUrl, headers) {
  try {
    const params = new URLSearchParams({
      agent: `eq.${alert.agent}`,
      status: "in.(acknowledged,resolved)",
      actual_assignee: "not.is.null",
      order: "created_at.desc",
      limit: "5",
      select: "actual_assignee,status,created_at,acknowledged_at,severity",
    });

    // If alert has entity_ref, filter for same entity
    if (alert.entity_ref) {
      params.set("entity_ref", `eq.${alert.entity_ref}`);
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/alerts?${params}`, { headers });
    if (!res.ok) return [];
    const rows = await res.json();

    return rows.map((r) => {
      const created = new Date(r.created_at);
      const resolved = r.acknowledged_at ? new Date(r.acknowledged_at) : null;
      const daysToResolve = resolved ? Math.round((resolved - created) / (24 * 3600 * 1000)) : null;
      return {
        past_assignee: r.actual_assignee,
        outcome: r.status,
        days_to_resolve: daysToResolve,
      };
    });
  } catch {
    return [];
  }
}
