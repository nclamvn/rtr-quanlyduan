import { useState, useMemo } from "react";
import {
  DollarSign, TrendingUp, AlertTriangle, Clock,
  ChevronDown, ChevronRight
} from "lucide-react";
import SafeResponsiveContainer from "./SafeChart";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from "recharts";
import EmptyState, { EMPTY_MESSAGES } from "./EmptyState";

const INVOICE_STATUS_COLORS = {
  DRAFT: "#94A3B8", SENT: "#3B82F6", PARTIAL: "#F59E0B",
  PAID: "#10B981", OVERDUE: "#EF4444", CANCELLED: "#64748B",
};
const COST_CATEGORY_COLORS = {
  MATERIAL: "#3B82F6", LABOR: "#F59E0B", OVERHEAD: "#8B5CF6",
  TOOLING: "#06B6D4", SHIPPING: "#F97316", OTHER: "#64748B",
};
const AGING_COLORS = { CURRENT: "#10B981", '1-30': "#F59E0B", '31-60': "#F97316", '61-90': "#EF4444", '90+': "#DC2626" };

const fmt = (n) => n >= 1000000 ? `$${(n/1000000).toFixed(1)}M` : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${n.toFixed(0)}`;

export default function FinanceModule({ financeSummary, invoices, costEntries, loading, lang }) {
  const [subTab, setSubTab] = useState("summary");
  const [showCharts, setShowCharts] = useState(true);
  const t = lang === "vi";

  // Totals
  const totalRevenue = financeSummary.reduce((s, f) => s + f.totalRevenue, 0);
  const totalCosts = financeSummary.reduce((s, f) => s + f.totalCosts, 0);
  const grossMargin = totalRevenue - totalCosts;
  const marginPercent = totalRevenue > 0 ? ((grossMargin / totalRevenue) * 100).toFixed(0) : 0;
  const outstandingAR = financeSummary.reduce((s, f) => s + f.outstandingAr, 0);
  const overdueInvoices = invoices.filter(inv => inv.status === 'OVERDUE').length;

  // Cost by category
  const costByCat = useMemo(() => {
    const map = {};
    costEntries.forEach(c => { map[c.category] = (map[c.category] || 0) + c.amount; });
    return Object.entries(map).map(([name, value]) => ({
      name, value, color: COST_CATEGORY_COLORS[name] || "#64748B",
    }));
  }, [costEntries]);

  // Margin by project
  const marginByProject = useMemo(() =>
    financeSummary.filter(f => f.totalRevenue > 0 || f.totalCosts > 0).map(f => ({
      name: f.projectName.split(' ')[0],
      revenue: f.totalRevenue,
      costs: f.totalCosts,
      margin: f.grossMargin,
    })),
    [financeSummary]
  );

  // AR aging
  const agingData = useMemo(() => {
    const buckets = { CURRENT: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    invoices.filter(inv => !['PAID', 'CANCELLED'].includes(inv.status)).forEach(inv => {
      buckets[inv.agingBucket] = (buckets[inv.agingBucket] || 0) + inv.balance;
    });
    return Object.entries(buckets).map(([name, value]) => ({ name, value, color: AGING_COLORS[name] }));
  }, [invoices]);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-dim)" }}>{t ? "Đang tải..." : "Loading..."}</div>;
  if (financeSummary.length === 0 && invoices.length === 0) { const em = EMPTY_MESSAGES[lang]?.finance || EMPTY_MESSAGES.vi.finance; return <EmptyState icon={em.icon} title={em.title} description={em.description} />; }

  const Badge = ({ color, children }) => (
    <span style={{ background: color + "18", color, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{children}</span>
  );

  const SUB_TABS = [
    { id: "summary", label: t ? "Tổng quan" : "Summary" },
    { id: "invoices", label: t ? "Hóa đơn" : "Invoices" },
    { id: "costs", label: t ? "Chi phí" : "Costs" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
        {[
          { label: t ? "Doanh thu" : "Revenue", value: fmt(totalRevenue), icon: TrendingUp, color: "#10B981" },
          { label: t ? "Chi phí" : "Costs", value: fmt(totalCosts), icon: DollarSign, color: "#F59E0B" },
          { label: t ? "Biên lợi nhuận" : "Margin", value: `${marginPercent}%`, icon: TrendingUp, color: parseFloat(marginPercent) >= 50 ? "#10B981" : "#F59E0B" },
          { label: t ? "AR chưa thu" : "Outstanding AR", value: fmt(outstandingAR), icon: Clock, color: outstandingAR > 0 ? "#F59E0B" : "#64748B" },
          { label: t ? "Hóa đơn quá hạn" : "Overdue Invoices", value: overdueInvoices, icon: AlertTriangle, color: overdueInvoices > 0 ? "#EF4444" : "#64748B" },
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

      {/* Per-Project Finance Cards */}
      {financeSummary.filter(f => f.totalRevenue > 0 || f.totalCosts > 0).length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
          {financeSummary.filter(f => f.totalRevenue > 0 || f.totalCosts > 0).map(f => (
            <div key={f.projectId} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>{f.projectName}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, fontSize: 12 }}>
                <div><span style={{ color: "var(--text-dim)" }}>{t ? "DT:" : "Rev:"}</span> <span style={{ fontWeight: 700, color: "#10B981" }}>{fmt(f.totalRevenue)}</span></div>
                <div><span style={{ color: "var(--text-dim)" }}>{t ? "CP:" : "Cost:"}</span> <span style={{ fontWeight: 700, color: "#F59E0B" }}>{fmt(f.totalCosts)}</span></div>
                <div><span style={{ color: "var(--text-dim)" }}>{t ? "BLN:" : "Margin:"}</span> <span style={{ fontWeight: 700, color: f.marginPercent >= 50 ? "#10B981" : "#F59E0B" }}>{f.marginPercent.toFixed(0)}%</span></div>
              </div>
              <div style={{ marginTop: 6 }}>
                <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, f.marginPercent)}%`, background: f.marginPercent >= 50 ? "#10B981" : "#F59E0B", borderRadius: 3 }} />
                </div>
              </div>
              {f.overdueCount > 0 && <div style={{ marginTop: 4, fontSize: 11, color: "#EF4444" }}>{f.overdueCount} {t ? "đơn quá hạn" : "overdue"}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)" }}>
        {SUB_TABS.map(st => (
          <button key={st.id} onClick={() => setSubTab(st.id)} style={{ background: "none", border: "none", borderBottom: subTab === st.id ? "2px solid #3B82F6" : "2px solid transparent", padding: "8px 16px", color: subTab === st.id ? "var(--text-primary)" : "var(--text-dim)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {st.label}
          </button>
        ))}
      </div>

      {/* Invoices Tab */}
      {subTab === "invoices" && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 5 }}>
                  {["INV#", t ? "Khách" : "Customer", t ? "Tổng" : "Amount", t ? "Đã trả" : "Paid", t ? "Còn lại" : "Balance", t ? "Hạn" : "Due", t ? "Trạng thái" : "Status", t ? "Quá hạn" : "Aging"].map((h, i) => (
                    <th key={i} style={{ padding: "8px 12px", textAlign: "left", borderBottom: "2px solid var(--border)", color: "var(--text-dim)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 700 }}>{inv.invoiceNumber}</td>
                    <td style={{ padding: "8px 12px" }}>{inv.customerName}</td>
                    <td style={{ padding: "8px 12px", fontWeight: 600 }}>{fmt(inv.totalAmount)}</td>
                    <td style={{ padding: "8px 12px", color: "#10B981" }}>{fmt(inv.paidAmount)}</td>
                    <td style={{ padding: "8px 12px", fontWeight: 600, color: inv.balance > 0 ? "#F59E0B" : "var(--text-dim)" }}>{fmt(inv.balance)}</td>
                    <td style={{ padding: "8px 12px", fontSize: 12 }}>{inv.dueDate}</td>
                    <td style={{ padding: "8px 12px" }}><Badge color={INVOICE_STATUS_COLORS[inv.status]}>{inv.status}</Badge></td>
                    <td style={{ padding: "8px 12px" }}>{inv.daysPastDue > 0 ? <Badge color={AGING_COLORS[inv.agingBucket]}>{inv.daysPastDue}d</Badge> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {invoices.length === 0 && <div style={{ padding: 30, textAlign: "center", color: "var(--text-dim)" }}>{t ? "Chưa có hóa đơn" : "No invoices"}</div>}
        </div>
      )}

      {/* Costs Tab */}
      {subTab === "costs" && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 5 }}>
                  {[t ? "Loại" : "Category", t ? "Mô tả" : "Description", t ? "Số tiền" : "Amount", "WO#", t ? "Ngày" : "Date", t ? "NCC" : "Vendor"].map((h, i) => (
                    <th key={i} style={{ padding: "8px 12px", textAlign: "left", borderBottom: "2px solid var(--border)", color: "var(--text-dim)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {costEntries.map(c => (
                  <tr key={c.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 12px" }}><Badge color={COST_CATEGORY_COLORS[c.category]}>{c.category}</Badge></td>
                    <td style={{ padding: "8px 12px" }}>{c.description}</td>
                    <td style={{ padding: "8px 12px", fontWeight: 700 }}>{fmt(c.amount)}</td>
                    <td style={{ padding: "8px 12px", color: "var(--text-dim)" }}>{c.woNumber || "—"}</td>
                    <td style={{ padding: "8px 12px", fontSize: 12 }}>{c.date}</td>
                    <td style={{ padding: "8px 12px", color: "var(--text-dim)" }}>{c.vendor || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {costEntries.length === 0 && <div style={{ padding: 30, textAlign: "center", color: "var(--text-dim)" }}>{t ? "Chưa có chi phí" : "No costs"}</div>}
        </div>
      )}

      {/* Summary Charts */}
      {subTab === "summary" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
          {/* Margin by Project */}
          {marginByProject.length > 0 && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{t ? "Doanh thu vs Chi phí" : "Revenue vs Cost"}</div>
              <SafeResponsiveContainer width="100%" height={180}>
                <BarChart data={marginByProject}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-dim)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-dim)" }} tickFormatter={v => fmt(v)} />
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} />
                  <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} name={t ? "Doanh thu" : "Revenue"} />
                  <Bar dataKey="costs" fill="#F59E0B" radius={[4, 4, 0, 0]} name={t ? "Chi phí" : "Costs"} />
                </BarChart>
              </SafeResponsiveContainer>
            </div>
          )}

          {/* Cost Breakdown Pie */}
          {costByCat.length > 0 && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{t ? "Chi phí theo loại" : "Cost Breakdown"}</div>
              <SafeResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={costByCat} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {costByCat.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} />
                </PieChart>
              </SafeResponsiveContainer>
            </div>
          )}

          {/* AR Aging */}
          {agingData.some(d => d.value > 0) && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{t ? "Tuổi nợ phải thu" : "AR Aging"}</div>
              <SafeResponsiveContainer width="100%" height={180}>
                <BarChart data={agingData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-dim)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-dim)" }} tickFormatter={v => fmt(v)} />
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} name={t ? "Số tiền" : "Amount"}>
                    {agingData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </SafeResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
