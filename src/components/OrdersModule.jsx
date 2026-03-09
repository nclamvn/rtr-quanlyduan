import { useState, useMemo } from "react";
import {
  Package, ChevronDown, ChevronRight, Search, Filter, Clock,
  DollarSign, Truck, AlertTriangle, CheckCircle2, Circle, X
} from "lucide-react";
import SafeResponsiveContainer from "./SafeChart";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import EmptyState, { EMPTY_MESSAGES } from "./EmptyState";

const STATUS_FLOW = [
  'QUOTE', 'PO_RECEIVED', 'CONFIRMED', 'IN_PRODUCTION', 'QC_PASSED',
  'PACKED', 'SHIPPED', 'DELIVERED', 'INVOICED', 'PAID', 'CLOSED',
];
const STATUS_COLORS = {
  QUOTE: "#94A3B8", PO_RECEIVED: "#3B82F6", CONFIRMED: "#6366F1",
  IN_PRODUCTION: "#F59E0B", QC_PASSED: "#8B5CF6", PACKED: "#06B6D4",
  SHIPPED: "#0EA5E9", DELIVERED: "#10B981", INVOICED: "#14B8A6",
  PAID: "#22C55E", CLOSED: "#64748B", CANCELLED: "#EF4444", ON_HOLD: "#F97316",
};
const PRIORITY_COLORS = { URGENT: "#EF4444", HIGH: "#F59E0B", NORMAL: "#3B82F6", LOW: "#64748B" };
const PAYMENT_COLORS = { UNPAID: "#94A3B8", PARTIAL: "#F59E0B", PAID: "#10B981", OVERDUE: "#EF4444", REFUNDED: "#8B5CF6" };

