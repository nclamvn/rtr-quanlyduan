// ═══════════════════════════════════════════════════════════
// RtR Control Tower — Cross-App Intelligence Widget
// Shows MRP production pipeline, inventory alerts, sales orders
// ═══════════════════════════════════════════════════════════
import { useState } from "react";
import {
  Factory, Package, ShoppingCart, AlertTriangle,
  ChevronDown, ChevronRight, ExternalLink, Clock,
  CheckCircle2, Truck, Ban, TrendingUp, Zap,
} from "lucide-react";
import { mono, sans } from "../constants";

const STATUS_COLORS = {
  draft: "#94A3B8",
  confirmed: "#3B82F6",
  in_production: "#F59E0B",
  completed: "#10B981",
  shipped: "#8B5CF6",
  delivered: "#10B981",
  stockout: "#EF4444",
  low_stock: "#F59E0B",
  eol: "#DC2626",
  overdue: "#EF4444",
};

function MiniCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 12px", flex: 1, minWidth: 90 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
        <Icon size={11} color={color} />
        <span style={{ fontSize: 10, color: "var(--text-dim)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: sans }}>{label}</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: mono, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 2, fontFamily: sans }}>{sub}</div>}
    </div>
  );
}

export default function CrossAppWidget({ data, summary, loading, lang }) {
  const vi = lang === "vi";
  const [expanded, setExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState("production");

  if (loading) {
    return (
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
        <div className="skeleton" style={{ height: 16, width: 200, borderRadius: 3, marginBottom: 10 }} />
        <div style={{ display: "flex", gap: 8 }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 56, flex: 1, borderRadius: 6 }} />)}
        </div>
      </div>
    );
  }

  const workOrders = data.filter(d => d.entity_type === "work_order");
  const inventoryAlerts = data.filter(d => d.entity_type === "inventory_alert");
  const salesOrders = data.filter(d => d.entity_type === "sales_order");
  const prodSummary = data.find(d => d.entity_type === "production_summary")?.data;
  const lastSynced = data[0]?.synced_at;

  // No MRP data yet
  if (data.length === 0) {
    return (
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <Factory size={14} color="#8B5CF6" />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: sans }}>
            {vi ? "Liên kết MRP" : "MRP Integration"}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-faint)", fontFamily: sans }}>
          {vi ? "Chưa có dữ liệu từ MRP. Chạy sync script để kết nối." : "No MRP data yet. Run sync script to connect."}
        </div>
      </div>
    );
  }

  const overdueWOs = workOrders.filter(d => d.due_date && new Date(d.due_date) < new Date() && !["completed", "cancelled"].includes(d.status));
  const urgentAlerts = inventoryAlerts.filter(d => d.priority === "urgent");

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", cursor: "pointer", borderBottom: expanded ? "1px solid var(--border)" : "none" }}
      >
        {expanded ? <ChevronDown size={13} color="var(--text-dim)" /> : <ChevronRight size={13} color="var(--text-dim)" />}
        <Factory size={14} color="#8B5CF6" />
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: sans, flex: 1 }}>
          {vi ? "Liên kết MRP — Sản xuất & Kho" : "MRP Bridge — Production & Inventory"}
        </span>
        {overdueWOs.length > 0 && (
          <span style={{ fontSize: 10, fontWeight: 700, color: "#EF4444", background: "#EF444415", padding: "2px 6px", borderRadius: 3, fontFamily: mono }}>
            {overdueWOs.length} {vi ? "quá hạn" : "overdue"}
          </span>
        )}
        {urgentAlerts.length > 0 && (
          <span style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B", background: "#F59E0B15", padding: "2px 6px", borderRadius: 3, fontFamily: mono }}>
            {urgentAlerts.length} {vi ? "cảnh báo" : "alerts"}
          </span>
        )}
        {lastSynced && (
          <span style={{ fontSize: 9, color: "var(--text-faint)", fontFamily: mono }}>
            {vi ? "Đồng bộ" : "Synced"} {new Date(lastSynced).toLocaleTimeString(vi ? "vi-VN" : "en-US", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {expanded && (
        <div style={{ padding: 16 }}>
          {/* KPI Row */}
          {prodSummary && (
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <MiniCard icon={Factory} label={vi ? "Đang SX" : "In Prod"} value={prodSummary.inProduction} color="#F59E0B" />
              <MiniCard icon={CheckCircle2} label={vi ? "Đã xong" : "Done"} value={prodSummary.completedToday} color="#10B981" />
              <MiniCard icon={Clock} label={vi ? "Chờ" : "Queued"} value={prodSummary.confirmed} color="#3B82F6" />
              <MiniCard icon={Ban} label={vi ? "Trễ" : "Overdue"} value={prodSummary.overdue} color={prodSummary.overdue > 0 ? "#EF4444" : "#10B981"} />
            </div>
          )}

          {/* Tab Switcher */}
          <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
            {[
              { id: "production", label: vi ? "Sản xuất" : "Production", icon: Factory, count: workOrders.length },
              { id: "inventory", label: vi ? "Kho" : "Inventory", icon: Package, count: inventoryAlerts.length },
              { id: "sales", label: vi ? "Đơn hàng" : "Sales", icon: ShoppingCart, count: salesOrders.length },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                background: activeTab === tab.id ? "#8B5CF615" : "transparent",
                border: `1px solid ${activeTab === tab.id ? "#8B5CF640" : "transparent"}`,
                borderRadius: 4, padding: "4px 10px", fontSize: 11, fontWeight: 600,
                color: activeTab === tab.id ? "#A78BFA" : "var(--text-dim)", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4, fontFamily: sans,
              }}>
                <tab.icon size={11} /> {tab.label}
                <span style={{ fontFamily: mono, fontSize: 10 }}>({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {activeTab === "production" && workOrders.slice(0, 15).map(wo => (
              <div key={wo.entity_id} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 8px",
                borderLeft: `3px solid ${STATUS_COLORS[wo.status] || "#6B7280"}`,
                borderBottom: "1px solid var(--border-a10)", fontSize: 12,
              }}>
                <span style={{ fontFamily: mono, color: "var(--text-faint)", fontSize: 10, width: 70, flexShrink: 0 }}>{wo.data?.woNumber}</span>
                <span style={{ color: "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: sans }}>{wo.data?.productName}</span>
                <span style={{ fontFamily: mono, color: "var(--text-muted)", fontSize: 11 }}>×{wo.data?.quantity}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: STATUS_COLORS[wo.status] || "var(--text-dim)", textTransform: "uppercase", fontFamily: mono }}>{wo.status}</span>
              </div>
            ))}

            {activeTab === "inventory" && inventoryAlerts.slice(0, 15).map(inv => (
              <div key={inv.entity_id} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 8px",
                borderLeft: `3px solid ${STATUS_COLORS[inv.status] || "#F59E0B"}`,
                borderBottom: "1px solid var(--border-a10)", fontSize: 12,
              }}>
                <AlertTriangle size={11} color={inv.priority === "urgent" ? "#EF4444" : "#F59E0B"} />
                <span style={{ color: "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: sans }}>{inv.data?.partName}</span>
                <span style={{ fontFamily: mono, fontSize: 11, color: inv.data?.availableQty <= 0 ? "#EF4444" : "#F59E0B", fontWeight: 700 }}>{inv.data?.availableQty}/{inv.data?.reorderPoint}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: STATUS_COLORS[inv.status] || "#F59E0B", textTransform: "uppercase", fontFamily: mono }}>{inv.status?.replace("_", " ")}</span>
              </div>
            ))}

            {activeTab === "sales" && salesOrders.slice(0, 15).map(so => (
              <div key={so.entity_id} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 8px",
                borderLeft: `3px solid ${STATUS_COLORS[so.status] || "#3B82F6"}`,
                borderBottom: "1px solid var(--border-a10)", fontSize: 12,
              }}>
                <span style={{ fontFamily: mono, color: "var(--text-faint)", fontSize: 10, width: 70, flexShrink: 0 }}>{so.data?.orderNumber}</span>
                <span style={{ color: "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: sans }}>{so.data?.customerName}</span>
                {so.data?.totalAmount && <span style={{ fontFamily: mono, fontSize: 11, color: "#10B981" }}>${so.data.totalAmount.toLocaleString()}</span>}
                <span style={{ fontSize: 9, fontWeight: 700, color: STATUS_COLORS[so.status] || "var(--text-dim)", textTransform: "uppercase", fontFamily: mono }}>{so.status}</span>
              </div>
            ))}

            {((activeTab === "production" && workOrders.length === 0) ||
              (activeTab === "inventory" && inventoryAlerts.length === 0) ||
              (activeTab === "sales" && salesOrders.length === 0)) && (
              <div style={{ padding: 20, textAlign: "center", color: "var(--text-faint)", fontSize: 12, fontFamily: sans }}>
                {vi ? "Không có dữ liệu" : "No data"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
