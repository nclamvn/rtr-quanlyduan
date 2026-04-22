// ═══════════════════════════════════════════════════════════
// Part EOL Impact Forecaster
// Predicts when EOL/obsolete parts will deplete and what WOs are affected
// Statistical: linear depletion rate + lead time buffer
// ═══════════════════════════════════════════════════════════

const DEFAULT_LEAD_TIME_DAYS = 30;

/**
 * Forecast impact of EOL/obsolete parts.
 *
 * @param {string} supabaseUrl
 * @param {string} supabaseKey
 * @returns {Array<{ part_id, eol_date, days_to_depletion, days_to_must_reorder, affected_work_orders, affected_milestones, severity, methodology }>}
 */
export async function forecastPartEolImpact(supabaseUrl, supabaseKey) {
  const headers = {
    "Content-Type": "application/json",
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  // 1. Fetch EOL/obsolete inventory alerts from cross_app_data
  const eolParts = await fetchJson(
    `${supabaseUrl}/rest/v1/cross_app_data?source_app=eq.MRP&entity_type=eq.inventory_alert&order=synced_at.desc`,
    headers,
  );

  const eolFiltered = eolParts.filter((p) => {
    const status = p.data?.lifecycleStatus;
    return status === "EOL" || status === "OBSOLETE" || p.status === "eol";
  });

  if (eolFiltered.length === 0) return [];

  // 2. Fetch recent work orders to estimate consumption rate
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
  const workOrders = await fetchJson(
    `${supabaseUrl}/rest/v1/cross_app_data?source_app=eq.MRP&entity_type=eq.work_order&synced_at=gte.${ninetyDaysAgo}&order=synced_at.desc&limit=200`,
    headers,
  );

  // 3. Fetch milestones for cross-reference
  const milestones = await fetchJson(
    `${supabaseUrl}/rest/v1/milestones?status=in.(PLANNED,IN_PROGRESS,DELAYED)&select=id,project_id,phase,target_date`,
    headers,
  );

  // 4. Process each EOL part
  const results = [];

  for (const part of eolFiltered) {
    const data = part.data || {};
    const availableQty = data.availableQty ?? (data.totalQty || 0) - (data.reservedQty || 0);
    const partNumber = data.partNumber || part.title;
    const leadTimeDays = data.leadTimeDays || DEFAULT_LEAD_TIME_DAYS;

    // Estimate consumption: count WOs mentioning this part's product code
    const relatedWOs = workOrders.filter((wo) => {
      const woData = wo.data || {};
      return (
        woData.productCode === data.partNumber ||
        wo.title?.includes(data.partNumber) ||
        wo.title?.includes(data.partName)
      );
    });

    // Consumption rate: WO count / 90 days (rough proxy for parts/day)
    const consumptionRate = relatedWOs.length > 0 ? relatedWOs.length / 90 : 0;

    // Days to depletion
    const daysToDepletion =
      consumptionRate > 0 ? Math.round(availableQty / consumptionRate) : availableQty > 0 ? 365 : 0; // if no consumption, assume 1 year unless already 0

    const daysToMustReorder = Math.max(0, daysToDepletion - leadTimeDays);

    // Affected milestones: find WOs' project_link → milestones
    const affectedProjectIds = [...new Set(relatedWOs.map((wo) => wo.project_link).filter(Boolean))];
    const affectedMilestones = milestones
      .filter((m) => affectedProjectIds.includes(m.project_id))
      .map((m) => ({ id: m.id, project_id: m.project_id, phase: m.phase, target_date: m.target_date }));

    // Severity
    let severity;
    if (daysToMustReorder <= 0) severity = "critical";
    else if (daysToMustReorder <= 14) severity = "warning";
    else severity = "info";

    results.push({
      part_id: part.entity_id,
      part_number: data.partNumber,
      part_name: data.partName || partNumber,
      lifecycle_status: data.lifecycleStatus || "EOL",
      available_qty: availableQty,
      consumption_rate_per_day: Math.round(consumptionRate * 100) / 100,
      lead_time_days: leadTimeDays,
      days_to_depletion: daysToDepletion,
      days_to_must_reorder: daysToMustReorder,
      affected_work_orders: relatedWOs.slice(0, 10).map((wo) => ({
        id: wo.entity_id,
        title: wo.title,
        project_link: wo.project_link,
      })),
      affected_milestones: affectedMilestones,
      severity,
      methodology: "linear_depletion_with_lead_time",
    });
  }

  // Sort: critical first
  results.sort((a, b) => {
    const sevOrder = { critical: 0, warning: 1, info: 2 };
    return (sevOrder[a.severity] ?? 3) - (sevOrder[b.severity] ?? 3);
  });

  return results;
}

async function fetchJson(url, headers) {
  try {
    const res = await fetch(url, { headers });
    return res.ok ? await res.json() : [];
  } catch {
    return [];
  }
}
