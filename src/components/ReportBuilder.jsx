import { useState } from "react";
import { FileText, Download, BarChart3, Users, DoorOpen, AlertTriangle, CheckCircle2, Loader } from "lucide-react";
import { Btn, Badge, Section } from "./ui";
import { PHASES, PHASE_COLORS, STATUS_COLORS, SEV_COLORS } from "../constants";

const REPORT_TYPES = [
  {
    id: "executive",
    label: "Executive Summary",
    labelVi: "Tóm tắt điều hành",
    desc: "High-level project health, KPIs, and risk overview",
    descVi: "Tổng quan sức khỏe dự án, KPI và rủi ro",
    Icon: BarChart3,
    color: "#3B82F6",
  },
  {
    id: "issues",
    label: "Issue Report",
    labelVi: "Báo cáo vấn đề",
    desc: "Detailed issue list with severity, status, and ownership",
    descVi: "Danh sách vấn đề chi tiết theo mức độ, trạng thái và người phụ trách",
    Icon: AlertTriangle,
    color: "#EF4444",
  },
  {
    id: "gates",
    label: "Gate Progress Report",
    labelVi: "Báo cáo tiến độ cổng",
    desc: "Phase gate completion status across all projects",
    descVi: "Trạng thái hoàn thành cổng giai đoạn của tất cả dự án",
    Icon: DoorOpen,
    color: "#8B5CF6",
  },
  {
    id: "team",
    label: "Team Workload Report",
    labelVi: "Báo cáo khối lượng công việc",
    desc: "Team member task distribution and capacity overview",
    descVi: "Phân bổ công việc và tải trọng của thành viên",
    Icon: Users,
    color: "#10B981",
  },
];

