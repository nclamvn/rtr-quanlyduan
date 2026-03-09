import { useState, useMemo } from "react";
import {
  Package, Search, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronRight, X, ArrowDown, ArrowUp, RotateCcw
} from "lucide-react";
import SafeResponsiveContainer from "./SafeChart";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import EmptyState, { EMPTY_MESSAGES } from "./EmptyState";

const CATEGORY_COLORS = {
  MECHANICAL: "#3B82F6", ELECTRICAL: "#F59E0B", SOFTWARE: "#8B5CF6", CONSUMABLE: "#10B981",
};
const STOCK_COLORS = { CRITICAL: "#EF4444", LOW: "#F59E0B", OK: "#10B981" };
const TXN_COLORS = { IN: "#10B981", OUT: "#EF4444", ADJUST: "#F59E0B", RETURN: "#3B82F6", SCRAP: "#94A3B8" };

const fmt = (n) => n >= 1000000 ? `$${(n/1000000).toFixed(1)}M` : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${n.toFixed(0)}`;

export default function InventoryModule({ inventory, transactions, loading, lang, perm }) {
  const [search, setSearch] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterStock, setFilterStock] = useState("ALL");
  const [selItem, setSelItem] = useState(null);
  const [showCharts, setShowCharts] = useState(true);
  const t = lang === "vi";

  const filtered = useMemo(() => {
    let list = inventory;
    if (filterWarehouse !== "ALL") list = list.filter(i => i.warehouse === filterWarehouse);
    if (filterCategory !== "ALL") list = list.filter(i => i.category === filterCategory);
    if (filterStock !== "ALL") list = list.filter(i => i.stockStatus === filterStock);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.partNumber.toLowerCase().includes(q) || i.partName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [inventory, filterWarehouse, filterCategory, filterStock, search]);

  // KPIs
  const totalSKUs = inventory.length;
  const totalValue = inventory.reduce((s, i) => s + i.totalValue, 0);
  const lowStockCount = inventory.filter(i => i.stockStatus === 'LOW').length;
  const criticalCount = inventory.filter(i => i.stockStatus === 'CRITICAL').length;

  // Value by category
  const valueByCat = useMemo(() => {
    const map = {};
    inventory.forEach(i => {
      const cat = i.category || 'OTHER';
      map[cat] = (map[cat] || 0) + i.totalValue;
    });
    return Object.entries(map).map(([name, value]) => ({
      name, value, color: CATEGORY_COLORS[name] || "#64748B",
    }));
  }, [inventory]);

  const warehouses = useMemo(() => [...new Set(inventory.map(i => i.warehouse))], [inventory]);
  const itemTransactions = useMemo(() =>
    selItem ? transactions.filter(tx => tx.inventoryId === selItem.id) : [],
    [selItem, transactions]
  );

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-dim)" }}>{t ? "Đang tải..." : "Loading..."}</div>;
  if (inventory.length === 0) { const em = EMPTY_MESSAGES[lang]?.inventory || EMPTY_MESSAGES.vi.inventory; return <EmptyState icon={em.icon} title={em.title} description={em.description} />; }

  const Badge = ({ color, children }) => (
    <span style={{ background: color + "18", color, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{children}</span>
  );

  const StockBadge = ({ status }) => {
    const labels = { CRITICAL: t ? "HET" : "OUT", LOW: t ? "THAP" : "LOW", OK: "OK" };
    return <Badge color={STOCK_COLORS[status]}>{labels[status]}</Badge>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
        {[
          { label: t ? "Tổng SKU" : "Total SKUs", value: totalSKUs, icon: Package, color: "#3B82F6" },
          { label: t ? "Tổng giá trị" : "Total Value", value: fmt(totalValue), icon: Package, color: "#10B981" },
          { label: t ? "Cảnh báo thấp" : "Low Stock", value: lowStockCount, icon: AlertTriangle, color: lowStockCount > 0 ? "#F59E0B" : "#64748B" },
          { label: t ? "Hết hàng" : "Critical/Out", value: criticalCount, icon: AlertTriangle, color: criticalCount > 0 ? "#EF4444" : "#64748B" },
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t ? "Tìm linh kiện..." : "Search parts..."} style={{ width: "100%", padding: "6px 8px 6px 28px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 13 }} />
        </div>
        <select value={filterWarehouse} onChange={e => setFilterWarehouse(e.target.value)} style={{ padding: "6px 8px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 12 }}>
          <option value="ALL">{t ? "Kho" : "Warehouse"}</option>
          {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ padding: "6px 8px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 12 }}>
          <option value="ALL">{t ? "Loại" : "Category"}</option>
          {Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStock} onChange={e => setFilterStock(e.target.value)} style={{ padding: "6px 8px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 12 }}>
          <option value="ALL">{t ? "Tồn kho" : "Stock Level"}</option>
          <option value="CRITICAL">{t ? "Hết hàng" : "Critical"}</option>
          <option value="LOW">{t ? "Thấp" : "Low"}</option>
          <option value="OK">OK</option>
        </select>
      </div>

      {/* Inventory Table */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 5 }}>
                {[t ? "Mã LK" : "Part#", t ? "Tên" : "Name", t ? "Tồn" : "On Hand", t ? "Đặt trước" : "Reserved", t ? "Khả dụng" : "Available", "Min", t ? "Trạng thái" : "Status", t ? "Giá trị" : "Value"].map((h, i) => (
                  <th key={i} style={{ padding: "8px 12px", textAlign: "left", borderBottom: "2px solid var(--border)", color: "var(--text-dim)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} onClick={() => setSelItem(selItem?.id === item.id ? null : item)} style={{ cursor: "pointer", borderBottom: "1px solid var(--border)", background: selItem?.id === item.id ? "var(--hover-bg)" : "transparent" }}>
                  <td style={{ padding: "8px 12px", fontWeight: 700, fontFamily: "monospace", fontSize: 12 }}>{item.partNumber}</td>
                  <td style={{ padding: "8px 12px" }}>{item.partName}</td>
                  <td style={{ padding: "8px 12px", fontWeight: 600 }}>{item.quantityOnHand}</td>
                  <td style={{ padding: "8px 12px", color: "var(--text-dim)" }}>{item.quantityReserved}</td>
                  <td style={{ padding: "8px 12px", fontWeight: 700, color: STOCK_COLORS[item.stockStatus] }}>{item.quantityAvailable}</td>
                  <td style={{ padding: "8px 12px", color: "var(--text-dim)" }}>{item.minStock || "—"}</td>
                  <td style={{ padding: "8px 12px" }}><StockBadge status={item.stockStatus} /></td>
                  <td style={{ padding: "8px 12px", fontSize: 12 }}>{fmt(item.totalValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div style={{ padding: 30, textAlign: "center", color: "var(--text-dim)" }}>{t ? "Không tìm thấy" : "No items match"}</div>}
      </div>

      {/* Detail + Transactions */}
      {selItem && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{selItem.partNumber} — {selItem.partName}</div>
            <button onClick={() => setSelItem(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)" }}><X size={16} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, fontSize: 13 }}>
            <div><span style={{ color: "var(--text-dim)" }}>{t ? "Kho:" : "Warehouse:"}</span> {selItem.warehouse}</div>
            <div><span style={{ color: "var(--text-dim)" }}>{t ? "Vị trí:" : "Location:"}</span> {selItem.location || "—"}</div>
            <div><span style={{ color: "var(--text-dim)" }}>{t ? "Loại:" : "Category:"}</span> {selItem.category || "—"}</div>
            <div><span style={{ color: "var(--text-dim)" }}>{t ? "NCC:" : "Supplier:"}</span> {selItem.supplierName || "—"}</div>
            <div><span style={{ color: "var(--text-dim)" }}>{t ? "Đơn giá:" : "Unit Cost:"}</span> ${selItem.unitCost.toFixed(2)}</div>
            <div><span style={{ color: "var(--text-dim)" }}>{t ? "Đang đặt:" : "On Order:"}</span> {selItem.quantityOnOrder}</div>
            <div><span style={{ color: "var(--text-dim)" }}>Lead Time:</span> {selItem.leadTimeDays} {t ? "ngày" : "days"}</div>
          </div>
          {selItem.notes && <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-dim)", fontStyle: "italic" }}>{selItem.notes}</div>}

          {itemTransactions.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t ? "Lịch sử giao dịch" : "Transaction History"}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {itemTransactions.slice(0, 10).map(tx => (
                  <div key={tx.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
                    <Badge color={TXN_COLORS[tx.type]}>{tx.type}</Badge>
                    <span style={{ fontWeight: 700, color: tx.quantity > 0 ? "#10B981" : "#EF4444" }}>{tx.quantity > 0 ? "+" : ""}{tx.quantity}</span>
                    <span style={{ color: "var(--text-dim)" }}>{tx.referenceId || tx.reason || "—"}</span>
                    <span style={{ marginLeft: "auto", color: "var(--text-faint)", fontSize: 11 }}>{new Date(tx.transactionDate).toLocaleDateString()}</span>
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
          {t ? "Giá trị theo loại" : "Value by Category"}
        </button>
        {showCharts && valueByCat.length > 0 && (
          <div style={{ padding: "0 14px 14px", display: "flex", alignItems: "center", gap: 20 }}>
            <SafeResponsiveContainer width="50%" height={160}>
              <PieChart>
                <Pie data={valueByCat} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {valueByCat.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} />
              </PieChart>
            </SafeResponsiveContainer>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{t ? "Top cảnh báo tồn kho" : "Low Stock Alerts"}</div>
              {inventory.filter(i => i.stockStatus !== 'OK').slice(0, 5).map(i => (
                <div key={i.id} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, padding: "3px 0" }}>
                  <StockBadge status={i.stockStatus} />
                  <span style={{ fontFamily: "monospace", fontSize: 11 }}>{i.partNumber}</span>
                  <span style={{ color: "var(--text-dim)" }}>{i.partName}</span>
                  <span style={{ marginLeft: "auto", fontWeight: 700, color: STOCK_COLORS[i.stockStatus] }}>{i.quantityAvailable}</span>
                </div>
              ))}
              {inventory.filter(i => i.stockStatus !== 'OK').length === 0 && (
                <div style={{ color: "var(--text-faint)", fontSize: 12 }}>{t ? "Tất cả OK" : "All stock OK"}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
