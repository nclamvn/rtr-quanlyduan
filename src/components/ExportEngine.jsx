// ===================================================================
// RtR CONTROL TOWER V3 — Export Engine
// Issues Excel, BOM Excel, Flight Test Excel, Project Summary PDF
// ===================================================================
import { useRef, useState } from "react";
import {
  Download, FileSpreadsheet, FileText, Presentation,
  X, Check, Loader2,
} from "lucide-react";
import { exportToExcel, generatePdfFromElement } from "../utils/importExport";
import { calcBomCosts } from "../data/v2Data";

const mono = "'JetBrains Mono', 'Fira Code', monospace";
const sans = "'Outfit', 'Segoe UI', system-ui, sans-serif";

// ── EXPORT FUNCTIONS ──────────────────────────────────────────

export function exportIssuesExcel(issues, project, lang) {
  const vi = lang === "vi";
  const columns = [
    { key: "id", header: vi ? "Mã" : "ID", width: 10 },
    { key: "title", header: vi ? "Tiêu đề" : "Title", width: 40 },
    { key: "status", header: vi ? "Trạng thái" : "Status", width: 12 },
    { key: "sev", header: vi ? "Mức độ" : "Severity", width: 12 },
    { key: "src", header: vi ? "Nguồn" : "Source", width: 12 },
    { key: "owner", header: vi ? "Chịu TN" : "Owner", width: 15 },
    { key: "phase", header: vi ? "Phase" : "Phase", width: 8 },
    { key: "rootCause", header: vi ? "Nguyên nhân gốc" : "Root Cause", width: 40 },
    { key: "created", header: vi ? "Ngày tạo" : "Created", width: 12 },
    { key: "due", header: vi ? "Hạn" : "Due", width: 12 },
  ];
  const data = issues.map((i) => ({
    ...i,
    title: vi && i.titleVi ? i.titleVi : i.title,
  }));
  exportToExcel(
    [{ name: vi ? "Vấn Đề" : "Issues", data, columns }],
    `${project?.name || "RtR"}_Issues_${new Date().toISOString().split("T")[0]}`
  );
}

export function exportBomExcel(bomParts, suppliers, lang) {
  const vi = lang === "vi";
  const costed = calcBomCosts(bomParts || []);

  const columns = [
    { key: "level", header: vi ? "Cấp" : "Level", width: 6 },
    { key: "partNumber", header: vi ? "Mã" : "Part #", width: 18 },
    { key: "description", header: vi ? "Mô tả" : "Description", width: 35 },
    { key: "category", header: vi ? "Danh mục" : "Category", width: 12 },
    { key: "quantity", header: vi ? "SL" : "Qty", width: 6 },
    { key: "unit", header: vi ? "ĐVT" : "Unit", width: 6 },
    { key: "unitCost", header: vi ? "Đơn giá" : "Unit Cost", width: 10 },
    { key: "totalCost", header: vi ? "Tổng" : "Total", width: 10 },
    { key: "supplierCode", header: vi ? "NCC" : "Supplier", width: 10 },
    { key: "leadTimeDays", header: vi ? "LT (ngày)" : "LT (days)", width: 10 },
    { key: "lifecycle", header: vi ? "Vòng đời" : "Lifecycle", width: 10 },
  ];

  const supplierList = suppliers || [];
  const data = costed.map((b) => ({
    ...b,
    description: vi && b.descriptionVi ? b.descriptionVi : b.description,
    totalCost: (b._totalCost || b.unitCost * b.quantity).toFixed(2),
    supplierCode: b.supplierId ? supplierList.find((s) => s.id === b.supplierId)?.code || "" : "",
  }));

  // Cost summary sheet
  const categories = {};
  costed.filter((b) => b.level > 1 && !b.children?.length).forEach((b) => {
    const cat = b.category || "OTHER";
    categories[cat] = (categories[cat] || 0) + (b._totalCost || b.unitCost * b.quantity);
  });
  const summaryData = Object.entries(categories).map(([cat, cost]) => ({
    category: cat, cost: cost.toFixed(2),
  }));

  exportToExcel(
    [
      { name: "BOM", data, columns },
      { name: vi ? "Tóm tắt chi phí" : "Cost Summary", data: summaryData, columns: [
        { key: "category", header: vi ? "Danh mục" : "Category", width: 15 },
        { key: "cost", header: vi ? "Chi phí ($)" : "Cost ($)", width: 12 },
      ]},
    ],
    `BOM_${new Date().toISOString().split("T")[0]}`
  );
}

