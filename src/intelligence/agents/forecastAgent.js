// ═══════════════════════════════════════════════════════════
// Forecast Agent — Orchestrates statistical forecasts
// Runs milestone slip + part EOL predictors, persists to forecasts table
// Creates alerts for high/critical forecasts via alertSink
// ═══════════════════════════════════════════════════════════

import { forecastMilestoneSlip } from "../forecast/milestoneSlip.js";
import { forecastPartEolImpact } from "../forecast/partEol.js";
import { persistAlerts } from "./alertSink.js";

const VALID_HOURS = 24;

/**
 * Run all forecasts and persist results.
 *
 * @param {string} supabaseUrl
 * @param {string} supabaseKey
 * @returns {{ milestone_forecasts: number, eol_forecasts: number, alerts_created: number }}
 */
export async function runForecasts(supabaseUrl, supabaseKey) {
  const headers = {
    "Content-Type": "application/json",
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  const validUntil = new Date(Date.now() + VALID_HOURS * 3600 * 1000).toISOString();
  const alerts = [];
  let milestoneCount = 0;
  let eolCount = 0;

  // 1. Fetch active projects
  const projects = await fetchJson(`${supabaseUrl}/rest/v1/projects?is_archived=eq.false&select=id,name`, headers);

  // 2. Milestone slip forecasts per project
  for (const project of projects) {
    try {
      const forecast = await forecastMilestoneSlip(project.id, supabaseUrl, supabaseKey);

      if (forecast.milestones.length > 0) {
        await persistForecast(
          {
            forecast_type: "milestone_slip",
            entity_ref: project.id,
            horizon_days: 90,
            prediction: forecast,
            methodology: forecast.methodology,
            inputs_summary: forecast.inputs || {},
            valid_until: validUntil,
          },
          supabaseUrl,
          headers,
        );
        milestoneCount++;

        // Alert if overall risk is high or critical
        if (forecast.overall_project_risk === "high" || forecast.overall_project_risk === "critical") {
          const worstMilestone = forecast.milestones.reduce(
            (a, b) => ((a.slip_probability || 0) > (b.slip_probability || 0) ? a : b),
            forecast.milestones[0],
          );

          alerts.push({
            agent: "forecast",
            severity: forecast.overall_project_risk === "critical" ? "critical" : "warning",
            entity_ref: project.id,
            summary: `${project.name}: ${worstMilestone.phase} milestone ${Math.round(worstMilestone.slip_probability * 100)}% likely to slip ${worstMilestone.expected_slip_days}d`,
            details: {
              forecast_type: "milestone_slip",
              worst_milestone: worstMilestone,
              overall_risk: forecast.overall_project_risk,
            },
          });
        }
      }
    } catch (err) {
      console.error(`[forecast] Milestone slip failed for ${project.id}: ${err.message}`);
    }
  }

  // 3. Part EOL forecasts
  try {
    const eolResults = await forecastPartEolImpact(supabaseUrl, supabaseKey);

    for (const eol of eolResults) {
      await persistForecast(
        {
          forecast_type: "part_eol",
          entity_ref: eol.part_id,
          horizon_days: eol.days_to_depletion,
          prediction: eol,
          methodology: eol.methodology,
          inputs_summary: {
            available_qty: eol.available_qty,
            consumption_rate: eol.consumption_rate_per_day,
            lead_time: eol.lead_time_days,
          },
          valid_until: validUntil,
        },
        supabaseUrl,
        headers,
      );
      eolCount++;

      // Alert for critical/warning EOL parts
      if (eol.severity === "critical" || eol.severity === "warning") {
        alerts.push({
          agent: "forecast",
          severity: eol.severity === "critical" ? "critical" : "warning",
          entity_ref: eol.part_id,
          summary: `${eol.part_name}: EOL part, ${eol.days_to_must_reorder}d to must-reorder (${eol.available_qty} remaining)`,
          details: {
            forecast_type: "part_eol",
            days_to_depletion: eol.days_to_depletion,
            days_to_must_reorder: eol.days_to_must_reorder,
            affected_wo_count: eol.affected_work_orders.length,
          },
        });
      }
    }
  } catch (err) {
    console.error(`[forecast] Part EOL failed: ${err.message}`);
  }

  // 4. Persist alerts
  let alertsCreated = 0;
  if (alerts.length > 0) {
    const result = await persistAlerts(supabaseUrl, supabaseKey, alerts);
    alertsCreated = result.inserted;
  }

  return { milestone_forecasts: milestoneCount, eol_forecasts: eolCount, alerts_created: alertsCreated };
}

async function persistForecast(forecast, supabaseUrl, headers) {
  try {
    await fetch(`${supabaseUrl}/rest/v1/forecasts`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify(forecast),
    });
  } catch (err) {
    console.error(`[forecast] Persist failed: ${err.message}`);
  }
}

async function fetchJson(url, headers) {
  try {
    const res = await fetch(url, { headers });
    return res.ok ? await res.json() : [];
  } catch {
    return [];
  }
}
