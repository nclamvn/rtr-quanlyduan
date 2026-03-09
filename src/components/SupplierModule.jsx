import { useState, useMemo } from "react";
import {
  Truck, Star, Clock, Mail, Phone, Globe, Award,
  ChevronLeft, Package, AlertTriangle, Check, X,
  TrendingUp, ShieldCheck, ShieldAlert, CircleAlert
} from "lucide-react";
import {
  SUPPLIER_QUAL_COLORS, DELIVERY_STATUS_COLORS,
} from "../data/v2Data";
import { useSupplierData, useDeliveryData, useBomData } from "../hooks/useV2Data";
import EmptyState, { EMPTY_MESSAGES } from "./EmptyState";

const mono = "'JetBrains Mono', 'Fira Code', monospace";
const sans = "'Outfit', 'Segoe UI', system-ui, sans-serif";

function Badge({ label, color, size = "sm", icon: IconComp }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: size === "sm" ? "1px 7px" : "3px 10px", borderRadius: 3, background: color + "15", color, fontSize: size === "sm" ? 9 : 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", border: `1px solid ${color}25`, fontFamily: mono, whiteSpace: "nowrap" }}>
      {IconComp ? <IconComp size={size === "sm" ? 10 : 12} /> : <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />}
      {label}
    </span>
  );
}

function StarRating({ rating, max = 5 }) {
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {Array.from({ length: max }, (_, i) => (
        <Star key={i} size={10} fill={i < Math.round(rating) ? "#F59E0B" : "transparent"} color={i < Math.round(rating) ? "#F59E0B" : "var(--text-disabled)"} />
      ))}
      <span style={{ fontSize: 12, fontFamily: mono, color: "var(--text-muted)", marginLeft: 4 }}>{rating.toFixed(1)}</span>
    </div>
  );
}

function ScoreBar({ label, value, unit = "%", max = 100, color = "#10B981", warn }) {
  const pct = Math.min(100, (value / max) * 100);
  const isWarn = warn != null && value < warn;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
        <span style={{ fontSize: 12, fontFamily: mono, color: isWarn ? "#EF4444" : color, fontWeight: 700 }}>{value}{unit}</span>
      </div>
      <div style={{ height: 4, background: "var(--hover-bg)", borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: isWarn ? "#EF4444" : color, borderRadius: 2 }} />
      </div>
    </div>
  );
}