export function exportFlightTestsExcel(flightTests, lang) {
  const vi = lang === "vi";
  const tests = flightTests || [];

  const columns = [
    { key: "testNumber", header: "#", width: 6 },
    { key: "date", header: vi ? "Ngày" : "Date", width: 12 },
    { key: "testType", header: vi ? "Loại" : "Type", width: 14 },
    { key: "pilot", header: vi ? "Phi công" : "Pilot", width: 12 },
    { key: "droneUnit", header: vi ? "Máy bay" : "Unit", width: 14 },
    { key: "durationMin", header: vi ? "Thời gian (phút)" : "Duration (min)", width: 14 },
    { key: "result", header: vi ? "Kết quả" : "Result", width: 10 },
    { key: "maxAltitude", header: vi ? "Cao nhất (m)" : "Max Alt (m)", width: 12 },
    { key: "maxSpeed", header: vi ? "Tốc độ max (m/s)" : "Max Speed (m/s)", width: 14 },
    { key: "location", header: vi ? "Địa điểm" : "Location", width: 20 },
    { key: "anomalyCount", header: vi ? "Bất thường" : "Anomalies", width: 10 },
    { key: "autoIssueId", header: "Issue", width: 10 },
    { key: "notes", header: vi ? "Ghi chú" : "Notes", width: 40 },
  ];

  const data = tests.map((ft) => ({
    ...ft,
    durationMin: (ft.duration / 60).toFixed(1),
    location: vi && ft.locationVi ? ft.locationVi : ft.location,
    anomalyCount: ft.anomalies.length,
    notes: vi && ft.notesVi ? ft.notesVi : ft.notes,
    autoIssueId: ft.autoIssueId || "",
  }));

  exportToExcel(
    [{ name: vi ? "Bay Thử" : "Flight Tests", data, columns }],
    `FlightTests_${new Date().toISOString().split("T")[0]}`
  );
}

// ── PROJECT SUMMARY PDF COMPONENT ─────────────────────────────

