import { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { useAppStore } from "../stores/appStore";
import { useProjectStore } from "../stores/projectStore";
import { usePermission } from "../hooks/usePermission";
import { useAuditLog } from "../contexts/AuditContext";
import { useUIStore } from "../stores/uiStore";
import { useIssueStore } from "../stores/issueStore";
import { LANG } from "../constants";

const TestingTab = lazy(() => import("../components/TestingTab"));

export default function TestingPage() {
  const { projects, issues, allFlights, online, sbCreateIssue, setIssues, intel } = useData();
  const lang = useAppStore((s) => s.lang);
  const selProject = useProjectStore((s) => s.selectedProjectId);
  const perm = usePermission();
  const audit = useAuditLog();
  const openAIImport = useUIStore((s) => s.openAIImport);
  const selectIssue = useIssueStore((s) => s.selectIssue);
  const navigate = useNavigate();
  const t = LANG[lang];
  const project = projects.find((p) => p.id === selProject);

  if (!project) return null;

  return (
    <Suspense fallback={null}>
      <TestingTab
        project={project}
        selProject={selProject}
        issues={issues}
        lang={lang}
        t={t}
        perm={perm}
        allFlights={allFlights}
        online={online}
        sbCreateIssue={sbCreateIssue}
        setIssues={setIssues}
        audit={audit}
        intel={intel}
        setTab={(tab) => navigate(`/${tab === "tower" ? "" : tab}`)}
        setSelIssue={(issue) => {
          selectIssue(issue?.id || null);
          navigate("/issues");
        }}
        onAIImport={openAIImport}
      />
    </Suspense>
  );
}
