/**
 * AIScanPanel — AI Relationship Scan Results UI
 * Shows clusters of related issues with explanations and recommendations
 */
import { useState } from "react";
import {
  Scan, ChevronDown, ChevronRight, AlertTriangle,
  Link2, Users, Layers, FolderKanban, Lightbulb, Clock,
} from "lucide-react";

const mono = "'JetBrains Mono', 'Fira Code', monospace";
const sans = "'Outfit', 'Segoe UI', system-ui, sans-serif";

const SEV_COLORS = {
  critical: "#EF4444",
  high: "#F59E0B",
  medium: "#3B82F6",
  low: "#6B7280",
  info: "#9CA3AF",
};

function Badge({ label, color, size = "sm" }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: size === "sm" ? "1px 7px" : "3px 10px",
      borderRadius: 3, background: color + "15", color,
      fontSize: size === "sm" ? 9 : 10, fontWeight: 700,
      letterSpacing: "0.06em", textTransform: "uppercase",
      border: `1px solid ${color}25`, fontFamily: mono,
      whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />
      {label}
    </span>
  );
}

function DimensionBadge({ icon: Icon, label }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: "2px 8px", borderRadius: 3,
      background: "var(--bg-secondary)", border: "1px solid var(--border)",
      fontSize: 10, fontFamily: mono, color: "var(--text-dim)",
    }}>
      <Icon size={10} />
      {label}
    </span>
  );
}

