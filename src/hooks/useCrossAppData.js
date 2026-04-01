// ═══════════════════════════════════════════════════════════
// RtR Control Tower — Cross-App Data Hook
// Reads synced MRP/HRM/CRM data from cross_app_data table
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { isSupabaseConnected, withTimeout, warmUpSupabase } from "../lib/supabase";
import { supabase } from "../lib/supabase";

export function useCrossAppData(sourceApp = null, entityType = null) {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!isSupabaseConnected()) {
      setLoading(false);
      return;
    }

    try {
      await warmUpSupabase();

      // Fetch detail data
      let query = supabase.from("cross_app_data").select("*").order("synced_at", { ascending: false });
      if (sourceApp) query = query.eq("source_app", sourceApp);
      if (entityType) query = query.eq("entity_type", entityType);
      query = query.limit(200);

      const { data: rows, error } = await withTimeout(query);
      if (!error && rows) {
        setData(rows);
      }

      // Fetch summary view
      const { data: summaryRows } = await supabase.from("cross_app_summary").select("*");
      if (summaryRows) {
        const summaryMap = {};
        for (const row of summaryRows) {
          if (!summaryMap[row.source_app]) summaryMap[row.source_app] = {};
          summaryMap[row.source_app][row.entity_type] = row;
        }
        setSummary(summaryMap);
      }
    } catch (err) {
      console.warn("[useCrossAppData] Error:", err.message);
    }
    setLoading(false);
  }, [sourceApp, entityType]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, summary, loading, refetch };
}

// Helper: get MRP production data for a specific project
export function useMRPForProject(projectLink) {
  const { data, summary, loading } = useCrossAppData("MRP");

  const projectData = {
    workOrders: data.filter((d) => d.entity_type === "work_order" && d.project_link === projectLink),
    inventoryAlerts: data.filter((d) => d.entity_type === "inventory_alert"),
    salesOrders: data.filter((d) => d.entity_type === "sales_order"),
    productionSummary: data.find((d) => d.entity_type === "production_summary")?.data || null,
  };

  return { ...projectData, summary: summary?.MRP, loading };
}
