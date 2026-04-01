import { useState, useRef, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Plus, Download, FileSpreadsheet } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { useAuditLog } from "../contexts/AuditContext";
import { useAppStore } from "../stores/appStore";
import { useProjectStore } from "../stores/projectStore";
import { useIssueStore } from "../stores/issueStore";
import { useUIStore } from "../stores/uiStore";
import { usePermission } from "../hooks/usePermission";
import { useIssueActions } from "../hooks/useIssueActions";
import { LANG, sans } from "../constants";
import { Btn, Section } from "../components/ui";
import { TabErrorBoundary } from "../components/ErrorBoundary";
import CreateIssueForm from "../components/CreateIssueForm";

const MyWorkspace = lazy(() => import("../components/MyWorkspace"));
const WorkplanDashboard = lazy(() => import("../components/WorkplanDashboard"));
const GanttChart = lazy(() => import("../components/GanttChart"));
const DashboardWidgets = lazy(() => import("../components/DashboardWidgets"));

export default function TowerPage() {
  const { projects, issues, setIssues, teamMembers, online, sbCreateIssue, intel } = useData();
  const { user: currentUser } = useAuth();
  const audit = useAuditLog();
  const lang = useAppStore((s) => s.lang);
  const selProject = useProjectStore((s) => s.selectedProjectId);
  const setSelProject = useProjectStore((s) => s.setSelectedProject);
  const selectIssue = useIssueStore((s) => s.selectIssue);
  const { showCreate, openCreate, closeCreate, openAIImport, openExport, showToast, clearToast } = useUIStore();
  const perm = usePermission();
  const { updateIssueStatus } = useIssueActions();
  const navigate = useNavigate();
  const t = LANG[lang];

  const project = projects.find((p) => p.id === selProject);
  const [towerView, setTowerView] = useState("workspace");
  const headerActionsRef = useRef(null);

  const setShowCreate = (v) => (v ? openCreate() : closeCreate());
  const setShowAIImport = (v) => (v ? openAIImport() : null);
  const setShowExport = (v) => (v ? openExport(v) : null);
  const setToast = showToast;

  // Empty state when no projects
  if (!project && projects.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 20px",
          textAlign: "center",
        }}
      >
        <Brain size={48} color="#8B5CF6" style={{ marginBottom: 16, opacity: 0.6 }} />
        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
          {lang === "vi" ? "Chào mừng đến RtR Control Tower" : "Welcome to RtR Control Tower"}
        </div>
        <div style={{ fontSize: 14, color: "var(--text-dim)", marginBottom: 24, maxWidth: 500 }}>
          {lang === "vi"
            ? "Chưa có dữ liệu. Tải file Excel master lên để AI tự động phân bổ dữ liệu vào hệ thống."
            : "No data yet. Upload a master Excel file and AI will auto-distribute data across the system."}
        </div>
        {perm.canImport() && (
          <button
            onClick={() => setShowAIImport(true)}
            style={{
              background: "linear-gradient(135deg, #8B5CF6, #3B82F6)",
              border: "none",
              borderRadius: 8,
              padding: "12px 32px",
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: sans,
              boxShadow: "0 4px 20px rgba(139,92,246,0.3)",
            }}
          >
            <Brain size={20} /> {lang === "vi" ? "AI Import — Tải dữ liệu" : "AI Import — Load Data"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Action Buttons */}
      <div ref={headerActionsRef} style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
        {perm.canCreateIssue() && (
          <Btn variant="primary" small onClick={() => setShowCreate(true)}>
            <Plus size={11} /> {t.issue.create}
          </Btn>
        )}
        {perm.canImport() && (
          <button
            onClick={() => setShowAIImport(true)}
            style={{
              background: "linear-gradient(135deg, #8B5CF6, #3B82F6)",
              border: "none",
              borderRadius: 4,
              padding: "3px 10px",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontFamily: sans,
              letterSpacing: "0.03em",
            }}
          >
            <Brain size={12} /> AI Import
          </button>
        )}
        <Btn small onClick={() => setShowExport("pdf")}>
          <Download size={11} /> {t.importExport?.exportPdf || "Export PDF"}
        </Btn>
        <Btn small onClick={() => setShowExport("slides")}>
          <FileSpreadsheet size={11} /> {t.importExport?.exportSlides || "Executive Slides"}
        </Btn>
      </div>

      {/* Create Issue Form */}
      {showCreate && (
        <Section
          title={
            <>
              <Plus size={13} /> {t.issue.create}
            </>
          }
        >
          <CreateIssueForm
            key={"create-tower-" + showCreate}
            t={t}
            lang={lang}
            selProject={selProject}
            initialStatus={perm.getNewIssueStatus()}
            teamMembers={teamMembers}
            onClose={() => setShowCreate(false)}
            onCreate={async (newIssue) => {
              if (online) {
                await sbCreateIssue(newIssue);
              } else {
                setIssues((prev) => [newIssue, ...prev]);
              }
              setShowCreate(false);
              audit.log("ISSUE_CREATED", "issue", newIssue.id, newIssue.title, null, newIssue.status);
              intel.ingestIssue(newIssue, "created");
              setToast({
                type: "success",
                message: lang === "vi" ? `Đã tạo vấn đề ${newIssue.id}` : `Issue ${newIssue.id} created`,
              });
              setTimeout(() => clearToast(), 3000);
            }}
          />
        </Section>
      )}

      {/* Tower sub-view toggle */}
      <div
        style={{
          display: "flex",
          gap: 2,
          background: "var(--bg-input)",
          borderRadius: 6,
          padding: 2,
          border: "1px solid var(--border)",
          width: "fit-content",
        }}
      >
        {[
          { id: "workspace", label: lang === "vi" ? "Không gian của tôi" : "My Workspace" },
          { id: "dashboard", label: lang === "vi" ? "Tổng quan dự án" : "All Projects" },
          { id: "gantt", label: "Gantt" },
          { id: "widgets", label: lang === "vi" ? "Tùy chỉnh" : "Custom" },
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => setTowerView(v.id)}
            style={{
              background: towerView === v.id ? "var(--bg-card)" : "transparent",
              border: towerView === v.id ? "1px solid var(--border)" : "1px solid transparent",
              borderRadius: 4,
              padding: "5px 14px",
              fontSize: 12,
              fontWeight: 600,
              color: towerView === v.id ? "var(--text-primary)" : "var(--text-faint)",
              cursor: "pointer",
              fontFamily: sans,
              boxShadow: towerView === v.id ? "0 1px 2px var(--shadow-color)" : "none",
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* My Workspace */}
      <Suspense fallback={null}>
        {towerView === "workspace" && (
          <TabErrorBoundary name="MyWorkspace" lang={lang}>
            <MyWorkspace
              currentUser={currentUser}
              issues={issues}
              projects={projects}
              teamMembers={teamMembers}
              lang={lang}
              onNavigateToProject={(projId) => {
                setSelProject(projId);
                setTowerView("dashboard");
              }}
              onNavigateToIssue={(issue) => {
                selectIssue(issue?.id || null);
                navigate("/issues");
              }}
            />
          </TabErrorBoundary>
        )}

        {/* All Projects Dashboard */}
        {towerView === "dashboard" && (
          <TabErrorBoundary name="Dashboard" lang={lang}>
            <WorkplanDashboard
              issues={issues}
              projects={projects}
              lang={lang}
              teamMembers={teamMembers}
              onNavigateIssue={(issue) => {
                selectIssue(issue?.id || null);
                navigate("/issues");
              }}
              onUpdateStatus={(issueId, newStatus) => updateIssueStatus(issueId, newStatus)}
              perm={perm}
              online={online}
            />
          </TabErrorBoundary>
        )}

        {/* Gantt Timeline */}
        {towerView === "gantt" && (
          <TabErrorBoundary name="Gantt" lang={lang}>
            <GanttChart projects={projects} issues={issues} lang={lang} />
          </TabErrorBoundary>
        )}

        {/* Custom Widgets Dashboard */}
        {towerView === "widgets" && (
          <TabErrorBoundary name="Widgets" lang={lang}>
            <DashboardWidgets projects={projects} issues={issues} teamMembers={teamMembers} lang={lang} />
          </TabErrorBoundary>
        )}
      </Suspense>
    </div>
  );
}
