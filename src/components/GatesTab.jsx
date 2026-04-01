import { lazy, Suspense } from "react";
import { DoorOpen, Check, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { PHASES, PHASE_COLORS } from "../constants";
import { DVT_CATEGORIES } from "../constants/gates";
import { Badge, Btn, Section } from "./ui";

const GateRadar = lazy(() => import("./GateRadar"));

// ===================================================================
// GATE ITEM (internal component)
// ===================================================================
function GateItem({ cond, lang, t, checked, onClick, disabled }) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "5px 8px",
        borderRadius: 4,
        background: checked ? "#10B98108" : "#1E2A3A08",
        cursor: disabled ? "default" : "pointer",
        border: `1px solid ${checked ? "#10B98120" : "transparent"}`,
        marginBottom: 3,
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 3,
          border: `2px solid ${checked ? "#10B981" : "var(--text-faint)"}`,
          background: checked ? "#10B981" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          minWidth: 36,
          minHeight: 36,
          padding: 8,
          boxSizing: "content-box",
          cursor: disabled ? "default" : "pointer",
        }}
      >
        {checked && <Check size={9} color="#000" strokeWidth={3} />}
      </div>
      <span
        style={{
          fontSize: 13,
          color: checked ? "var(--text-dim)" : "var(--text-secondary)",
          textDecoration: checked ? "line-through" : "none",
          flex: 1,
        }}
      >
        {lang === "vi" ? cond.label_vi : cond.label}
      </span>
      {cond.required && (
        <span style={{ fontSize: 10, color: "#EF4444", fontWeight: 700, letterSpacing: "0.05em" }}>
          {t.gate.required}
        </span>
      )}
    </div>
  );
}

// ===================================================================
// GATES TAB
// ===================================================================
export default function GatesTab({ project, lang, t, perm, activeGateConfig, getGateProgress, toggleGate }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          fontSize: 16,
          fontWeight: 800,
          marginBottom: 2,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <DoorOpen size={16} />
        {project.name} — {t.gate.conditions}
      </div>

      {/* Gate Radar Chart */}
      <Suspense fallback={null}>
        <GateRadar gateConfig={activeGateConfig} gateChecks={project.gateChecks} phase={project.phase} lang={lang} />
      </Suspense>

      {PHASES.filter((ph) => ph !== "CONCEPT" || project.phase === "CONCEPT").map((phase) => {
        const config = activeGateConfig[phase];
        if (!config) return null;
        const checks = project.gateChecks[phase] || {};
        const gp = getGateProgress(project, phase);
        const isDVT = phase === "DVT";
        const phaseIdx = PHASES.indexOf(phase);
        const currentIdx = PHASES.indexOf(project.phase);
        const isCurrent = phaseIdx === currentIdx;
        const isPast = phaseIdx < currentIdx;

        return (
          <Section
            key={phase}
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                <span style={{ color: PHASE_COLORS[phase], fontWeight: 800 }}>{phase}</span>
                <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
                  {gp.passed}/{gp.total} {t.gate.passed}
                </span>
                <div style={{ flex: 1, height: 4, background: "var(--hover-bg)", borderRadius: 2, marginLeft: 8 }}>
                  <div
                    style={{
                      width: `${gp.pct}%`,
                      height: "100%",
                      background: gp.canPass ? "#10B981" : PHASE_COLORS[phase],
                      borderRadius: 2,
                      transition: "width 0.3s",
                    }}
                  />
                </div>
                <Badge
                  label={isPast ? "PASSED" : gp.canPass ? t.gate.ready : t.gate.blocked}
                  color={isPast ? "#10B981" : gp.canPass ? "#10B981" : "#EF4444"}
                  glow={isCurrent}
                  icon={isPast ? CheckCircle2 : gp.canPass ? CheckCircle2 : XCircle}
                />
              </div>
            }
            actions={
              isCurrent && gp.canPass && perm.canTransitionPhase() ? (
                <Btn variant="success" small>
                  <ArrowRight size={11} /> {t.gate.transition}
                </Btn>
              ) : null
            }
          >
            {isDVT ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {/* Prerequisite */}
                <div style={{ gridColumn: "1 / -1" }}>
                  {config.conditions
                    .filter((c) => c.cat === "prerequisite")
                    .map((cond) => (
                      <GateItem
                        key={cond.id}
                        cond={cond}
                        lang={lang}
                        t={t}
                        checked={checks[cond.id]}
                        onClick={() => !isPast && perm.canToggleGate() && toggleGate(phase, cond.id)}
                        disabled={isPast || !perm.canToggleGate()}
                      />
                    ))}
                </div>
                {/* 4 Test Categories */}
                {Object.entries(DVT_CATEGORIES).map(([catKey, cat]) => {
                  const catConds = config.conditions.filter((c) => c.cat === catKey);
                  const catPassed = catConds.filter((c) => checks[c.id]).length;
                  const CatIcon = cat.Icon;
                  return (
                    <div
                      key={catKey}
                      style={{
                        background: "var(--bg-modal)",
                        borderRadius: 6,
                        border: "1px solid var(--border)",
                        padding: 10,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <CatIcon size={14} color={cat.color} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: cat.color }}>
                          {lang === "vi" ? cat.label_vi : cat.label}
                        </span>
                        <span style={{ fontSize: 12, color: "var(--text-dim)", marginLeft: "auto" }}>
                          {catPassed}/{catConds.length}
                        </span>
                      </div>
                      {catConds.map((cond) => (
                        <GateItem
                          key={cond.id}
                          cond={cond}
                          lang={lang}
                          t={t}
                          checked={checks[cond.id]}
                          onClick={() => !isPast && perm.canToggleGate() && toggleGate(phase, cond.id)}
                          disabled={isPast || !perm.canToggleGate()}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {config.conditions.map((cond) => (
                  <GateItem
                    key={cond.id}
                    cond={cond}
                    lang={lang}
                    t={t}
                    checked={checks[cond.id]}
                    onClick={() => !isPast && perm.canToggleGate() && toggleGate(phase, cond.id)}
                    disabled={isPast || !perm.canToggleGate()}
                  />
                ))}
              </div>
            )}
          </Section>
        );
      })}
    </div>
  );
}
