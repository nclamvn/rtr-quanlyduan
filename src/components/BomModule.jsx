import { useState, useMemo } from "react";
import {
  Package, ChevronRight, ChevronDown, AlertTriangle, Search,
  Box, Cpu, Code, Droplets, ExternalLink, Layers, DollarSign,
  CircleAlert, Check, ShieldAlert, FilterX
} from "lucide-react";
import EmptyState, { EMPTY_MESSAGES } from "./EmptyState";
import {
  BOM_CATEGORY_COLORS, BOM_LIFECYCLE_COLORS,
} from "../data/v2Data";
import { useBomData, useSupplierData } from "../hooks/useV2Data";
import {
  PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import SafeResponsiveContainer from "./SafeChart";

const mono = "'JetBrains Mono', 'Fira Code', monospace";
const sans = "'Outfit', 'Segoe UI', system-ui, sans-serif";

const CATEGORY_ICONS = { MECHANICAL: Box, ELECTRICAL: Cpu, SOFTWARE: Code, CONSUMABLE: Droplets };

const normalizeVN = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

function Badge({ label, color, size = "sm", icon: IconComp }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: size === "sm" ? "1px 7px" : "3px 10px", borderRadius: 3, background: color + "15", color, fontSize: size === "sm" ? 9 : 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", border: `1px solid ${color}25`, fontFamily: mono, whiteSpace: "nowrap" }}>
      {IconComp ? <IconComp size={size === "sm" ? 10 : 12} /> : <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />}
      {label}
    </span>
  );
}

