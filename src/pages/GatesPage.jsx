import { Suspense } from "react";
import { TabErrorBoundary } from "../components/ErrorBoundary";
import GatesTab from "../components/GatesTab";
import { useData } from "../contexts/DataContext";
import { useAppStore } from "../stores/appStore";
import { useProjectStore } from "../stores/projectStore";
import { usePermission } from "../hooks/usePermission";
import { useAuditLog } from "../contexts/AuditContext";
import { useAuth } from "../contexts/AuthContext";
import { LANG } from "../constants";
import { GATE_CONFIG } from "../constants/gates";

export default function GatesPage() {
  const { projects, activeGateConfig, sbToggleGate, online, setProjects } = useData();
  const lang = useAppStore((s) => s.lang);
  const selProject = useProjectStore((s) => s.selectedProjectId);
  const perm = usePermission();
  const audit = useAuditLog();
  const { user: currentUser } = useAuth();
  const t = LANG[lang];

  const gateConfig = activeGateConfig && Object.keys(activeGateConfig).length > 0 ? activeGateConfig : GATE_CONFIG;
  const project = projects.find((p) => p.id === selProject);

  const getGateProgress = (proj, phase) => {
    const conds = gateConfig[phase]?.conditions || [];
    const checks = proj.gateChecks[phase] || {};
    const total = conds.length;
    const passed = conds.filter((c) => checks[c.id]).length;
    const reqTotal = conds.filter((c) => c.required).length;
    const reqPassed = conds.filter((c) => c.required && checks[c.id]).length;
    return {
      total,
      passed,
      reqTotal,
      reqPassed,
      pct: total ? Math.round((passed / total) * 100) : 0,
      canPass: reqPassed === reqTotal,
    };
  };

  const toggleGate = (phase, condId) => {
    const proj = projects.find((p) => p.id === selProject);
    const oldVal = proj?.gateChecks[phase]?.[condId] ? "true" : "false";
    const newVal = oldVal === "true" ? "false" : "true";
    const cond = gateConfig[phase]?.conditions.find((c) => c.id === condId);
    if (online) sbToggleGate(condId, newVal === "true", currentUser?.id);
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== selProject) return p;
        const gc = { ...p.gateChecks };
        gc[phase] = { ...gc[phase], [condId]: newVal === "true" };
        return { ...p, gateChecks: gc };
      }),
    );
    audit.log("GATE_CHECK_TOGGLED", "gate", condId, cond?.label || condId, oldVal, newVal, { phase });
  };

  if (!project) return null;

  return (
    <Suspense fallback={null}>
      <TabErrorBoundary name="Gates" lang={lang}>
        <GatesTab
          project={project}
          lang={lang}
          t={t}
          perm={perm}
          activeGateConfig={gateConfig}
          getGateProgress={getGateProgress}
          toggleGate={toggleGate}
        />
      </TabErrorBoundary>
    </Suspense>
  );
}