function generateReportHTML(type, { projects, issues, teamMembers, lang, gateConfig: _gateConfig }) {
  const t = lang === "vi";
  const today = new Date().toISOString().split("T")[0];

  const header = `
    <div style="text-align:center;margin-bottom:32px;border-bottom:3px solid #3B82F6;padding-bottom:16px;">
      <h1 style="font-size:24px;font-weight:800;margin:0;">RtR Control Tower</h1>
      <h2 style="font-size:16px;color:#666;font-weight:400;margin:4px 0;">
        ${REPORT_TYPES.find((r) => r.id === type)?.[t ? "labelVi" : "label"] || type}
      </h2>
      <div style="font-size:12px;color:#999;font-family:monospace;">${t ? "Ngày tạo" : "Generated"}: ${today}</div>
    </div>
  `;

  if (type === "executive") {
    const totalIssues = issues.length;
    const openIssues = issues.filter((i) => i.status !== "CLOSED").length;
    const criticalIssues = issues.filter((i) => i.sev === "CRITICAL" && i.status !== "CLOSED").length;
    const closedPct = totalIssues > 0 ? Math.round(((totalIssues - openIssues) / totalIssues) * 100) : 0;

    return `${header}
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;">
        <div style="background:#f8f9fa;border-radius:8px;padding:16px;text-align:center;border-left:4px solid #3B82F6;">
          <div style="font-size:28px;font-weight:800;color:#3B82F6;">${projects.length}</div>
          <div style="font-size:12px;color:#666;">${t ? "Dự án" : "Projects"}</div>
        </div>
        <div style="background:#f8f9fa;border-radius:8px;padding:16px;text-align:center;border-left:4px solid #EF4444;">
          <div style="font-size:28px;font-weight:800;color:#EF4444;">${openIssues}</div>
          <div style="font-size:12px;color:#666;">${t ? "Vấn đề mở" : "Open Issues"}</div>
        </div>
        <div style="background:#f8f9fa;border-radius:8px;padding:16px;text-align:center;border-left:4px solid #F59E0B;">
          <div style="font-size:28px;font-weight:800;color:#F59E0B;">${criticalIssues}</div>
          <div style="font-size:12px;color:#666;">${t ? "Nghiêm trọng" : "Critical"}</div>
        </div>
        <div style="background:#f8f9fa;border-radius:8px;padding:16px;text-align:center;border-left:4px solid #10B981;">
          <div style="font-size:28px;font-weight:800;color:#10B981;">${closedPct}%</div>
          <div style="font-size:12px;color:#666;">${t ? "Tỷ lệ đóng" : "Closure Rate"}</div>
        </div>
      </div>
      <h3>${t ? "Tổng quan dự án" : "Project Overview"}</h3>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tr style="background:#f0f0f0;"><th style="padding:8px;text-align:left;">${t ? "Dự án" : "Project"}</th><th>Phase</th><th>${t ? "Vấn đề mở" : "Open"}</th><th>Critical</th><th>Blocked</th></tr>
        ${projects
          .map((p) => {
            const pIssues = issues.filter((i) => i.pid === p.id && i.status !== "CLOSED");
            return `<tr style="border-bottom:1px solid #eee;">
            <td style="padding:8px;font-weight:600;">${p.name}</td>
            <td style="padding:8px;"><span style="background:${PHASE_COLORS[p.phase]}20;color:${PHASE_COLORS[p.phase]};padding:2px 8px;border-radius:4px;font-weight:700;">${p.phase}</span></td>
            <td style="padding:8px;text-align:center;">${pIssues.length}</td>
            <td style="padding:8px;text-align:center;color:#EF4444;">${pIssues.filter((i) => i.sev === "CRITICAL").length}</td>
            <td style="padding:8px;text-align:center;color:#DC2626;">${pIssues.filter((i) => i.status === "BLOCKED").length}</td>
          </tr>`;
          })
          .join("")}
      </table>`;
  }

  if (type === "issues") {
    return `${header}
      <div style="margin-bottom:12px;font-size:13px;color:#666;">${t ? "Tổng cộng" : "Total"}: ${issues.length} ${t ? "vấn đề" : "issues"}</div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <tr style="background:#f0f0f0;">
          <th style="padding:6px;text-align:left;">ID</th>
          <th style="padding:6px;text-align:left;">${t ? "Tiêu đề" : "Title"}</th>
          <th style="padding:6px;">Sev</th>
          <th style="padding:6px;">Status</th>
          <th style="padding:6px;">Phase</th>
          <th style="padding:6px;">${t ? "Người phụ trách" : "Owner"}</th>
          <th style="padding:6px;">${t ? "Hạn" : "Due"}</th>
        </tr>
        ${issues
          .map(
            (i) => `<tr style="border-bottom:1px solid #eee;">
          <td style="padding:6px;font-family:monospace;color:#3B82F6;">${i.id}</td>
          <td style="padding:6px;max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${t ? i.titleVi || i.title : i.title}</td>
          <td style="padding:6px;text-align:center;"><span style="color:${SEV_COLORS[i.sev]};font-weight:700;">${i.sev}</span></td>
          <td style="padding:6px;text-align:center;"><span style="color:${STATUS_COLORS[i.status]};font-weight:700;">${i.status}</span></td>
          <td style="padding:6px;text-align:center;">${i.phase}</td>
          <td style="padding:6px;">${i.owner || "-"}</td>
          <td style="padding:6px;font-family:monospace;">${i.due || "-"}</td>
        </tr>`,
          )
          .join("")}
      </table>`;
  }

  if (type === "team") {
    return `${header}
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tr style="background:#f0f0f0;">
          <th style="padding:8px;text-align:left;">${t ? "Thành viên" : "Member"}</th>
          <th style="padding:8px;">${t ? "Vai trò" : "Role"}</th>
          <th style="padding:8px;">${t ? "Vấn đề mở" : "Open"}</th>
          <th style="padding:8px;">Critical</th>
          <th style="padding:8px;">Blocked</th>
        </tr>
        ${(teamMembers || [])
          .map((m) => {
            const mIssues = issues.filter((i) => i.owner === m.name && i.status !== "CLOSED");
            return `<tr style="border-bottom:1px solid #eee;">
            <td style="padding:8px;font-weight:600;">${m.name}</td>
            <td style="padding:8px;">${m.role}</td>
            <td style="padding:8px;text-align:center;">${mIssues.length}</td>
            <td style="padding:8px;text-align:center;color:#EF4444;">${mIssues.filter((i) => i.sev === "CRITICAL").length}</td>
            <td style="padding:8px;text-align:center;color:#DC2626;">${mIssues.filter((i) => i.status === "BLOCKED").length}</td>
          </tr>`;
          })
          .join("")}
      </table>`;
  }

  if (type === "gates") {
    return `${header}
      ${projects
        .map((p) => {
          return `<h3 style="margin-top:20px;color:${PHASE_COLORS[p.phase]};">${p.name} — ${p.phase}</h3>
        <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px;">
          <tr style="background:#f0f0f0;"><th style="padding:6px;text-align:left;">Phase</th><th>Passed</th><th>Total</th><th>%</th></tr>
          ${PHASES.map((phase) => {
            const checks = p.gateChecks?.[phase] || {};
            const total = Object.keys(checks).length;
            const passed = Object.values(checks).filter(Boolean).length;
            const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
            return `<tr style="border-bottom:1px solid #eee;">
              <td style="padding:6px;font-weight:700;color:${PHASE_COLORS[phase]};">${phase}</td>
              <td style="padding:6px;text-align:center;">${passed}</td>
              <td style="padding:6px;text-align:center;">${total}</td>
              <td style="padding:6px;text-align:center;font-weight:700;color:${pct === 100 ? "#10B981" : pct > 0 ? "#F59E0B" : "#94A3B8"};">${pct}%</td>
            </tr>`;
          }).join("")}
        </table>`;
        })
        .join("")}`;
  }

  return `${header}<p>Unknown report type</p>`;
}

