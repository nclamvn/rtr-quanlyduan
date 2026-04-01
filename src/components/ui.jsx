// ═══════════════════════════════════════════════════════════
// RtR Control Tower — Shared UI Components
// Badge, Metric, Btn, Section, NotifIcon, RoleIcon
// ═══════════════════════════════════════════════════════════
import { CircleAlert, Zap, Timer, DoorOpen, Shield, Eye, Wrench, UserCog } from "lucide-react";
import { LineChart, Line } from "recharts";
import SafeResponsiveContainer from "./SafeChart";
import { mono, sans } from "../constants";

export function Badge({ label, color, size = "sm", glow, icon: IconComp }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: size === "sm" ? "1px 7px" : "3px 10px",
        borderRadius: 3,
        background: color + "15",
        color,
        fontSize: size === "sm" ? 10 : 11,
        fontWeight: 700,
        letterSpacing: "0.04em",
        border: `1px solid ${color}25`,
        fontFamily: mono,
        whiteSpace: "nowrap",
        boxShadow: glow ? `0 0 8px ${color}30` : "none",
      }}
    >
      {IconComp ? (
        <IconComp size={size === "sm" ? 10 : 12} />
      ) : (
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />
      )}
      {label}
    </span>
  );
}

export function Metric({
  label,
  value,
  color = "var(--text-primary)",
  sub,
  icon: IconComp,
  onClick,
  active,
  sparkData,
  sparkTrend,
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--bg-input)",
        border: `1px solid ${active ? color : "var(--border)"}`,
        borderRadius: 6,
        padding: "12px 14px",
        position: "relative",
        overflow: "hidden",
        flex: 1,
        minWidth: 0,
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: active ? `0 0 0 1px ${color}40` : "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: active ? 3 : 2,
          background: `linear-gradient(90deg, ${color}, transparent)`,
        }}
      />
      <div
        style={{
          fontSize: 12,
          color: "var(--text-dim)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 4,
          fontWeight: 600,
          fontFamily: sans,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {IconComp && <IconComp size={11} />}
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 6 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: mono, lineHeight: 1 }}>{value}</div>
        {sparkData &&
          sparkTrend &&
          (() => {
            const delta = sparkData[sparkData.length - 1] - sparkData[sparkData.length - 2];
            const isGood = sparkTrend === "neutral" ? null : sparkTrend === "up-good" ? delta >= 0 : delta <= 0;
            const arrowColor = isGood === null ? "var(--text-faint)" : isGood ? "#22C55E" : "#EF4444";
            return (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  fontSize: 10,
                  fontFamily: mono,
                  color: arrowColor,
                  fontWeight: 700,
                }}
              >
                {delta > 0 ? "▲" : delta < 0 ? "▼" : "─"}
                {Math.abs(delta)}
              </div>
            );
          })()}
      </div>
      {sparkData && (
        <div style={{ marginTop: 4, height: 28, minWidth: 50, minHeight: 28 }}>
          <SafeResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <LineChart data={sparkData.map((v) => ({ v }))}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={color}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </SafeResponsiveContainer>
        </div>
      )}
      {sub && <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 3, fontFamily: sans }}>{sub}</div>}
    </div>
  );
}

export function Btn({ children, onClick, variant = "default", small, disabled }) {
  const styles = {
    default: { bg: "var(--hover-bg)", border: "var(--border)", color: "var(--text-secondary)" },
    primary: { bg: "#1D4ED8", border: "#2563EB", color: "#fff" },
    danger: { bg: "#7F1D1D", border: "#991B1B", color: "#FCA5A5" },
    success: { bg: "#065F46", border: "#047857", color: "#6EE7B7" },
    ghost: { bg: "transparent", border: "transparent", color: "var(--text-dim)" },
  };
  const s = styles[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 4,
        padding: small ? "3px 8px" : "6px 12px",
        color: s.color,
        fontSize: small ? 9 : 10,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        fontFamily: sans,
        transition: "all 0.15s",
        letterSpacing: "0.03em",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {children}
    </button>
  );
}

export function Section({ title, children, actions, noPad }) {
  return (
    <div
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}
    >
      {title && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 16px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text-primary)",
              fontFamily: sans,
              display: "flex",
              alignItems: "center",
              gap: 6,
              flex: 1,
            }}
          >
            {title}
          </div>
          {actions && <div style={{ display: "flex", gap: 6 }}>{actions}</div>}
        </div>
      )}
      <div style={{ padding: noPad ? 0 : 16 }}>{children}</div>
    </div>
  );
}

export function NotifIcon({ type }) {
  if (type === "CRITICAL_ISSUE") return <CircleAlert size={13} color="#EF4444" />;
  if (type === "MILESTONE_IMPACT") return <Zap size={13} color="#F59E0B" />;
  if (type === "OVERDUE_ISSUE") return <Timer size={13} color="#F97316" />;
  return <DoorOpen size={13} color="#8B5CF6" />;
}

export function RoleIcon({ role }) {
  if (role === "admin") return <Shield size={10} color="#EF4444" />;
  if (role === "pm") return <UserCog size={10} color="#3B82F6" />;
  if (role === "engineer") return <Wrench size={10} color="#F59E0B" />;
  return <Eye size={10} color="#94A3B8" />;
}
