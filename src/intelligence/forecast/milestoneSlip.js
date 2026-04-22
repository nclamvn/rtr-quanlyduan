// ═══════════════════════════════════════════════════════════
// Milestone Slip Forecaster
// Predicts probability of milestone delay per project
// Statistical: historical slip mean + issue-weighted adjustment
// ═══════════════════════════════════════════════════════════

import { welfordOnline, confidenceInterval } from "./stats.js";

const RISK_WEIGHT = {
  critical_issue: 5, // days added per open critical issue
  high_issue: 2, // days per open high issue
  unchecked_gate: 3, // days per required but unchecked gate condition
  convergence_alert: 4, // days per recent convergence alert
};

/**
 * Forecast milestone slip for a project.
 *
 * @param {string} projectId
 * @param {string} supabaseUrl
 * @param {string} supabaseKey
 * @returns {{ project_id, milestones[], overall_project_risk, methodology }}
 */
export async function forecastMilestoneSlip(projectId, supabaseUrl, supabaseKey) {
  const headers = {
    "Content-Type": "application/json",
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  // 1. Fetch milestones
  const milestones = await fetchJson(
    `${supabaseUrl}/rest/v1/milestones?project_id=eq.${projectId}&order=created_at.asc`,
    headers,
  );

  if (milestones.length === 0) {
    return {
      project_id: projectId,
      milestones: [],
      overall_project_risk: "low",
      methodology: "no_milestones",
    };
  }

  // 2. Compute historical slip from completed milestones
  const completedSlips = milestones
    .filter((m) => m.status === "DONE" && m.target_date && m.actual_date)
    .map((m) => {
      const target = new Date(m.target_date);
      const actual = new Date(m.actual_date);
      return Math.round((actual - target) / (24 * 3600 * 1000)); // days slip (negative = early)
    });

  const slipStats = completedSlips.length > 0 ? welfordOnline(completedSlips) : { mean: 0, stdev: 14, count: 0 }; // default: 0 mean, 14 day stdev if no history

  // 3. Fetch open issues for risk weighting
  const issues = await fetchJson(
    `${supabaseUrl}/rest/v1/issues?project_id=eq.${projectId}&status=in.(OPEN,IN_PROGRESS,BLOCKED)&select=id,severity`,
    headers,
  );

  const criticalCount = issues.filter((i) => i.severity === "CRITICAL").length;
  const highCount = issues.filter((i) => i.severity === "HIGH").length;

  // 4. Fetch gate conditions (unchecked required)
  const gates = await fetchJson(
    `${supabaseUrl}/rest/v1/gate_conditions?project_id=eq.${projectId}&is_required=eq.true&is_checked=eq.false&select=id,phase`,
    headers,
  );

  // 5. Fetch recent convergence alerts for this project
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const convAlerts = await fetchJson(
    `${supabaseUrl}/rest/v1/alerts?agent=eq.convergence&entity_ref=eq.${projectId}&status=eq.open&created_at=gte.${oneWeekAgo}&select=id`,
    headers,
  );

  // 6. Compute risk-weighted slip for each pending milestone
  const issueAdj = criticalCount * RISK_WEIGHT.critical_issue + highCount * RISK_WEIGHT.high_issue;
  const gateAdj = gates.length * RISK_WEIGHT.unchecked_gate;
  const alertAdj = convAlerts.length * RISK_WEIGHT.convergence_alert;
  const totalAdj = issueAdj + gateAdj + alertAdj;

  const forecastedMilestones = milestones
    .filter((m) => m.status !== "DONE")
    .map((m) => {
      const baseSlip = Math.max(0, Math.round(slipStats.mean));
      const expectedSlipDays = baseSlip + totalAdj;
      const ci = confidenceInterval(expectedSlipDays, slipStats.stdev);

      // Probability on time: assume normal distribution, P(slip <= 0)
      const zOnTime = slipStats.stdev > 0 ? -expectedSlipDays / slipStats.stdev : expectedSlipDays > 0 ? -3 : 3;
      const probOnTime = Math.max(0, Math.min(1, normalCDF(zOnTime)));

      const expectedDate = m.target_date
        ? new Date(new Date(m.target_date).getTime() + expectedSlipDays * 24 * 3600 * 1000).toISOString().split("T")[0]
        : null;

      // Phase-specific unchecked gates
      const phaseGates = gates.filter((g) => g.phase === m.phase).length;

      const riskFactors = [];
      if (criticalCount > 0)
        riskFactors.push({
          factor: "critical_issues",
          count: criticalCount,
          days_added: criticalCount * RISK_WEIGHT.critical_issue,
        });
      if (highCount > 0)
        riskFactors.push({ factor: "high_issues", count: highCount, days_added: highCount * RISK_WEIGHT.high_issue });
      if (phaseGates > 0)
        riskFactors.push({
          factor: "unchecked_gates",
          count: phaseGates,
          days_added: phaseGates * RISK_WEIGHT.unchecked_gate,
        });
      if (convAlerts.length > 0)
        riskFactors.push({
          factor: "convergence_alerts",
          count: convAlerts.length,
          days_added: convAlerts.length * RISK_WEIGHT.convergence_alert,
        });

      return {
        id: m.id,
        phase: m.phase,
        target_date: m.target_date,
        status: m.status,
        expected_actual_date: expectedDate,
        expected_slip_days: expectedSlipDays,
        slip_probability: Math.round((1 - probOnTime) * 100) / 100,
        confidence_interval: { lower: Math.round(ci.lower), upper: Math.round(ci.upper) },
        risk_factors: riskFactors,
      };
    });

  // 7. Overall project risk
  const maxSlipProb = Math.max(0, ...forecastedMilestones.map((m) => m.slip_probability));
  const overallRisk =
    maxSlipProb >= 0.8 ? "critical" : maxSlipProb >= 0.6 ? "high" : maxSlipProb >= 0.3 ? "medium" : "low";

  return {
    project_id: projectId,
    milestones: forecastedMilestones,
    overall_project_risk: overallRisk,
    methodology: "historical_mean + issue_weighted_adjustment",
    inputs: {
      historical_slips: completedSlips.length,
      mean_slip_days: Math.round(slipStats.mean * 10) / 10,
      open_issues: { critical: criticalCount, high: highCount },
      unchecked_gates: gates.length,
      convergence_alerts: convAlerts.length,
    },
  };
}

// Simple normal CDF approximation (Abramowitz & Stegun)
function normalCDF(z) {
  if (z < -6) return 0;
  if (z > 6) return 1;
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327; // 1/sqrt(2π)
  const p =
    d *
    Math.exp((-z * z) / 2) *
    (t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429)))));
  return z > 0 ? 1 - p : p;
}

async function fetchJson(url, headers) {
  try {
    const res = await fetch(url, { headers });
    return res.ok ? await res.json() : [];
  } catch {
    return [];
  }
}