export default function ReportBuilder({ projects, issues, teamMembers, gateConfig, lang }) {
  const [selectedType, setSelectedType] = useState(null);
  const [generating, setGenerating] = useState(false);

  const t = {
    title: lang === "vi" ? "Tạo Báo Cáo" : "Generate Report",
    desc: lang === "vi" ? "Chọn loại báo cáo và xuất PDF" : "Select report type and export to PDF",
    generate: lang === "vi" ? "Tạo PDF" : "Generate PDF",
    select: lang === "vi" ? "Chọn loại báo cáo" : "Select report type",
  };

  const handleGenerate = async () => {
    if (!selectedType) return;
    setGenerating(true);

    const html = generateReportHTML(selectedType, { projects, issues, teamMembers, lang, gateConfig });

    // Generate PDF using existing jsPDF + html2canvas
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");

      // Create temp container
      const container = document.createElement("div");
      container.style.cssText =
        "position:fixed;left:-9999px;width:800px;padding:32px;background:#fff;color:#111;font-family:Outfit,system-ui,sans-serif;font-size:13px;";
      container.innerHTML = html;
      document.body.appendChild(container);

      const canvas = await html2canvas(container, { scale: 2, useCORS: true });
      document.body.removeChild(container);

      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Multi-page support
      const pageHeight = pdf.internal.pageSize.getHeight();
      let position = 0;
      let page = 0;
      while (position < pdfHeight) {
        if (page > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -position, pdfWidth, pdfHeight);
        position += pageHeight;
        page++;
      }

      const reportName =
        REPORT_TYPES.find((r) => r.id === selectedType)?.[lang === "vi" ? "labelVi" : "label"] || selectedType;
      pdf.save(`RtR-${reportName}-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
    setGenerating(false);
  };

  return (
    <Section
      title={
        <>
          <FileText size={14} /> {t.title}
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 13, color: "var(--text-dim)" }}>{t.desc}</div>

        {/* Report type cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
          {REPORT_TYPES.map((rt) => {
            const isSelected = selectedType === rt.id;
            return (
              <div
                key={rt.id}
                onClick={() => setSelectedType(rt.id)}
                style={{
                  padding: "12px 14px",
                  borderRadius: 8,
                  border: `2px solid ${isSelected ? rt.color : "var(--border)"}`,
                  background: isSelected ? `${rt.color}08` : "var(--bg-modal)",
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <rt.Icon size={16} color={rt.color} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                    {lang === "vi" ? rt.labelVi : rt.label}
                  </span>
                  {isSelected && <CheckCircle2 size={14} color={rt.color} style={{ marginLeft: "auto" }} />}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.4 }}>
                  {lang === "vi" ? rt.descVi : rt.desc}
                </div>
              </div>
            );
          })}
        </div>

        {/* Generate button */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Btn variant="primary" onClick={handleGenerate} disabled={!selectedType || generating}>
            {generating ? <Loader size={12} className="animate-spin" /> : <Download size={12} />}
            {generating ? (lang === "vi" ? "Đang tạo..." : "Generating...") : t.generate}
          </Btn>
          {!selectedType && <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{t.select}</span>}
        </div>
      </div>
    </Section>
  );
}
