import { lazy, Suspense, useMemo } from "react";
import {
  AlertTriangle,
  BarChart3,
  Search,
  FilterX,
  Plus,
  CheckCircle2,
  ChevronRight,
  User,
  Calendar,
  Check,
  Trash2,
  Activity,
  Layers,
  Clock,
  FileSpreadsheet,
  Brain,
  SearchX,
} from "lucide-react";
import { Badge, Btn, Section } from "../components/ui";
import EmptyState, { EMPTY_MESSAGES } from "../components/EmptyState";
import { TabErrorBoundary } from "../components/ErrorBoundary";
import { exportIssuesExcel } from "../components/ExportEngine";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { useAuditLog } from "../contexts/AuditContext";
import { useAppStore } from "../stores/appStore";
import { useProjectStore } from "../stores/projectStore";
import { useIssueStore } from "../stores/issueStore";
import { useUIStore } from "../stores/uiStore";
import { usePermission } from "../hooks/usePermission";
import { useIssueActions } from "../hooks/useIssueActions";
import { normalizeVN } from "../utils/string";
import {
  LANG,
  PHASES,
  PHASE_COLORS,
  STATUS_LIST,
  STATUS_COLORS,
  SEV_LIST,
  SEV_COLORS,
  SRC_LIST,
  SRC_COLORS,
  mono,
} from "../constants";

const IssueCharts = lazy(() => import("../components/IssueCharts"));
const CreateIssueForm = lazy(() => import("../components/CreateIssueForm"));
const KanbanBoard = lazy(() => import("../components/KanbanBoard"));
const IssueComments = lazy(() => import("../components/IssueComments"));
const FileAttachments = lazy(() => import("../components/FileAttachments"));

