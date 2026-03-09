import { useState, useMemo } from "react";
import {
  Factory, Search, Clock, CheckCircle2, AlertTriangle,
  ChevronDown, ChevronRight, X, Activity
} from "lucide-react";
import SafeResponsiveContainer from "./SafeChart";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import EmptyState, { EMPTY_MESSAGES } from "./EmptyState";

const STATUS_COLORS = {
  PLANNED: "#94A3B8", MATERIAL_READY: "#6366F1", IN_PROGRESS: "#F59E0B",
  QC: "#8B5CF6", COMPLETED: "#10B981", SHIPPED: "#0EA5E9",
  ON_HOLD: "#F97316", CANCELLED: "#EF4444",
};
const STATIONS = ['SMT', 'ASSEMBLY', 'FIRMWARE', 'CALIBRATION', 'FLIGHT_TEST', 'QC', 'PACKING'];
const STATION_COLORS = {
  SMT: "#6366F1", ASSEMBLY: "#3B82F6", FIRMWARE: "#8B5CF6",
  CALIBRATION: "#06B6D4", FLIGHT_TEST: "#F59E0B", QC: "#10B981", PACKING: "#14B8A6",
};
const PRIORITY_COLORS = { URGENT: "#EF4444", HIGH: "#F59E0B", NORMAL: "#3B82F6", LOW: "#64748B" };

