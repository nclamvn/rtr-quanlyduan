import { useMemo } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
} from "recharts";
import SafeResponsiveContainer from "./SafeChart";

const mono = "'JetBrains Mono', 'Fira Code', monospace";
const sans = "'Outfit', 'Segoe UI', system-ui, sans-serif";

// DVT has named categories via DVT_CATEGORIES
const DVT_CATS = {
  flight_test: { vi: "Bay thử", en: "Flight Test", color: "#3B82F6" },
  env_test: { vi: "Môi trường", en: "Environmental", color: "#10B981" },
  emc_test: { vi: "EMC/EMI", en: "EMC/EMI", color: "#F59E0B" },
  mech_test: { vi: "Cơ khí", en: "Mechanical", color: "#8B5CF6" },
  prerequisite: { vi: "Tiền đề", en: "Prerequisite", color: "#F97316" },
};

const GENERIC_CATS = {
  general: { vi: "Chung", en: "General", color: "#3B82F6" },
  design: { vi: "Thiết kế", en: "Design", color: "#8B5CF6" },
  test: { vi: "Kiểm tra", en: "Test", color: "#10B981" },
  supply: { vi: "Cung ứng", en: "Supply", color: "#F59E0B" },
  production: { vi: "Sản xuất", en: "Production", color: "#F97316" },
  compliance: { vi: "Tuân thủ", en: "Compliance", color: "#EF4444" },
  prerequisite: { vi: "Tiền đề", en: "Prerequisite", color: "#6B7280" },
};

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 12px", fontSize: 12, fontFamily: sans, boxShadow: "0 4px 12px var(--shadow-color)" }}>
      <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{d.label}</div>
      <div style={{ color: "var(--text-dim)", marginTop: 2 }}>
        <span style={{ fontFamily: mono, fontWeight: 700, color: d.progress >= 80 ? "#10B981" : d.progress >= 50 ? "#F59E0B" : "#EF4444" }}>{d.progress}%</span>
        {" "}({d.passed}/{d.total})
      </div>
    </div>
  );
}

export default function GateRadar({ gateConfig, gateChecks, phase, lang }) {
  const isVi = lang === "vi";
  const isDark = document.documentElement.getAttribute("data-theme") !== "light";

  const conditions = gateConfig?.[phase]?.conditions || [];
  const checks = gateChecks?.[phase] || {};

  const data = useMemo(() => {
    // Group conditions by cat
    const catMap = {};
    conditions.forEach(c => {
      const cat = c.cat || "general";
      if (!catMap[cat]) catMap[cat] = { total: 0, passed: 0 };
      catMap[cat].total++;
      if (checks[c.id]) catMap[cat].passed++;
    });

    const catDefs = phase === "DVT" ? DVT_CATS : GENERIC_CATS;
    return Object.entries(catMap).map(([cat, { total, passed }]) => {
      const def = catDefs[cat] || GENERIC_CATS[cat] || { vi: cat, en: cat, color: "#6B7280" };
      return {
        label: isVi ? def.vi : def.en,
        progress: total > 0 ? Math.round(passed / total * 100) : 0,
        passed,
        total,
        fullMark: 100,
        color: def.color,
      };
    });
  }, [conditions, checks, phase, isVi]);

  if (conditions.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "var(--text-faint)", padding: 30, fontSize: 13 }}>
        {isVi ? "Chưa có điều kiện cổng cho phase này" : "No gate conditions for this phase"}
      </div>
    );
  }

  // Use bar chart if fewer than 3 categories
  if (data.length < 3) {
    return (
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: sans, marginBottom: 12 }}>
          {isVi ? `Tiến độ cổng ${phase}` : `${phase} Gate Progress`}
        </div>
        <SafeResponsiveContainer width="100%" height={160} minWidth={0} minHeight={0}>
          <BarChart data={data} margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1E2A3A" : "#E2E8F0"} />
            <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 11, fontFamily: sans }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 11, fontFamily: mono }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="progress" radius={[4, 4, 0, 0]} barSize={36}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </SafeResponsiveContainer>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: sans, marginBottom: 8 }}>
        {isVi ? `Radar tiến độ cổng ${phase}` : `${phase} Gate Radar`}
      </div>
      <SafeResponsiveContainer width="100%" height={280} minWidth={0} minHeight={0}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke={isDark ? "#1E2A3A" : "#CBD5E1"} />
          <PolarAngleAxis dataKey="label" tick={{ fill: isDark ? "#94A3B8" : "#475569", fontSize: 11, fontFamily: sans }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 9, fontFamily: mono }} tickFormatter={v => `${v}%`} axisLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Radar dataKey="progress" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.25} strokeWidth={2} dot={{ r: 4, fill: "#fff", stroke: "#3B82F6", strokeWidth: 2 }} animationDuration={800} />
        </RadarChart>
      </SafeResponsiveContainer>
      {/* Legend */}
      <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", marginTop: 4 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-dim)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
            {d.label}: <span style={{ fontFamily: mono, fontWeight: 700, color: d.progress >= 80 ? "#10B981" : d.progress >= 50 ? "#F59E0B" : "#EF4444" }}>{d.progress}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
