import { useMemo } from "react";
import { PieChart, Pie, Cell } from "recharts";
import SafeResponsiveContainer from "./SafeChart";
import { AlertTriangle, Ban, DoorOpen, Plane, Zap, Bot, ShieldAlert } from "lucide-react";

const mono = "'JetBrains Mono', 'Fira Code', monospace";
const sans = "'Outfit', 'Segoe UI', system-ui, sans-serif";

const FACTOR_ICONS = [AlertTriangle, Ban, DoorOpen, Plane, Zap];

function calculateProjectRisk(project, projectIssues, gateConfig, flightTests, lang) {
  const isVi = lang === "vi";
  let riskScore = 0;
  const factors = [];

  // Factor 1: Critical issues (0-30)
  const criticalCount = projectIssues.filter(i => i.sev === "CRITICAL" && i.status !== "CLOSED").length;
  const criticalScore = Math.min(criticalCount * 15, 30);
  riskScore += criticalScore;
  if (criticalCount > 0) factors.push({
    factor: isVi ? "Vấn đề nghiêm trọng" : "Critical Issues",
    score: criticalScore, max: 30, icon: AlertTriangle,
    detail: isVi ? `${criticalCount} vấn đề nghiêm trọng chưa giải quyết` : `${criticalCount} unresolved critical issue(s)`,
    rec: isVi ? "Ưu tiên giải quyết trước khi chuyển phase" : "Prioritize resolution before phase transition",
  });

  // Factor 2: Blocked issues (0-25)
  const blockedCount = projectIssues.filter(i => i.status === "BLOCKED").length;
  const blockedScore = Math.min(blockedCount * 12, 25);
  riskScore += blockedScore;
  if (blockedCount > 0) factors.push({
    factor: isVi ? "Vấn đề bị chặn" : "Blocked Issues",
    score: blockedScore, max: 25, icon: Ban,
    detail: isVi ? `${blockedCount} vấn đề đang bị chặn` : `${blockedCount} issue(s) currently blocked`,
    rec: isVi ? "Xác định và gỡ bỏ trở ngại. Escalate nếu phụ thuộc bên ngoài" : "Identify and remove blockers. Escalate if external dependency",
  });

  // Factor 3: Gate progress (0-20)
  const conds = gateConfig?.[project.phase]?.conditions || [];
  const checks = project.gateChecks?.[project.phase] || {};
  const reqConds = conds.filter(c => c.required);
  const reqPassed = reqConds.filter(c => checks[c.id]).length;
  const gateProgress = reqConds.length > 0 ? reqPassed / reqConds.length : 1;
  const gateScore = Math.round((1 - gateProgress) * 20);
  riskScore += gateScore;
  if (gateProgress < 0.8) factors.push({
    factor: isVi ? "Tiến độ cổng phase" : "Gate Progress",
    score: gateScore, max: 20, icon: DoorOpen,
    detail: isVi ? `${Math.round(gateProgress * 100)}% điều kiện bắt buộc đã đạt` : `${Math.round(gateProgress * 100)}% required conditions met`,
    rec: gateProgress < 0.5
      ? (isVi ? "Khoảng cách lớn. Rà soát kế hoạch test và phân bổ nguồn lực" : "Significant gap. Review test plan and allocate resources")
      : (isVi ? "Đúng hướng nhưng cần chú ý các điều kiện còn lại" : "On track but needs attention on remaining conditions"),
  });

  // Factor 4: Flight test fail rate (0-15)
  const projTests = (flightTests || []).filter(t => t.projectId === project.id);
  const failedTests = projTests.filter(t => t.result === "FAIL" || t.result === "PARTIAL");
  const failRate = projTests.length > 0 ? failedTests.length / projTests.length : 0;
  const failScore = Math.round(failRate * 15);
  riskScore += failScore;
  if (failRate > 0.15) factors.push({
    factor: isVi ? "Tỷ lệ bay thử thất bại" : "Flight Test Failures",
    score: failScore, max: 15, icon: Plane,
    detail: isVi ? `${failedTests.length}/${projTests.length} bay thử thất bại/một phần (${Math.round(failRate * 100)}%)` : `${failedTests.length}/${projTests.length} tests failed/partial (${Math.round(failRate * 100)}%)`,
    rec: isVi ? "Rà soát patterns thất bại. Cần phân tích nguyên nhân gốc" : "Review failure patterns. Root cause analysis needed",
  });

  // Factor 5: Cascade delays (0-10)
  const cascadeIssues = projectIssues.filter(i => i.impacts?.length > 0 && i.status !== "CLOSED");
  const cascadeScore = Math.min(cascadeIssues.length * 5, 10);
  riskScore += cascadeScore;
  if (cascadeIssues.length > 0) factors.push({
    factor: isVi ? "Delay dây chuyền" : "Cascade Delays",
    score: cascadeScore, max: 10, icon: Zap,
    detail: isVi ? `${cascadeIssues.length} vấn đề gây delay dây chuyền` : `${cascadeIssues.length} issue(s) causing cascade delays`,
    rec: isVi ? "Tập trung vào vấn đề gây cascade để tránh ảnh hưởng lịch trình" : "Focus on cascade-causing issues to prevent downstream impact",
  });

  riskScore = Math.min(riskScore, 100);

  let riskLevel, riskColor;
  if (riskScore <= 25) { riskLevel = isVi ? "THẤP" : "LOW"; riskColor = "#22C55E"; }
  else if (riskScore <= 50) { riskLevel = isVi ? "TRUNG BÌNH" : "MODERATE"; riskColor = "#F59E0B"; }
  else if (riskScore <= 75) { riskLevel = isVi ? "CAO" : "HIGH"; riskColor = "#F97316"; }
  else { riskLevel = isVi ? "NGHIÊM TRỌNG" : "CRITICAL"; riskColor = "#EF4444"; }

  return { riskScore, riskLevel, riskColor, factors };
}