const fmt = (n) => n >= 1000000 ? `$${(n/1000000).toFixed(1)}M` : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${n.toFixed(0)}`;

export default function OrdersModule({ orders, customers, loading, lang, perm }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [filterCustomer, setFilterCustomer] = useState("ALL");
  const [selOrder, setSelOrder] = useState(null);
  const [showCharts, setShowCharts] = useState(true);
  const t = lang === "vi";

  const filtered = useMemo(() => {
    let list = orders;
    if (filterStatus !== "ALL") list = list.filter(o => o.status === filterStatus);
    if (filterPriority !== "ALL") list = list.filter(o => o.priority === filterPriority);
    if (filterCustomer !== "ALL") list = list.filter(o => o.customerId === filterCustomer);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.poNumber || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, filterStatus, filterPriority, filterCustomer, search]);

  // KPIs
  const totalOrders = orders.length;
  const pipelineValue = orders.filter(o => !['CANCELLED', 'CLOSED', 'PAID'].includes(o.status)).reduce((s, o) => s + o.totalAmount, 0);
  const overdueOrders = orders.filter(o => o.requiredDeliveryDate && new Date(o.requiredDeliveryDate) < new Date() && !['DELIVERED', 'SHIPPED', 'PAID', 'CLOSED', 'CANCELLED'].includes(o.status)).length;
  const shippedMonth = orders.filter(o => o.status === 'SHIPPED' && o.actualDeliveryDate && new Date(o.actualDeliveryDate).getMonth() === new Date().getMonth()).length;

  // Pipeline funnel
  const funnelData = useMemo(() => {
    return STATUS_FLOW.map(s => ({
      name: s.replace(/_/g, ' '),
      count: orders.filter(o => o.status === s).length,
      color: STATUS_COLORS[s],
    })).filter(d => d.count > 0);
  }, [orders]);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-dim)" }}>{t ? "Đang tải..." : "Loading..."}</div>;
  if (orders.length === 0) { const em = EMPTY_MESSAGES[lang]?.orders || EMPTY_MESSAGES.vi.orders; return <EmptyState icon={em.icon} title={em.title} description={em.description} />; }

  const Badge = ({ color, children }) => (
    <span style={{ background: color + "18", color, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{children}</span>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
        {[
          { label: t ? "Tổng đơn" : "Total Orders", value: totalOrders, icon: Package, color: "#3B82F6" },
          { label: t ? "Giá trị Pipeline" : "Pipeline Value", value: fmt(pipelineValue), icon: DollarSign, color: "#10B981" },
          { label: t ? "Đơn quá hạn" : "Overdue", value: overdueOrders, icon: AlertTriangle, color: overdueOrders > 0 ? "#EF4444" : "#64748B" },
          { label: t ? "Giao tháng này" : "Shipped (Month)", value: shippedMonth, icon: Truck, color: "#06B6D4" },
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t ? "Tìm đơn hàng..." : "Search orders..."} style={{ width: "100%", padding: "6px 8px 6px 28px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 13 }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: "6px 8px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 12 }}>
          <option value="ALL">{t ? "Trạng thái" : "Status"}</option>
          {[...new Set(orders.map(o => o.status))].sort().map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ padding: "6px 8px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 12 }}>
          <option value="ALL">{t ? "Ưu tiên" : "Priority"}</option>
          {["URGENT", "HIGH", "NORMAL", "LOW"].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)} style={{ padding: "6px 8px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 12 }}>
          <option value="ALL">{t ? "Khách hàng" : "Customer"}</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Order Table */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 5 }}>
                {[t ? "Mã đơn" : "Order #", t ? "Khách hàng" : "Customer", "PO#", t ? "Tổng" : "Amount", t ? "Trạng thái" : "Status", t ? "Giao hàng" : "Delivery", t ? "Thanh toán" : "Payment"].map((h, i) => (
                  <th key={i} style={{ padding: "8px 12px", textAlign: "left", borderBottom: "2px solid var(--border)", color: "var(--text-dim)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} onClick={() => setSelOrder(selOrder?.id === o.id ? null : o)} style={{ cursor: "pointer", borderBottom: "1px solid var(--border)", background: selOrder?.id === o.id ? "var(--hover-bg)" : "transparent" }}>
                  <td style={{ padding: "8px 12px", fontWeight: 700 }}>{o.orderNumber}</td>
                  <td style={{ padding: "8px 12px" }}>{o.customerName}</td>
                  <td style={{ padding: "8px 12px", color: "var(--text-dim)" }}>{o.poNumber || "—"}</td>
                  <td style={{ padding: "8px 12px", fontWeight: 600 }}>{fmt(o.totalAmount)}</td>
                  <td style={{ padding: "8px 12px" }}><Badge color={STATUS_COLORS[o.status] || "#64748B"}>{o.status.replace(/_/g, ' ')}</Badge></td>
                  <td style={{ padding: "8px 12px", fontSize: 12, color: o.requiredDeliveryDate && new Date(o.requiredDeliveryDate) < new Date() && !['DELIVERED','SHIPPED','PAID','CLOSED','CANCELLED'].includes(o.status) ? "#EF4444" : "var(--text-dim)" }}>
                    {o.requiredDeliveryDate || "—"}
                  </td>
                  <td style={{ padding: "8px 12px" }}><Badge color={PAYMENT_COLORS[o.paymentStatus] || "#64748B"}>{o.paymentStatus}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: 30, textAlign: "center", color: "var(--text-dim)" }}>{t ? "Không tìm thấy đơn hàng" : "No orders match filters"}</div>
        )}
      </div>

      {/* Detail Panel */}
      {selOrder && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{selOrder.orderNumber} — {selOrder.customerName}</div>
            <button onClick={() => setSelOrder(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)" }}><X size={16} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, fontSize: 13 }}>
            <div><span style={{ color: "var(--text-dim)" }}>PO:</span> {selOrder.poNumber || "—"}</div>
            <div><span style={{ color: "var(--text-dim)" }}>{t ? "Ngày đặt:" : "Order Date:"}</span> {selOrder.orderDate || "—"}</div>
            <div><span style={{ color: "var(--text-dim)" }}>{t ? "Hạn giao:" : "Required:"}</span> {selOrder.requiredDeliveryDate || "—"}</div>
            <div><span style={{ color: "var(--text-dim)" }}>{t ? "Vận chuyển:" : "Shipping:"}</span> {selOrder.shippingMethod || "—"}</div>
            <div><span style={{ color: "var(--text-dim)" }}>{t ? "Tracking:" : "Tracking:"}</span> {selOrder.trackingNumber || "—"}</div>
            <div><span style={{ color: "var(--text-dim)" }}>{t ? "Đã thanh toán:" : "Paid:"}</span> {fmt(selOrder.paidAmount)} / {fmt(selOrder.totalAmount)}</div>
          </div>
          {selOrder.items.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t ? "Sản phẩm" : "Line Items"} ({selOrder.items.length})</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    {[t ? "Sản phẩm" : "Product", "SKU", t ? "SL" : "Qty", t ? "Đơn giá" : "Unit Price", t ? "Tổng" : "Total"].map((h, i) => (
                      <th key={i} style={{ padding: "4px 8px", textAlign: "left", borderBottom: "1px solid var(--border)", color: "var(--text-dim)", fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selOrder.items.map(item => (
                    <tr key={item.id}>
                      <td style={{ padding: "4px 8px" }}>{item.productName}</td>
                      <td style={{ padding: "4px 8px", color: "var(--text-dim)" }}>{item.productSku || "—"}</td>
                      <td style={{ padding: "4px 8px" }}>{item.quantity}</td>
                      <td style={{ padding: "4px 8px" }}>{fmt(item.unitPrice)}</td>
                      <td style={{ padding: "4px 8px", fontWeight: 600 }}>{fmt(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {selOrder.notes && <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-dim)", fontStyle: "italic" }}>{selOrder.notes}</div>}
        </div>
      )}

      {/* Charts */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <button onClick={() => setShowCharts(!showCharts)} style={{ width: "100%", background: "none", border: "none", padding: "10px 14px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: "var(--text-primary)", fontSize: 13, fontWeight: 700 }}>
          {showCharts ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {t ? "Biểu đồ Pipeline" : "Pipeline Charts"}
        </button>
        {showCharts && funnelData.length > 0 && (
          <div style={{ padding: "0 14px 14px" }}>
            <SafeResponsiveContainer width="100%" height={180}>
              <BarChart data={funnelData} layout="vertical" margin={{ left: 80 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-dim)" }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--text-dim)" }} width={80} />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {funnelData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </SafeResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
