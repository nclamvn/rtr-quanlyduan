import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from "recharts";
import SafeResponsiveContainer from "./SafeChart";

const mono = "'JetBrains Mono', 'Fira Code', monospace";
const sans = "'Outfit', 'Segoe UI', system-ui, sans-serif";

const SEV_COLORS = { CRITICAL: "#EF4444", HIGH: "#F59E0B", MEDIUM: "#3B82F6", LOW: "#22C55E" };
const STATUS_COLORS = { DRAFT: "#94A3B8", OPEN: "#3B82F6", IN_PROGRESS: "#F59E0B", BLOCKED: "#EF4444", CLOSED: "#22C55E" };

function computeTrendData(issues) {
  const NUM_WEEKS = 12;
  const now = new Date();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weekStart = (idx) => new Date(now.getTime() - (NUM_WEEKS - idx) * msPerWeek);

  const weeks = [];
  for (let i = 0; i < NUM_WEEKS; i++) {
    const start = weekStart(i);
    const end = i < NUM_WEEKS - 1 ? weekStart(i + 1) : now;
    let opened = 0;
    let closed = 0;
    issues.forEach((issue) => {
      const created = issue.created ? new Date(issue.created) : null;
      if (created && created >= start && created < end) opened++;
      if (issue.status === "CLOSED") {
        const closedDate = issue.closedAt ? new Date(issue.closedAt) : created;
        if (closedDate && closedDate >= start && closedDate < end) closed++;
      }
    });
    weeks.push({
      week: `T${i + 1}`,
      weekEn: `W${i + 1}`,
      opened,
      closed,
    });
  }
  return weeks;
}

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
    computeTrendData(issues).map(d => ({ ...d, name: isVi ? d.week : d.weekEn })), [issues, isVi]
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
        <SafeResponsiveContainer width="100%" height={220} minWidth={0} minHeight={0}>
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
        </SafeResponsiveContainer>
      </div>

      {/* Row 2: Severity Donut + Status Bar */}
      <div className="chart-grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Severity Donut */}
        <div style={sectionStyle}>
          <div style={titleStyle}>{isVi ? "Phân bổ mức độ" : "Severity Breakdown"}</div>
          <SafeResponsiveContainer width="100%" height={220} minWidth={0} minHeight={0}>
            <PieChart>
              <Pie data={sevData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: tickColor }} style={{ fontSize: 11, fontFamily: sans }}>
                {sevData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </SafeResponsiveContainer>
          <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-dim)", fontFamily: sans, marginTop: -8 }}>
            {isVi ? "Tổng" : "Total"}: <span style={{ fontFamily: mono, fontWeight: 700, color: "var(--text-primary)" }}>{issues.length}</span>
          </div>
        </div>

        {/* Status Distribution */}
        <div style={sectionStyle}>
          <div style={titleStyle}>{isVi ? "Phân bổ trạng thái" : "Status Distribution"}</div>
          <SafeResponsiveContainer width="100%" height={220} minWidth={0} minHeight={0}>
            <BarChart data={statusData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
              <XAxis type="number" tick={{ fill: tickColor, fontSize: 11, fontFamily: mono }} axisLine={{ stroke: gridColor }} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: tickColor, fontSize: 11, fontFamily: sans }} axisLine={{ stroke: gridColor }} tickLine={false} width={80} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name={isVi ? "Số lượng" : "Count"} radius={[0, 4, 4, 0]} barSize={20}>
                {statusData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </SafeResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
