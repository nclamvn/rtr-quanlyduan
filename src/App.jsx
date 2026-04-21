import { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import {
  LayoutDashboard,
  AlertTriangle,
  DoorOpen,
  Zap,
  Users,
  ClipboardCheck,
  Bell,
  ChevronDown,
  Globe,
  Clock,
  User,
  Check,
  X,
  Plus,
  Circle,
  CircleDot,
  CheckCircle2,
  XCircle,
  Ban,
  FileText,
  Flame,
  ArrowUp,
  Minus,
  ChevronRight,
  ArrowRight,
  Shield,
  Eye,
  Wrench,
  UserCog,
  Plane,
  Thermometer,
  Radio,
  Cog,
  Target,
  TrendingUp,
  BarChart3,
  Activity,
  Calendar,
  MapPin,
  GitBranch,
  Layers,
  CircleAlert,
  Timer,
  Milestone,
  ChevronLeft,
  LogIn,
  LogOut,
  RefreshCw,
  ScrollText,
  Download,
  Trash2,
  Package,
  Truck,
  Scale,
  Upload,
  Settings,
  Mail,
  FileSpreadsheet,
  Sun,
  Moon,
  SearchX,
  FilterX,
  Search,
  WifiOff,
  Brain,
  Factory,
  Warehouse,
  ShoppingCart,
  DollarSign,
} from "lucide-react";
import { useAuth } from "./contexts/AuthContext";
import { usePermission } from "./hooks/usePermission";
import { useAuditLog } from "./contexts/AuditContext";
import { useAlertsStore } from "./stores/alertsStore";
import LoginScreen from "./components/LoginScreen";
import AccessDenied from "./components/AccessDenied";
// Note: These are static imports for functions/singletons used synchronously.
// The default component exports are lazy-loaded above.
import { notificationEngine, NotificationToast } from "./components/EmailNotifications";
// exportIssuesExcel moved to IssuesPage

// Lazy-loaded modules (code-split into separate chunks)
// BomTab, TestingTab moved to pages/
const ImportWizard = lazy(() => import("./components/ImportWizard"));
const ExportModal = lazy(() => import("./components/ExportEngine"));
// EmailPreferences moved to pages/SettingsPage
const IssueCharts = lazy(() => import("./components/IssueCharts"));
// IntelligencePanel, OrdersModule, ProductionModule, InventoryModule, FinanceModule moved to pages/
const AIImportWizard = lazy(() => import("./components/AIImportWizard"));
const WorkplanDashboard = lazy(() => import("./components/WorkplanDashboard"));
const MyWorkspace = lazy(() => import("./components/MyWorkspace"));
// Data hooks moved to DataContext
import { resetWarmUp } from "./lib/supabase";
// useProjectsData, useIssuesData, useNotificationsData moved to DataContext
import { LineChart, Line } from "recharts";
import SafeResponsiveContainer from "./components/SafeChart";
import EmptyState, { EMPTY_MESSAGES } from "./components/EmptyState";
import { TabErrorBoundary } from "./components/ErrorBoundary";
import { Badge, Metric, Btn, Section, NotifIcon, RoleIcon } from "./components/ui";
import CreateIssueForm from "./components/CreateIssueForm";
// Tab page components moved to src/pages/ — loaded via TAB_PAGES map
import { GATE_CONFIG } from "./constants/gates";
import TabNavigation from "./components/layout/TabNavigation";
// normalizeVN moved to IssuesPage
import { useAppStore } from "./stores/appStore";
import { useProjectStore } from "./stores/projectStore";
import { useIssueStore } from "./stores/issueStore";
import { useUIStore } from "./stores/uiStore";
import { useData } from "./contexts/DataContext";
import { useTabSync } from "./hooks/useTabSync";
import { TAB_PAGES } from "./router";
import {
  PHASES,
  PHASE_COLORS,
  STATUS_LIST,
  STATUS_COLORS,
  SEV_LIST,
  SEV_COLORS,
  SRC_LIST,
  SRC_COLORS,
  LANG,
  mono,
  sans,
} from "./constants";

// normalizeVN moved to utils/string.js

// ===================================================================
// RtR CONTROL TOWER V1 — Full Interactive Prototype
// Based on Vibecode Kit v5.0 Blueprint
// 3 Core Modules: Dashboard, Issues, Phase & Gates
// All icons: Lucide React
// ===================================================================

// i18n: LANG imported from constants/i18n.js (see imports at top)
// _LEGACY_ i18n block removed 2026-03-24 (~60 lines cleaned)
// --- CONSTANTS (imported from ./constants/) ---

// --- GATE CONDITIONS ---

// GateItem, DVT_CATEGORIES → components/GatesTab.jsx + constants/gates.js

// ===================================================================
// MAIN APP
// ===================================================================
export default function App() {
  const { user: currentUser, isAuthenticated, isGuest, isLoading, logout, accessDenied } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const perm = usePermission();
  const audit = useAuditLog();
  // ── Zustand stores ──
  const { lang, setLang, theme, setTheme: storeSetTheme } = useAppStore();
  const { selectedProjectId: selProject, setSelectedProject: setSelProject } = useProjectStore();
  const { selectedIssueId, selectIssue } = useIssueStore();
  const selIssue = selectedIssueId ? { id: selectedIssueId } : null;
  const setSelIssue = (v) => selectIssue(v?.id || null);
  const {
    showNotif,
    showCreate,
    showUserMenu,
    showImport,
    showAIImport,
    showExport,
    toast,
    showFab,
    toggleNotif,
    openCreate,
    closeCreate,
    toggleUserMenu,
    closeUserMenu,
    openImport,
    closeImport,
    openAIImport: storeOpenAIImport,
    closeAIImport: storeCloseAIImport,
    openExport,
    closeExport,
    showToast: storeShowToast,
    setShowFab,
    closeNotif,
  } = useUIStore();

  // Compat aliases for legacy code in App.jsx
  const setShowNotif = (v) => (v ? toggleNotif() : closeNotif());
  const setShowUserMenu = (v) => (v ? toggleUserMenu() : closeUserMenu());

  // All data from DataContext (must be before any useEffect that reads it)
  const {
    connStatus,
    online,
    projects,
    setProjects,
    issues,
    setIssues,
    notifications,
    setNotifications,
    projLoading,
    issLoading,
    sbMarkRead,
    sbMarkAllRead,
    allFlights,
    allBom,
    intel,
  } = useData();

  // Tab state synced with React Router URL
  const [tab, setTab] = useState(() => localStorage.getItem("rtr-tab") || "tower");
  useTabSync(tab, setTab);

  // Auto-hide "online" indicator after 3s
  const [showOnline, setShowOnline] = useState(false);
  useEffect(() => {
    if (connStatus === "online") {
      setShowOnline(true);
      const timer = setTimeout(() => setShowOnline(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [connStatus]);

  // auditFilter moved to AuditPage
  const [time, setTime] = useState(new Date());
  const setToast = storeShowToast;
  const [selMetric, setSelMetric] = useState(null);
  const [selProjMetric, setSelProjMetric] = useState(null);
  const setShowImport = (v) => (v ? openImport() : closeImport());
  const setShowAIImport = (v) => (v ? storeOpenAIImport() : storeCloseAIImport());
  const setShowExport = (v) => (v ? openExport(v) : closeExport());
  const setShowCreate = (v) => (v ? openCreate() : closeCreate());
  const setTheme = (v) => {
    storeSetTheme(v);
    document.documentElement.setAttribute("data-theme", v);
  };
  const headerActionsRef = useRef(null);

  const t = LANG[lang];
  const project = projects.find((p) => p.id === selProject);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // All data hooks moved to DataContext — accessed via useData() above

  // Agent alerts badge count
  const alertsOpenCount = useAlertsStore((s) => s.openCount);
  const loadOpenCount = useAlertsStore((s) => s.loadOpenCount);
  useEffect(() => {
    loadOpenCount();
  }, []);

  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(i);
  }, []);
  // theme + lang persisted by Zustand appStore
  // tab synced via React Router (useTabSync)
  // FAB visibility: show when header actions scroll out of view
  useEffect(() => {
    const el = headerActionsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setShowFab(!entry.isIntersecting), { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [isAuthenticated]);
  // Validate persisted tab against current role
  useEffect(() => {
    if (tab === "review" && !perm.canViewReviewQueue()) setTab("tower");
    if (tab === "audit" && currentUser?.role !== "admin") setTab("tower");
  }, [currentUser?.role]);
  // project, filters, search, selIssue persisted by Zustand stores
  useEffect(() => {
    if (projects.length > 0 && !projects.find((p) => p.id === selProject)) setSelProject(projects[0].id);
  }, [projects]);
  // selIssue resolve moved to IssuesPage

  // --- Intelligence event → toast notifications ---
  useEffect(() => {
    const latestEvent = intel.events[intel.events.length - 1];
    if (!latestEvent) return;
    if (latestEvent.type === "convergence_detected") {
      const dims = Object.entries(latestEvent.alert.dimensionValues)
        .map(([, v]) => `${v}`)
        .join("/");
      setToast({
        type: "warning",
        message: `${t.intel?.convergenceDetected || "Convergence"}: ${latestEvent.alert.signalTypes.length} ${t.intel?.signalTypes || "types"} @ ${dims}`,
      });
      setTimeout(() => setToast(null), 5000);
    } else if (latestEvent.type === "anomaly_detected") {
      setToast({ type: "info", message: `${t.intel?.anomalyDetected || "Anomaly"}: ${latestEvent.anomaly.message}` });
      setTimeout(() => setToast(null), 5000);
    } else if (latestEvent.type === "index_updated") {
      const crit = latestEvent.scores.find((s) => s.level === "critical");
      if (crit) {
        setToast({
          type: "error",
          message: `${t.intel?.healthCritical || "Health Critical"}: ${crit.entityId} ${Math.round(crit.score)}/100`,
        });
        setTimeout(() => setToast(null), 5000);
      }
    }
  }, [intel.events.length]);

  // --- Escape key handler ---
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        if (showImport) setShowImport(false);
        else if (showExport) setShowExport(null);
        else if (selIssue) setSelIssue(null);
        else if (showCreate) setShowCreate(false);
        else if (selProjMetric) setSelProjMetric(null);
        else if (selMetric) setSelMetric(null);
        else if (showUserMenu) setShowUserMenu(false);
        else if (showNotif) setShowNotif(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showImport, showExport, selIssue, showCreate, showUserMenu, showNotif, selMetric, selProjMetric]);

  // filteredIssues, sparklines moved to IssuesPage
  // Metrics kept for tab badges only
  const allOpen = useMemo(() => issues.filter((i) => i.status !== "CLOSED"), [issues]);
  const cascadeIssues = useMemo(() => issues.filter((i) => i.status !== "CLOSED" && i.impacts?.length > 0), [issues]);
  const draftIssues = useMemo(
    () => issues.filter((i) => i.pid === selProject && i.status === "DRAFT"),
    [issues, selProject],
  );

  // Auth guard — loading spinner
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-main)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <RefreshCw size={24} color="#3B82F6" style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
      </div>
    );
  }

  // Auth guard — access denied (Gateway mode: user has no PM permissions)
  if (accessDenied) {
    return <AccessDenied />;
  }

  // Auth guard — guests must login, no dashboard access
  // In Gateway mode, AuthContext handles redirect automatically.
  // LoginScreen is only shown in dev/Supabase-only mode.
  if (isGuest || showAuthModal) {
    return (
      <LoginScreen
        onLogin={(user, selectedLang) => {
          setLang(selectedLang);
          audit.log("USER_LOGIN", "user", user.id, user.name, null, user.role, { _asUser: user });
          setShowAuthModal(false);
        }}
        initialLang={lang}
      />
    );
  }

  // Gate helpers, issue actions, cascade moved to page components + useIssueActions hook

  // --- TABS CONFIG ---
  const tabs = [
    { id: "tower", label: t.tabs.tower, Icon: LayoutDashboard },
    {
      id: "issues",
      label: t.tabs.issues,
      Icon: AlertTriangle,
      badge: allOpen.filter((i) => i.pid === selProject).length,
    },
    { id: "gates", label: t.tabs.gates, Icon: DoorOpen },
    { id: "impact", label: t.tabs.impact, Icon: Zap, badge: cascadeIssues.filter((i) => i.pid === selProject).length },
    { id: "bom", label: t.tabs.bom, Icon: Package },
    { id: "testing", label: t.tabs.testing, Icon: Plane },
    { id: "team", label: t.tabs.team, Icon: Users },
    ...(perm.canViewReviewQueue()
      ? [{ id: "review", label: t.tabs.review, Icon: ClipboardCheck, badge: draftIssues.length }]
      : []),
    ...(currentUser?.role === "admin"
      ? [
          {
            id: "audit",
            label: t.tabs.audit,
            Icon: ScrollText,
            badge: audit.logs.length > 0 ? audit.logs.length : undefined,
          },
        ]
      : []),
    { id: "orders", label: t.tabs.orders, Icon: ShoppingCart },
    { id: "production", label: t.tabs.production, Icon: Factory },
    { id: "inventory", label: t.tabs.inventory, Icon: Warehouse },
    ...(["admin", "pm"].includes(currentUser?.role)
      ? [{ id: "finance", label: t.tabs.finance, Icon: DollarSign }]
      : []),
    {
      id: "intelligence",
      label: t.tabs.intelligence,
      Icon: Brain,
      badge: intel.convergences.length + alertsOpenCount || undefined,
    },
    { id: "settings", label: t.tabs.settings, Icon: Settings },
  ];

  // --- Role icon: imported from components/ui.jsx ---

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-main)",
        color: "var(--text-primary)",
        fontFamily: sans,
        fontSize: 14,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* === HEADER === */}
      <div
        style={{
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border)",
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 52,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Left: App branding + Project selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ marginRight: 4, flexShrink: 0 }}>
            <div
              style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.3, whiteSpace: "nowrap" }}
            >
              {t.appName}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--text-faint)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              {t.appSub}
            </div>
          </div>
          {/* Offline indicator */}
          {!online && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "0 10px",
                height: 32,
                background: "#F59E0B15",
                border: "1px solid #F59E0B30",
                borderRadius: 6,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <WifiOff size={12} color="#F59E0B" />
              <span style={{ fontSize: 11, color: "#F59E0B", fontWeight: 700 }}>{t.offline}</span>
            </div>
          )}
          {/* Divider */}
          <div style={{ width: 1, height: 24, background: "var(--border)", flexShrink: 0 }} />
          {/* Project selector — separated into General + specific projects */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* General / Portfolio button — visually distinct */}
            {projects
              .filter((p) => p.name.split(" ")[0].toLowerCase() === "general")
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelProject(p.id);
                    setSelIssue(null);
                    useIssueStore.getState().setSearch("");
                  }}
                  aria-label={p.name}
                  aria-pressed={selProject === p.id}
                  style={{
                    background: selProject === p.id ? "var(--hover-bg)" : "transparent",
                    border: `1px solid ${selProject === p.id ? "#3B82F6" : "var(--border)"}`,
                    borderRadius: 6,
                    padding: "0 12px",
                    height: 32,
                    color: selProject === p.id ? "var(--text-primary)" : "var(--text-dim)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Globe size={12} style={{ opacity: 0.7 }} />
                  {lang === "vi" ? "Tổng quát" : "General"}
                </button>
              ))}
            {/* Separator dot between General and project tabs */}
            {projects.some((p) => p.name.split(" ")[0].toLowerCase() === "general") && (
              <div
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  background: "var(--text-faint)",
                  opacity: 0.4,
                  margin: "0 2px",
                }}
              />
            )}
            {/* Specific project tabs */}
            <div style={{ display: "flex", gap: 2, background: "var(--bg-main)", borderRadius: 8, padding: 2 }}>
              {projects
                .filter((p) => p.name.split(" ")[0].toLowerCase() !== "general")
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelProject(p.id);
                      setSelIssue(null);
                      useIssueStore.getState().setSearch("");
                    }}
                    aria-label={p.name}
                    aria-pressed={selProject === p.id}
                    style={{
                      background: selProject === p.id ? "var(--bg-card)" : "transparent",
                      border: "none",
                      borderRadius: 6,
                      padding: "0 12px",
                      height: 28,
                      color: selProject === p.id ? "var(--text-primary)" : "var(--text-dim)",
                      fontSize: 12,
                      fontWeight: selProject === p.id ? 700 : 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      transition: "all 0.15s ease",
                      boxShadow: selProject === p.id ? "0 1px 3px var(--shadow-color)" : "none",
                    }}
                  >
                    {p.name.split(" ")[0]}
                  </button>
                ))}
            </div>
          </div>
        </div>
        {/* Right: Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Connection status indicator */}
          {(connStatus === "connecting" || showOnline) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "0 10px",
                height: 32,
                borderRadius: 6,
                border: "1px solid var(--border)",
                fontSize: 11,
                fontWeight: 600,
                color: connStatus === "online" ? "#22C55E" : "#F59E0B",
                background: connStatus === "online" ? "#22C55E10" : "#F59E0B10",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: connStatus === "online" ? "#22C55E" : "#F59E0B",
                  animation: connStatus === "connecting" ? "pulse 1.5s infinite" : "none",
                }}
              />
              {connStatus === "online"
                ? lang === "vi"
                  ? "Đã kết nối"
                  : "Connected"
                : lang === "vi"
                  ? "Đang kết nối..."
                  : "Connecting..."}
            </div>
          )}
          {/* Lang toggle — simple click to switch */}
          <button
            onClick={() => setLang(lang === "vi" ? "en" : "vi")}
            aria-label={lang === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "0 10px",
              height: 32,
              color: "var(--text-primary)",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: sans,
              letterSpacing: "0.03em",
            }}
          >
            {lang === "vi" ? "VN" : "EN"}
          </button>
          {/* Divider */}
          <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 2px" }} />
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 6,
              width: 32,
              height: 32,
              color: "var(--text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowNotif(!showNotif)}
              aria-label={t.notifications}
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: 6,
                width: 32,
                height: 32,
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: 14,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bell size={14} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    background: "#EF4444",
                    color: "#fff",
                    borderRadius: "50%",
                    width: 16,
                    height: 16,
                    fontSize: 10,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotif && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 6,
                  width: 320,
                  background: "var(--bg-modal)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  boxShadow: "0 20px 40px var(--shadow-color)",
                  zIndex: 200,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--border)",
                    fontSize: 14,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Bell size={13} /> {t.notifications}
                  {unreadCount > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (online) sbMarkAllRead();
                        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                      }}
                      style={{
                        marginLeft: "auto",
                        background: "none",
                        border: "1px solid var(--border)",
                        borderRadius: 3,
                        padding: "2px 8px",
                        fontSize: 11,
                        color: "var(--text-dim)",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {t.markAllRead}
                    </button>
                  )}
                </div>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (online) sbMarkRead(n.id);
                      setNotifications((prev) => prev.map((nn) => (nn.id === n.id ? { ...nn, read: true } : nn)));
                    }}
                    style={{
                      padding: "8px 14px",
                      borderBottom: "1px solid var(--border-a10)",
                      cursor: "pointer",
                      background: n.read ? "transparent" : "var(--border-a20)",
                      display: "flex",
                      gap: 8,
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ marginTop: 2 }}>
                      <NotifIcon type={n.type} />
                    </span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13,
                          color: n.read ? "var(--text-dim)" : "var(--text-primary)",
                          fontWeight: n.read ? 400 : 600,
                        }}
                      >
                        {lang === "vi" ? n.titleVi : n.title}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>
                        {lang === "vi" ? n.timeVi : n.time}
                      </div>
                    </div>
                    {!n.read && (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#3B82F6",
                          marginTop: 4,
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Divider */}
          <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 2px" }} />
          {/* User Menu / Login Button */}
          {isGuest ? (
            <button
              onClick={() => setShowAuthModal(true)}
              style={{
                background: "linear-gradient(135deg, #1D4ED8, #2563EB)",
                border: "none",
                borderRadius: 6,
                padding: "0 14px",
                height: 32,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <LogIn size={12} />
              {lang === "vi" ? "Đăng nhập" : "Sign In"}
            </button>
          ) : (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotif(false);
                }}
                aria-label={lang === "vi" ? "Menu người dùng" : "User menu"}
                style={{
                  background: showUserMenu ? "var(--hover-bg)" : "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "0 10px",
                  height: 32,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  {currentUser.avatar || currentUser.name[0]}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {currentUser.name}
                </div>
                <ChevronDown size={10} color="var(--text-faint)" />
              </button>
              {showUserMenu && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: 6,
                    width: 240,
                    background: "var(--bg-modal)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    boxShadow: "0 20px 40px var(--shadow-color)",
                    zIndex: 200,
                    overflow: "hidden",
                  }}
                >
                  {/* Current user info */}
                  <div
                    style={{
                      padding: "10px 14px",
                      borderBottom: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#fff",
                      }}
                    >
                      {currentUser.avatar || currentUser.name[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                        {currentUser.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{currentUser.email}</div>
                    </div>
                  </div>
                  {/* Logout */}
                  <button
                    onClick={() => {
                      audit.log("USER_LOGOUT", "user", currentUser.id, currentUser.name, currentUser.role, null);
                      logout();
                      setShowUserMenu(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 14px",
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "#EF4444",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#7F1D1D20";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <LogOut size={12} />
                    {lang === "vi" ? "Đăng xuất" : "Sign Out"}
                  </button>
                </div>
              )}
            </div>
          )}
          <div
            style={{
              fontFamily: mono,
              fontSize: 12,
              color: "var(--text-faint)",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontWeight: 500,
              padding: "0 4px",
            }}
          >
            <Clock size={11} />
            {time.toLocaleTimeString("vi-VN")}
          </div>
        </div>
      </div>

      {/* === OFFLINE BANNER === */}
      {connStatus === "offline" && (
        <div
          style={{
            background: "#FEF3C7",
            borderBottom: "1px solid #F59E0B40",
            padding: "6px 20px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            fontWeight: 600,
            color: "#92400E",
          }}
        >
          <WifiOff size={14} />
          <span style={{ flex: 1 }}>
            {lang === "vi"
              ? "Không kết nối được Supabase. Đang hiện dữ liệu demo. Dữ liệu tạo mới sẽ không được lưu."
              : "Cannot connect to Supabase. Showing demo data. New data will not be saved."}
          </span>
          <button
            onClick={() => resetWarmUp()}
            style={{
              background: "#F59E0B",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: "2px 10px",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {lang === "vi" ? "Thử lại" : "Retry"}
          </button>
        </div>
      )}

      {/* === NAV TABS === */}
      <TabNavigation
        tabs={tabs}
        activeTab={tab}
        onTabChange={(id) => {
          setTab(id);
          setSelMetric(null);
          setSelProjMetric(null);
        }}
      />

      {/* Breadcrumb */}
      <div
        style={{
          padding: "4px 20px",
          fontSize: 11,
          color: "var(--text-faint)",
          fontFamily: mono,
          display: "flex",
          alignItems: "center",
          gap: 4,
          borderBottom: "1px solid var(--border-a10)",
        }}
      >
        <span>{project?.name || selProject}</span>
        <ChevronRight size={9} />
        <span style={{ color: "var(--text-dim)" }}>{tabs.find((tb) => tb.id === tab)?.label || tab}</span>
      </div>

      {/* Read-only banner for Viewer */}
      {perm.isReadOnly() && (
        <div
          style={{
            background: "var(--hover-bg)",
            borderBottom: "1px solid var(--text-disabled)",
            padding: "5px 20px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "var(--text-muted)",
            fontWeight: 600,
          }}
        >
          <Eye size={12} color="var(--text-dim)" />
          {t.readOnlyMode}
        </div>
      )}

      {/* === CONTENT === */}
      <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "var(--text-dim)" }}>Loading...</div>}>
        <div
          className="content-pad"
          style={{ padding: "16px 20px", maxWidth: 1400, margin: "0 auto", flex: 1, width: "100%" }}
          onClick={() => {
            if (showNotif) setShowNotif(false);
            if (showUserMenu) setShowUserMenu(false);
          }}
        >
          {/* Loading Skeleton — shown when Supabase is fetching and no data yet */}
          {online && (projLoading || issLoading) && projects.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 8 }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="skeleton skeleton-metric" />
                ))}
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton skeleton-row" />
              ))}
            </div>
          )}

          {/* === ROUTE PAGES (extracted from App.jsx) === */}
          {TAB_PAGES[tab] &&
            (() => {
              const PageComponent = TAB_PAGES[tab];
              return (
                <Suspense fallback={null}>
                  <PageComponent />
                </Suspense>
              );
            })()}
        </div>

        {/* === IMPORT WIZARD MODAL === */}
        {showImport && (
          <ImportWizard
            lang={lang}
            project={project}
            issues={issues}
            initialType={typeof showImport === "string" ? showImport : undefined}
            onImport={(importedItems, importType) => {
              if (importType === "issues") {
                setIssues((prev) => [...importedItems, ...prev]);
                importedItems.forEach((item) => {
                  audit.log("ISSUE_CREATED", "issue", item.id, item.title, null, item.status, { source: "import" });
                });
                notificationEngine.notify(
                  "CRITICAL_ISSUE_CREATED",
                  {
                    title: `Imported ${importedItems.length} issues`,
                    titleVi: `Đã nhập ${importedItems.length} vấn đề`,
                    entityType: "import",
                  },
                  { userId: currentUser?.id },
                );
              }
              setToast({
                type: "success",
                message:
                  lang === "vi"
                    ? `Đã nhập ${importedItems.length} bản ghi`
                    : `Imported ${importedItems.length} records`,
              });
              setTimeout(() => setToast(null), 4000);
            }}
            onClose={() => setShowImport(false)}
          />
        )}

        {/* === AI IMPORT WIZARD === */}
        {showAIImport && (
          <AIImportWizard
            lang={lang}
            project={project}
            onImport={async (rows, importType, sheetName) => {
              // Auto-create project from sheet name if no projects exist
              let targetPid = selProject;
              if (projects.length === 0 || !project) {
                const projId = `PRJ-${Date.now().toString(36).toUpperCase()}`;
                const projName = sheetName.replace(/sheet\d*/gi, "").trim() || "Imported Project";
                const newProj = {
                  id: projId,
                  name: projName,
                  desc: `Imported from ${sheetName}`,
                  descVi: `Import từ ${sheetName}`,
                  phase: "DVT",
                  phaseOwner: currentUser?.name || "",
                  startDate: new Date().toISOString().split("T")[0],
                  targetMP: "",
                  milestones: {
                    CONCEPT: { target: "", actual: "", adjusted: null, status: "PLANNED" },
                    EVT: { target: "", actual: "", adjusted: null, status: "PLANNED" },
                    DVT: { target: "", actual: "", adjusted: null, status: "IN_PROGRESS" },
                    PVT: { target: "", actual: "", adjusted: null, status: "PLANNED" },
                    MP: { target: "", actual: "", adjusted: null, status: "PLANNED" },
                  },
                  gateChecks: { CONCEPT: {}, EVT: {}, DVT: {}, PVT: {}, MP: {} },
                };
                setProjects((prev) => [...prev, newProj]);
                targetPid = projId;
                setSelProject(projId);
              }

              // Convert all imported rows to issues
              const newIssues = rows.map((r, i) => ({
                id: `ISS-${Date.now().toString(36).toUpperCase()}-${i}`,
                pid: targetPid,
                title:
                  r.title ||
                  r.partNumber ||
                  r.orderNumber ||
                  r.woNumber ||
                  Object.values(r).find((v) => typeof v === "string" && v.length > 3) ||
                  `Item ${i + 1}`,
                titleVi: r.titleVi || "",
                desc: r.description || "",
                rootCause: r.rootCause || "Imported from Excel",
                status: r.status || "OPEN",
                sev: r.severity || "MEDIUM",
                src: r.source || "INTERNAL",
                owner: r.owner || r.pilot || r.assignedTo || "",
                phase: r.phase || "DVT",
                created: r.createdDate || r.orderDate || r.testDate || new Date().toISOString().split("T")[0],
                due: r.dueDate || "",
                impacts: [],
                updates: [
                  {
                    date: new Date().toISOString().split("T")[0],
                    author: "AI Import",
                    text: `Imported from "${sheetName}" (${importType})`,
                  },
                ],
              }));
              setIssues((prev) => [...newIssues, ...prev]);
              newIssues.forEach((iss) =>
                audit.log("ISSUE_CREATED", "issue", iss.id, iss.title, null, iss.status, {
                  source: "ai_import",
                  sheet: sheetName,
                  type: importType,
                }),
              );
              setToast({
                type: "success",
                message: `${lang === "vi" ? "Đã import" : "Imported"} ${newIssues.length} ${lang === "vi" ? "mục vào dự án" : "items into project"}`,
              });
              setTimeout(() => setToast(null), 5000);
            }}
            onClose={() => setShowAIImport(false)}
          />
        )}

        {/* === EXPORT MODAL === */}
        {showExport && (
          <ExportModal
            type={showExport}
            lang={lang}
            project={project}
            issues={issues.filter((i) => i.pid === selProject)}
            onClose={() => setShowExport(null)}
            bomParts={allBom.filter((b) => b.projectId === selProject)}
            flightTests={allFlights.filter((ft) => ft.projectId === selProject)}
          />
        )}

        {/* === NOTIFICATION TOAST === */}
        {toast && <NotificationToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* === FAB: Speed Dial === */}
        {showFab && (
          <div
            style={{
              position: "fixed",
              bottom: 28,
              right: 28,
              zIndex: 1000,
              display: "flex",
              flexDirection: "column-reverse",
              alignItems: "flex-end",
              gap: 10,
            }}
          >
            {/* Scroll to top */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label={lang === "vi" ? "Lên đầu trang" : "Scroll to top"}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "var(--bg-card)",
                color: "var(--text-faint)",
                border: "1px solid var(--border)",
                cursor: "pointer",
                boxShadow: "0 2px 8px var(--shadow-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <ArrowUp size={14} />
            </button>
            {/* Main FAB */}
            {perm.canCreateIssue() && (
              <button
                onClick={() => {
                  setTab("tower");
                  setShowCreate(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                title={t.issue.create}
                aria-label={t.issue.create}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "#3B82F6",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(59,130,246,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <Plus size={22} />
              </button>
            )}
            {/* Export mini FAB */}
            <button
              onClick={() => setShowExport("pdf")}
              title={lang === "vi" ? "Export PDF" : "Export PDF"}
              aria-label="Export PDF"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "var(--bg-card)",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
                cursor: "pointer",
                boxShadow: "0 2px 8px var(--shadow-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <Download size={16} />
            </button>
            {/* AI Import mini FAB */}
            {perm.canImport() && (
              <button
                onClick={() => setShowAIImport(true)}
                title="AI Import"
                aria-label="AI Import"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "var(--bg-card)",
                  color: "#7C3AED",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px var(--shadow-color)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <Upload size={16} />
              </button>
            )}
          </div>
        )}
      </Suspense>

      {/* === FOOTER === */}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          padding: "6px 20px",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "var(--text-dim)",
          fontWeight: 500,
          background: "var(--bg-card)",
          marginTop: "auto",
        }}
      >
        <span>RtR Control Tower V1 • Vibecode Kit v5.0 • Real-time Robotics © 2026</span>
        <span>Built for: 50+ users • 4 roles • Bilingual Vi-En • 5-phase lifecycle</span>
      </div>
    </div>
  );
}