export default function SupplierModule({ lang, t, project, perm }) {
  const readOnly = perm?.isReadOnly ? perm.isReadOnly() : false;
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Fetch from Supabase (or static fallback)
  const { data: allSuppliers, loading: suppLoading } = useSupplierData();
  const { data: allDeliveries } = useDeliveryData(null);
  const { data: allBom } = useBomData(project?.id);

  // Get suppliers that supply parts for this project
  const projectSupplierIds = useMemo(() => {
    const ids = new Set();
    allBom.filter(b => b.supplierId).forEach(b => ids.add(b.supplierId));
    return ids;
  }, [allBom]);

  const suppliers = useMemo(() =>
    allSuppliers.filter(s => projectSupplierIds.has(s.id)),
    [allSuppliers, projectSupplierIds]
  );

  if (suppLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, color: "var(--text-dim)", fontSize: 14 }}>
        <Truck size={16} style={{ marginRight: 8, opacity: 0.5 }} />
        {lang === "vi" ? "Đang tải nhà cung cấp..." : "Loading suppliers..."}
      </div>
    );
  }

  if (selectedSupplier) {
    const s = selectedSupplier;
    const deliveries = allDeliveries.filter(d => d.supplierId === s.id).sort((a, b) => b.orderDate.localeCompare(a.orderDate));
    const suppliedParts = allBom.filter(b => b.supplierId === s.id);
    const qualColor = SUPPLIER_QUAL_COLORS[s.qualificationStatus] || "var(--text-dim)";

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <button onClick={() => setSelectedSupplier(null)}
            style={{ background: "none", border: "none", color: "var(--text-dim)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
            <ChevronLeft size={12} /> {lang === "vi" ? "Quay lại danh sách" : "Back to list"}
          </button>
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Truck size={16} color="#3B82F6" />
          <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>{s.code}</span>
          <span style={{ fontSize: 14, color: "var(--text-muted)" }}>{lang === "vi" ? s.nameVi : s.name}</span>
          <Badge label={s.qualificationStatus} color={qualColor} icon={s.qualificationStatus === "QUALIFIED" ? ShieldCheck : ShieldAlert} />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {/* Profile */}
          <div style={{ flex: 1, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 12, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 8 }}>
              {lang === "vi" ? "Thông tin liên hệ" : "Contact Info"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { icon: User, label: s.contactName },
                { icon: Mail, label: s.contactEmail },
                { icon: Phone, label: s.contactPhone },
                { icon: Globe, label: s.country },
                { icon: Clock, label: `${lang === "vi" ? "Điều khoản" : "Terms"}: ${s.paymentTerms}` },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <item.icon size={10} color="var(--text-faint)" />
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{item.label}</span>
                </div>
              ))}
              {s.certifications.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                  <Award size={10} color="#F59E0B" />
                  {s.certifications.map((c, i) => <Badge key={i} label={c} color="#F59E0B" />)}
                </div>
              )}
            </div>
          </div>

          {/* Scorecard */}
          <div style={{ flex: 1, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 12, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 8 }}>
              {lang === "vi" ? "Bảng đánh giá" : "Scorecard"}
            </div>
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{lang === "vi" ? "Chất lượng" : "Quality"}</span>
              <StarRating rating={s.qualityRating} />
            </div>
            <ScoreBar label={lang === "vi" ? "Giao hàng đúng hạn" : "On-Time Delivery"} value={s.deliveryOnTimeRate} warn={85} />
            <ScoreBar label={lang === "vi" ? "Tỷ lệ lỗi" : "Defect Rate"} value={s.defectRate} unit="%" max={5} color="#EF4444" warn={null} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-dim)" }}>{lang === "vi" ? "Tổng đơn hàng" : "Total Orders"}: <span style={{ color: "var(--text-primary)", fontFamily: mono }}>{s.totalOrders}</span></span>
              <span style={{ fontSize: 12, color: "var(--text-dim)" }}>{lang === "vi" ? "Trễ" : "Late"}: <span style={{ color: s.lateDeliveries > 0 ? "#F97316" : "#10B981", fontFamily: mono }}>{s.lateDeliveries}</span></span>
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-dim)" }}>
              {lang === "vi" ? "Audit tiếp theo" : "Next Audit"}: <span style={{ fontFamily: mono, color: "var(--text-muted)" }}>{s.nextAuditDate}</span>
            </div>
          </div>
        </div>

        {/* Parts Supplied */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 12, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 8 }}>
            {lang === "vi" ? "Linh kiện cung cấp" : "Parts Supplied"} ({suppliedParts.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {suppliedParts.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", background: "var(--bg-input)", borderRadius: 4 }}>
                <span style={{ fontSize: 12, fontFamily: mono, color: "var(--text-dim)", width: 100 }}>{p.partNumber}</span>
                <span style={{ fontSize: 13, color: "var(--text-secondary)", flex: 1 }}>{lang === "vi" && p.descriptionVi ? p.descriptionVi : p.description}</span>
                <span style={{ fontSize: 12, fontFamily: mono, color: "#10B981" }}>${p.unitCost}/{p.unit}</span>
                <span style={{ fontSize: 12, fontFamily: mono, color: "var(--text-dim)" }}>{p.leadTimeDays}d</span>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery History */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 12, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 8 }}>
            {lang === "vi" ? "Lịch sử giao hàng" : "Delivery History"} ({deliveries.length})
          </div>
          <div style={{ borderLeft: "2px solid var(--border)", paddingLeft: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {deliveries.map((d, i) => {
              const part = allBom.find(b => b.id === d.bomPartId);
              const statusColor = DELIVERY_STATUS_COLORS[d.status] || "var(--text-dim)";
              return (
                <div key={d.id} style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: -19, top: 3, width: 8, height: 8, borderRadius: "50%", background: statusColor, border: "2px solid var(--bg-card)" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, fontFamily: mono, color: "var(--text-dim)" }}>{d.actualDate || d.promisedDate}</span>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{part?.partNumber || d.bomPartId}</span>
                    <span style={{ fontSize: 12, fontFamily: mono, color: "var(--text-muted)" }}>×{d.quantity}</span>
                    <Badge label={d.status.replace(/_/g, " ")} color={statusColor} />
                    {d.delayDays > 0 && <span style={{ fontSize: 11, color: "#F97316", fontWeight: 700 }}>+{d.delayDays}d</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Directory view
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Truck size={16} color="#3B82F6" />
        <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
          {lang === "vi" ? "Nhà Cung Cấp" : "Suppliers"}
        </span>
        <span style={{ fontSize: 13, color: "var(--text-dim)" }}>— {suppliers.length} {lang === "vi" ? "nhà cung cấp" : "suppliers"}</span>
        {readOnly && <span style={{ fontSize: 11, color: "var(--text-faint)", background: "var(--hover-bg)", padding: "2px 8px", borderRadius: 3, fontWeight: 600 }}>{lang === "vi" ? "Chỉ xem" : "Read-only"}</span>}
      </div>

      {suppliers.length === 0 && (
        <EmptyState icon={EMPTY_MESSAGES[lang].suppliers.icon} title={EMPTY_MESSAGES[lang].suppliers.title} description={EMPTY_MESSAGES[lang].suppliers.desc} />
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
        {suppliers.map(s => {
          const qualColor = SUPPLIER_QUAL_COLORS[s.qualificationStatus] || "var(--text-dim)";
          const partsCount = allBom.filter(b => b.supplierId === s.id).length;
          return (
            <div key={s.id} onClick={() => setSelectedSupplier(s)}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 14, cursor: "pointer", transition: "border-color 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#3B82F6"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{s.code}</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{lang === "vi" ? s.nameVi : s.name}</div>
                </div>
                <Badge label={s.qualificationStatus} color={qualColor} />
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase" }}>{lang === "vi" ? "Chất lượng" : "Quality"}</div>
                  <StarRating rating={s.qualityRating} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase" }}>{lang === "vi" ? "Đúng hạn" : "On-Time"}</div>
                  <span style={{ fontSize: 14, fontFamily: mono, color: s.deliveryOnTimeRate >= 90 ? "#10B981" : "#F59E0B", fontWeight: 700 }}>{s.deliveryOnTimeRate}%</span>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-dim)" }}>
                <span><Package size={10} style={{ display: "inline", verticalAlign: "middle" }} /> {partsCount} {lang === "vi" ? "linh kiện" : "parts"}</span>
                <span>{s.country}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

