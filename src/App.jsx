import { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from "react";
import {
  LayoutDashboard, AlertTriangle, DoorOpen, Zap, Users, ClipboardCheck,
  Bell, ChevronDown, Globe, Clock, User, Check, X, Plus,
  Circle, CircleDot, CheckCircle2, XCircle, Ban, FileText,
  Flame, ArrowUp, Minus, ChevronRight, ArrowRight,
  Shield, Eye, Wrench, UserCog,
  Plane, Thermometer, Radio, Cog,
  Target, TrendingUp, BarChart3, Activity,
  Calendar, MapPin, GitBranch, Layers,
  CircleAlert, Timer, Milestone, ChevronLeft,
  LogIn, LogOut, RefreshCw, ScrollText, Download, Trash2,
  Package, Truck, Scale,
  Upload, Settings, Mail, FileSpreadsheet,
  Sun, Moon, SearchX, FilterX, Search, WifiOff, Brain,
  Factory, Warehouse, ShoppingCart, DollarSign
} from "lucide-react";
import { useAuth } from "./contexts/AuthContext";
import { usePermission } from "./hooks/usePermission";
import { useAuditLog } from "./contexts/AuditContext";
import LoginScreen from "./components/LoginScreen";
// Note: These are static imports for functions/singletons used synchronously.
// The default component exports are lazy-loaded above.
import { notificationEngine, NotificationToast } from "./components/EmailNotifications";
import { exportIssuesExcel, exportBomExcel, exportFlightTestsExcel } from "./components/ExportEngine";

// Lazy-loaded modules (code-split into separate chunks)
const BomModule = lazy(() => import("./components/BomModule"));
const FlightTestModule = lazy(() => import("./components/FlightTestModule"));
const SupplierModule = lazy(() => import("./components/SupplierModule"));
const DecisionsModule = lazy(() => import("./components/DecisionsModule"));
const ImportWizard = lazy(() => import("./components/ImportWizard"));
const ExportModal = lazy(() => import("./components/ExportEngine"));
const EmailPreferences = lazy(() => import("./components/EmailNotifications"));
const IssueCharts = lazy(() => import("./components/IssueCharts"));
const GateRadar = lazy(() => import("./components/GateRadar"));
const IntelligencePanel = lazy(() => import("./components/IntelligencePanel"));
const OrdersModule = lazy(() => import("./components/OrdersModule"));
const ProductionModule = lazy(() => import("./components/ProductionModule"));
const InventoryModule = lazy(() => import("./components/InventoryModule"));
const FinanceModule = lazy(() => import("./components/FinanceModule"));
const AIImportWizard = lazy(() => import("./components/AIImportWizard"));
const WorkplanDashboard = lazy(() => import("./components/WorkplanDashboard"));
const MyWorkspace = lazy(() => import("./components/MyWorkspace"));
import { useFlightTestData, useDeliveryData, useBomData, useSupplierData } from "./hooks/useV2Data";
import { useOrders, useCustomers } from "./hooks/useOrderData";
import { useProductionOrders } from "./hooks/useProductionData";
import { useInventory, useInventoryTransactions } from "./hooks/useInventoryData";
import { useFinanceSummary, useInvoices, useCostEntries } from "./hooks/useFinanceData";
import { useTeamData } from "./hooks/useTeamData";
import { useSignalHub } from "./intelligence";
import { isSupabaseConnected, getConnectionStatus, onConnectionStatusChange, resetWarmUp, warmUpSupabase } from "./lib/supabase";
import { useProjectsData, useIssuesData, useNotificationsData } from "./hooks/useAppData";
import { LineChart, Line } from "recharts";
import SafeResponsiveContainer from "./components/SafeChart";
import EmptyState, { EMPTY_MESSAGES } from "./components/EmptyState";
import { TabErrorBoundary } from "./components/ErrorBoundary";
import { Badge, Metric, Btn, Section, NotifIcon, RoleIcon } from "./components/ui";
import CreateIssueForm from "./components/CreateIssueForm";
import { PHASES, PHASE_COLORS, STATUS_LIST, STATUS_COLORS, SEV_LIST, SEV_COLORS, SRC_LIST, SRC_COLORS, LANG, mono, sans } from "./constants";

const normalizeVN = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

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
const GATE_CONFIG = {
  CONCEPT: { conditions: [
    { id: "c1", label: "Product requirements defined", label_vi: "Y\u00EAu c\u1EA7u s\u1EA3n ph\u1EA9m \u0111\u00E3 x\u00E1c \u0111\u1ECBnh", required: true, cat: "general" },
    { id: "c2", label: "Feasibility study completed", label_vi: "Nghi\u00EAn c\u1EE9u kh\u1EA3 thi ho\u00E0n t\u1EA5t", required: true, cat: "general" },
    { id: "c3", label: "Initial BOM estimated", label_vi: "BOM \u01B0\u1EDBc l\u01B0\u1EE3ng ban \u0111\u1EA7u", required: false, cat: "general" },
  ]},
  EVT: { conditions: [
    { id: "e1", label: "Schematic review passed", label_vi: "Review s\u01A1 \u0111\u1ED3 m\u1EA1ch \u0111\u1EA1t", required: true, cat: "design" },
    { id: "e2", label: "PCB layout DRC clean", label_vi: "PCB layout DRC s\u1EA1ch", required: true, cat: "design" },
    { id: "e3", label: "BOM finalized & sourced", label_vi: "BOM \u0111\u00E3 ch\u1ED1t & t\u00ECm ngu\u1ED3n", required: true, cat: "supply" },
    { id: "e4", label: "First power-on successful", label_vi: "B\u1EADt ngu\u1ED3n l\u1EA7n \u0111\u1EA7u OK", required: true, cat: "test" },
    { id: "e5", label: "Basic flight test passed", label_vi: "Bay test c\u01A1 b\u1EA3n \u0111\u1EA1t", required: false, cat: "test" },
  ]},
  DVT: { conditions: [
    { id: "d1", label: "All EVT issues closed", label_vi: "M\u1ECDi v\u1EA5n \u0111\u1EC1 EVT \u0111\u00E3 \u0111\u00F3ng", required: true, cat: "prerequisite" },
    { id: "d2", label: "Flight endurance validated", label_vi: "Th\u1EDDi gian bay x\u00E1c nh\u1EADn", required: true, cat: "flight_test" },
    { id: "d3", label: "Stability test passed", label_vi: "Test \u1ED5n \u0111\u1ECBnh \u0111\u1EA1t", required: true, cat: "flight_test" },
    { id: "d4", label: "Thermal test passed", label_vi: "Test nhi\u1EC7t \u0111\u1EA1t", required: true, cat: "env_test" },
    { id: "d5", label: "Humidity test passed", label_vi: "Test \u1EA9m \u0111\u1EA1t", required: true, cat: "env_test" },
    { id: "d6", label: "Dust ingress test passed", label_vi: "Test b\u1EE5i \u0111\u1EA1t", required: true, cat: "env_test" },
    { id: "d7", label: "EMC pre-scan passed", label_vi: "EMC pre-scan \u0111\u1EA1t", required: true, cat: "emc_test" },
    { id: "d8", label: "EMI certification submitted", label_vi: "\u0110\u00E3 n\u1ED9p ch\u1EE9ng nh\u1EADn EMI", required: true, cat: "emc_test" },
    { id: "d9", label: "Drop test passed", label_vi: "Test r\u01A1i \u0111\u1EA1t", required: true, cat: "mech_test" },
    { id: "d10", label: "Vibration test passed", label_vi: "Test rung \u0111\u1EA1t", required: true, cat: "mech_test" },
    { id: "d11", label: "Design freeze approved", label_vi: "\u0110\u00E3 ph\u00EA duy\u1EC7t \u0111\u00F3ng b\u0103ng thi\u1EBFt k\u1EBF", required: true, cat: "prerequisite" },
  ]},
  PVT: { conditions: [
    { id: "p1", label: "All DVT issues closed", label_vi: "M\u1ECDi v\u1EA5n \u0111\u1EC1 DVT \u0111\u00E3 \u0111\u00F3ng", required: true, cat: "prerequisite" },
    { id: "p2", label: "Production line validated", label_vi: "D\u00E2y chuy\u1EC1n s\u1EA3n xu\u1EA5t \u0111\u00E3 x\u00E1c nh\u1EADn", required: true, cat: "production" },
    { id: "p3", label: "QC process documented", label_vi: "Quy tr\u00ECnh QC \u0111\u00E3 t\u00E0i li\u1EC7u h\u00F3a", required: true, cat: "production" },
    { id: "p4", label: "Yield > 95%", label_vi: "Yield > 95%", required: true, cat: "production" },
    { id: "p5", label: "Regulatory certification", label_vi: "Ch\u1EE9ng nh\u1EADn ph\u00E1p quy", required: true, cat: "compliance" },
  ]},
  MP: { conditions: [
    { id: "m1", label: "All PVT issues closed", label_vi: "M\u1ECDi v\u1EA5n \u0111\u1EC1 PVT \u0111\u00E3 \u0111\u00F3ng", required: true, cat: "prerequisite" },
    { id: "m2", label: "Mass production BOM locked", label_vi: "BOM s\u1EA3n xu\u1EA5t h\u00E0ng lo\u1EA1t \u0111\u00E3 kh\u00F3a", required: true, cat: "production" },
    { id: "m3", label: "Supply chain confirmed", label_vi: "Chu\u1ED7i cung \u1EE9ng \u0111\u00E3 x\u00E1c nh\u1EADn", required: true, cat: "supply" },
  ]},
};

const DVT_CATEGORIES = {
  flight_test: { label: "Flight Test", label_vi: "Bay Th\u1EED", Icon: Plane, color: "#3B82F6" },
  env_test: { label: "Environmental", label_vi: "M\u00F4i Tr\u01B0\u1EDDng", Icon: Thermometer, color: "#10B981" },
  emc_test: { label: "EMC/EMI", label_vi: "EMC/EMI", Icon: Radio, color: "#F59E0B" },
  mech_test: { label: "Mechanical", label_vi: "C\u01A1 Kh\u00ED", Icon: Cog, color: "#8B5CF6" },
};

// ===================================================================
// REUSABLE COMPONENTS — Extracted to components/ui.jsx
// Badge, Metric, Btn, Section, NotifIcon, RoleIcon imported at top
// ===================================================================

// ===================================================================
// GATE ITEM
// ===================================================================
function GateItem({ cond, lang, t, checked, onClick, disabled }) {
  return (
    <div onClick={disabled ? undefined : onClick}
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 4, background: checked ? "#10B98108" : "#1E2A3A08", cursor: disabled ? "default" : "pointer", border: `1px solid ${checked ? "#10B98120" : "transparent"}`, marginBottom: 3 }}>
      <div style={{ width: 20, height: 20, borderRadius: 3, border: `2px solid ${checked ? "#10B981" : "var(--text-faint)"}`, background: checked ? "#10B981" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, minWidth: 36, minHeight: 36, padding: 8, boxSizing: "content-box", cursor: disabled ? "default" : "pointer" }}>
        {checked && <Check size={9} color="#000" strokeWidth={3} />}
      </div>
      <span style={{ fontSize: 13, color: checked ? "var(--text-dim)" : "var(--text-secondary)", textDecoration: checked ? "line-through" : "none", flex: 1 }}>
        {lang === "vi" ? cond.label_vi : cond.label}
      </span>
      {cond.required && <span style={{ fontSize: 10, color: "#EF4444", fontWeight: 700, letterSpacing: "0.05em" }}>{t.gate.required}</span>}
    </div>
  );
}

