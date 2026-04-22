/**
 * Forecasts Service — reads forecast data from latest_forecasts view
 */
import { supabase, isSupabaseConnected } from "../lib/supabase";

export async function fetchLatestForecasts() {
  if (!isSupabaseConnected()) return { data: [], error: "Offline mode" };

  const { data, error } = await supabase
    .from("latest_forecasts")
    .select("*")
    .order("generated_at", { ascending: false });

  if (error) console.error("[forecastsService] fetchLatestForecasts error:", error);
  return { data: data || [], error };
}

export async function fetchForecastsByType(forecastType) {
  if (!isSupabaseConnected()) return { data: [], error: "Offline mode" };

  const { data, error } = await supabase
    .from("latest_forecasts")
    .select("*")
    .eq("forecast_type", forecastType)
    .order("generated_at", { ascending: false });

  if (error) console.error("[forecastsService] fetchForecastsByType error:", error);
  return { data: data || [], error };
}