export default function IssuesPage() {
  const { issues, setIssues, projects, online, sbCreateIssue, teamMembers, intel } = useData();
  const lang = useAppStore((s) => s.lang);
  const selProject = useProjectStore((s) => s.selectedProjectId);
  const {
    filters,
    search: issueSearch,
    sort: issueSort,
    selectedIssueId,
    issueSubTab,
    setFilter,
    setSearch: setIssueSearch,
    setSort: storeSetSort,
    selectIssue,
    setIssueSubTab,
  } = useIssueStore();
  const {
    showCreate,
    showAIImport: _showAIImport,
    openCreate,
    closeCreate,
    openAIImport,
    closeAIImport,
    showToast: storeShowToast,
    clearToast,
  } = useUIStore();
  const perm = usePermission();
  const audit = useAuditLog();
  const { updateIssueStatus, createIssue: _createIssue, deleteIssue: _deleteIssue } = useIssueActions();
  const { user: currentUser } = useAuth();

  const t = LANG[lang];
  const project = projects.find((p) => p.id === selProject);
  const selIssue = issues.find((i) => i.id === selectedIssueId) || null;
  const setSelIssue = (issue) => selectIssue(issue?.id || null);

  const setFilters = (updater) => {
    const newF = typeof updater === "function" ? updater(filters) : updater;
    Object.entries(newF).forEach(([k, v]) => setFilter(k, v));
  };

  const setShowCreate = (v) => (v ? openCreate() : closeCreate());
  const setShowAIImport = (v) => (v ? openAIImport() : closeAIImport());
  const setToast = (v) => (v ? storeShowToast(v) : clearToast());

  const setIssueSort = (updaterOrCol, dir) => {
    if (typeof updaterOrCol === "function") {
      const newSort = updaterOrCol(issueSort);
      storeSetSort(newSort.col, newSort.dir);
    } else {
      storeSetSort(updaterOrCol, dir);
    }
  };

  const filteredIssues = useMemo(() => {
    let f = issues.filter((i) => i.pid === selProject);
    if (filters.status !== "ALL") f = f.filter((i) => i.status === filters.status);
    if (filters.sev !== "ALL") f = f.filter((i) => i.sev === filters.sev);
    if (filters.src !== "ALL") f = f.filter((i) => i.src === filters.src);
    if (issueSearch.trim()) {
      const s = normalizeVN(issueSearch.trim());
      f = f.filter(
        (i) =>
          normalizeVN(i.id).includes(s) ||
          normalizeVN(i.title).includes(s) ||
          normalizeVN(i.titleVi || "").includes(s) ||
          normalizeVN(i.owner || "").includes(s) ||
          normalizeVN(i.rootCause || "").includes(s),
      );
    }
    if (issueSort.col) {
      const SEV_ORDER = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      f.sort((a, b) => {
        let va, vb;
        if (issueSort.col === "sev") {
          va = SEV_ORDER[a.sev] || 0;
          vb = SEV_ORDER[b.sev] || 0;
        } else if (issueSort.col === "due") {
          va = a.due || "9999";
          vb = b.due || "9999";
        } else if (issueSort.col === "created") {
          va = a.created || "";
          vb = b.created || "";
        } else if (issueSort.col === "owner") {
          va = (a.owner || "").toLowerCase();
          vb = (b.owner || "").toLowerCase();
        } else if (issueSort.col === "status") {
          va = a.status;
          vb = b.status;
        } else {
          va = a[issueSort.col] || "";
          vb = b[issueSort.col] || "";
        }
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return issueSort.dir === "asc" ? cmp : -cmp;
      });
    }
    return f;
  }, [issues, selProject, filters, issueSearch, issueSort]);

  return (
    <TabErrorBoundary name="Issues" lang={lang}>
      <Suspense fallback={null}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Issue Sub-tabs */}
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { id: "list", label: lang === "vi" ? "Danh sách" : "List", icon: AlertTriangle },
              { id: "kanban", label: "Kanban", icon: Layers },
              { id: "analytics", label: lang === "vi" ? "Phân tích" : "Analytics", icon: BarChart3 },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setIssueSubTab(st.id)}
                style={{
                  background: issueSubTab === st.id ? "#1D4ED820" : "transparent",
                  border: `1px solid ${issueSubTab === st.id ? "#1D4ED840" : "var(--border)"}`,
                  borderRadius: 4,
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: issueSubTab === st.id ? "#60A5FA" : "var(--text-dim)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <st.icon size={12} /> {st.label}
              </button>
            ))}
          </div>

          {issueSubTab === "analytics" && (
            <IssueCharts issues={issues.filter((i) => i.pid === selProject)} lang={lang} />
          )}

          {issueSubTab === "kanban" && (
            <KanbanBoard
              issues={issues.filter((i) => i.pid === selProject)}
              lang={lang}
              onStatusChange={(issueId, newStatus) => updateIssueStatus(issueId, newStatus)}
              onCardClick={(issue) => {
                setSelIssue(issue);
                setIssueSubTab("list");
              }}
            />
          )}

          {issueSubTab === "list" && (
            <>
              {/* Filters */}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  background: "var(--bg-card)",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  flexWrap: "wrap",
                  position: "sticky",
                  top: 48,
                  zIndex: 20,
                }}
              >
                {/* Issue search */}
                <div style={{ position: "relative", minWidth: 160 }}>
                  <Search size={12} color="var(--text-faint)" style={{ position: "absolute", left: 8, top: 7 }} />
                  <input
                    value={issueSearch}
                    onChange={(e) => setIssueSearch(e.target.value)}
                    placeholder={t.searchIssues}
                    style={{
                      background: "var(--bg-input)",
                      border: "1px solid var(--border)",
                      borderRadius: 4,
                      padding: "5px 8px 5px 26px",
                      color: "var(--text-primary)",
                      fontSize: 12,
                      width: "100%",
                      outline: "none",
                      fontFamily: "'Outfit', 'Segoe UI', system-ui, sans-serif",
                    }}
                  />
                </div>
                {[
                  {
                    key: "status",
                    opts: ["ALL", ...STATUS_LIST],
                    colors: { ALL: "var(--text-dim)", ...STATUS_COLORS },
                    labels: t.status,
                  },
                  {
                    key: "sev",
                    opts: ["ALL", ...SEV_LIST],
                    colors: { ALL: "var(--text-dim)", ...SEV_COLORS },
                    labels: t.severity,
                  },
                  {
                    key: "src",
                    opts: ["ALL", ...SRC_LIST],
                    colors: { ALL: "var(--text-dim)", ...SRC_COLORS },
                    labels: t.source,
                  },
                ].map((f) => (
                  <div key={f.key} style={{ display: "flex", gap: 2 }}>
                    {f.opts.map((o) => (
                      <button
                        key={o}
                        onClick={() => setFilters((prev) => ({ ...prev, [f.key]: o }))}
                        style={{
                          background: filters[f.key] === o ? "var(--hover-bg)" : "transparent",
                          border: `1px solid ${filters[f.key] === o ? f.colors[o] || "#3B82F6" : "transparent"}`,
                          borderRadius: 3,
                          padding: "2px 7px",
                          color: filters[f.key] === o ? "var(--text-primary)" : "var(--text-faint)",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {o === "ALL" ? t.issue.all : f.labels[o] || o.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                ))}
                {(filters.status !== "ALL" || filters.sev !== "ALL" || filters.src !== "ALL" || issueSearch) && (
                  <button
                    onClick={() => {
                      setFilters({ status: "ALL", sev: "ALL", src: "ALL" });
                      setIssueSearch("");
                    }}
                    style={{
                      background: "#EF444415",
                      border: "1px solid #EF444430",
                      borderRadius: 3,
                      padding: "2px 8px",
                      color: "#EF4444",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <FilterX size={11} /> {lang === "vi" ? "Xoá lọc" : "Reset"}
                  </button>
                )}
                <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{filteredIssues.length} issues</span>
                  {perm.canImport() && (
                    <Btn small onClick={() => setShowAIImport(true)}>
                      <Brain size={11} /> AI Import
                    </Btn>
                  )}
                  <Btn
                    small
                    onClick={() =>
                      exportIssuesExcel(
                        issues.filter((i) => i.pid === selProject),
                        project,
                        lang,
                      )
                    }
                  >
                    <FileSpreadsheet size={11} /> {t.importExport?.exportExcel || "Export Excel"}
                  </Btn>
                  {perm.canCreateIssue() && (
                    <Btn variant="primary" small onClick={() => setShowCreate(!showCreate)}>
                      <Plus size={11} /> {t.issue.create}
                    </Btn>
                  )}
                </div>
              </div>

              {/* Create Form */}
              {showCreate && (
                <Section
                  title={
                    <>
                      <Plus size={13} /> {t.issue.create}
                    </>
                  }
                >
                  <CreateIssueForm
                    key={"create-issues-" + showCreate}
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
                      setTimeout(() => setToast(null), 3000);
                    }}
                  />
                </Section>
              )}

              {/* Issue Table with inline expand */}
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  overflow: "hidden",
                  background: "var(--bg-card)",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "20px 64px 1fr 82px 72px 76px 80px 56px",
                    gap: 6,
                    padding: "7px 12px",
                    background: "var(--bg-modal)",
                    borderBottom: "1px solid var(--border)",
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                  }}
                >
                  {[
                    ["", null],
                    [t.issue.id, null],
                    [t.issue.title, null],
                    [t.issue.status, "status"],
                    [t.issue.severity, "sev"],
                    [t.issue.source, null],
                    [t.issue.owner, "owner"],
                    [t.issue.phase, null],
                  ].map(([h, sortKey]) => (
                    <span
                      key={h}
                      onClick={
                        sortKey
                          ? () =>
                              setIssueSort((prev) => ({
                                col: sortKey,
                                dir: prev.col === sortKey && prev.dir === "desc" ? "asc" : "desc",
                              }))
                          : undefined
                      }
                      style={{
                        fontSize: 11,
                        color: issueSort.col === sortKey ? "#3B82F6" : "var(--text-faint)",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        cursor: sortKey ? "pointer" : "default",
                        userSelect: "none",
                      }}
                    >
                      {h}
                      {issueSort.col === sortKey ? (issueSort.dir === "asc" ? " ↑" : " ↓") : ""}
                    </span>
                  ))}
                </div>
                {filteredIssues.map((issue) => {
                  const isOpen = selIssue?.id === issue.id;
                  return (
                    <div key={issue.id}>
                      <div
                        tabIndex={0}
                        role="button"
                        onClick={() => setSelIssue(isOpen ? null : issue)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelIssue(isOpen ? null : issue);
                          }
                        }}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "20px 64px 1fr 82px 72px 76px 80px 56px",
                          gap: 6,
                          padding: "8px 12px",
                          borderBottom: `1px solid ${isOpen ? "var(--border)" : "var(--border-a10)"}`,
                          borderLeft: `3px solid ${SEV_COLORS[issue.sev] || "transparent"}`,
                          cursor: "pointer",
                          background: isOpen ? "var(--hover-bg)" : "transparent",
                          alignItems: "center",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) => {
                          if (!isOpen) e.currentTarget.style.background = "var(--bg-input)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isOpen) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <ChevronRight
                          size={12}
                          color="var(--text-faint)"
                          style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}
                        />
                        <span style={{ fontSize: 12, color: "#3B82F6", fontFamily: mono, fontWeight: 600 }}>
                          {issue.id}
                        </span>
                        <div>
                          <div
                            style={{
                              fontSize: 14,
                              color: "var(--text-primary)",
                              fontWeight: 600,
                              lineHeight: 1.4,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: isOpen ? "normal" : "nowrap",
                            }}
                          >
                            {lang === "vi" ? issue.titleVi || issue.title : issue.title}
                          </div>
                          {!isOpen && (
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--text-faint)",
                                marginTop: 1,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {(issue.rootCause || "").substring(0, 80)}
                            </div>
                          )}
                        </div>
                        <Badge label={t.status[issue.status]} color={STATUS_COLORS[issue.status]} />
                        <Badge label={t.severity[issue.sev]} color={SEV_COLORS[issue.sev]} />
                        <Badge label={t.source[issue.src]} color={SRC_COLORS[issue.src]} />
                        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{issue.owner}</span>
                        <span style={{ fontSize: 12, color: "var(--text-faint)", fontFamily: mono }}>
                          {issue.phase}
                        </span>
                      </div>
                      {/* Inline expand — detail right below this row */}
                      {isOpen && (
                        <div
                          style={{
                            padding: "12px 16px 16px 36px",
                            borderBottom: "2px solid var(--border)",
                            background: "var(--bg-input)",
                          }}
                        >
                          {/* Actions */}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: 4,
                              marginBottom: 10,
                              flexWrap: "wrap",
                            }}
                          >
                            {/* Report Progress — available to everyone including guests */}
                            {issue.status !== "CLOSED" && issue.status !== "DRAFT" && perm.canReportProgress() && (
                              <>
                                <Btn
                                  variant="success"
                                  small
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateIssueStatus(issue.id, "CLOSED");
                                    setToast({
                                      type: "success",
                                      message: lang === "vi" ? `${issue.id} → Hoàn thành` : `${issue.id} → Done`,
                                    });
                                    setTimeout(() => setToast(null), 3000);
                                  }}
                                >
                                  <CheckCircle2 size={11} /> {lang === "vi" ? "Báo Done" : "Report Done"}
                                </Btn>
                              </>
                            )}
                            {/* Admin/PM/Engineer actions */}
                            {!perm.isReadOnly() && (
                              <>
                                {issue.status === "DRAFT" && perm.canReviewIssue() && (
                                  <Btn
                                    variant="success"
                                    small
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateIssueStatus(issue.id, "OPEN");
                                    }}
                                  >
                                    <Check size={11} /> {t.review.approve}
                                  </Btn>
                                )}
                                {issue.status === "OPEN" && perm.canEditIssue(issue) && (
                                  <Btn
                                    variant="primary"
                                    small
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateIssueStatus(issue.id, "IN_PROGRESS");
                                    }}
                                  >
                                    <Activity size={11} /> Start
                                  </Btn>
                                )}
                                {issue.status !== "CLOSED" && perm.canCloseIssue(issue) && (
                                  <Btn
                                    variant="success"
                                    small
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateIssueStatus(issue.id, "CLOSED");
                                    }}
                                  >
                                    <CheckCircle2 size={11} /> {t.close}
                                  </Btn>
                                )}
                                {perm.canDeleteIssue(issue) && (
                                  <Btn
                                    variant="danger"
                                    small
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (confirm(t.deleteConfirm)) {
                                        if (online) {
                                          const { remove } = await import("../services/supabaseService");
                                          await remove("issues", issue.id);
                                        }
                                        setIssues((prev) => prev.filter((i) => i.id !== issue.id));
                                        setSelIssue(null);
                                        audit.log("ISSUE_DELETED", "issue", issue.id, issue.title, issue.status, null);
                                        setToast({ type: "success", message: `${issue.id} ${t.deleted}` });
                                        setTimeout(() => setToast(null), 3000);
                                      }
                                    }}
                                  >
                                    <Trash2 size={11} />
                                  </Btn>
                                )}
                              </>
                            )}
                          </div>
                          {/* Meta */}
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr 1fr 1fr",
                              gap: 8,
                              marginBottom: 10,
                            }}
                          >
                            {[
                              [t.issue.owner, issue.owner, User],
                              [t.issue.phase, issue.phase, Layers],
                              [t.issue.dueDate, issue.due, Calendar],
                              ["Created", issue.created, Clock],
                            ].map(([k, v, Icon]) => {
                              const fmtDate = (d) => {
                                if (!d) return "—";
                                const parts = d.split("-");
                                return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d;
                              };
                              const display = k === t.issue.dueDate || k === "Created" ? fmtDate(v) : v || "—";
                              return (
                                <div
                                  key={k}
                                  style={{ background: "var(--bg-card)", borderRadius: 4, padding: "5px 8px" }}
                                >
                                  <div
                                    style={{
                                      fontSize: 10,
                                      color: "var(--text-faint)",
                                      textTransform: "uppercase",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 3,
                                    }}
                                  >
                                    <Icon size={9} /> {k}
                                  </div>
                                  <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>
                                    {display}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {/* Root cause */}
                          <div style={{ marginBottom: 10 }}>
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--text-faint)",
                                textTransform: "uppercase",
                                marginBottom: 3,
                                fontWeight: 700,
                              }}
                            >
                              {t.issue.rootCause}
                            </div>
                            <div
                              style={{
                                fontSize: 13,
                                color: "var(--text-secondary)",
                                background: "var(--bg-card)",
                                borderRadius: 4,
                                padding: "6px 10px",
                                borderLeft: "3px solid #F59E0B",
                                whiteSpace: "pre-wrap",
                                lineHeight: 1.6,
                              }}
                            >
                              {issue.rootCause || issue.desc || "—"}
                            </div>
                          </div>
                          {/* Description (if different from rootCause) */}
                          {issue.desc && issue.desc !== issue.rootCause && (
                            <div style={{ marginBottom: 10 }}>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "var(--text-faint)",
                                  textTransform: "uppercase",
                                  marginBottom: 3,
                                  fontWeight: 700,
                                }}
                              >
                                {t.issue.description}
                              </div>
                              <div
                                style={{
                                  fontSize: 13,
                                  color: "var(--text-secondary)",
                                  background: "var(--bg-card)",
                                  borderRadius: 4,
                                  padding: "6px 10px",
                                  borderLeft: "3px solid #3B82F6",
                                  whiteSpace: "pre-wrap",
                                  lineHeight: 1.6,
                                  maxHeight: 200,
                                  overflowY: "auto",
                                }}
                              >
                                {issue.desc}
                              </div>
                            </div>
                          )}
                          {/* Impacts */}
                          {issue.impacts?.length > 0 && (
                            <div style={{ marginBottom: 10 }}>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "#EF4444",
                                  textTransform: "uppercase",
                                  marginBottom: 3,
                                  fontWeight: 700,
                                }}
                              >
                                {t.issue.impactMap}
                              </div>
                              {issue.impacts.map((imp, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "4px 8px",
                                    marginBottom: 2,
                                    background: "#EF444408",
                                    borderRadius: 4,
                                    borderLeft: "3px solid #EF4444",
                                  }}
                                >
                                  <Badge label={imp.phase} color={PHASE_COLORS[imp.phase]} />
                                  <span style={{ fontSize: 12, color: "#FCA5A5" }}>
                                    {lang === "vi" ? imp.descVi : imp.desc}
                                  </span>
                                  <span
                                    style={{ fontSize: 11, color: "#F59E0B", fontFamily: mono, marginLeft: "auto" }}
                                  >
                                    +{Math.ceil(imp.days / 7)}w
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Activity log */}
                          {issue.updates?.length > 0 && (
                            <div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "var(--text-faint)",
                                  textTransform: "uppercase",
                                  marginBottom: 4,
                                  fontWeight: 700,
                                }}
                              >
                                {t.issue.activityLog}
                              </div>
                              <div
                                style={{
                                  borderLeft: "2px solid var(--border)",
                                  paddingLeft: 12,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 4,
                                }}
                              >
                                {issue.updates.slice(0, 5).map((u, idx) => (
                                  <div key={idx} style={{ position: "relative" }}>
                                    <div
                                      style={{
                                        position: "absolute",
                                        left: -17,
                                        top: 3,
                                        width: 6,
                                        height: 6,
                                        borderRadius: "50%",
                                        background: "#3B82F6",
                                        border: "2px solid var(--bg-input)",
                                      }}
                                    />
                                    <div style={{ fontSize: 11, color: "var(--text-faint)" }}>
                                      <span style={{ fontFamily: mono }}>{u.date}</span> — {u.author}
                                    </div>
                                    <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                                      {u.text}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* File Attachments */}
                          <FileAttachments
                            entityType="issue"
                            entityId={issue.id}
                            currentUser={currentUser}
                            canUpload={perm.canEditIssue(issue) || perm.canCreateIssue()}
                            lang={lang}
                          />
                          {/* Comments & @Mentions */}
                          <IssueComments
                            issueId={issue.id}
                            currentUser={currentUser}
                            teamMembers={teamMembers}
                            lang={lang}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredIssues.length === 0 &&
                  (() => {
                    const em = EMPTY_MESSAGES[lang]?.issues || EMPTY_MESSAGES.vi.issues;
                    const hasFilters =
                      filters.status !== "ALL" || filters.sev !== "ALL" || filters.src !== "ALL" || issueSearch;
                    const totalProjectIssues = issues.filter((i) => i.pid === selProject).length;
                    return totalProjectIssues === 0 ? (
                      <EmptyState
                        icon={em.icon}
                        title={em.title}
                        description={em.desc}
                        actionLabel={perm.canCreateIssue() ? em.action : undefined}
                        onAction={perm.canCreateIssue() ? () => setShowCreate(true) : undefined}
                      />
                    ) : (
                      <div style={{ padding: 40, textAlign: "center" }}>
                        <SearchX size={24} color="var(--text-disabled)" style={{ marginBottom: 8 }} />
                        <div style={{ fontSize: 14, color: "var(--text-faint)" }}>{t.issue.noIssues}</div>
                        {hasFilters && (
                          <button
                            onClick={() => {
                              setFilters({ status: "ALL", sev: "ALL", src: "ALL" });
                              setIssueSearch("");
                            }}
                            style={{
                              marginTop: 10,
                              background: "var(--hover-bg)",
                              border: "1px solid var(--border)",
                              borderRadius: 4,
                              padding: "5px 12px",
                              color: "var(--text-muted)",
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <FilterX size={12} /> {lang === "vi" ? "Xoá bộ lọc" : "Clear filters"}
                          </button>
                        )}
                      </div>
                    );
                  })()}
              </div>

              {/* Legacy detail panel removed — now inline expand above */}
            </>
          )}
        </div>
      </Suspense>
    </TabErrorBoundary>
  );
}