// CREATE ISSUE FORM — Extracted to components/CreateIssueForm.jsx (imported at top)

// ===================================================================
// MAIN APP
// ===================================================================
export default function App() {
  const { user: currentUser, isAuthenticated, isGuest, isLoading, logout, login, register } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const perm = usePermission();
  const audit = useAuditLog();
  const [lang, setLang] = useState(() => localStorage.getItem('rtr-lang') || "vi");
  const [tab, setTab] = useState(() => localStorage.getItem('rtr-tab') || "tower");
  const [towerView, setTowerView] = useState("workspace"); // workspace | dashboard
  const [selProject, setSelProject] = useState(() => localStorage.getItem('rtr-project') || "PRJ-001");
  const [selIssue, setSelIssue] = useState(() => { try { const id = sessionStorage.getItem('rtr-selIssue'); return id ? { id } : null; } catch { return null; } });
  const [filters, setFilters] = useState(() => { try { return JSON.parse(sessionStorage.getItem('rtr-filters')) || { status: "ALL", sev: "ALL", src: "ALL" }; } catch { return { status: "ALL", sev: "ALL", src: "ALL" }; } });
  const [issueSearch, setIssueSearch] = useState(() => sessionStorage.getItem('rtr-issueSearch') || "");
  const [issueSort, setIssueSort] = useState({ col: null, dir: "desc" });

  // ── Connection status ──
  const [connStatus, setConnStatus] = useState(getConnectionStatus);
  useEffect(() => {
    return onConnectionStatusChange(setConnStatus);
  }, []);
  // Auto-hide "online" indicator after 3s
  const [showOnline, setShowOnline] = useState(false);
  useEffect(() => {
    if (connStatus === 'online') {
      setShowOnline(true);
      const timer = setTimeout(() => setShowOnline(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [connStatus]);

  // Supabase hooks (no-op when offline)
  const {
    projects: sbProjects, gateConfig: sbGateConfig, loading: projLoading,
    refetch: refetchProjects, setProjects: setSbProjects, toggleGate: sbToggleGate,
  } = useProjectsData();
  const {
    issues: sbIssues, loading: issLoading,
    refetch: refetchIssues, setIssues: setSbIssues,
    createIssue: sbCreateIssue, updateStatus: sbUpdateStatus,
  } = useIssuesData();
  const {
    notifications: sbNotifications, loading: notifLoading,
    setNotifications: setSbNotifications, markRead: sbMarkRead, markAllAsRead: sbMarkAllRead,
  } = useNotificationsData(currentUser?.id);

  // Decide data source: Supabase when connected & has data, else static mock
  const online = connStatus === 'online';
  // Start empty — no mock data. Use AI Import or Supabase for real data.
  const [offlineProjects, setOfflineProjects] = useState([]);
  const [offlineIssues, setOfflineIssues] = useState([]);
  const [offlineNotifications, setOfflineNotifications] = useState([]);

  const projects = online && sbProjects.length > 0 ? sbProjects : offlineProjects;
  const setProjects = online && sbProjects.length > 0 ? setSbProjects : setOfflineProjects;
  const issues = online && sbIssues.length > 0 ? sbIssues : offlineIssues;
  const setIssues = online && sbIssues.length > 0 ? setSbIssues : setOfflineIssues;
  const notifications = online && sbNotifications.length > 0 ? sbNotifications : offlineNotifications;
  const setNotifications = online && sbNotifications.length > 0 ? setSbNotifications : setOfflineNotifications;

  // Dynamic gate config: from Supabase or static constant
  const activeGateConfig = online && sbGateConfig ? sbGateConfig : GATE_CONFIG;

  const [showNotif, setShowNotif] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [auditFilter, setAuditFilter] = useState({ action: "ALL", user: "ALL" });
  const [bomSubTab, setBomSubTab] = useState(() => sessionStorage.getItem('rtr-bomSubTab') || "tree");
  const [testSubTab, setTestSubTab] = useState(() => sessionStorage.getItem('rtr-testSubTab') || "flights");
  const [time, setTime] = useState(new Date());
  const [showImport, setShowImport] = useState(false);
  const [showAIImport, setShowAIImport] = useState(false);
  const [showExport, setShowExport] = useState(null);
  const [toast, setToast] = useState(null);
  const [selMetric, setSelMetric] = useState(null);
  const [selProjMetric, setSelProjMetric] = useState(null); // { projId, type: "open"|"critical"|"gate"|"cascade" }
  const [issueSubTab, setIssueSubTab] = useState(() => sessionStorage.getItem('rtr-issueSubTab') || "list");
  const [theme, setTheme] = useState(() => localStorage.getItem('rtr-theme') || 'dark');
  const [showFab, setShowFab] = useState(false);
  const headerActionsRef = useRef(null);

  const t = LANG[lang];
  const project = projects.find(p => p.id === selProject);
  const unreadCount = notifications.filter(n => !n.read).length;

  // --- V2 Data hooks for Intelligence (all projects, not filtered) ---
  const { data: allFlights } = useFlightTestData(null);
  const { data: allDeliveries } = useDeliveryData(null);
  const { data: allBom } = useBomData(null);
  const { data: allSuppliers } = useSupplierData();

  // --- Team Data (live Supabase with TEAM fallback) ---
  const { data: sbTeam } = useTeamData();
  const teamMembers = online && sbTeam.length > 0 ? sbTeam : []; // No mock team data

  // --- Business Operations Data ---
  const { data: ordersList, loading: ordersLoading } = useOrders(selProject);
  const { data: customersList } = useCustomers();
  const { data: productionOrdersList, loading: productionLoading } = useProductionOrders(selProject);
  const { data: inventoryList, loading: inventoryLoading } = useInventory();
  const { data: inventoryTxns } = useInventoryTransactions(null);
  const { data: financeSummaryList, loading: financeLoading } = useFinanceSummary();
  const { data: invoicesList } = useInvoices();

  // --- SignalHub Intelligence ---
  const intel = useSignalHub(issues, projects, allFlights, allDeliveries, allBom, ordersList, productionOrdersList, inventoryList);
  const { data: costEntriesList } = useCostEntries(selProject);

  useEffect(() => { const i = setInterval(() => setTime(new Date()), 60000); return () => clearInterval(i); }, []);
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('rtr-theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('rtr-lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('rtr-tab', tab); }, [tab]);
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
  useEffect(() => { localStorage.setItem('rtr-project', selProject); }, [selProject]);
  // Validate persisted project exists
  useEffect(() => {
    if (projects.length > 0 && !projects.find(p => p.id === selProject)) setSelProject(projects[0].id);
  }, [projects]);
  useEffect(() => { sessionStorage.setItem('rtr-bomSubTab', bomSubTab); }, [bomSubTab]);
  useEffect(() => { sessionStorage.setItem('rtr-testSubTab', testSubTab); }, [testSubTab]);
  useEffect(() => { sessionStorage.setItem('rtr-issueSubTab', issueSubTab); }, [issueSubTab]);
  useEffect(() => { sessionStorage.setItem('rtr-filters', JSON.stringify(filters)); }, [filters]);
  useEffect(() => { sessionStorage.setItem('rtr-issueSearch', issueSearch); }, [issueSearch]);
  useEffect(() => { sessionStorage.setItem('rtr-selIssue', selIssue?.id || ''); }, [selIssue]);
  // Resolve stored issue ID to full object once data loads
  useEffect(() => {
    if (selIssue && selIssue.id && !selIssue.title && issues.length > 0) {
      const found = issues.find(i => i.id === selIssue.id);
      if (found) setSelIssue(found);
      else setSelIssue(null);
    }
  }, [issues]);

  // --- Intelligence event → toast notifications ---
  useEffect(() => {
    const latestEvent = intel.events[intel.events.length - 1];
    if (!latestEvent) return;
    if (latestEvent.type === 'convergence_detected') {
      const dims = Object.entries(latestEvent.alert.dimensionValues).map(([k, v]) => `${v}`).join('/');
      setToast({ type: "warning", message: `${t.intel?.convergenceDetected || "Convergence"}: ${latestEvent.alert.signalTypes.length} ${t.intel?.signalTypes || "types"} @ ${dims}` });
      setTimeout(() => setToast(null), 5000);
    } else if (latestEvent.type === 'anomaly_detected') {
      setToast({ type: "info", message: `${t.intel?.anomalyDetected || "Anomaly"}: ${latestEvent.anomaly.message}` });
      setTimeout(() => setToast(null), 5000);
    } else if (latestEvent.type === 'index_updated') {
      const crit = latestEvent.scores.find(s => s.level === 'critical');
      if (crit) {
        setToast({ type: "error", message: `${t.intel?.healthCritical || "Health Critical"}: ${crit.entityId} ${Math.round(crit.score)}/100` });
        setTimeout(() => setToast(null), 5000);
      }
    }
  }, [intel.events.length]);

  // --- Escape key handler ---
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
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
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showImport, showExport, selIssue, showCreate, showUserMenu, showNotif, selMetric, selProjMetric]);

  // --- Filtered issues ---
  const filteredIssues = useMemo(() => {
    let f = issues.filter(i => i.pid === selProject);
    if (filters.status !== "ALL") f = f.filter(i => i.status === filters.status);
    if (filters.sev !== "ALL") f = f.filter(i => i.sev === filters.sev);
    if (filters.src !== "ALL") f = f.filter(i => i.src === filters.src);
    if (issueSearch.trim()) {
      const s = normalizeVN(issueSearch.trim());
      f = f.filter(i =>
        normalizeVN(i.id).includes(s) ||
        normalizeVN(i.title).includes(s) ||
        normalizeVN(i.titleVi || "").includes(s) ||
        normalizeVN(i.owner || "").includes(s) ||
        normalizeVN(i.rootCause || "").includes(s)
      );
    }
    if (issueSort.col) {
      const SEV_ORDER = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      f.sort((a, b) => {
        let va, vb;
        if (issueSort.col === "sev") { va = SEV_ORDER[a.sev] || 0; vb = SEV_ORDER[b.sev] || 0; }
        else if (issueSort.col === "due") { va = a.due || "9999"; vb = b.due || "9999"; }
        else if (issueSort.col === "created") { va = a.created || ""; vb = b.created || ""; }
        else if (issueSort.col === "owner") { va = (a.owner || "").toLowerCase(); vb = (b.owner || "").toLowerCase(); }
        else if (issueSort.col === "status") { va = a.status; vb = b.status; }
        else { va = a[issueSort.col] || ""; vb = b[issueSort.col] || ""; }
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return issueSort.dir === "asc" ? cmp : -cmp;
      });
    }
    return f;
  }, [issues, selProject, filters, issueSearch, issueSort]);

  // --- Sparkline data: 8-week history computed from real issues ---
  // Must be before early returns to respect Rules of Hooks
  const sparklines = useMemo(() => {
    const now = new Date();
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (7 - i) * 7);
      return d.toISOString().split("T")[0];
    });
    const issuesByWeek = (filterFn) => weeks.map((weekStart, i) => {
      const weekEnd = i < 7 ? weeks[i + 1] : now.toISOString().split("T")[0];
      return issues.filter(iss => {
        const created = iss.created || "";
        return created <= weekEnd && filterFn(iss, created, weekStart);
      }).length;
    });
    return {
      open: issuesByWeek((iss) => iss.status !== "CLOSED"),
      critical: issuesByWeek((iss) => iss.sev === "CRITICAL" && iss.status !== "CLOSED"),
      blocked: issuesByWeek((iss) => iss.status === "BLOCKED"),
      cascade: issuesByWeek((iss) => iss.status !== "CLOSED" && iss.impacts?.length > 0),
      closure: weeks.map((_, i) => {
        const weekEnd = i < 7 ? weeks[i + 1] : now.toISOString().split("T")[0];
        const total = issues.filter(iss => (iss.created || "") <= weekEnd).length;
        const closed = issues.filter(iss => (iss.created || "") <= weekEnd && iss.status === "CLOSED").length;
        return total > 0 ? Math.round(closed / total * 100) : 0;
      }),
      projects: weeks.map(() => projects.length),
    };
  }, [issues, projects.length]);

  // --- Computed metrics (must be before early returns to respect Rules of Hooks) ---
  const allOpen = useMemo(() => issues.filter(i => i.status !== "CLOSED"), [issues]);
  const allCrit = useMemo(() => issues.filter(i => i.sev === "CRITICAL" && i.status !== "CLOSED"), [issues]);
  const allBlocked = useMemo(() => issues.filter(i => i.status === "BLOCKED"), [issues]);
  const cascadeIssues = useMemo(() => issues.filter(i => i.status !== "CLOSED" && i.impacts?.length > 0), [issues]);
  const draftIssues = useMemo(() => issues.filter(i => i.pid === selProject && i.status === "DRAFT"), [issues, selProject]);

  // Auth guard — loading spinner
  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-main)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <RefreshCw size={24} color="#3B82F6" style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
      </div>
    );
  }

  // Auth modal — shown when guest clicks login
  if (showAuthModal) {
    return <LoginScreen onLogin={(user, selectedLang) => { setLang(selectedLang); audit.log("USER_LOGIN", "user", user.id, user.name, null, user.role, { _asUser: user }); setShowAuthModal(false); }} initialLang={lang} />;
  }

  // --- Gate helpers ---
  const getGateProgress = (proj, phase) => {
    const conds = activeGateConfig[phase]?.conditions || [];
    const checks = proj.gateChecks[phase] || {};
    const total = conds.length;
    const passed = conds.filter(c => checks[c.id]).length;
    const reqTotal = conds.filter(c => c.required).length;
    const reqPassed = conds.filter(c => c.required && checks[c.id]).length;
    return { total, passed, reqTotal, reqPassed, pct: total ? Math.round(passed / total * 100) : 0, canPass: reqPassed === reqTotal };
  };

  const toggleGate = (phase, condId) => {
    const proj = projects.find(p => p.id === selProject);
    const oldVal = proj?.gateChecks[phase]?.[condId] ? "true" : "false";
    const newVal = oldVal === "true" ? "false" : "true";
    const cond = activeGateConfig[phase]?.conditions.find(c => c.id === condId);
    // Supabase: toggle gate via service
    if (online) {
      sbToggleGate(condId, newVal === "true", currentUser?.id);
    }
    setProjects(prev => prev.map(p => {
      if (p.id !== selProject) return p;
      const gc = { ...p.gateChecks };
      gc[phase] = { ...gc[phase], [condId]: !gc[phase]?.[condId] };
      return { ...p, gateChecks: gc };
    }));
    audit.log("GATE_CHECK_TOGGLED", "gate", `${selProject} ${phase}`, cond ? (lang === "vi" ? cond.label_vi : cond.label) : condId, oldVal, newVal);
    intel.ingestGateToggle(selProject, phase, condId, newVal === "true");
    const condLabel = cond ? (lang === "vi" ? cond.label_vi : cond.label) : condId;
    setToast({ type: "success", message: `${condLabel} → ${newVal === "true" ? "✓" : "✗"}` }); setTimeout(() => setToast(null), 2000);
  };

  // --- Issue actions ---
  const updateIssueStatus = (issueId, newStatus) => {
    const issue = issues.find(i => i.id === issueId);
    const oldStatus = issue?.status;
    // Optimistic local update
    setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: newStatus } : i));
    if (selIssue?.id === issueId) setSelIssue(prev => ({ ...prev, status: newStatus }));
    // Persist to Supabase
    if (online) sbUpdateStatus(issueId, newStatus);
    const action = newStatus === "CLOSED" ? "ISSUE_CLOSED" : oldStatus === "DRAFT" && newStatus === "OPEN" ? "ISSUE_REVIEWED" : "ISSUE_STATUS_CHANGED";
    audit.log(action, "issue", issueId, issue?.title || issueId, oldStatus, newStatus);
    setToast({ type: "success", message: `${issueId} → ${t.status[newStatus]}` });
    setTimeout(() => setToast(null), 3000);
    // Ingest to intelligence
    const updatedIssue = { ...issue, status: newStatus };
    intel.ingestIssue(updatedIssue, newStatus === "CLOSED" ? 'closed' : 'updated');
  };

  // --- Cascade calculation ---
  const getCascade = (proj) => {
    const pIssues = issues.filter(i => i.pid === proj.id && i.status !== "CLOSED");
    const cascades = [];
    pIssues.forEach(issue => {
      issue.impacts.forEach(imp => {
        const phaseIdx = PHASES.indexOf(imp.phase);
        const chain = [{ phase: imp.phase, days: imp.days, desc: lang === "vi" ? imp.descVi : imp.desc }];
        for (let i = phaseIdx + 1; i < PHASES.length; i++) {
          chain.push({ phase: PHASES[i], days: imp.days, desc: `${t.cascade.autoShift} +${Math.ceil(imp.days / 7)} ${t.cascade.weeks}` });
        }
        cascades.push({ issue, chain });
      });
    });
    return cascades;
  };

  // --- TABS CONFIG ---
  const tabs = [
    { id: "tower", label: t.tabs.tower, Icon: LayoutDashboard },
    { id: "issues", label: t.tabs.issues, Icon: AlertTriangle, badge: allOpen.filter(i => i.pid === selProject).length },
    { id: "gates", label: t.tabs.gates, Icon: DoorOpen },
    { id: "impact", label: t.tabs.impact, Icon: Zap, badge: cascadeIssues.filter(i => i.pid === selProject).length },
    { id: "bom", label: t.tabs.bom, Icon: Package },
    { id: "testing", label: t.tabs.testing, Icon: Plane },
    { id: "team", label: t.tabs.team, Icon: Users },
    ...(perm.canViewReviewQueue() ? [{ id: "review", label: t.tabs.review, Icon: ClipboardCheck, badge: draftIssues.length }] : []),
    ...(currentUser?.role === "admin" ? [{ id: "audit", label: t.tabs.audit, Icon: ScrollText, badge: audit.logs.length > 0 ? audit.logs.length : undefined }] : []),
    { id: "orders", label: t.tabs.orders, Icon: ShoppingCart },
    { id: "production", label: t.tabs.production, Icon: Factory },
    { id: "inventory", label: t.tabs.inventory, Icon: Warehouse },
    ...(["admin", "pm"].includes(currentUser?.role) ? [{ id: "finance", label: t.tabs.finance, Icon: DollarSign }] : []),
    { id: "intelligence", label: t.tabs.intelligence, Icon: Brain, badge: intel.convergences.length > 0 ? intel.convergences.length : undefined },
    { id: "settings", label: t.tabs.settings, Icon: Settings },
  ];

  // --- Role icon: imported from components/ui.jsx ---

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)", color: "var(--text-primary)", fontFamily: sans, fontSize: 14, display: "flex", flexDirection: "column" }}>

      {/* === HEADER === */}
      <div style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52, position: "sticky", top: 0, zIndex: 100 }}>
        {/* Left: App branding + Project selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ marginRight: 4, flexShrink: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.3, whiteSpace: "nowrap" }}>{t.appName}</div>
            <div style={{ fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{t.appSub}</div>
          </div>
          {/* Offline indicator */}
          {!online && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 10px", height: 32, background: "#F59E0B15", border: "1px solid #F59E0B30", borderRadius: 6, whiteSpace: "nowrap", flexShrink: 0 }}>
              <WifiOff size={12} color="#F59E0B" />
              <span style={{ fontSize: 11, color: "#F59E0B", fontWeight: 700 }}>{t.offline}</span>
            </div>
          )}
          {/* Divider */}
          <div style={{ width: 1, height: 24, background: "var(--border)", flexShrink: 0 }} />
          {/* Project selector — separated into General + specific projects */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* General / Portfolio button — visually distinct */}
            {projects.filter(p => p.name.split(" ")[0].toLowerCase() === "general").map(p => (
              <button key={p.id} onClick={() => { setSelProject(p.id); setSelIssue(null); setIssueSearch(""); }}
                aria-label={p.name} aria-pressed={selProject === p.id}
                style={{ background: selProject === p.id ? "var(--hover-bg)" : "transparent", border: `1px solid ${selProject === p.id ? "#3B82F6" : "var(--border)"}`, borderRadius: 6, padding: "0 12px", height: 32, color: selProject === p.id ? "var(--text-primary)" : "var(--text-dim)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <Globe size={12} style={{ opacity: 0.7 }} />
                {lang === "vi" ? "Tổng quát" : "General"}
              </button>
            ))}
            {/* Separator dot between General and project tabs */}
            {projects.some(p => p.name.split(" ")[0].toLowerCase() === "general") && (
              <div style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--text-faint)", opacity: 0.4, margin: "0 2px" }} />
            )}
            {/* Specific project tabs */}
            <div style={{ display: "flex", gap: 2, background: "var(--bg-main)", borderRadius: 8, padding: 2 }}>
              {projects.filter(p => p.name.split(" ")[0].toLowerCase() !== "general").map(p => (
                <button key={p.id} onClick={() => { setSelProject(p.id); setSelIssue(null); setIssueSearch(""); }}
                  aria-label={p.name} aria-pressed={selProject === p.id}
                  style={{ background: selProject === p.id ? "var(--bg-card)" : "transparent", border: "none", borderRadius: 6, padding: "0 12px", height: 28, color: selProject === p.id ? "var(--text-primary)" : "var(--text-dim)", fontSize: 12, fontWeight: selProject === p.id ? 700 : 500, cursor: "pointer", display: "flex", alignItems: "center", transition: "all 0.15s ease", boxShadow: selProject === p.id ? "0 1px 3px var(--shadow-color)" : "none" }}>
                  {p.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Right: Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Connection status indicator */}
          {(connStatus === 'connecting' || showOnline) && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 10px", height: 32, borderRadius: 6, border: "1px solid var(--border)", fontSize: 11, fontWeight: 600, color: connStatus === 'online' ? "#22C55E" : "#F59E0B", background: connStatus === 'online' ? "#22C55E10" : "#F59E0B10" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: connStatus === 'online' ? "#22C55E" : "#F59E0B", animation: connStatus === 'connecting' ? "pulse 1.5s infinite" : "none" }} />
              {connStatus === 'online' ? (lang === "vi" ? "Đã kết nối" : "Connected") : (lang === "vi" ? "Đang kết nối..." : "Connecting...")}
            </div>
          )}
          {/* Lang toggle */}
          <div style={{ display: "flex", background: "var(--bg-main)", borderRadius: 6, padding: 2, alignItems: "center", height: 32 }}>
            <Globe size={11} style={{ margin: "0 6px 0 4px", color: "var(--text-faint)" }} />
            {["vi", "en"].map(l => (
              <button key={l} onClick={() => setLang(l)} aria-label={l === "vi" ? "Tiếng Việt" : "English"} style={{ background: lang === l ? "var(--bg-card)" : "transparent", border: "none", padding: "0 10px", height: 28, color: lang === l ? "var(--text-primary)" : "var(--text-faint)", fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "uppercase", borderRadius: 5, transition: "all 0.15s ease", boxShadow: lang === l ? "0 1px 3px var(--shadow-color)" : "none" }}>{l}</button>
            ))}
          </div>
          {/* Divider */}
          <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 2px" }} />
          {/* Theme toggle */}
          <button onClick={() => setTheme(th => th === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 6, width: 32, height: 32, color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowNotif(!showNotif)} aria-label={t.notifications} style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 6, width: 32, height: 32, color: "var(--text-muted)", cursor: "pointer", fontSize: 14, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bell size={14} />
              {unreadCount > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "#EF4444", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{unreadCount}</span>}
            </button>
            {showNotif && (
              <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 6, width: 320, background: "var(--bg-modal)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "0 20px 40px var(--shadow-color)", zIndex: 200, overflow: "hidden" }}>
                <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                  <Bell size={13} /> {t.notifications}
                  {unreadCount > 0 && <button onClick={(e) => { e.stopPropagation(); if (online) sbMarkAllRead(); setNotifications(prev => prev.map(n => ({ ...n, read: true }))); }}
                    style={{ marginLeft: "auto", background: "none", border: "1px solid var(--border)", borderRadius: 3, padding: "2px 8px", fontSize: 11, color: "var(--text-dim)", cursor: "pointer", fontWeight: 600 }}>
                    {t.markAllRead}
                  </button>}
                </div>
                {notifications.map(n => (
                  <div key={n.id} onClick={() => { if (online) sbMarkRead(n.id); setNotifications(prev => prev.map(nn => nn.id === n.id ? { ...nn, read: true } : nn)); }} style={{ padding: "8px 14px", borderBottom: "1px solid var(--border-a10)", cursor: "pointer", background: n.read ? "transparent" : "var(--border-a20)", display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ marginTop: 2 }}><NotifIcon type={n.type} /></span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: n.read ? "var(--text-dim)" : "var(--text-primary)", fontWeight: n.read ? 400 : 600 }}>{lang === "vi" ? n.titleVi : n.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>{lang === "vi" ? n.timeVi : n.time}</div>
                    </div>
                    {!n.read && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3B82F6", marginTop: 4, flexShrink: 0 }} />}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Divider */}
          <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 2px" }} />
          {/* User Menu / Login Button */}
          {isGuest ? (
            <button onClick={() => setShowAuthModal(true)}
              style={{ background: "linear-gradient(135deg, #1D4ED8, #2563EB)", border: "none", borderRadius: 6, padding: "0 14px", height: 32, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: "#fff", fontSize: 12, fontWeight: 700 }}>
              <LogIn size={12} />
              {lang === "vi" ? "Đăng nhập" : "Sign In"}
            </button>
          ) : (
            <div style={{ position: "relative" }}>
              <button onClick={() => { setShowUserMenu(!showUserMenu); setShowNotif(false); }}
                aria-label={lang === "vi" ? "Menu người dùng" : "User menu"}
                style={{ background: showUserMenu ? "var(--hover-bg)" : "transparent", border: "1px solid var(--border)", borderRadius: 6, padding: "0 10px", height: 32, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg, #3B82F6, #6366F1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{currentUser.avatar || currentUser.name[0]}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1, whiteSpace: "nowrap" }}>{currentUser.name}</div>
                <ChevronDown size={10} color="var(--text-faint)" />
              </button>
              {showUserMenu && (
                <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 6, width: 240, background: "var(--bg-modal)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "0 20px 40px var(--shadow-color)", zIndex: 200, overflow: "hidden" }}>
                  {/* Current user info */}
                  <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #3B82F6, #6366F1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>{currentUser.avatar || currentUser.name[0]}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{currentUser.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{currentUser.email}</div>
                    </div>
                  </div>
                  {/* Logout */}
                  <button onClick={() => { audit.log("USER_LOGOUT", "user", currentUser.id, currentUser.name, currentUser.role, null); logout(); setShowUserMenu(false); }}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", width: "100%", background: "transparent", border: "none", cursor: "pointer", color: "#EF4444", fontSize: 13, fontWeight: 600 }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#7F1D1D20"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                    <LogOut size={12} />
                    {lang === "vi" ? "Đăng xuất" : "Sign Out"}
                  </button>
                </div>
              )}
            </div>
          )}
          <div style={{ fontFamily: mono, fontSize: 12, color: "var(--text-faint)", display: "flex", alignItems: "center", gap: 4, fontWeight: 500, padding: "0 4px" }}>
            <Clock size={11} />
            {time.toLocaleTimeString("vi-VN")}
          </div>
        </div>
      </div>

      {/* === OFFLINE BANNER === */}
      {connStatus === 'offline' && (
        <div style={{ background: "#FEF3C7", borderBottom: "1px solid #F59E0B40", padding: "6px 20px", display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: "#92400E" }}>
          <WifiOff size={14} />
          <span style={{ flex: 1 }}>{lang === "vi" ? "Không kết nối được Supabase. Đang hiện dữ liệu demo. Dữ liệu tạo mới sẽ không được lưu." : "Cannot connect to Supabase. Showing demo data. New data will not be saved."}</span>
          <button onClick={() => resetWarmUp()} style={{ background: "#F59E0B", color: "#fff", border: "none", borderRadius: 4, padding: "2px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{lang === "vi" ? "Thử lại" : "Retry"}</button>
        </div>
      )}

      {/* === NAV TABS === */}
      <div className="tab-bar" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)", padding: "0 20px", display: "flex", gap: 0, overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none", position: "relative", maskImage: "linear-gradient(90deg, transparent 0, #000 20px, #000 calc(100% - 30px), transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent 0, #000 20px, #000 calc(100% - 30px), transparent)" }}>
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => { setTab(tb.id); setSelMetric(null); setSelProjMetric(null); }}
            style={{ background: "none", border: "none", borderBottom: tab === tb.id ? "2px solid #3B82F6" : "2px solid transparent", padding: "9px 14px", color: tab === tb.id ? "var(--text-primary)" : "var(--text-dim)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: sans, flexShrink: 0, whiteSpace: "nowrap" }}>
            <tb.Icon size={13} />
            {tb.label}
            {tb.badge > 0 && <span style={{ background: "#EF4444", color: "#fff", borderRadius: 8, padding: "0 5px", fontSize: 11, fontWeight: 800, minWidth: 14, textAlign: "center" }}>{tb.badge}</span>}
          </button>
        ))}
      </div>

      {/* Breadcrumb */}
      <div style={{ padding: "4px 20px", fontSize: 11, color: "var(--text-faint)", fontFamily: mono, display: "flex", alignItems: "center", gap: 4, borderBottom: "1px solid var(--border-a10)" }}>
        <span>{project?.name || selProject}</span>
        <ChevronRight size={9} />
        <span style={{ color: "var(--text-dim)" }}>{tabs.find(tb => tb.id === tab)?.label || tab}</span>
      </div>

      {/* Read-only banner for Viewer */}
      {perm.isReadOnly() && (
        <div style={{ background: "var(--hover-bg)", borderBottom: "1px solid var(--text-disabled)", padding: "5px 20px", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>
          <Eye size={12} color="var(--text-dim)" />
          {t.readOnlyMode}
        </div>
      )}

      {/* === CONTENT === */}
      <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "var(--text-dim)" }}>Loading...</div>}>
      <div className="content-pad" style={{ padding: "16px 20px", maxWidth: 1400, margin: "0 auto", flex: 1, width: "100%" }} onClick={() => { if (showNotif) setShowNotif(false); if (showUserMenu) setShowUserMenu(false); }}>

        {/* Loading Skeleton — shown when Supabase is fetching and no data yet */}
        {online && (projLoading || issLoading) && sbProjects.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 8 }}>{[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-metric" />)}</div>
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton skeleton-row" />)}
          </div>
        )}

        {/* === EMPTY STATE: No data yet === */}
        {tab === "tower" && !project && projects.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", textAlign: "center" }}>
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
              <button onClick={() => setShowAIImport(true)}
                style={{ background: "linear-gradient(135deg, #8B5CF6, #3B82F6)", border: "none", borderRadius: 8, padding: "12px 32px", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: sans, boxShadow: "0 4px 20px rgba(139,92,246,0.3)" }}>
                <Brain size={20} /> {lang === "vi" ? "AI Import — Tải dữ liệu" : "AI Import — Load Data"}
              </button>
            )}
          </div>
        )}

        {/* === CONTROL TOWER (v2 — Workplan Dashboard) === */}
        {tab === "tower" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Action Buttons */}
            <div ref={headerActionsRef} style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
              {perm.canCreateIssue() && <Btn variant="primary" small onClick={() => setShowCreate(true)}><Plus size={11} /> {t.issue.create}</Btn>}
              {perm.canImport() && (
                <button onClick={() => setShowAIImport(true)}
                  style={{ background: "linear-gradient(135deg, #8B5CF6, #3B82F6)", border: "none", borderRadius: 4, padding: "3px 10px", color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontFamily: sans, letterSpacing: "0.03em" }}>
                  <Brain size={12} /> AI Import
                </button>
              )}
              <Btn small onClick={() => setShowExport("pdf")}><Download size={11} /> {t.importExport?.exportPdf || "Export PDF"}</Btn>
              <Btn small onClick={() => setShowExport("slides")}><FileSpreadsheet size={11} /> {t.importExport?.exportSlides || "Executive Slides"}</Btn>
            </div>
            {/* Create Issue Form (Dashboard) */}
            {showCreate && tab === "tower" && (
              <Section title={<><Plus size={13} /> {t.issue.create}</>}>
                <CreateIssueForm key={"create-tower-" + showCreate} t={t} lang={lang} selProject={selProject} initialStatus={perm.getNewIssueStatus()} teamMembers={teamMembers} onClose={() => setShowCreate(false)}
                  onCreate={async (newIssue) => {
                    if (online) { await sbCreateIssue(newIssue); } else { setIssues(prev => [newIssue, ...prev]); }
                    setShowCreate(false); audit.log("ISSUE_CREATED", "issue", newIssue.id, newIssue.title, null, newIssue.status);
                    intel.ingestIssue(newIssue, 'created');
                    setToast({ type: "success", message: lang === "vi" ? `Đã tạo vấn đề ${newIssue.id}` : `Issue ${newIssue.id} created` }); setTimeout(() => setToast(null), 3000);
                  }} />
              </Section>
            )}
            {/* Tower sub-view toggle */}
            <div style={{ display: "flex", gap: 2, background: "var(--bg-input)", borderRadius: 6, padding: 2, border: "1px solid var(--border)", width: "fit-content" }}>
              {[
                { id: "workspace", label: lang === "vi" ? "Không gian của tôi" : "My Workspace" },
                { id: "dashboard", label: lang === "vi" ? "Tổng quan dự án" : "All Projects" },
              ].map(v => (
                <button key={v.id} onClick={() => setTowerView(v.id)} style={{
                  background: towerView === v.id ? "var(--bg-card)" : "transparent",
                  border: towerView === v.id ? "1px solid var(--border)" : "1px solid transparent",
                  borderRadius: 4, padding: "5px 14px", fontSize: 12, fontWeight: 600,
                  color: towerView === v.id ? "var(--text-primary)" : "var(--text-faint)",
                  cursor: "pointer", fontFamily: sans,
                  boxShadow: towerView === v.id ? "0 1px 2px var(--shadow-color)" : "none",
                }}>
                  {v.label}
                </button>
              ))}
            </div>

            {/* My Workspace (Personal Dashboard) */}
            {towerView === "workspace" && (
              <TabErrorBoundary name="MyWorkspace" lang={lang}>
                <MyWorkspace
                  currentUser={currentUser}
                  issues={issues}
                  projects={projects}
                  teamMembers={teamMembers}
                  lang={lang}
                  onNavigateToProject={(projId) => { setSelProject(projId); setTowerView("dashboard"); }}
                  onNavigateToIssue={(issue) => { setTab("issues"); setSelIssue && setSelIssue(issue); }}
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
                onNavigateIssue={(issue) => { setTab("issues"); setSelIssue && setSelIssue(issue); }}
                onUpdateStatus={(issueId, newStatus) => { updateIssueStatus(issueId, newStatus); }}
                onRefreshIssues={() => { refetchIssues && refetchIssues(); }}
                perm={perm}
                online={online}
              />
            </TabErrorBoundary>
            )}

            {/* OLD METRIC DETAIL PANEL — kept but hidden for reference */}
            {/* AI Risk Assessment — disabled in v2 dashboard */}
            {/* Business Overview — disabled in v2 dashboard */}
            {/* Project Cards — disabled in v2 dashboard */}
            {/* Cascade Alerts Panel — disabled in v2 dashboard */}
          </div>
        )}

        {/* === ISSUES === */}
        {tab === "issues" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Issue Sub-tabs */}
            <div style={{ display: "flex", gap: 4 }}>
              {[{ id: "list", label: lang === "vi" ? "Danh sách" : "List", icon: AlertTriangle },
                { id: "analytics", label: lang === "vi" ? "Phân tích" : "Analytics", icon: BarChart3 }].map(st => (
                <button key={st.id} onClick={() => setIssueSubTab(st.id)}
                  style={{ background: issueSubTab === st.id ? "#1D4ED820" : "transparent", border: `1px solid ${issueSubTab === st.id ? "#1D4ED840" : "var(--border)"}`, borderRadius: 4, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: issueSubTab === st.id ? "#60A5FA" : "var(--text-dim)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                  <st.icon size={12} /> {st.label}
                </button>
              ))}
            </div>

            {issueSubTab === "analytics" && (
              <IssueCharts issues={issues.filter(i => i.pid === selProject)} lang={lang} />
            )}

            {issueSubTab === "list" && <>
            {/* Filters */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", background: "var(--bg-card)", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", flexWrap: "wrap", position: "sticky", top: 48, zIndex: 20 }}>
              {/* Issue search */}
              <div style={{ position: "relative", minWidth: 160 }}>
                <Search size={12} color="var(--text-faint)" style={{ position: "absolute", left: 8, top: 7 }} />
                <input value={issueSearch} onChange={e => setIssueSearch(e.target.value)}
                  placeholder={t.searchIssues}
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 8px 5px 26px", color: "var(--text-primary)", fontSize: 12, width: "100%", outline: "none", fontFamily: "'Outfit', 'Segoe UI', system-ui, sans-serif" }} />
              </div>
              {[{ key: "status", opts: ["ALL", ...STATUS_LIST], colors: { ALL: "var(--text-dim)", ...STATUS_COLORS }, labels: t.status },
                { key: "sev", opts: ["ALL", ...SEV_LIST], colors: { ALL: "var(--text-dim)", ...SEV_COLORS }, labels: t.severity },
                { key: "src", opts: ["ALL", ...SRC_LIST], colors: { ALL: "var(--text-dim)", ...SRC_COLORS }, labels: t.source },
              ].map(f => (
                <div key={f.key} style={{ display: "flex", gap: 2 }}>
                  {f.opts.map(o => (
                    <button key={o} onClick={() => setFilters(prev => ({ ...prev, [f.key]: o }))}
                      style={{ background: filters[f.key] === o ? "var(--hover-bg)" : "transparent", border: `1px solid ${filters[f.key] === o ? f.colors[o] || "#3B82F6" : "transparent"}`, borderRadius: 3, padding: "2px 7px", color: filters[f.key] === o ? "var(--text-primary)" : "var(--text-faint)", fontSize: 11, fontWeight: 600, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {o === "ALL" ? t.issue.all : (f.labels[o] || o.replace("_", " "))}
                    </button>
                  ))}
                </div>
              ))}
              {(filters.status !== "ALL" || filters.sev !== "ALL" || filters.src !== "ALL" || issueSearch) && (
                <button onClick={() => { setFilters({ status: "ALL", sev: "ALL", src: "ALL" }); setIssueSearch(""); }}
                  style={{ background: "#EF444415", border: "1px solid #EF444430", borderRadius: 3, padding: "2px 8px", color: "#EF4444", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                  <FilterX size={11} /> {lang === "vi" ? "Xoá lọc" : "Reset"}
                </button>
              )}
              <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{filteredIssues.length} issues</span>
                {perm.canImport() && <Btn small onClick={() => setShowAIImport(true)}><Brain size={11} /> AI Import</Btn>}
                <Btn small onClick={() => exportIssuesExcel(issues.filter(i => i.pid === selProject), project, lang)}><FileSpreadsheet size={11} /> {t.importExport?.exportExcel || "Export Excel"}</Btn>
                {perm.canCreateIssue() && <Btn variant="primary" small onClick={() => setShowCreate(!showCreate)}><Plus size={11} /> {t.issue.create}</Btn>}
              </div>
            </div>

            {/* Create Form */}
            {showCreate && (
              <Section title={<><Plus size={13} /> {t.issue.create}</>}>
                <CreateIssueForm key={"create-issues-" + showCreate} t={t} lang={lang} selProject={selProject} initialStatus={perm.getNewIssueStatus()} teamMembers={teamMembers} onClose={() => setShowCreate(false)}
                  onCreate={async (newIssue) => {
                    if (online) { await sbCreateIssue(newIssue); } else { setIssues(prev => [newIssue, ...prev]); }
                    setShowCreate(false); audit.log("ISSUE_CREATED", "issue", newIssue.id, newIssue.title, null, newIssue.status);
                    intel.ingestIssue(newIssue, 'created');
                    setToast({ type: "success", message: lang === "vi" ? `Đã tạo vấn đề ${newIssue.id}` : `Issue ${newIssue.id} created` }); setTimeout(() => setToast(null), 3000);
                  }} />
              </Section>
            )}

            {/* Issue Table with inline expand */}
            <div style={{ border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden", background: "var(--bg-card)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "20px 64px 1fr 82px 72px 76px 80px 56px", gap: 6, padding: "7px 12px", background: "var(--bg-modal)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 10 }}>
                {[["", null], [t.issue.id, null], [t.issue.title, null], [t.issue.status, "status"], [t.issue.severity, "sev"], [t.issue.source, null], [t.issue.owner, "owner"], [t.issue.phase, null]].map(([h, sortKey]) => (
                  <span key={h} onClick={sortKey ? () => setIssueSort(prev => ({ col: sortKey, dir: prev.col === sortKey && prev.dir === "desc" ? "asc" : "desc" })) : undefined}
                    style={{ fontSize: 11, color: issueSort.col === sortKey ? "#3B82F6" : "var(--text-faint)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", cursor: sortKey ? "pointer" : "default", userSelect: "none" }}>
                    {h}{issueSort.col === sortKey ? (issueSort.dir === "asc" ? " ↑" : " ↓") : ""}
                  </span>
                ))}
              </div>
              {filteredIssues.map(issue => {
                const isOpen = selIssue?.id === issue.id;
                return (
                <div key={issue.id}>
                  <div tabIndex={0} role="button" onClick={() => setSelIssue(isOpen ? null : issue)}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelIssue(isOpen ? null : issue); } }}
                    style={{ display: "grid", gridTemplateColumns: "20px 64px 1fr 82px 72px 76px 80px 56px", gap: 6, padding: "8px 12px", borderBottom: `1px solid ${isOpen ? "var(--border)" : "var(--border-a10)"}`, borderLeft: `3px solid ${SEV_COLORS[issue.sev] || "transparent"}`, cursor: "pointer", background: isOpen ? "var(--hover-bg)" : "transparent", alignItems: "center", transition: "background 0.1s" }}
                    onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = "var(--bg-input)"; }}
                    onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = "transparent"; }}>
                    <ChevronRight size={12} color="var(--text-faint)" style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
                    <span style={{ fontSize: 12, color: "#3B82F6", fontFamily: mono, fontWeight: 600 }}>{issue.id}</span>
                    <div>
                      <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 600, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: isOpen ? "normal" : "nowrap" }}>{lang === "vi" ? (issue.titleVi || issue.title) : issue.title}</div>
                      {!isOpen && <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(issue.rootCause || "").substring(0, 80)}</div>}
                    </div>
                    <Badge label={t.status[issue.status]} color={STATUS_COLORS[issue.status]} />
                    <Badge label={t.severity[issue.sev]} color={SEV_COLORS[issue.sev]} />
                    <Badge label={t.source[issue.src]} color={SRC_COLORS[issue.src]} />
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{issue.owner}</span>
                    <span style={{ fontSize: 12, color: "var(--text-faint)", fontFamily: mono }}>{issue.phase}</span>
                  </div>
                  {/* Inline expand — detail right below this row */}
                  {isOpen && (
                    <div style={{ padding: "12px 16px 16px 36px", borderBottom: "2px solid var(--border)", background: "var(--bg-input)" }}>
                      {/* Actions */}
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
                        {/* Report Progress — available to everyone including guests */}
                        {issue.status !== "CLOSED" && issue.status !== "DRAFT" && perm.canReportProgress() && <>
                          <Btn variant="success" small onClick={(e) => { e.stopPropagation(); updateIssueStatus(issue.id, "CLOSED"); setToast({ type: "success", message: lang === "vi" ? `${issue.id} → Hoàn thành` : `${issue.id} → Done` }); setTimeout(() => setToast(null), 3000); }}><CheckCircle2 size={11} /> {lang === "vi" ? "Báo Done" : "Report Done"}</Btn>
                        </>}
                        {/* Admin/PM/Engineer actions */}
                        {!perm.isReadOnly() && <>
                          {issue.status === "DRAFT" && perm.canReviewIssue() && <Btn variant="success" small onClick={(e) => { e.stopPropagation(); updateIssueStatus(issue.id, "OPEN"); }}><Check size={11} /> {t.review.approve}</Btn>}
                          {issue.status === "OPEN" && perm.canEditIssue(issue) && <Btn variant="primary" small onClick={(e) => { e.stopPropagation(); updateIssueStatus(issue.id, "IN_PROGRESS"); }}><Activity size={11} /> Start</Btn>}
                          {issue.status !== "CLOSED" && perm.canCloseIssue(issue) && <Btn variant="success" small onClick={(e) => { e.stopPropagation(); updateIssueStatus(issue.id, "CLOSED"); }}><CheckCircle2 size={11} /> {t.close}</Btn>}
                          {perm.canDeleteIssue(issue) && <Btn variant="danger" small onClick={async (e) => { e.stopPropagation(); if (confirm(t.deleteConfirm)) { if (online) { const { remove } = await import("./services/supabaseService"); await remove("issues", issue.id); } setIssues(prev => prev.filter(i => i.id !== issue.id)); setSelIssue(null); audit.log("ISSUE_DELETED", "issue", issue.id, issue.title, issue.status, null); setToast({ type: "success", message: `${issue.id} ${t.deleted}` }); setTimeout(() => setToast(null), 3000); } }}><Trash2 size={11} /></Btn>}
                        </>}
                      </div>
                      {/* Meta */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                        {[[t.issue.owner, issue.owner, User], [t.issue.phase, issue.phase, Layers], [t.issue.dueDate, issue.due, Calendar], ["Created", issue.created, Clock]].map(([k, v, Icon]) => {
                          const fmtDate = (d) => { if (!d) return "—"; const parts = d.split("-"); return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d; };
                          const display = (k === t.issue.dueDate || k === "Created") ? fmtDate(v) : (v || "—");
                          return (
                          <div key={k} style={{ background: "var(--bg-card)", borderRadius: 4, padding: "5px 8px" }}>
                            <div style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 3 }}><Icon size={9} /> {k}</div>
                            <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>{display}</div>
                          </div>
                          );
                        })}
                      </div>
                      {/* Root cause */}
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", marginBottom: 3, fontWeight: 700 }}>{t.issue.rootCause}</div>
                        <div style={{ fontSize: 13, color: "var(--text-secondary)", background: "var(--bg-card)", borderRadius: 4, padding: "6px 10px", borderLeft: "3px solid #F59E0B", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{issue.rootCause || issue.desc || "—"}</div>
                      </div>
                      {/* Description (if different from rootCause) */}
                      {issue.desc && issue.desc !== issue.rootCause && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", marginBottom: 3, fontWeight: 700 }}>{t.issue.description}</div>
                          <div style={{ fontSize: 13, color: "var(--text-secondary)", background: "var(--bg-card)", borderRadius: 4, padding: "6px 10px", borderLeft: "3px solid #3B82F6", whiteSpace: "pre-wrap", lineHeight: 1.6, maxHeight: 200, overflowY: "auto" }}>{issue.desc}</div>
                        </div>
                      )}
                      {/* Impacts */}
                      {issue.impacts?.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 11, color: "#EF4444", textTransform: "uppercase", marginBottom: 3, fontWeight: 700 }}>{t.issue.impactMap}</div>
                          {issue.impacts.map((imp, idx) => (
                            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", marginBottom: 2, background: "#EF444408", borderRadius: 4, borderLeft: "3px solid #EF4444" }}>
                              <Badge label={imp.phase} color={PHASE_COLORS[imp.phase]} />
                              <span style={{ fontSize: 12, color: "#FCA5A5" }}>{lang === "vi" ? imp.descVi : imp.desc}</span>
                              <span style={{ fontSize: 11, color: "#F59E0B", fontFamily: mono, marginLeft: "auto" }}>+{Math.ceil(imp.days / 7)}w</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Activity log */}
                      {issue.updates?.length > 0 && (
                        <div>
                          <div style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", marginBottom: 4, fontWeight: 700 }}>{t.issue.activityLog}</div>
                          <div style={{ borderLeft: "2px solid var(--border)", paddingLeft: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                            {issue.updates.slice(0, 5).map((u, idx) => (
                              <div key={idx} style={{ position: "relative" }}>
                                <div style={{ position: "absolute", left: -17, top: 3, width: 6, height: 6, borderRadius: "50%", background: "#3B82F6", border: "2px solid var(--bg-input)" }} />
                                <div style={{ fontSize: 11, color: "var(--text-faint)" }}><span style={{ fontFamily: mono }}>{u.date}</span> — {u.author}</div>
                                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>{u.text}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                );
              })}
              {filteredIssues.length === 0 && (() => {
                const em = EMPTY_MESSAGES[lang]?.issues || EMPTY_MESSAGES.vi.issues;
                const hasFilters = filters.status !== "ALL" || filters.sev !== "ALL" || filters.src !== "ALL" || issueSearch;
                const totalProjectIssues = issues.filter(i => i.pid === selProject).length;
                return totalProjectIssues === 0 ? (
                  <EmptyState icon={em.icon} title={em.title} description={em.desc}
                    actionLabel={perm.canCreateIssue() ? em.action : undefined}
                    onAction={perm.canCreateIssue() ? () => setShowCreate(true) : undefined} />
                ) : (
                  <div style={{ padding: 40, textAlign: "center" }}>
                    <SearchX size={24} color="var(--text-disabled)" style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 14, color: "var(--text-faint)" }}>{t.issue.noIssues}</div>
                    {hasFilters && (
                      <button onClick={() => { setFilters({ status: "ALL", sev: "ALL", src: "ALL" }); setIssueSearch(""); }}
                        style={{ marginTop: 10, background: "var(--hover-bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 12px", color: "var(--text-muted)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <FilterX size={12} /> {lang === "vi" ? "Xoá bộ lọc" : "Clear filters"}
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Legacy detail panel removed — now inline expand above */}
            </>}
          </div>
        )}

        {/* === GATES === */}
        {tab === "gates" && project && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
              <DoorOpen size={16} />
              {project.name} — {t.gate.conditions}
            </div>

            {/* Gate Radar Chart */}
            <GateRadar gateConfig={activeGateConfig} gateChecks={project.gateChecks} phase={project.phase} lang={lang} />

            {PHASES.filter(ph => ph !== "CONCEPT" || project.phase === "CONCEPT").map(phase => {
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
                <Section key={phase} title={
                  <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                    <span style={{ color: PHASE_COLORS[phase], fontWeight: 800 }}>{phase}</span>
                    <span style={{ fontSize: 12, color: "var(--text-dim)" }}>{gp.passed}/{gp.total} {t.gate.passed}</span>
                    <div style={{ flex: 1, height: 4, background: "var(--hover-bg)", borderRadius: 2, marginLeft: 8 }}>
                      <div style={{ width: `${gp.pct}%`, height: "100%", background: gp.canPass ? "#10B981" : PHASE_COLORS[phase], borderRadius: 2, transition: "width 0.3s" }} />
                    </div>
                    <Badge label={isPast ? "PASSED" : gp.canPass ? t.gate.ready : t.gate.blocked} color={isPast ? "#10B981" : gp.canPass ? "#10B981" : "#EF4444"} glow={isCurrent} icon={isPast ? CheckCircle2 : gp.canPass ? CheckCircle2 : XCircle} />
                  </div>
                } actions={isCurrent && gp.canPass && perm.canTransitionPhase() ? <Btn variant="success" small><ArrowRight size={11} /> {t.gate.transition}</Btn> : null}>
                  {isDVT ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {/* Prerequisite */}
                      <div style={{ gridColumn: "1 / -1" }}>
                        {config.conditions.filter(c => c.cat === "prerequisite").map(cond => (
                          <GateItem key={cond.id} cond={cond} lang={lang} t={t} checked={checks[cond.id]} onClick={() => !isPast && perm.canToggleGate() && toggleGate(phase, cond.id)} disabled={isPast || !perm.canToggleGate()} />
                        ))}
                      </div>
                      {/* 4 Test Categories */}
                      {Object.entries(DVT_CATEGORIES).map(([catKey, cat]) => {
                        const catConds = config.conditions.filter(c => c.cat === catKey);
                        const catPassed = catConds.filter(c => checks[c.id]).length;
                        const CatIcon = cat.Icon;
                        return (
                          <div key={catKey} style={{ background: "var(--bg-modal)", borderRadius: 6, border: "1px solid var(--border)", padding: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                              <CatIcon size={14} color={cat.color} />
                              <span style={{ fontSize: 13, fontWeight: 700, color: cat.color }}>{lang === "vi" ? cat.label_vi : cat.label}</span>
                              <span style={{ fontSize: 12, color: "var(--text-dim)", marginLeft: "auto" }}>{catPassed}/{catConds.length}</span>
                            </div>
                            {catConds.map(cond => (
                              <GateItem key={cond.id} cond={cond} lang={lang} t={t} checked={checks[cond.id]} onClick={() => !isPast && perm.canToggleGate() && toggleGate(phase, cond.id)} disabled={isPast || !perm.canToggleGate()} />
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {config.conditions.map(cond => (
                        <GateItem key={cond.id} cond={cond} lang={lang} t={t} checked={checks[cond.id]} onClick={() => !isPast && perm.canToggleGate() && toggleGate(phase, cond.id)} disabled={isPast || !perm.canToggleGate()} />
                      ))}
                    </div>
                  )}
                </Section>
              );
            })}
          </div>
        )}

        {/* === IMPACT MAP === */}
        {tab === "impact" && project && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
              <Zap size={16} color="#F59E0B" />
              {t.cascade.ripple} — {project.name}
            </div>

            {issues.filter(i => i.pid === selProject && i.status !== "CLOSED" && i.impacts.length > 0).map(issue => (
              <div key={issue.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 14, borderLeft: `4px solid ${SEV_COLORS[issue.sev]}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  <Badge label={issue.id} color="#3B82F6" />
                  <span style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 700 }}>{lang === "vi" ? issue.titleVi : issue.title}</span>
                  <Badge label={t.severity[issue.sev]} color={SEV_COLORS[issue.sev]} />
                  <Badge label={t.status[issue.status]} color={STATUS_COLORS[issue.status]} />
                  <span style={{ fontSize: 12, color: "var(--text-dim)", marginLeft: "auto", display: "flex", alignItems: "center", gap: 3 }}><User size={9} /> {t.issue.owner}: {issue.owner}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <div style={{ background: "var(--bg-input)", borderRadius: 4, padding: "5px 8px", fontSize: 12, color: "var(--text-muted)", border: "1px solid var(--border)", maxWidth: 200, display: "flex", alignItems: "flex-start", gap: 4 }}>
                    <MapPin size={10} style={{ flexShrink: 0, marginTop: 1 }} /> {issue.rootCause}
                  </div>
                  <ArrowRight size={14} color="var(--text-faint)" />
                  {issue.impacts.map((imp, idx) => {
                    const pidx = PHASES.indexOf(imp.phase);
                    const downstream = PHASES.slice(pidx + 1);
                    return (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ background: `${PHASE_COLORS[imp.phase]}12`, border: `1px solid ${PHASE_COLORS[imp.phase]}25`, borderRadius: 4, padding: "5px 8px" }}>
                          <div style={{ fontSize: 11, color: PHASE_COLORS[imp.phase], fontWeight: 700 }}>{imp.phase}</div>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{lang === "vi" ? imp.descVi : imp.desc}</div>
                        </div>
                        {downstream.map(ds => (
                          <span key={ds} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <ArrowRight size={11} color="#EF4444" />
                            <span style={{ background: `${PHASE_COLORS[ds]}10`, border: `1px solid ${PHASE_COLORS[ds]}20`, borderRadius: 3, padding: "2px 6px", fontSize: 11, color: PHASE_COLORS[ds], fontWeight: 600 }}>
                              {ds} {t.cascade.autoShift}
                            </span>
                          </span>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Milestone Risk Summary */}
            <Section title={<><Milestone size={13} /> {t.milestoneRisk}</>}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
                {PHASES.map(phase => {
                  const count = issues.filter(i => i.pid === selProject && i.status !== "CLOSED" && i.impacts.some(imp => imp.phase === phase)).length;
                  return (
                    <div key={phase} style={{ background: "var(--bg-modal)", borderRadius: 6, padding: 12, border: `1px solid ${count > 0 ? PHASE_COLORS[phase] + "40" : "var(--border)"}`, textAlign: "center" }}>
                      <div style={{ fontSize: 12, color: PHASE_COLORS[phase], fontWeight: 700, marginBottom: 3 }}>{phase}</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: count > 0 ? "#EF4444" : "#10B981", fontFamily: mono }}>{count}</div>
                      <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{t.blockingIssues}</div>
                    </div>
                  );
                })}
              </div>
            </Section>
          </div>
        )}

        {/* === TEAM === */}
        {tab === "team" && (
          <Section title={<><Users size={14} /> {t.team.workload}</>}>
            {teamMembers.length === 0 ? (
              <EmptyState icon={(EMPTY_MESSAGES[lang]?.team || { icon: Users, title: lang === "vi" ? "Chưa có dữ liệu đội ngũ" : "No team data", desc: lang === "vi" ? "Kết nối Supabase để xem thành viên dự án" : "Connect to Supabase to view project members" }).icon} title={lang === "vi" ? "Chưa có dữ liệu đội ngũ" : "No team data"} description={lang === "vi" ? "Kết nối Supabase để xem thành viên dự án" : "Connect to Supabase to view project members"} />
            ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
              {teamMembers.map(m => {
                const memberIssues = issues.filter(i => i.owner === m.name && i.status !== "CLOSED");
                const crit = memberIssues.filter(i => i.sev === "CRITICAL").length;
                const blocked = memberIssues.filter(i => i.status === "BLOCKED").length;
                const projectNames = m.projects.map(pid => projects.find(p => p.id === pid)?.name || pid).join(", ");
                return (
                  <div key={m.name} style={{ background: "var(--bg-modal)", borderRadius: 6, padding: "12px 14px", border: `1px solid ${crit > 0 ? "#EF444430" : "var(--border)"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--hover-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--text-muted)" }}>{m.name.split(" ").pop()[0]}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-dim)", display: "flex", alignItems: "center", gap: 3 }}>
                          <RoleIcon role={m.role} />
                          {t.role[m.role]} {projectNames && <>• {projectNames}</>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {crit > 0 && <Badge label={`${crit} CRIT`} color="#EF4444" icon={Flame} />}
                      {blocked > 0 && <Badge label={`${blocked} BLOCK`} color="#DC2626" icon={Ban} />}
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: memberIssues.length > 0 ? "#F59E0B" : "#10B981", fontFamily: mono }}>{memberIssues.length}</div>
                        <div style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase" }}>{t.team.openTasks}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </Section>
        )}

        {/* === REVIEW QUEUE === */}
        {tab === "review" && (
          <Section title={<><ClipboardCheck size={14} /> {t.review.queue} — {project?.name}</>}>
            {draftIssues.length === 0 ? (
              <EmptyState icon={(EMPTY_MESSAGES[lang]?.review || EMPTY_MESSAGES.vi.review).icon} title={(EMPTY_MESSAGES[lang]?.review || EMPTY_MESSAGES.vi.review).title} description={(EMPTY_MESSAGES[lang]?.review || EMPTY_MESSAGES.vi.review).desc} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {draftIssues.map(issue => (
                  <div key={issue.id} style={{ background: "var(--bg-modal)", border: "1px solid var(--border)", borderRadius: 6, padding: 12, borderLeft: "4px solid #6B7280" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <Badge label={issue.id} color="#3B82F6" />
                          <Badge label={t.status.DRAFT} color={STATUS_COLORS.DRAFT} icon={FileText} />
                          <Badge label={t.severity[issue.sev]} color={SEV_COLORS[issue.sev]} />
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{lang === "vi" ? issue.titleVi : issue.title}</div>
                        <div style={{ fontSize: 13, color: "var(--text-dim)", display: "flex", alignItems: "center", gap: 3 }}><GitBranch size={9} /> {t.issue.rootCause}: {issue.rootCause}</div>
                        <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 4, display: "flex", alignItems: "center", gap: 3 }}><User size={9} /> {t.issue.owner}: {issue.owner} • Created: {issue.created}</div>
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <Btn variant="success" small onClick={() => updateIssueStatus(issue.id, "OPEN")}><Check size={11} /> {t.review.approve}</Btn>
                        <Btn variant="danger" small onClick={() => updateIssueStatus(issue.id, "DRAFT")}><X size={11} /> {t.review.reject}</Btn>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* === BOM & SUPPLIERS === */}
        {tab === "bom" && project && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Sub-navigation */}
            <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
              {[
                { id: "tree", label: lang === "vi" ? "Cây BOM" : "BOM Tree", Icon: Package },
                { id: "suppliers", label: lang === "vi" ? "Nhà Cung Cấp" : "Suppliers", Icon: Truck },
              ].map(st => (
                <button key={st.id} onClick={() => setBomSubTab(st.id)}
                  style={{
                    background: bomSubTab === st.id ? "#1D4ED815" : "transparent",
                    border: `1px solid ${bomSubTab === st.id ? "#1D4ED840" : "transparent"}`,
                    borderRadius: 4, padding: "5px 12px", fontSize: 13, fontWeight: 600,
                    color: bomSubTab === st.id ? "#60A5FA" : "var(--text-dim)", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 5, fontFamily: sans,
                  }}>
                  <st.Icon size={12} />
                  {st.label}
                </button>
              ))}
              <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                {perm.canImport() && <Btn small onClick={() => setShowAIImport(true)}><Brain size={11} /> AI Import</Btn>}
                <Btn small onClick={() => exportBomExcel(allBom.filter(b => b.projectId === selProject), allSuppliers, lang)}><FileSpreadsheet size={11} /> {t.importExport?.exportExcel || "Export Excel"}</Btn>
              </div>
            </div>
            {bomSubTab === "tree" && <TabErrorBoundary name="BOM" lang={lang}><BomModule lang={lang} t={t} project={project} perm={perm} /></TabErrorBoundary>}
            {bomSubTab === "suppliers" && <TabErrorBoundary name="Suppliers" lang={lang}><SupplierModule lang={lang} t={t} project={project} perm={perm} /></TabErrorBoundary>}
          </div>
        )}

        {/* === TESTING & DECISIONS === */}
        {tab === "testing" && project && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Sub-navigation */}
            <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
              {[
                { id: "flights", label: lang === "vi" ? "Bay Thử" : "Flight Tests", Icon: Plane },
                { id: "decisions", label: lang === "vi" ? "Quyết Định" : "Decisions", Icon: Scale },
              ].map(st => (
                <button key={st.id} onClick={() => setTestSubTab(st.id)}
                  style={{
                    background: testSubTab === st.id ? "#1D4ED815" : "transparent",
                    border: `1px solid ${testSubTab === st.id ? "#1D4ED840" : "transparent"}`,
                    borderRadius: 4, padding: "5px 12px", fontSize: 13, fontWeight: 600,
                    color: testSubTab === st.id ? "#60A5FA" : "var(--text-dim)", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 5, fontFamily: sans,
                  }}>
                  <st.Icon size={12} />
                  {st.label}
                </button>
              ))}
              <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                {perm.canImport() && <Btn small onClick={() => setShowAIImport(true)}><Brain size={11} /> AI Import</Btn>}
                <Btn small onClick={() => exportFlightTestsExcel(allFlights.filter(ft => ft.projectId === selProject), lang)}><FileSpreadsheet size={11} /> {t.importExport?.exportExcel || "Export Excel"}</Btn>
              </div>
            </div>
            {testSubTab === "flights" && <TabErrorBoundary name="Flight Tests" lang={lang}><FlightTestModule lang={lang} t={t} project={project} issues={issues} perm={perm}
              onViewIssue={(id) => { setTab("issues"); setSelIssue(issues.find(i => i.id === id) || null); }}
              onCreateAutoIssue={(ft) => {
                const sevMap = { FAIL: "CRITICAL", PARTIAL: "HIGH" };
                const issueId = `ISS-${String(issues.length + Math.floor(Math.random() * 100) + 10).padStart(3, "0")}`;
                const anomalyText = ft.anomalies.map(a => `[${a.severity}] ${a.description}`).join("; ");
                const newIssue = {
                  id: issueId, pid: project.id,
                  title: `Flight FLT-${String(ft.testNumber).padStart(3, "0")} ${ft.result}: ${ft.anomalies[0]?.description || ft.testType + " test failed"}`,
                  titleVi: `Bay FLT-${String(ft.testNumber).padStart(3, "0")} ${ft.result}: ${ft.anomalies[0]?.descriptionVi || ft.anomalies[0]?.description || ft.testType + " test failed"}`,
                  desc: `Auto-created from flight test FLT-${String(ft.testNumber).padStart(3, "0")}. Anomalies: ${anomalyText || "None recorded"}`,
                  rootCause: "Pending investigation", status: "DRAFT", sev: sevMap[ft.result] || "HIGH",
                  src: "INTERNAL", owner: ft.pilot, phase: ft.testPhase,
                  created: new Date().toISOString().split("T")[0],
                  due: "", impacts: [],
                  updates: [{ date: new Date().toISOString().split("T")[0], author: "System", text: `Auto-created from flight FLT-${String(ft.testNumber).padStart(3, "0")} (${ft.result})` }],
                };
                ft.autoIssueId = issueId;
                if (online) { sbCreateIssue(newIssue); } else { setIssues(prev => [newIssue, ...prev]); }
                audit.log("ISSUE_CREATED", "issue", issueId, newIssue.title, null, "DRAFT", { source: "flight_test", flightId: ft.id });
              }}
            /></TabErrorBoundary>}
            {testSubTab === "decisions" && <TabErrorBoundary name="Decisions" lang={lang}><DecisionsModule lang={lang} t={t} project={project} issues={issues} perm={perm} onViewIssue={(id) => { setTab("issues"); setSelIssue(issues.find(i => i.id === id) || null); }} /></TabErrorBoundary>}
          </div>
        )}

        {/* === AUDIT LOG === */}
        {tab === "audit" && currentUser?.role === "admin" && (() => {
          const ACTION_TYPES = ["ISSUE_CREATED", "ISSUE_STATUS_CHANGED", "ISSUE_REVIEWED", "ISSUE_CLOSED", "GATE_CHECK_TOGGLED", "USER_LOGIN", "USER_LOGOUT", "USER_ROLE_SWITCHED"];
          const ACTION_COLORS = { ISSUE_CREATED: "#10B981", ISSUE_STATUS_CHANGED: "#3B82F6", ISSUE_REVIEWED: "#8B5CF6", ISSUE_CLOSED: "#6B7280", GATE_CHECK_TOGGLED: "#F59E0B", USER_LOGIN: "#10B981", USER_LOGOUT: "#EF4444", USER_ROLE_SWITCHED: "#06B6D4", ISSUE_UPDATED: "#3B82F6", ISSUE_ASSIGNED: "#F97316", PHASE_TRANSITIONED: "#8B5CF6" };
          const uniqueUsers = [...new Set(audit.logs.map(l => l.userName))];
          let filtered = audit.logs;
          if (auditFilter.action !== "ALL") filtered = filtered.filter(l => l.action === auditFilter.action);
          if (auditFilter.user !== "ALL") filtered = filtered.filter(l => l.userName === auditFilter.user);

          const handleExport = () => {
            const csv = audit.exportCSV();
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `rtr-audit-log-${new Date().toISOString().split("T")[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          };

          return (
            <Section title={<><ScrollText size={14} /> {t.audit.tab} <span style={{ fontSize: 12, color: "var(--text-faint)", fontWeight: 400, marginLeft: 4 }}>{filtered.length} entries</span></>}
              actions={<>
                <Btn small onClick={handleExport}><Download size={11} /> {t.audit.export}</Btn>
                <Btn variant="danger" small onClick={() => { if (confirm(t.audit.confirmClear)) audit.clearLogs(); }}><Trash2 size={11} /> {t.audit.clear}</Btn>
              </>}>
              {/* Filters */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <select value={auditFilter.action} onChange={e => setAuditFilter(f => ({ ...f, action: e.target.value }))}
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 8px", color: "var(--text-primary)", fontSize: 13, outline: "none", fontFamily: sans }}>
                  <option value="ALL">{t.audit.allActions}</option>
                  {ACTION_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select value={auditFilter.user} onChange={e => setAuditFilter(f => ({ ...f, user: e.target.value }))}
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 8px", color: "var(--text-primary)", fontSize: 13, outline: "none", fontFamily: sans }}>
                  <option value="ALL">{t.audit.allUsers}</option>
                  {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              {/* Log entries */}
              {filtered.length === 0 ? (
                <EmptyState icon={(EMPTY_MESSAGES[lang]?.audit || EMPTY_MESSAGES.vi.audit).icon} title={(EMPTY_MESSAGES[lang]?.audit || EMPTY_MESSAGES.vi.audit).title} description={(EMPTY_MESSAGES[lang]?.audit || EMPTY_MESSAGES.vi.audit).desc} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {filtered.slice(0, 100).map(entry => {
                    const ts = new Date(entry.timestamp);
                    const timeStr = ts.toLocaleTimeString(lang === "vi" ? "vi-VN" : "en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                    const dateStr = ts.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US");
                    const color = ACTION_COLORS[entry.action] || "var(--text-dim)";
                    return (
                      <div key={entry.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--border-a10)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ width: 52, flexShrink: 0, textAlign: "right" }}>
                          <div style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: mono, fontWeight: 600 }}>{timeStr}</div>
                          <div style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: mono }}>{dateStr}</div>
                        </div>
                        <div style={{ width: 3, borderRadius: 2, background: color, flexShrink: 0, alignSelf: "stretch" }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{entry.userName}</span>
                            <Badge label={t.role[entry.userRole] || entry.userRole} color={({ admin: "#EF4444", pm: "#3B82F6", engineer: "#F59E0B", viewer: "#6B7280" })[entry.userRole] || "var(--text-dim)"} />
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                            <Badge label={entry.action} color={color} />
                          </div>
                          {entry.entityTitle && (
                            <div style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                              <span style={{ color: "#3B82F6", fontFamily: mono, fontSize: 12, fontWeight: 600 }}>{entry.entityId}</span>
                              {entry.entityTitle}
                            </div>
                          )}
                          {(entry.oldValue || entry.newValue) && (
                            <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2, fontFamily: mono }}>
                              {entry.oldValue && <span style={{ color: "#EF4444" }}>{entry.oldValue}</span>}
                              {entry.oldValue && entry.newValue && <span> → </span>}
                              {entry.newValue && <span style={{ color: "#10B981" }}>{entry.newValue}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>
          );
        })()}

        {/* === ORDERS === */}
        {tab === "orders" && (
          <TabErrorBoundary name="Orders" lang={lang}>
          <OrdersModule
            orders={ordersList}
            customers={customersList}
            loading={ordersLoading}
            lang={lang}
            perm={perm}
          />
          </TabErrorBoundary>
        )}

        {/* === PRODUCTION === */}
        {tab === "production" && (
          <TabErrorBoundary name="Production" lang={lang}>
          <ProductionModule
            productionOrders={productionOrdersList}
            loading={productionLoading}
            lang={lang}
            perm={perm}
          />
          </TabErrorBoundary>
        )}

        {/* === INVENTORY === */}
        {tab === "inventory" && (
          <TabErrorBoundary name="Inventory" lang={lang}>
          <InventoryModule
            inventory={inventoryList}
            transactions={inventoryTxns}
            loading={inventoryLoading}
            lang={lang}
            perm={perm}
          />
          </TabErrorBoundary>
        )}

        {/* === FINANCE === */}
        {tab === "finance" && (
          <TabErrorBoundary name="Finance" lang={lang}>
          <FinanceModule
            financeSummary={financeSummaryList}
            invoices={invoicesList}
            costEntries={costEntriesList}
            loading={financeLoading}
            lang={lang}
          />
          </TabErrorBoundary>
        )}

        {/* === INTELLIGENCE === */}
        {tab === "intelligence" && (
          <TabErrorBoundary name="Intelligence" lang={lang}>
          <IntelligencePanel
            intel={intel}
            projects={projects}
            lang={lang}
            t={t}
            issues={issues}
          />
          </TabErrorBoundary>
        )}

        {/* === SETTINGS === */}
        {tab === "settings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
              <Settings size={16} />
              {t.tabs.settings}
            </div>
            <Section title={<><Mail size={14} /> {t.email?.preferences || "Email Preferences"}</>}>
              <EmailPreferences lang={lang} currentUser={currentUser} />
            </Section>
          </div>
        )}
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
              setIssues(prev => [...importedItems, ...prev]);
              importedItems.forEach(item => {
                audit.log("ISSUE_CREATED", "issue", item.id, item.title, null, item.status, { source: "import" });
              });
              notificationEngine.notify("CRITICAL_ISSUE_CREATED", {
                title: `Imported ${importedItems.length} issues`,
                titleVi: `Đã nhập ${importedItems.length} vấn đề`,
                entityType: "import",
              }, { userId: currentUser?.id });
            }
            setToast({ type: "success", message: lang === "vi" ? `Đã nhập ${importedItems.length} bản ghi` : `Imported ${importedItems.length} records` });
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
                id: projId, name: projName, desc: `Imported from ${sheetName}`, descVi: `Import từ ${sheetName}`,
                phase: "DVT", phaseOwner: currentUser?.name || "", startDate: new Date().toISOString().split("T")[0], targetMP: "",
                milestones: { CONCEPT: { target: "", actual: "", adjusted: null, status: "PLANNED" }, EVT: { target: "", actual: "", adjusted: null, status: "PLANNED" }, DVT: { target: "", actual: "", adjusted: null, status: "IN_PROGRESS" }, PVT: { target: "", actual: "", adjusted: null, status: "PLANNED" }, MP: { target: "", actual: "", adjusted: null, status: "PLANNED" } },
                gateChecks: { CONCEPT: {}, EVT: {}, DVT: {}, PVT: {}, MP: {} },
              };
              setOfflineProjects(prev => [...prev, newProj]);
              targetPid = projId;
              setSelProject(projId);
            }

            // Convert all imported rows to issues
            const newIssues = rows.map((r, i) => ({
              id: `ISS-${Date.now().toString(36).toUpperCase()}-${i}`,
              pid: targetPid,
              title: r.title || r.partNumber || r.orderNumber || r.woNumber || Object.values(r).find(v => typeof v === "string" && v.length > 3) || `Item ${i + 1}`,
              titleVi: r.titleVi || "",
              desc: r.description || "",
              rootCause: r.rootCause || "Imported from Excel",
              status: r.status || "OPEN", sev: r.severity || "MEDIUM",
              src: r.source || "INTERNAL", owner: r.owner || r.pilot || r.assignedTo || "",
              phase: r.phase || "DVT",
              created: r.createdDate || r.orderDate || r.testDate || new Date().toISOString().split("T")[0],
              due: r.dueDate || "", impacts: [], updates: [{ date: new Date().toISOString().split("T")[0], author: "AI Import", text: `Imported from "${sheetName}" (${importType})` }],
            }));
            setIssues(prev => [...newIssues, ...prev]);
            newIssues.forEach(iss => audit.log("ISSUE_CREATED", "issue", iss.id, iss.title, null, iss.status, { source: "ai_import", sheet: sheetName, type: importType }));
            setToast({ type: "success", message: `${lang === "vi" ? "Đã import" : "Imported"} ${newIssues.length} ${lang === "vi" ? "mục vào dự án" : "items into project"}` });
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
          issues={issues.filter(i => i.pid === selProject)}
          onClose={() => setShowExport(null)}
          bomParts={allBom.filter(b => b.projectId === selProject)}
          flightTests={allFlights.filter(ft => ft.projectId === selProject)}
        />
      )}

      {/* === NOTIFICATION TOAST === */}
      {toast && <NotificationToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* === FAB: Speed Dial === */}
      {showFab && (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 1000, display: "flex", flexDirection: "column-reverse", alignItems: "flex-end", gap: 10 }}>
          {/* Scroll to top */}
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label={lang === "vi" ? "Lên đầu trang" : "Scroll to top"}
            style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--bg-card)", color: "var(--text-faint)", border: "1px solid var(--border)", cursor: "pointer", boxShadow: "0 2px 8px var(--shadow-color)", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
            <ArrowUp size={14} />
          </button>
          {/* Main FAB */}
          {perm.canCreateIssue() && (
            <button onClick={() => { setTab("tower"); setShowCreate(true); window.scrollTo({ top: 0, behavior: "smooth" }); }} title={t.issue.create}
              aria-label={t.issue.create}
              style={{ width: 52, height: 52, borderRadius: "50%", background: "#3B82F6", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(59,130,246,0.4)", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.2s, box-shadow 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
              <Plus size={22} />
            </button>
          )}
          {/* Export mini FAB */}
          <button onClick={() => setShowExport("pdf")} title={lang === "vi" ? "Export PDF" : "Export PDF"}
            aria-label="Export PDF"
            style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border)", cursor: "pointer", boxShadow: "0 2px 8px var(--shadow-color)", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
            <Download size={16} />
          </button>
          {/* AI Import mini FAB */}
          {perm.canImport() && (
            <button onClick={() => setShowAIImport(true)} title="AI Import"
              aria-label="AI Import"
              style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--bg-card)", color: "#7C3AED", border: "1px solid var(--border)", cursor: "pointer", boxShadow: "0 2px 8px var(--shadow-color)", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
              <Upload size={16} />
            </button>
          )}
        </div>
      )}

      </Suspense>

      {/* === FOOTER === */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "6px 20px", display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-dim)", fontWeight: 500, background: "var(--bg-card)", marginTop: "auto" }}>
        <span>RtR Control Tower V1 • Vibecode Kit v5.0 • Real-time Robotics © 2026</span>
        <span>Built for: 50+ users • 4 roles • Bilingual Vi-En • 5-phase lifecycle</span>
      </div>
    </div>
  );
}