function BomTreeRow({ item, depth, expanded, onToggle, hasChildren, onSelect, selected, lang, supplierMap, canViewCost }) {
  const isAssembly = hasChildren;
  const CatIcon = CATEGORY_ICONS[item.category] || Box;
  const supplier = item.supplierId ? supplierMap.get(item.supplierId) : null;
  const lifecycleColor = BOM_LIFECYCLE_COLORS[item.lifecycleStatus] || "var(--text-dim)";
  const isWarning = item.lifecycleStatus === "EOL" || item.lifecycleStatus === "OBSOLETE" || item.lifecycleStatus === "NRND";

  return (
    <div
      onClick={() => onSelect(item)}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 10px 6px " + (16 + depth * 24) + "px",
        cursor: "pointer",
        background: selected ? "#1D4ED810" : "transparent",
        borderLeft: selected ? "2px solid #3B82F6" : "2px solid transparent",
        borderBottom: "1px solid var(--bg-input)",
        transition: "background 0.15s",
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = "var(--border-a20)"; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent"; }}
    >
      {/* Expand/Collapse toggle */}
      <div style={{ width: 16, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
           onClick={e => { e.stopPropagation(); if (hasChildren) onToggle(item.id); }}>
        {hasChildren ? (
          expanded ? <ChevronDown size={12} color="var(--text-dim)" /> : <ChevronRight size={12} color="var(--text-dim)" />
        ) : <span style={{ width: 12 }} />}
      </div>

      {/* Icon */}
      {isAssembly
        ? <Package size={13} color={BOM_CATEGORY_COLORS[item.category] || "var(--text-dim)"} />
        : <CatIcon size={11} color={BOM_CATEGORY_COLORS[item.category] || "var(--text-dim)"} />
      }

      {/* Part Number */}
      <span title={item.partNumber} style={{ fontSize: 12, fontFamily: mono, color: "var(--text-dim)", width: 110, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {item.partNumber}
      </span>

      {/* Description */}
      <span title={lang === "vi" && item.descriptionVi ? item.descriptionVi : item.description} style={{ fontSize: 13, color: isAssembly ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: isAssembly ? 700 : 400, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {lang === "vi" && item.descriptionVi ? item.descriptionVi : item.description}
      </span>

      {/* Lifecycle warning */}
      {isWarning && <Badge label={item.lifecycleStatus} color={lifecycleColor} icon={item.lifecycleStatus === "OBSOLETE" ? ShieldAlert : AlertTriangle} />}

      {/* Qty */}
      <span style={{ fontSize: 12, fontFamily: mono, color: "var(--text-muted)", width: 30, textAlign: "right", flexShrink: 0 }}>
        ×{item.quantity}
      </span>

      {/* Cost */}
      {canViewCost && (
        <span style={{ fontSize: 13, fontFamily: mono, color: isAssembly ? "#10B981" : "var(--text-muted)", width: 70, textAlign: "right", flexShrink: 0, fontWeight: isAssembly ? 700 : 400 }}>
          ${(item.totalCost || 0).toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </span>
      )}

      {/* Supplier */}
      <span style={{ fontSize: 12, color: "var(--text-dim)", width: 36, textAlign: "center", flexShrink: 0 }}>
        {supplier ? supplier.code : "—"}
      </span>

      {/* Lead Time */}
      <span style={{ fontSize: 12, fontFamily: mono, color: "var(--text-dim)", width: 30, textAlign: "right", flexShrink: 0 }}>
        {item.leadTimeDays ? `${item.leadTimeDays}d` : "—"}
      </span>
    </div>
  );
}

export default function BomModule({ lang, t, project, perm }) {
  const [subTab, setSubTab] = useState("tree");
  const [expandedNodes, setExpandedNodes] = useState(new Set(["BOM-001"]));
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterLifecycle, setFilterLifecycle] = useState("ALL");
  const [search, setSearch] = useState("");

  const canViewCost = perm?.canViewCost ? perm.canViewCost() : true;

  // Fetch from Supabase (or static fallback)
  const { data: bomParts, loading: bomLoading } = useBomData(project?.id);
  const { data: suppliers } = useSupplierData();
  const supplierMap = useMemo(() => new Map(suppliers.map(s => [s.id, s])), [suppliers]);

  // BOM already comes with costs calculated from the hook
  const projectBom = bomParts;

  // Build tree structure
  const childrenMap = useMemo(() => {
    const m = new Map();
    for (const item of projectBom) {
      if (item.parentId) {
        if (!m.has(item.parentId)) m.set(item.parentId, []);
        m.get(item.parentId).push(item);
      }
    }
    return m;
  }, [projectBom]);

  const rootItems = useMemo(() => projectBom.filter(b => !b.parentId), [projectBom]);

  // Cost summary
  const costSummary = useMemo(() => {
    const byCategory = {};
    for (const item of projectBom) {
      if (item.level === 2) {
        const cat = item.category;
        if (!byCategory[cat]) byCategory[cat] = 0;
        byCategory[cat] += (item.unitCost || 0) * item.quantity;
      }
    }
    const total = rootItems.reduce((sum, r) => sum + (r.totalCost || 0), 0);
    const eolCount = projectBom.filter(b => b.lifecycleStatus === "EOL" || b.lifecycleStatus === "OBSOLETE").length;
    const nrndCount = projectBom.filter(b => b.lifecycleStatus === "NRND").length;
    const totalParts = projectBom.filter(b => b.level === 2).length;
    const assemblies = projectBom.filter(b => b.level === 1).length;
    // Sub-assembly costs for charts
    const bySubAssy = projectBom.filter(b => b.level === 1).map(b => ({
      name: lang === "vi" ? (b.descriptionVi || b.description) : b.description,
      value: b.totalCost || 0,
    })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
    // Supplier costs
    const supplierCosts = {};
    projectBom.filter(b => b.level === 2 && b.supplierId).forEach(b => {
      const s = supplierMap.get(b.supplierId);
      const name = s ? s.code : b.supplierId;
      supplierCosts[name] = (supplierCosts[name] || 0) + (b.unitCost || 0) * b.quantity;
    });
    const bySupplier = Object.entries(supplierCosts).map(([name, cost]) => ({ name, value: cost })).sort((a, b) => b.value - a.value);
    // Lifecycle breakdown
    const lifecycleCounts = {};
    projectBom.filter(b => b.level === 2).forEach(b => { lifecycleCounts[b.lifecycleStatus] = (lifecycleCounts[b.lifecycleStatus] || 0) + 1; });
    const byLifecycle = Object.entries(lifecycleCounts).map(([k, v]) => ({ name: k, value: v, color: BOM_LIFECYCLE_COLORS[k] || "#6B7280" }));
    return { total, byCategory, eolCount, nrndCount, totalParts, assemblies, bySubAssy, bySupplier, byLifecycle };
  }, [projectBom, rootItems, lang, supplierMap]);

  const toggleExpand = (id) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Flatten tree for rendering
  const flattenTree = (items, depth = 0) => {
    const rows = [];
    for (const item of items) {
      // Filter
      if (filterCategory !== "ALL" && item.level === 2 && item.category !== filterCategory) continue;
      if (filterLifecycle !== "ALL" && item.level === 2 && item.lifecycleStatus !== filterLifecycle) continue;
      if (search && item.level === 2) {
        const s = normalizeVN(search);
        const match = normalizeVN(item.partNumber).includes(s) || normalizeVN(item.description).includes(s) || normalizeVN(item.descriptionVi || "").includes(s);
        if (!match) continue;
      }

      const children = childrenMap.get(item.id) || [];
      rows.push({ item, depth, hasChildren: children.length > 0 });
      if (children.length > 0 && expandedNodes.has(item.id)) {
        rows.push(...flattenTree(children, depth + 1));
      }
    }
    return rows;
  };

  const visibleRows = useMemo(() => flattenTree(rootItems), [rootItems, expandedNodes, filterCategory, filterLifecycle, search, childrenMap]);

  const subTabs = [
    { id: "tree", label: lang === "vi" ? "Cây BOM" : "BOM Tree" },
    { id: "cost", label: lang === "vi" ? "Tổng Chi Phí" : "Cost Summary" },
  ];

  const selectedSupplier = selectedItem?.supplierId ? supplierMap.get(selectedItem.supplierId) : null;

  if (bomLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, color: "var(--text-dim)", fontSize: 14 }}>
        <Package size={16} style={{ marginRight: 8, opacity: 0.5 }} />
        {lang === "vi" ? "Đang tải BOM..." : "Loading BOM..."}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header + sub-tabs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Package size={16} color="#3B82F6" />
          <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>{project?.name}</span>
          <span style={{ fontSize: 13, color: "var(--text-dim)" }}>—</span>
          <span style={{ fontSize: 13, color: "var(--text-dim)" }}>
            {canViewCost && <><DollarSign size={10} style={{ display: "inline", verticalAlign: "middle" }} /> ${costSummary.total.toLocaleString()}</>}
            {" "}{costSummary.totalParts} {lang === "vi" ? "linh kiện" : "parts"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {subTabs.map(st => (
            <button key={st.id} onClick={() => setSubTab(st.id)}
              style={{
                background: subTab === st.id ? "#1D4ED820" : "transparent",
                border: `1px solid ${subTab === st.id ? "#1D4ED840" : "var(--border)"}`,
                borderRadius: 4, padding: "4px 10px", fontSize: 12, fontWeight: 600,
                color: subTab === st.id ? "#60A5FA" : "var(--text-dim)", cursor: "pointer",
              }}>
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {(costSummary.eolCount > 0 || costSummary.nrndCount > 0) && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {costSummary.eolCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "#F9731610", border: "1px solid #F9731630", borderRadius: 4 }}>
              <CircleAlert size={12} color="#F97316" />
              <span style={{ fontSize: 12, color: "#F97316", fontWeight: 600 }}>{costSummary.eolCount} EOL/Obsolete</span>
            </div>
          )}
          {costSummary.nrndCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "#F59E0B10", border: "1px solid #F59E0B30", borderRadius: 4 }}>
              <AlertTriangle size={12} color="#F59E0B" />
              <span style={{ fontSize: 12, color: "#F59E0B", fontWeight: 600 }}>{costSummary.nrndCount} NRND</span>
            </div>
          )}
        </div>
      )}

      {subTab === "tree" && (
        <div style={{ display: "flex", gap: 12 }}>
          {/* Main tree */}
          <div style={{ flex: 1, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
            {/* Filters bar */}
            <div style={{ display: "flex", gap: 8, padding: "8px 12px", borderBottom: "1px solid var(--border)", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 120 }}>
                <Search size={12} color="var(--text-faint)" style={{ position: "absolute", left: 8, top: 7 }} />
                <input placeholder={lang === "vi" ? "Tìm part..." : "Search parts..."} value={search} onChange={e => setSearch(e.target.value)}
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 8px 5px 26px", color: "var(--text-primary)", fontSize: 13, width: "100%", outline: "none", fontFamily: sans }} />
              </div>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 8px", color: "var(--text-muted)", fontSize: 12, outline: "none" }}>
                <option value="ALL">{lang === "vi" ? "Tất cả loại" : "All Categories"}</option>
                {["MECHANICAL", "ELECTRICAL", "CONSUMABLE"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filterLifecycle} onChange={e => setFilterLifecycle(e.target.value)}
                style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 8px", color: "var(--text-muted)", fontSize: 12, outline: "none" }}>
                <option value="ALL">{lang === "vi" ? "Tất cả trạng thái" : "All Lifecycle"}</option>
                {["ACTIVE", "NRND", "EOL", "OBSOLETE"].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              {(search || filterCategory !== "ALL" || filterLifecycle !== "ALL") && (
                <button onClick={() => { setSearch(""); setFilterCategory("ALL"); setFilterLifecycle("ALL"); }}
                  style={{ background: "#EF444415", border: "1px solid #EF444430", borderRadius: 4, padding: "4px 8px", color: "#EF4444", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                  <FilterX size={11} /> {lang === "vi" ? "Xoá lọc" : "Reset"}
                </button>
              )}
            </div>

            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px 4px 40px", borderBottom: "1px solid var(--border)", fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, position: "sticky", top: 0, zIndex: 10, background: "var(--bg-card)" }}>
              <span style={{ width: 16 }} />
              <span style={{ width: 13 }} />
              <span style={{ width: 110, flexShrink: 0 }}>{lang === "vi" ? "Mã Part" : "Part #"}</span>
              <span style={{ flex: 1 }}>{lang === "vi" ? "Mô tả" : "Description"}</span>
              <span style={{ width: 30, textAlign: "right", flexShrink: 0 }}>{lang === "vi" ? "SL" : "Qty"}</span>
              {canViewCost && <span style={{ width: 70, textAlign: "right", flexShrink: 0 }}>{lang === "vi" ? "Chi phí" : "Cost"}</span>}
              <span style={{ width: 36, textAlign: "center", flexShrink: 0 }}>{lang === "vi" ? "NCC" : "Sup"}</span>
              <span style={{ width: 30, textAlign: "right", flexShrink: 0 }}>LT</span>
            </div>

            {/* Tree rows */}
            <div style={{ maxHeight: 420, overflowY: "auto" }}>
              {projectBom.length === 0 && (
                <EmptyState icon={EMPTY_MESSAGES[lang].bom.icon} title={EMPTY_MESSAGES[lang].bom.title} description={EMPTY_MESSAGES[lang].bom.desc} />
              )}
              {visibleRows.map(({ item, depth, hasChildren }) => (
                <BomTreeRow key={item.id} item={item} depth={depth} expanded={expandedNodes.has(item.id)}
                  onToggle={toggleExpand} hasChildren={hasChildren} onSelect={setSelectedItem}
                  selected={selectedItem?.id === item.id} lang={lang} supplierMap={supplierMap}
                  canViewCost={canViewCost} />
              ))}
            </div>
          </div>

          {/* Detail panel */}
          {selectedItem && (
            <div style={{ width: 280, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 14, display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 13, fontFamily: mono, color: "var(--text-dim)" }}>{selectedItem.partNumber}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>
                    {lang === "vi" && selectedItem.descriptionVi ? selectedItem.descriptionVi : selectedItem.description}
                  </div>
                </div>
                <Badge label={selectedItem.lifecycleStatus} color={BOM_LIFECYCLE_COLORS[selectedItem.lifecycleStatus]} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ background: "var(--bg-input)", borderRadius: 4, padding: "6px 8px" }}>
                  <div style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{lang === "vi" ? "Loại" : "Category"}</div>
                  <div style={{ fontSize: 13, color: BOM_CATEGORY_COLORS[selectedItem.category], fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                    {(() => { const I = CATEGORY_ICONS[selectedItem.category]; return I ? <I size={10} /> : null; })()}
                    {selectedItem.category}
                  </div>
                </div>
                <div style={{ background: "var(--bg-input)", borderRadius: 4, padding: "6px 8px" }}>
                  <div style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{lang === "vi" ? "Số lượng" : "Quantity"}</div>
                  <div style={{ fontSize: 13, color: "var(--text-primary)", fontFamily: mono, marginTop: 2 }}>{selectedItem.quantity} {selectedItem.unit}</div>
                </div>
                {canViewCost && (
                  <>
                    <div style={{ background: "var(--bg-input)", borderRadius: 4, padding: "6px 8px" }}>
                      <div style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{lang === "vi" ? "Đơn giá" : "Unit Cost"}</div>
                      <div style={{ fontSize: 13, color: "#10B981", fontFamily: mono, marginTop: 2 }}>{selectedItem.unitCost != null ? `$${selectedItem.unitCost}` : "—"}</div>
                    </div>
                    <div style={{ background: "var(--bg-input)", borderRadius: 4, padding: "6px 8px" }}>
                      <div style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{lang === "vi" ? "Tổng" : "Total"}</div>
                      <div style={{ fontSize: 13, color: "#10B981", fontFamily: mono, fontWeight: 700, marginTop: 2 }}>${(selectedItem.totalCost || 0).toLocaleString()}</div>
                    </div>
                  </>
                )}
              </div>

              {/* Supplier info */}
              {selectedSupplier && (
                <div style={{ background: "var(--bg-input)", borderRadius: 4, padding: "8px 10px" }}>
                  <div style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{lang === "vi" ? "Nhà cung cấp" : "Supplier"}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{selectedSupplier.code}</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{lang === "vi" ? selectedSupplier.nameVi : selectedSupplier.name}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: "var(--text-dim)" }}>LT: <span style={{ color: "#F59E0B", fontFamily: mono }}>{selectedItem.leadTimeDays}d</span></span>
                    <span style={{ fontSize: 11, color: "var(--text-dim)" }}>{lang === "vi" ? "Chất lượng" : "Quality"}: <span style={{ color: "#10B981" }}>{"★".repeat(Math.round(selectedSupplier.qualityRating))}</span></span>
                  </div>
                </div>
              )}

              {/* Designator */}
              {selectedItem.designator && (
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                  <span style={{ fontWeight: 600 }}>Ref:</span> <span style={{ fontFamily: mono, color: "var(--text-muted)" }}>{selectedItem.designator}</span>
                </div>
              )}

              {/* Alternate parts warning */}
              {selectedItem.alternatePartIds?.length > 0 && (
                <div style={{ background: "#F59E0B08", border: "1px solid #F59E0B20", borderRadius: 4, padding: "6px 8px" }}>
                  <div style={{ fontSize: 11, color: "#F59E0B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
                    {lang === "vi" ? "Part thay thế có sẵn" : "Alternate Parts Available"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {selectedItem.alternatePartIds.join(", ")}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cost Summary sub-tab */}
      {subTab === "cost" && canViewCost && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, background: "var(--bg-input)", borderRadius: 6, padding: "14px 16px", borderTop: "2px solid #10B981" }}>
              <div style={{ fontSize: 12, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{lang === "vi" ? "Tổng chi phí BOM" : "Total BOM Cost"}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#10B981", fontFamily: mono, marginTop: 4 }}>${costSummary.total.toLocaleString()}</div>
            </div>
            <div style={{ flex: 1, background: "var(--bg-input)", borderRadius: 6, padding: "14px 16px", borderTop: "2px solid #3B82F6" }}>
              <div style={{ fontSize: 12, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{lang === "vi" ? "Linh kiện" : "Components"}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#3B82F6", fontFamily: mono, marginTop: 4 }}>{costSummary.totalParts}</div>
              <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>{costSummary.assemblies} {lang === "vi" ? "bộ lắp ráp" : "assemblies"}</div>
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>{lang === "vi" ? "Chi phí theo loại" : "Cost by Category"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {Object.entries(costSummary.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, cost]) => {
              const pct = costSummary.total > 0 ? (cost / costSummary.total * 100) : 0;
              const color = BOM_CATEGORY_COLORS[cat] || "var(--text-dim)";
              return (
                <div key={cat} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                  <span style={{ fontSize: 12, color, fontWeight: 700, width: 80 }}>{cat}</span>
                  <div style={{ flex: 1, height: 6, background: "var(--hover-bg)", borderRadius: 3 }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.3s" }} />
                  </div>
                  <span style={{ fontSize: 13, fontFamily: mono, color: "var(--text-primary)", width: 60, textAlign: "right" }}>${cost.toLocaleString()}</span>
                  <span style={{ fontSize: 12, fontFamily: mono, color: "var(--text-dim)", width: 35, textAlign: "right" }}>{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>

          {/* BOM Charts */}
          {(() => {
            const isDark = document.documentElement.getAttribute("data-theme") !== "light";
            const gridColor = isDark ? "#1E2A3A" : "#E2E8F0";
            const tickColor = "#64748B";
            const COLORS = ["#3B82F6", "#F59E0B", "#8B5CF6", "#10B981", "#F97316", "#EF4444", "#06B6D4"];
            const bomTooltip = ({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0];
              return (
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 12px", fontSize: 12, fontFamily: sans, boxShadow: "0 4px 12px var(--shadow-color)" }}>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{d.name || d.payload?.name}</div>
                  <div style={{ fontFamily: mono, color: d.payload?.color || "#3B82F6" }}>${(d.value || d.payload?.value || 0).toLocaleString()}</div>
                </div>
              );
            };
            return (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
                {/* Sub-assembly Pie */}
                <div style={{ minWidth: 0, minHeight: 200 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>{lang === "vi" ? "Chi phí theo cụm lắp ráp" : "Cost by Sub-Assembly"}</div>
                  <SafeResponsiveContainer width="100%" height={200} minWidth={0} minHeight={0}>
                    <PieChart>
                      <Pie data={costSummary.bySubAssy} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value" nameKey="name"
                        label={({ name, percent }) => `${name.length > 12 ? name.slice(0, 12) + "..." : name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={{ stroke: tickColor }} style={{ fontSize: 10, fontFamily: sans }}>
                        {costSummary.bySubAssy.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={bomTooltip} />
                    </PieChart>
                  </SafeResponsiveContainer>
                </div>
                {/* Supplier Bar */}
                <div style={{ minWidth: 0, minHeight: 200 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>{lang === "vi" ? "Chi phí theo nhà cung cấp" : "Cost by Supplier"}</div>
                  <SafeResponsiveContainer width="100%" height={200} minWidth={0} minHeight={0}>
                    <BarChart data={costSummary.bySupplier} layout="vertical" margin={{ left: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                      <XAxis type="number" tick={{ fill: tickColor, fontSize: 10, fontFamily: mono }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                      <YAxis type="category" dataKey="name" tick={{ fill: tickColor, fontSize: 11, fontFamily: mono }} axisLine={false} tickLine={false} width={40} />
                      <Tooltip content={bomTooltip} />
                      <Bar dataKey="value" name={lang === "vi" ? "Chi phí" : "Cost"} radius={[0, 4, 4, 0]} barSize={18}>
                        {costSummary.bySupplier.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </SafeResponsiveContainer>
                </div>
                {/* Lifecycle Donut */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>{lang === "vi" ? "Rủi ro vòng đời linh kiện" : "Component Lifecycle Risk"}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                    <SafeResponsiveContainer width={160} height={140} minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie data={costSummary.byLifecycle} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value" nameKey="name">
                          {costSummary.byLifecycle.map((d, i) => <Cell key={i} fill={d.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </SafeResponsiveContainer>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                      {costSummary.byLifecycle.map((d, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: "var(--text-dim)" }}>{d.name}</span>
                          <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: d.color }}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {subTab === "cost" && !canViewCost && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 40, textAlign: "center" }}>
          <ShieldAlert size={24} color="var(--text-dim)" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 14, color: "var(--text-dim)" }}>{lang === "vi" ? "Bạn không có quyền xem chi phí" : "You don't have permission to view costs"}</div>
        </div>
      )}
    </div>
  );
}
