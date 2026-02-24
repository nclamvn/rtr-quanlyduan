import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from "recharts";

const mono = "'JetBrains Mono', 'Fira Code', monospace";
const sans = "'Outfit', 'Segoe UI', system-ui, sans-serif";

const SEV_COLORS = { CRITICAL: "#EF4444", HIGH: "#F59E0B", MEDIUM: "#3B82F6", LOW: "#22C55E" };
const STATUS_COLORS = { DRAFT: "#94A3B8", OPEN: "#3B82F6", IN_PROGRESS: "#F59E0B", BLOCKED: "#EF4444", CLOSED: "#22C55E" };

const TREND_DATA = [
  { week: "T1", weekEn: "W1", opened: 2, closed: 0 },
  { week: "T2", weekEn: "W2", opened: 3, closed: 1 },
  { week: "T3", weekEn: "W3", opened: 1, closed: 2 },
  { week: "T4", weekEn: "W4", opened: 4, closed: 1 },
  { week: "T5", weekEn: "W5", opened: 2, closed: 3 },
  { week: "T6", weekEn: "W6", opened: 3, closed: 2 },
  { week: "T7", weekEn: "W7", opened: 1, closed: 4 },
  { week: "T8", weekEn: "W8", opened: 5, closed: 2 },
  { week: "T9", weekEn: "W9", opened: 2, closed: 3 },
  { week: "T10", weekEn: "W10", opened: 3, closed: 1 },
  { week: "T11", weekEn: "W11", opened: 1, closed: 2 },
  { week: "T12", weekEn: "W12", opened: 2, closed: 3 },
];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 12px", fontSize: 12, fontFamily: sans, boxShadow: "0 4px 12px var(--shadow-color)" }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
          {p.name}: <span style={{ fontFamily: mono, fontWeight: 700 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function IssueCharts({ issues, lang }) {
  const isVi = lang === "vi";
  const isDark = document.documentElement.getAttribute("data-theme") !== "light";
  const gridColor = isDark ? "#1E2A3A" : "#E2E8F0";
  const tickColor = isDark ? "#64748B" : "#64748B";

  const trendData = useMemo(() =>
    TREND_DATA.map(d => ({ ...d, name: isVi ? d.week : d.weekEn })), [isVi]
  );

  const sevData = useMemo(() => {
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    issues.forEach(i => { if (counts[i.sev] !== undefined) counts[i.sev]++; });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ name: isVi ? { CRITICAL: "Nghiêm trọng", HIGH: "Cao", MEDIUM: "Trung bình", LOW: "Thấp" }[k] : k, value: v, color: SEV_COLORS[k] }));
  }, [issues, isVi]);

  const statusData = useMemo(() => {
    const labels = isVi
      ? { DRAFT: "Nháp", OPEN: "Mở", IN_PROGRESS: "Đang xử lý", BLOCKED: "Bị chặn", CLOSED: "Đã đóng" }
      : { DRAFT: "Draft", OPEN: "Open", IN_PROGRESS: "In Progress", BLOCKED: "Blocked", CLOSED: "Closed" };
    const counts = {};
    issues.forEach(i => { counts[i.status] = (counts[i.status] || 0) + 1; });
    return Object.entries(STATUS_COLORS).map(([k, c]) => ({ name: labels[k] || k, value: counts[k] || 0, fill: c })).filter(d => d.value > 0);
  }, [issues, isVi]);

  const sectionStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 16, overflow: "hidden" };
  const titleStyle = { fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: sans, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Trend Chart — full width */}
      <div style={sectionStyle}>
        <div style={titleStyle}>{isVi ? "Xu hướng vấn đề 12 tuần" : "Issue Trend — 12 Weeks"}</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="gradOpen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradClosed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 11, fontFamily: mono }} axisLine={{ stroke: gridColor }} tickLine={false} />
            <YAxis tick={{ fill: tickColor, fontSize: 11, fontFamily: mono }} axisLine={{ stroke: gridColor }} tickLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="opened" name={isVi ? "Mở mới" : "Opened"} stroke="#EF4444" fill="url(#gradOpen)" strokeWidth={2} dot={{ r: 3, fill: "#EF4444" }} />
            <Area type="monotone" dataKey="closed" name={isVi ? "Đã đóng" : "Closed"} stroke="#22C55E" fill="url(#gradClosed)" strokeWidth={2} dot={{ r: 3, fill: "#22C55E" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Row 2: Severity Donut + Status Bar */}
      <div className="chart-grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Severity Donut */}
        <div style={sectionStyle}>
          <div style={titleStyle}>{isVi ? "Phân bổ mức độ" : "Severity Breakdown"}</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={sevData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: tickColor }} style={{ fontSize: 11, fontFamily: sans }}>
                {sevData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-dim)", fontFamily: sans, marginTop: -8 }}>
            {isVi ? "Tổng" : "Total"}: <span style={{ fontFamily: mono, fontWeight: 700, color: "var(--text-primary)" }}>{issues.length}</span>
          </div>
        </div>

        {/* Status Distribution */}
        <div style={sectionStyle}>
          <div style={titleStyle}>{isVi ? "Phân bổ trạng thái" : "Status Distribution"}</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
              <XAxis type="number" tick={{ fill: tickColor, fontSize: 11, fontFamily: mono }} axisLine={{ stroke: gridColor }} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: tickColor, fontSize: 11, fontFamily: sans }} axisLine={{ stroke: gridColor }} tickLine={false} width={80} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name={isVi ? "Số lượng" : "Count"} radius={[0, 4, 4, 0]} barSize={20}>
                {statusData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