function ClusterCard({ cluster, lang, onNavigateIssue }) {
  const [expanded, setExpanded] = useState(false);
  const color = SEV_COLORS[cluster.severity] || SEV_COLORS.info;
  const explanation = lang === "vi" ? cluster.explanation.vi : cluster.explanation.en;
  const recommendation = lang === "vi" ? cluster.recommendation.vi : cluster.recommendation.en;

  return (
    <div style={{
      background: "var(--bg-input)",
      border: `1px solid ${color}30`,
      borderRadius: 8,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div
        style={{
          padding: "12px 14px",
          cursor: "pointer",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          {expanded ? <ChevronDown size={14} color="var(--text-dim)" /> : <ChevronRight size={14} color="var(--text-dim)" />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Severity + size */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Badge label={cluster.severity} color={color} />
            <span style={{ fontSize: 11, fontFamily: mono, color: "var(--text-faint)" }}>
              {cluster.issues.length} issues / {cluster.edges.length} {lang === "vi" ? "liên kết" : "links"}
            </span>
          </div>

          {/* Explanation */}
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: sans, lineHeight: 1.4 }}>
            {explanation}
          </div>

          {/* Shared dimension badges */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
            {cluster.sharedComponents.map(c => (
              <DimensionBadge key={`comp-${c}`} icon={Layers} label={c} />
            ))}
            {cluster.sharedPhases.map(p => (
              <DimensionBadge key={`phase-${p}`} icon={FolderKanban} label={p} />
            ))}
            {cluster.sharedOwners.map(o => (
              <DimensionBadge key={`owner-${o}`} icon={Users} label={o} />
            ))}
            {cluster.sharedProjects.map(p => (
              <DimensionBadge key={`proj-${p}`} icon={FolderKanban} label={p} />
            ))}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "12px 14px 14px 38px" }}>
          {/* Recommendation */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 6,
            padding: "8px 10px", marginBottom: 10,
            background: "#3B82F608", border: "1px solid #3B82F620",
            borderRadius: 6, fontSize: 12, fontFamily: sans,
            color: "#3B82F6", lineHeight: 1.4,
          }}>
            <Lightbulb size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            {recommendation}
          </div>

          {/* Issue list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {cluster.issues.map(issue => (
              <div
                key={issue.id}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 8px", borderRadius: 4,
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  cursor: onNavigateIssue ? "pointer" : "default",
                }}
                onClick={() => onNavigateIssue?.(issue.id)}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                  background: SEV_COLORS[issue.severity] || SEV_COLORS.info,
                }} />
                <span style={{ flex: 1, fontSize: 11, fontFamily: sans, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {issue.title}
                </span>
                {issue.owner && (
                  <span style={{ fontSize: 9, fontFamily: mono, color: "var(--text-faint)", flexShrink: 0 }}>
                    {issue.owner}
                  </span>
                )}
                {issue.severity && (
                  <Badge label={issue.severity} color={SEV_COLORS[issue.severity] || SEV_COLORS.info} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AIScanPanel({ scanResult, issues, onRunScan, lang, onNavigateIssue }) {
  const [scanning, setScanning] = useState(false);

  const handleScan = () => {
    setScanning(true);
    // Use setTimeout to allow UI to update before scan
    setTimeout(() => {
      onRunScan(issues);
      setScanning(false);
    }, 50);
  };

  const hasResult = scanResult && scanResult.clusters;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Scan button + summary */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={handleScan}
          disabled={scanning || !issues?.length}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 6,
            background: scanning ? "var(--border)" : "#3B82F6",
            color: "#fff", border: "none", cursor: scanning ? "wait" : "pointer",
            fontSize: 13, fontWeight: 700, fontFamily: sans,
            opacity: !issues?.length ? 0.5 : 1,
          }}
        >
          <Scan size={14} style={scanning ? { animation: "spin 1s linear infinite" } : {}} />
          {scanning
            ? (lang === "vi" ? "Đang quét..." : "Scanning...")
            : (lang === "vi" ? "AI Quét Liên Quan" : "AI Scan Relationships")}
        </button>

        {hasResult && (
          <div style={{ display: "flex", gap: 14, fontSize: 11, fontFamily: mono, color: "var(--text-dim)" }}>
            <span>{scanResult.totalIssues} issues</span>
            <span><Link2 size={10} style={{ display: "inline", verticalAlign: "middle" }} /> {scanResult.totalRelationships} {lang === "vi" ? "liên kết" : "relationships"}</span>
            <span>{scanResult.clusters.length} {lang === "vi" ? "nhóm" : "clusters"}</span>
            <span><Clock size={10} style={{ display: "inline", verticalAlign: "middle" }} /> {scanResult.scanTimeMs}ms</span>
          </div>
        )}
      </div>

      {/* Results */}
      {hasResult && scanResult.clusters.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {scanResult.clusters.map(cluster => (
            <ClusterCard
              key={cluster.id}
              cluster={cluster}
              lang={lang}
              onNavigateIssue={onNavigateIssue}
            />
          ))}
        </div>
      )}

      {/* No results */}
      {hasResult && scanResult.clusters.length === 0 && (
        <div style={{ textAlign: "center", padding: "30px 20px" }}>
          <Link2 size={32} color="var(--text-faint)" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-dim)", fontFamily: sans, marginBottom: 4 }}>
            {lang === "vi" ? "Không tìm thấy nhóm liên quan" : "No related issue clusters found"}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-faint)", fontFamily: sans }}>
            {lang === "vi"
              ? "Các issues hiện tại không có đủ điểm tương đồng để nhóm lại"
              : "Current issues don't share enough similarity to form clusters"}
          </div>
        </div>
      )}

      {/* Initial state */}
      {!hasResult && !scanning && (
        <div style={{ textAlign: "center", padding: "30px 20px" }}>
          <Scan size={32} color="var(--text-faint)" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-dim)", fontFamily: sans, marginBottom: 4 }}>
            {lang === "vi" ? "AI Quét Vấn Đề Liên Quan" : "AI Relationship Scanner"}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-faint)", fontFamily: sans }}>
            {lang === "vi"
              ? "Quét toàn bộ issues để phát hiện các vấn đề có mối liên hệ qua component, owner, keyword, và các chiều dữ liệu khác"
              : "Scan all issues to discover related problems through shared components, owners, keywords, and other dimensions"}
          </div>
        </div>
      )}

      {/* Spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