export default function ProductionModule({ productionOrders, loading, lang, perm }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterStation, setFilterStation] = useState("ALL");
  const [selWO, setSelWO] = useState(null);
  const [showCharts, setShowCharts] = useState(true);
  const t = lang === "vi";

  const filtered = useMemo(() => {
    let list = productionOrders;
    if (filterStatus !== "ALL") list = list.filter(w => w.status === filterStatus);
    if (filterStation !== "ALL") list = list.filter(w => w.currentStation === filterStation);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(w => w.woNumber.toLowerCase().includes(q) || w.productName.toLowerCase().includes(q));
    }
    return list;
  }, [productionOrders, filterStatus, filterStation, search]);

  // KPIs
  const active = productionOrders.filter(w => ['IN_PROGRESS', 'QC', 'MATERIAL_READY'].includes(w.status));
  const completed = productionOrders.filter(w => ['COMPLETED', 'SHIPPED'].includes(w.status));
  const totalYield = completed.reduce((s, w) => s + w.yieldQuantity, 0);
  const totalQty = completed.reduce((s, w) => s + w.quantity, 0);
  const yieldRate = totalQty > 0 ? ((totalYield / totalQty) * 100).toFixed(0) : "—";
  const today = new Date();
  const onTimeRate = completed.length > 0
    ? ((completed.filter(w => !w.plannedEnd || new Date(w.actualEnd || today) <= new Date(w.plannedEnd)).length / completed.length) * 100).toFixed(0)
    : "—";
  const delayed = productionOrders.filter(w => w.plannedEnd && new Date(w.plannedEnd) < today && !['COMPLETED', 'SHIPPED', 'CANCELLED'].includes(w.status)).length;

  // WIP by station
  const wipByStation = useMemo(() => {
    return STATIONS.map(s => ({
      name: s,
      count: productionOrders.filter(w => w.currentStation === s && ['IN_PROGRESS', 'QC'].includes(w.status)).length,
      color: STATION_COLORS[s],
    }));
  }, [productionOrders]);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-dim)" }}>{t ? "Đang tải..." : "Loading..."}</div>;
  if (productionOrders.length === 0) { const em = EMPTY_MESSAGES[lang]?.production || EMPTY_MESSAGES.vi.production; return <EmptyState icon={em.icon} title={em.title} description={em.description} />; }

  const Badge = ({ color, children }) => (
    <span style={{ background: color + "18", color, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{children}</span>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
        {[
          { label: t ? "WO đang chạy" : "Active WOs", value: active.length, icon: Factory, color: "#F59E0B" },
          { label: t ? "Đúng hạn" : "On-Time Rate", value: onTimeRate + "%", icon: Clock, color: "#10B981" },
          { label: t ? "Yield" : "Yield Rate", value: yieldRate + "%", icon: CheckCircle2, color: "#3B82F6" },
          { label: t ? "Trễ hạn" : "Delayed", value: delayed, icon: AlertTriangle, color: delayed > 0 ? "#EF4444" : "#64748B" },
        ].map((kpi, i) => (
          <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: kpi.color + "15", borderRadius: 8, padding: 8 }}><kpi.icon size={16} color={kpi.color} /></div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>{kpi.value}</div>
              <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <Search size={13} style={{ position: "absolute", left: 8, top: 9, color: "var(--text-faint)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t ? "Tìm WO..." : "Search WO..."} style={{ width: "100%", padding: "6px 8px 6px 28px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 13 }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: "6px 8px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 12 }}>
          <option value="ALL">{t ? "Trạng thái" : "Status"}</option>
          {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={filterStation} onChange={e => setFilterStation(e.target.value)} style={{ padding: "6px 8px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 12 }}>
          <option value="ALL">{t ? "Công đoạn" : "Station"}</option>
          {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* WO Table */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 5 }}>
                {["WO#", t ? "Sản phẩm" : "Product", t ? "SL" : "Qty", t ? "Công đoạn" : "Station", t ? "Trạng thái" : "Status", t ? "Kế hoạch" : "Planned", t ? "Yield" : "Yield"].map((h, i) => (
                  <th key={i} style={{ padding: "8px 12px", textAlign: "left", borderBottom: "2px solid var(--border)", color: "var(--text-dim)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(w => {
                const isLate = w.plannedEnd && new Date(w.plannedEnd) < today && !['COMPLETED', 'SHIPPED', 'CANCELLED'].includes(w.status);
                return (
                  <tr key={w.id} onClick={() => setSelWO(selWO?.id === w.id ? null : w)} style={{ cursor: "pointer", borderBottom: "1px solid var(--border)", background: selWO?.id === w.id ? "var(--hover-bg)" : "transparent" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 700 }}>{w.woNumber}</td>
                    <td style={{ padding: "8px 12px" }}>{w.productName}</td>
                    <td style={{ padding: "8px 12px" }}>{w.quantity}</td>
                    <td style={{ padding: "8px 12px" }}>{w.currentStation ? <Badge color={STATION_COLORS[w.currentStation] || "#64748B"}>{w.currentStation}</Badge> : "—"}</td>
                    <td style={{ padding: "8px 12px" }}><Badge color={STATUS_COLORS[w.status] || "#64748B"}>{w.status.replace(/_/g, ' ')}</Badge></td>
                    <td style={{ padding: "8px 12px", fontSize: 12, color: isLate ? "#EF4444" : "var(--text-dim)" }}>
                      {w.plannedStart || "—"} → {w.plannedEnd || "—"} {isLate && <AlertTriangle size={11} style={{ marginLeft: 2 }} />}
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      {w.yieldQuantity > 0 || w.defectQuantity > 0
                        ? <span>{w.yieldQuantity}<span style={{ color: "var(--text-faint)" }}>/{w.quantity}</span>{w.defectQuantity > 0 && <span style={{ color: "#EF4444", marginLeft: 4 }}>({w.defectQuantity} fail)</span>}</span>
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div style={{ padding: 30, textAlign: "center", color: "var(--text-dim)" }}>{t ? "Không tìm thấy" : "No WOs match"}</div>}
      </div>

      {/* Detail Panel */}
      {selWO && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{selWO.woNumber} — {selWO.productName}</div>
            <button onClick={() => setSelWO(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)" }}><X size={16} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, fontSize: 13 }}>
            <div><span style={{ color: "var(--text-dim)" }}>{t ? "Đơn hàng:" : "Order:"}</span> {selWO.orderNumber || "—"}</div>
            <div><span style={{ color: "var(--text-dim)" }}>{t ? "Khách:" : "Customer:"}</span> {selWO.customerName || "—"}</div>
            <div><span style={{ color: "var(--text-dim)" }}>{t ? "Phụ trách:" : "Assigned:"}</span> {selWO.assignedTo || "—"}</div>
            <div><span style={{ color: "var(--text-dim)" }}>{t ? "Thực tế:" : "Actual:"}</span> {selWO.actualStart || "—"} → {selWO.actualEnd || t ? "đang chạy" : "ongoing"}</div>
          </div>
          {selWO.defectNotes && <div style={{ marginTop: 8, padding: 8, background: "#EF444410", borderRadius: 4, fontSize: 12, color: "#EF4444" }}>{selWO.defectNotes}</div>}

          {/* Station Timeline */}
          {selWO.logs.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{t ? "Nhật ký sản xuất" : "Production Log"} ({selWO.logs.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {selWO.logs.map(log => (
                  <div key={log.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
                    <Badge color={STATION_COLORS[log.station] || "#64748B"}>{log.station}</Badge>
                    <Badge color={log.action === 'FAILED_QC' ? "#EF4444" : log.action === 'PASSED_QC' ? "#10B981" : "#3B82F6"}>{log.action}</Badge>
                    <span style={{ color: "var(--text-dim)" }}>{log.operator || "—"}</span>
                    {log.durationMinutes && <span style={{ color: "var(--text-faint)" }}>{log.durationMinutes}min</span>}
                    <span style={{ marginLeft: "auto", color: "var(--text-faint)", fontSize: 11 }}>{new Date(log.loggedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <button onClick={() => setShowCharts(!showCharts)} style={{ width: "100%", background: "none", border: "none", padding: "10px 14px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: "var(--text-primary)", fontSize: 13, fontWeight: 700 }}>
          {showCharts ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {t ? "WIP theo công đoạn" : "WIP by Station"}
        </button>
        {showCharts && (
          <div style={{ padding: "0 14px 14px" }}>
            <SafeResponsiveContainer width="100%" height={160}>
              <BarChart data={wipByStation}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-dim)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-dim)" }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {wipByStation.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </SafeResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