export function ProjectSummaryReport({ project, issues, lang, gateConfig, gateChecks, bomParts, flightTests: flightTestsProp }) {
  const vi = lang === "vi";
  const openIssues = issues.filter((i) => i.pid === project?.id && i.status !== "CLOSED");
  const criticalIssues = openIssues.filter((i) => i.sev === "CRITICAL");
  const costed = calcBomCosts(bomParts || []);
  const totalCost = costed.find((b) => b.level === 0)?._totalCost || 0;
  const flightTests = flightTestsProp || [];
  const passTests = flightTests.filter((ft) => ft.result === "PASS").length;

  return (
    <div style={{ width: 794, padding: 40, background: "#060A0F", color: "#E2E8F0", fontFamily: sans, fontSize: 11 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #3B82F6", paddingBottom: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 8, color: "#3B82F6", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>RtR Control Tower</div>
          <div style={{ fontSize: 6, color: "#64748B" }}>Real-time Robotics</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, fontWeight: 700 }}>{vi ? "Báo cáo Trạng thái Dự án" : "Project Status Report"}</div>
          <div style={{ fontSize: 8, color: "#64748B" }}>{new Date().toLocaleDateString(vi ? "vi-VN" : "en-US")} | {project?.name}</div>
        </div>
      </div>

      {/* Metrics row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 20 }}>
        {[
          { label: "Phase", value: project?.currentPhase || "—" },
          { label: vi ? "Đang mở" : "Open Issues", value: openIssues.length },
          { label: vi ? "Nghiêm trọng" : "Critical", value: criticalIssues.length },
          { label: vi ? "BOM Cost" : "BOM Cost", value: `$${totalCost.toLocaleString()}` },
          { label: vi ? "Bay thử" : "Flight Tests", value: `${passTests}/${flightTests.length} PASS` },
        ].map((m, i) => (
          <div key={i} style={{ background: "#080C10", border: "1px solid #1E2A3A", borderRadius: 4, padding: "6px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 7, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.label}</div>
            <div style={{ fontSize: 14, fontWeight: 800, fontFamily: mono, color: "#E2E8F0" }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Open Issues */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid #1E2A3A", paddingBottom: 4, marginBottom: 8 }}>
          {vi ? "Vấn đề đang mở" : "Open Issues"}
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1E2A3A" }}>
              {[vi ? "Mã" : "ID", vi ? "Tiêu đề" : "Title", vi ? "Mức độ" : "Sev", vi ? "Trạng thái" : "Status", vi ? "Chịu TN" : "Owner"].map((h) => (
                <th key={h} style={{ padding: "4px 6px", textAlign: "left", color: "#475569", fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {openIssues.slice(0, 10).map((i) => (
              <tr key={i.id} style={{ borderBottom: "1px solid #0F1419" }}>
                <td style={{ padding: "3px 6px", fontFamily: mono, color: "#64748B" }}>{i.id}</td>
                <td style={{ padding: "3px 6px", color: "#CBD5E1" }}>{vi && i.titleVi ? i.titleVi : i.title}</td>
                <td style={{ padding: "3px 6px", color: i.sev === "CRITICAL" ? "#EF4444" : i.sev === "HIGH" ? "#F59E0B" : "#94A3B8", fontWeight: 700 }}>{i.sev}</td>
                <td style={{ padding: "3px 6px", color: "#94A3B8" }}>{i.status}</td>
                <td style={{ padding: "3px 6px", color: "#94A3B8" }}>{i.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cascade risks */}
      {(() => {
        const cascadeIssues = openIssues.filter((i) => i.impacts?.length > 0);
        if (cascadeIssues.length === 0) return null;
        return (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid #1E2A3A", paddingBottom: 4, marginBottom: 8 }}>
              {vi ? "Rủi ro Cascade" : "Cascade Risks"}
            </div>
            {cascadeIssues.slice(0, 5).map((i) => (
              <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", fontSize: 9 }}>
                <span style={{ fontFamily: mono, color: "#EF4444", width: 60 }}>{i.id}</span>
                <span style={{ color: "#94A3B8", flex: 1 }}>{vi && i.titleVi ? i.titleVi : i.title}</span>
                <span style={{ color: "#F59E0B", fontFamily: mono }}>
                  {i.impacts.map((imp) => `${imp.phase}+${Math.ceil(imp.days / 7)}w`).join(" → ")}
                </span>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Footer */}
      <div style={{ borderTop: "1px solid #1E2A3A", paddingTop: 8, fontSize: 7, color: "#475569", display: "flex", justifyContent: "space-between" }}>
        <span>RtR Control Tower | {vi ? "Tạo tự động" : "Auto-generated"}</span>
        <span>{new Date().toLocaleString(vi ? "vi-VN" : "en-US")}</span>
      </div>
    </div>
  );
}

// ── EXECUTIVE SLIDES COMPONENT ────────────────────────────────

export function ExecutiveSlides({ project, issues, lang, flightTests: flightTestsProp }) {
  const vi = lang === "vi";
  const openIssues = issues.filter((i) => i.pid === project?.id && i.status !== "CLOSED");
  const criticalIssues = openIssues.filter((i) => i.sev === "CRITICAL");
  const flightTests = flightTestsProp || [];
  const passTests = flightTests.filter((ft) => ft.result === "PASS").length;
  const cascadeIssues = openIssues.filter((i) => i.impacts?.length > 0);

  const slideStyle = {
    width: 960, height: 540, background: "#060A0F", padding: "40px 60px",
    fontFamily: sans, color: "#E2E8F0", display: "flex", flexDirection: "column",
    justifyContent: "center", border: "1px solid #1E2A3A", marginBottom: 12, flexShrink: 0,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Slide 1: Cover */}
      <div style={{ ...slideStyle, justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <div style={{ fontSize: 10, color: "#3B82F6", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 700, marginBottom: 12 }}>
          RtR Control Tower
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{project?.name}</div>
        <div style={{ fontSize: 12, color: "#64748B" }}>
          {vi ? "Báo cáo Trạng thái" : "Status Update"} | {new Date().toLocaleDateString(vi ? "vi-VN" : "en-US", { month: "long", year: "numeric" })}
        </div>
        <div style={{ marginTop: 24, padding: "6px 16px", background: "#3B82F620", border: "1px solid #3B82F640", borderRadius: 4, fontSize: 12, fontWeight: 700, color: "#60A5FA" }}>
          Phase: {project?.currentPhase}
        </div>
      </div>

      {/* Slide 2: Status Overview */}
      <div style={slideStyle}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>{vi ? "Tổng quan Trạng thái" : "Status Overview"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: vi ? "Vấn đề mở" : "Open Issues", value: openIssues.length, color: "#3B82F6" },
            { label: vi ? "Nghiêm trọng" : "Critical", value: criticalIssues.length, color: "#EF4444" },
            { label: vi ? "Bay thử" : "Flight Tests", value: `${passTests}/${flightTests.length}`, color: "#10B981" },
            { label: vi ? "Sức khỏe" : "Health", value: criticalIssues.length > 1 ? (vi ? "NGUY CƠ" : "AT RISK") : criticalIssues.length > 0 ? (vi ? "CHÚ Ý" : "CAUTION") : "OK", color: criticalIssues.length > 1 ? "#EF4444" : criticalIssues.length > 0 ? "#F59E0B" : "#10B981" },
          ].map((m, i) => (
            <div key={i} style={{ background: "#080C10", border: "1px solid #1E2A3A", borderRadius: 8, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: m.color, fontFamily: mono }}>{m.value}</div>
              <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Slide 3: Key Risks */}
      <div style={slideStyle}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>{vi ? "Rủi ro & Blockers" : "Key Risks & Blockers"}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {cascadeIssues.slice(0, 4).map((i) => (
            <div key={i.id} style={{ background: "#080C10", border: "1px solid #1E2A3A", borderRadius: 6, padding: "12px 16px", borderLeft: `3px solid ${i.sev === "CRITICAL" ? "#EF4444" : "#F59E0B"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#E2E8F0" }}>{i.id}: {vi && i.titleVi ? i.titleVi : i.title}</span>
                <span style={{ fontSize: 9, color: i.sev === "CRITICAL" ? "#EF4444" : "#F59E0B", fontWeight: 700 }}>{i.sev}</span>
              </div>
              <div style={{ fontSize: 9, color: "#F59E0B", fontFamily: mono }}>
                {vi ? "Ảnh hưởng" : "Impact"}: {i.impacts.map((imp) => `${imp.phase}+${Math.ceil(imp.days / 7)}w`).join(" → ")}
              </div>
            </div>
          ))}
          {cascadeIssues.length === 0 && (
            <div style={{ fontSize: 12, color: "#10B981", textAlign: "center", padding: 20 }}>
              {vi ? "Không có rủi ro cascade" : "No cascade risks detected"}
            </div>
          )}
        </div>
      </div>

      {/* Slide 4: Timeline */}
      <div style={slideStyle}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>{vi ? "Dòng Thời Gian" : "Timeline"}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 20, padding: "0 20px" }}>
          {["CONCEPT", "EVT", "DVT", "PVT", "MP"].map((phase, i) => {
            const isCurrent = project?.currentPhase === phase;
            const isPast = ["CONCEPT", "EVT", "DVT", "PVT", "MP"].indexOf(project?.currentPhase) > i;
            return (
              <div key={phase} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: isPast ? "#10B981" : isCurrent ? "#3B82F6" : "#1E2A3A",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isPast && <Check size={10} color="#fff" />}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: isCurrent ? "#3B82F6" : isPast ? "#10B981" : "#475569", marginTop: 4 }}>{phase}</div>
              </div>
            );
          })}
        </div>
        {cascadeIssues.length > 0 && (
          <div style={{ background: "#F59E0B10", border: "1px solid #F59E0B30", borderRadius: 6, padding: 12, fontSize: 10, color: "#FDE68A" }}>
            {vi ? "Cảnh báo: Cascade delays có thể ảnh hưởng mốc MP" : "Warning: Cascade delays may impact MP milestone"}
          </div>
        )}
      </div>

      {/* Slide 5: Action Items */}
      <div style={slideStyle}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>{vi ? "Hành Động Cần Thiết" : "Action Items"}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {criticalIssues.slice(0, 3).map((i, idx) => (
            <div key={i.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 12px", background: "#080C10", border: "1px solid #1E2A3A", borderRadius: 6 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#EF444420", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{idx + 1}</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#E2E8F0" }}>{vi && i.titleVi ? i.titleVi : i.title}</div>
                <div style={{ fontSize: 9, color: "#64748B" }}>{vi ? "Chịu TN" : "Owner"}: {i.owner} | {vi ? "Hạn" : "Due"}: {i.due || "TBD"}</div>
              </div>
            </div>
          ))}
          {criticalIssues.length === 0 && openIssues.slice(0, 3).map((i, idx) => (
            <div key={i.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 12px", background: "#080C10", border: "1px solid #1E2A3A", borderRadius: 6 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#3B82F620", color: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{idx + 1}</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#E2E8F0" }}>{vi && i.titleVi ? i.titleVi : i.title}</div>
                <div style={{ fontSize: 9, color: "#64748B" }}>{vi ? "Chịu TN" : "Owner"}: {i.owner}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── EXPORT MODAL (for PDF/Slides preview + download) ──────────

export default function ExportModal({ type, project, issues, lang, onClose, bomParts, flightTests }) {
  const vi = lang === "vi";
  const reportRef = useRef(null);
  const slidesRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  const handleExportPdf = async () => {
    const el = type === "slides" ? slidesRef.current : reportRef.current;
    if (!el) return;
    setExporting(true);
    setExportError(null);
    try {
      if (type === "slides") {
        const { generateSlidesPdf } = await import("../utils/importExport");
        const slideEls = el.querySelectorAll("[data-slide]");
        await generateSlidesPdf([...slideEls], `${project?.name || "RtR"}_Slides_${new Date().toISOString().split("T")[0]}`);
      } else {
        await generatePdfFromElement(el, `${project?.name || "RtR"}_Report_${new Date().toISOString().split("T")[0]}`);
      }
    } catch (err) {
      console.error("PDF export error:", err);
      setExportError(vi ? "Không thể tạo PDF. Vui lòng thử lại." : "Failed to generate PDF. Please try again.");
    }
    setExporting(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--overlay)", zIndex: 9999, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-modal)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {type === "slides" ? <Presentation size={16} color="#8B5CF6" /> : <FileText size={16} color="#3B82F6" />}
          <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
            {type === "slides" ? (vi ? "Executive Slides" : "Executive Slides") : (vi ? "Báo cáo Dự án" : "Project Report")}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleExportPdf} disabled={exporting}
            style={{ background: "#3B82F6", border: "none", borderRadius: 4, padding: "6px 14px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, opacity: exporting ? 0.6 : 1 }}>
            {exporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            {vi ? "Tải PDF" : "Download PDF"}
          </button>
          <button onClick={onClose} style={{ background: "none", border: "1px solid var(--text-disabled)", borderRadius: 4, padding: "6px 10px", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {exportError && (
        <div style={{ margin: "0 20px", padding: "8px 14px", background: "#EF444415", border: "1px solid #EF444430", borderRadius: 6, color: "#FCA5A5", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <X size={14} color="#EF4444" />
          {exportError}
        </div>
      )}

      {/* Preview */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", justifyContent: "center", padding: 20 }}>
        {type === "report" && (
          <div ref={reportRef}>
            <ProjectSummaryReport project={project} issues={issues} lang={lang} bomParts={bomParts} flightTests={flightTests} />
          </div>
        )}
        {type === "slides" && (
          <div ref={slidesRef}>
            <ExecutiveSlides project={project} issues={issues} lang={lang} flightTests={flightTests} />
          </div>
        )}
      </div>
    </div>
  );
}