function RiskGauge({ score, color, level }) {
  const gaugeData = [
    { value: score, color },
    { value: 100 - score, color: "var(--bg-input)" },
  ];
  return (
    <div style={{ position: "relative", width: 160, height: 160 }}>
      <SafeResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <PieChart>
          <Pie data={gaugeData} cx="50%" cy="50%" innerRadius={55} outerRadius={72} startAngle={225} endAngle={-45} paddingAngle={2} dataKey="value" stroke="none" animationDuration={1000} animationEasing="ease-in-out">
            {gaugeData.map((d, i) => <Cell key={i} fill={i === 0 ? d.color : "var(--hover-bg)"} />)}
          </Pie>
        </PieChart>
      </SafeResponsiveContainer>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
        <div style={{ fontSize: 32, fontWeight: 900, color, fontFamily: mono, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.08em", marginTop: 2 }}>{level}</div>
      </div>
    </div>
  );
}

export default function AIRiskPanel({ projects, issues, gateConfig, flightTests, lang }) {
  const isVi = lang === "vi";

  const riskResults = useMemo(() => {
    return projects.map(proj => {
      const pIssues = issues.filter(i => i.pid === proj.id);
      return { ...proj, risk: calculateProjectRisk(proj, pIssues, gateConfig, flightTests, lang) };
    });
  }, [projects, issues, gateConfig, flightTests, lang]);

  // Find highest risk project for featured display
  const featured = riskResults.reduce((max, p) => p.risk.riskScore > max.risk.riskScore ? p : max, riskResults[0]);

  const sectionStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" };

  return (
    <div style={sectionStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
        <Bot size={15} color="#8B5CF6" />
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: sans }}>
          {isVi ? "Đánh Giá Rủi Ro AI" : "AI Risk Assessment"}
        </span>
        <span style={{ fontSize: 11, color: "var(--text-faint)", marginLeft: "auto", fontFamily: sans }}>
          {isVi ? "Tự động phân tích từ dữ liệu dự án" : "Auto-analyzed from project data"}
        </span>
      </div>
      <div style={{ padding: 16 }}>
        {/* Featured project risk */}
        <div className="risk-panel-flex" style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {/* Left: Gauge */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minWidth: 160 }}>
            <RiskGauge score={featured.risk.riskScore} color={featured.risk.riskColor} level={featured.risk.riskLevel} />
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: sans, textAlign: "center" }}>
              {featured.id} — {featured.name}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-faint)", display: "flex", alignItems: "center", gap: 3 }}>
              <ShieldAlert size={11} /> {isVi ? "Dự án rủi ro cao nhất" : "Highest risk project"}
            </div>
          </div>
          {/* Right: Factors */}
          <div style={{ flex: 1, minWidth: 300 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              {isVi ? "Yếu tố rủi ro" : "Risk Factors"}
            </div>
            {featured.risk.factors.length === 0 && (
              <div style={{ color: "#22C55E", fontSize: 13, padding: "12px 0" }}>
                {isVi ? "Không phát hiện rủi ro đáng kể" : "No significant risks detected"}
              </div>
            )}
            {featured.risk.factors.map((f, i) => {
              const Icon = f.icon;
              const pct = f.max > 0 ? (f.score / f.max) * 100 : 0;
              return (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <Icon size={12} color={f.score > f.max * 0.6 ? "#EF4444" : "#F59E0B"} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", flex: 1 }}>{f.factor}</span>
                    <span style={{ fontFamily: mono, fontSize: 11, color: "var(--text-dim)" }}>{f.score}/{f.max}</span>
                  </div>
                  <div style={{ height: 6, background: "var(--hover-bg)", borderRadius: 3, overflow: "hidden", marginBottom: 3 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: pct > 70 ? "#EF4444" : pct > 40 ? "#F59E0B" : "#3B82F6", borderRadius: 3, transition: "width 0.6s ease" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{f.detail}</div>
                  <div style={{ fontSize: 11, color: "#3B82F6", fontStyle: "italic", marginTop: 1 }}>{f.rec}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Portfolio Risk Summary */}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            {isVi ? "Tổng quan rủi ro toàn bộ" : "Portfolio Risk Overview"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
            {riskResults.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "var(--bg-input)", borderRadius: 6, border: `1px solid ${p.id === featured.id ? p.risk.riskColor + "40" : "var(--border)"}` }}>
                <span style={{ fontFamily: mono, fontSize: 11, color: "#3B82F6", fontWeight: 700, width: 55 }}>{p.id}</span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name.replace("RTR-", "")}</span>
                <div style={{ width: 60, height: 6, background: "var(--hover-bg)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${p.risk.riskScore}%`, background: p.risk.riskColor, borderRadius: 3 }} />
                </div>
                <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 800, color: p.risk.riskColor, width: 24, textAlign: "right" }}>{p.risk.riskScore}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: p.risk.riskColor, letterSpacing: "0.05em", width: 55 }}>{p.risk.riskLevel}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
