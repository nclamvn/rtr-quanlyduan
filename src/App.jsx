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
  LogOut, RefreshCw, ScrollText, Download, Trash2,
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
// eslint-disable-next-line no-unused-vars
import AIRiskPanel from "./components/AIRiskPanel";

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
import { PHASES, PHASE_COLORS, STATUS_LIST, STATUS_COLORS, SEV_LIST, SEV_COLORS, SRC_LIST, SRC_COLORS, mono, sans } from "./constants";

const normalizeVN = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

// ===================================================================
// RtR CONTROL TOWER V1 — Full Interactive Prototype
// Based on Vibecode Kit v5.0 Blueprint
// 3 Core Modules: Dashboard, Issues, Phase & Gates
// All icons: Lucide React
// ===================================================================

// --- i18n ---
const LANG = {
  vi: {
    appName: "RtR Control Tower",
    appSub: "Real-time Robotics • Qu\u1EA3n l\u00FD D\u1EF1 \u00E1n Drone",
    tabs: { tower: "B\u1EA3ng \u0110i\u1EC1u Khi\u1EC3n", issues: "V\u1EA5n \u0110\u1EC1", gates: "C\u1ED5ng Phase", impact: "B\u1EA3n \u0110\u1ED3 \u1EA2nh H\u01B0\u1EDFng", team: "\u0110\u1ED9i Ng\u0169", review: "Duy\u1EC7t", audit: "Nh\u1EADt K\u00FD", bom: "BOM & NCC", testing: "Test & Q\u0110", orders: "\u0110\u01A1n H\u00E0ng", production: "S\u1EA3n Xu\u1EA5t", inventory: "T\u1ED3n Kho", finance: "T\u00E0i Ch\u00EDnh", intelligence: "Tr\u00ED Tu\u1EC7", settings: "C\u00E0i \u0110\u1EB7t" },
    importExport: { import: "Nh\u1EADp", export: "Xu\u1EA5t", exportExcel: "Xu\u1EA5t Excel", exportPdf: "Xu\u1EA5t PDF", exportSlides: "Slide T\u1ED5ng Quan", importData: "Nh\u1EADp D\u1EEF Li\u1EC7u" },
    email: { preferences: "C\u00E0i \u0111\u1EB7t Email", eventType: "Lo\u1EA1i s\u1EF1 ki\u1EC7n", emailNotif: "Email", inApp: "Trong \u1EE9ng d\u1EE5ng", frequency: "T\u1EA7n su\u1EA5t", save: "L\u01B0u c\u00E0i \u0111\u1EB7t", preview: "Xem tr\u01B0\u1EDBc", realtime: "Th\u1EDDi gian th\u1EF1c", daily: "H\u00E0ng ng\u00E0y", weekly: "H\u00E0ng tu\u1EA7n" },
    metrics: { activeProjects: "D\u1EF1 \u00E1n", openIssues: "\u0110ang m\u1EDF", critical: "Nghi\u00EAm tr\u1ECDng", blocked: "B\u1ECB ch\u1EB7n", closureRate: "T\u1EF7 l\u1EC7 \u0111\u00F3ng", cascadeAlerts: "C\u1EA3nh b\u00E1o delay" },
    issue: { id: "M\u00E3", title: "Ti\u00EAu \u0111\u1EC1", status: "Tr\u1EA1ng th\u00E1i", severity: "M\u1EE9c \u0111\u1ED9", source: "Ngu\u1ED3n", owner: "Ch\u1ECBu TN", phase: "Phase", rootCause: "Nguy\u00EAn nh\u00E2n g\u1ED1c", impactMap: "B\u1EA3n \u0111\u1ED3 \u1EA3nh h\u01B0\u1EDFng", activityLog: "Nh\u1EADt k\u00FD ho\u1EA1t \u0111\u1ED9ng", create: "T\u1EA1o v\u1EA5n \u0111\u1EC1", noIssues: "Kh\u00F4ng c\u00F3 v\u1EA5n \u0111\u1EC1 n\u00E0o", description: "M\u00F4 t\u1EA3", dueDate: "H\u1EA1n x\u1EED l\u00FD", all: "T\u1EA5t c\u1EA3" },
    gate: { ready: "S\u1EB4N S\u00C0NG", blocked: "CH\u01AFA \u0110\u1EE6", passed: "\u0111\u00E3 \u0111\u1EA1t", required: "B\u1EAET BU\u1ED8C", transition: "Chuy\u1EC3n Phase", confirm: "X\u00E1c nh\u1EADn chuy\u1EC3n", conditions: "\u0110i\u1EC1u ki\u1EC7n c\u1ED5ng", testCategories: "Nh\u00F3m ki\u1EC3m tra" },
    cascade: { title: "C\u1EA3nh B\u00E1o Cascade", ripple: "Hi\u1EC7u \u1EE9ng d\u00E2y chuy\u1EC1n", delayBy: "Tr\u1EC5", weeks: "tu\u1EA7n", autoShift: "t\u1EF1 \u0111\u1ED9ng d\u1ECBch" },
    status: { DRAFT: "Nh\u00E1p", OPEN: "M\u1EDF", IN_PROGRESS: "\u0110ang x\u1EED l\u00FD", BLOCKED: "B\u1ECB ch\u1EB7n", CLOSED: "\u0110\u00E3 \u0111\u00F3ng" },
    severity: { CRITICAL: "Nghi\u00EAm tr\u1ECDng", HIGH: "Cao", MEDIUM: "Trung b\u00ECnh", LOW: "Th\u1EA5p" },
    source: { INTERNAL: "N\u1ED9i b\u1ED9", EXTERNAL: "B\u00EAn ngo\u00E0i", CROSS_TEAM: "Li\u00EAn nh\u00F3m" },
    role: { admin: "Qu\u1EA3n tr\u1ECB", pm: "Qu\u1EA3n l\u00FD DA", engineer: "K\u1EF9 s\u01B0", viewer: "Xem" },
    review: { queue: "H\u00E0ng ch\u1EDD duy\u1EC7t", approve: "Duy\u1EC7t", reject: "Tr\u1EA3 l\u1EA1i", pending: "Ch\u1EDD duy\u1EC7t", noPending: "Kh\u00F4ng c\u00F3 v\u1EA5n \u0111\u1EC1 ch\u1EDD duy\u1EC7t" },
    team: { workload: "Kh\u1ED1i l\u01B0\u1EE3ng c\u00F4ng vi\u1EC7c", openTasks: "vi\u1EC7c \u0111ang m\u1EDF", member: "Th\u00E0nh vi\u00EAn" },
    notifications: "Th\u00F4ng b\u00E1o",
    phaseOwner: "Ch\u1EE7 Phase",
    targetMP: "M\u1EE5c ti\u00EAu MP",
    gateProgress: "Ti\u1EBFn \u0111\u1ED9 c\u1ED5ng",
    milestoneRisk: "R\u1EE7i ro Milestone",
    blockingIssues: "v\u1EA5n \u0111\u1EC1 ch\u1EB7n",
    readOnlyMode: "Ch\u1EBF \u0111\u1ED9 xem",
    audit: { tab: "Nh\u1EADt k\u00FD", export: "Xu\u1EA5t CSV", clear: "X\u00F3a t\u1EA5t c\u1EA3", noLogs: "Ch\u01B0a c\u00F3 nh\u1EADt k\u00FD", allActions: "T\u1EA5t c\u1EA3 h\u00E0nh \u0111\u1ED9ng", allUsers: "T\u1EA5t c\u1EA3 ng\u01B0\u1EDDi d\u00F9ng", confirmClear: "X\u00E1c nh\u1EADn x\u00F3a to\u00E0n b\u1ED9 nh\u1EADt k\u00FD?" },
    save: "L\u01B0u", cancel: "H\u1EE7y", close: "\u0110\u00F3ng", search: "T\u00ECm ki\u1EBFm...", searchIssues: "T\u00ECm v\u1EA5n \u0111\u1EC1...",
    deleteConfirm: "X\u00E1c nh\u1EADn x\u00F3a v\u1EA5n \u0111\u1EC1 n\u00E0y?", deleted: "\u0110\u00E3 x\u00F3a", markAllRead: "\u0110\u00E1nh d\u1EA5u t\u1EA5t c\u1EA3 \u0111\u00E3 \u0111\u1ECDc",
    offline: "Ngo\u1EA1i tuy\u1EBFn", unsavedChanges: "C\u00F3 thay \u0111\u1ED5i ch\u01B0a l\u01B0u. B\u1EA1n c\u00F3 ch\u1EAFc mu\u1ED1n \u0111\u00F3ng?",
    intel: { title: "Tr\u00ED tu\u1EC7 D\u1EF1 \u00E1n", overview: "T\u1ED5ng quan", convergence: "H\u1ED9i t\u1EE5", anomaly: "B\u1EA5t th\u01B0\u1EDDng", freshness: "\u0110\u1ED9 t\u01B0\u01A1i", signals: "t\u00EDn hi\u1EC7u", signalTypes: "lo\u1EA1i", events: "s\u1EF1 ki\u1EC7n", signalCount: "T\u00EDn hi\u1EC7u", convergenceCount: "H\u1ED9i t\u1EE5", anomalyCount: "B\u1EA5t th\u01B0\u1EDDng", dataFreshness: "\u0110\u1ED9 t\u01B0\u01A1i", projectHealth: "S\u1EE9c kh\u1ECFe D\u1EF1 \u00E1n (PHI)", recentConvergences: "H\u1ED9i t\u1EE5 g\u1EA7n \u0111\u00E2y", noConvergences: "Kh\u00F4ng ph\u00E1t hi\u1EC7n h\u1ED9i t\u1EE5", noConvergencesSub: "H\u1EC7 th\u1ED1ng s\u1EBD c\u1EA3nh b\u00E1o khi nhi\u1EC1u t\u00EDn hi\u1EC7u xu\u1EA5t hi\u1EC7n c\u00F9ng l\u00FAc", noAnomalies: "Kh\u00F4ng c\u00F3 b\u1EA5t th\u01B0\u1EDDng", noAnomaliesSub: "C\u1EA7n th\u00EAm d\u1EEF li\u1EC7u baseline", observed: "Th\u1EF1c t\u1EBF", expected: "D\u1EF1 ki\u1EBFn", contributingSignals: "T\u00EDn hi\u1EC7u \u0111\u00F3ng g\u00F3p", freshSources: "T\u01B0\u01A1i", staleSources: "C\u0169", errorSources: "L\u1ED7i", coverage: "Ph\u1EE7", degradedDecisions: "Quy\u1EBFt \u0111\u1ECBnh suy gi\u1EA3m", modifiersActive: "Modifier \u0111ang ho\u1EA1t \u0111\u1ED9ng", levels: { healthy: "Kh\u1ECFe", attention: "Ch\u00FA \u00FD", warning: "C\u1EA3nh b\u00E1o", critical: "Nghi\u00EAm tr\u1ECDng", unknown: "Ch\u01B0a r\u00F5" }, convergenceDetected: "Ph\u00E1t hi\u1EC7n h\u1ED9i t\u1EE5", anomalyDetected: "Ph\u00E1t hi\u1EC7n b\u1EA5t th\u01B0\u1EDDng", healthCritical: "S\u1EE9c kh\u1ECFe nghi\u00EAm tr\u1ECDng" },
  },
  en: {
    appName: "RtR Control Tower",
    appSub: "Real-time Robotics • Drone Program Management",
    tabs: { tower: "Control Tower", issues: "Issues", gates: "Phase Gates", impact: "Impact Map", team: "Team", review: "Review", audit: "Audit Log", bom: "BOM & Suppliers", testing: "Testing & Decisions", orders: "Orders", production: "Production", inventory: "Inventory", finance: "Finance", intelligence: "Intelligence", settings: "Settings" },
    importExport: { import: "Import", export: "Export", exportExcel: "Export Excel", exportPdf: "Export PDF", exportSlides: "Executive Slides", importData: "Import Data" },
    email: { preferences: "Email Preferences", eventType: "Event Type", emailNotif: "Email", inApp: "In-App", frequency: "Frequency", save: "Save Preferences", preview: "Preview", realtime: "Realtime", daily: "Daily Digest", weekly: "Weekly" },
    metrics: { activeProjects: "Projects", openIssues: "Open", critical: "Critical", blocked: "Blocked", closureRate: "Closure", cascadeAlerts: "Cascade Alerts" },
    issue: { id: "ID", title: "Title", status: "Status", severity: "Severity", source: "Source", owner: "Owner", phase: "Phase", rootCause: "Root Cause", impactMap: "Impact Mapping", activityLog: "Activity Log", create: "Create Issue", noIssues: "No issues match filters", description: "Description", dueDate: "Due Date", all: "All" },
    gate: { ready: "GATE READY", blocked: "GATE BLOCKED", passed: "passed", required: "REQUIRED", transition: "Transition Phase", confirm: "Confirm Transition", conditions: "Gate Conditions", testCategories: "Test Categories" },
    cascade: { title: "Cascade Alerts", ripple: "Ripple Effect", delayBy: "Delay by", weeks: "weeks", autoShift: "auto-shift" },
    status: { DRAFT: "Draft", OPEN: "Open", IN_PROGRESS: "In Progress", BLOCKED: "Blocked", CLOSED: "Closed" },
    severity: { CRITICAL: "Critical", HIGH: "High", MEDIUM: "Medium", LOW: "Low" },
    source: { INTERNAL: "Internal", EXTERNAL: "External", CROSS_TEAM: "Cross-team" },
    role: { admin: "Admin", pm: "PM", engineer: "Engineer", viewer: "Viewer" },
    review: { queue: "Review Queue", approve: "Approve", reject: "Return", pending: "Pending Review", noPending: "No pending issues" },
    team: { workload: "Workload", openTasks: "open tasks", member: "Member" },
    notifications: "Notifications",
    phaseOwner: "Phase Owner",
    targetMP: "Target MP",
    gateProgress: "Gate Progress",
    milestoneRisk: "Milestone Risk",
    blockingIssues: "blocking issues",
    readOnlyMode: "Read-only mode",
    audit: { tab: "Audit Log", export: "Export CSV", clear: "Clear All", noLogs: "No audit entries yet", allActions: "All Actions", allUsers: "All Users", confirmClear: "Confirm clear all audit logs?" },
    save: "Save", cancel: "Cancel", close: "Close", search: "Search...", searchIssues: "Search issues...",
    deleteConfirm: "Confirm delete this issue?", deleted: "Deleted", markAllRead: "Mark all as read",
    offline: "Offline", unsavedChanges: "You have unsaved changes. Are you sure you want to close?",
    intel: { title: "Project Intelligence", overview: "Overview", convergence: "Convergence", anomaly: "Anomaly", freshness: "Freshness", signals: "signals", signalTypes: "types", events: "events", signalCount: "Signals", convergenceCount: "Convergences", anomalyCount: "Anomalies", dataFreshness: "Freshness", projectHealth: "Project Health Index (PHI)", recentConvergences: "Recent Convergences", noConvergences: "No convergences detected", noConvergencesSub: "System will alert when multiple signal types appear together", noAnomalies: "No anomalies detected", noAnomaliesSub: "Need more baseline data for comparison", observed: "Observed", expected: "Expected", contributingSignals: "Contributing signals", freshSources: "Fresh", staleSources: "Stale", errorSources: "Error", coverage: "Coverage", degradedDecisions: "Degraded Decisions", modifiersActive: "Modifiers active", levels: { healthy: "Healthy", attention: "Attention", warning: "Warning", critical: "Critical", unknown: "Unknown" }, convergenceDetected: "Convergence Detected", anomalyDetected: "Anomaly Detected", healthCritical: "Health Critical" },
  },
};

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

// --- SAMPLE DATA ---
const PROJECTS = [
  { id: "PRJ-001", name: "RTR-X7 Surveyor", desc: "Enterprise survey drone with RTK GPS", descVi: "Drone kh\u1EA3o s\u00E1t doanh nghi\u1EC7p v\u1EDBi RTK GPS", phase: "DVT", phaseOwner: "Minh Tu\u1EA5n", startDate: "2025-06-01", targetMP: "2026-06-01",
    milestones: { CONCEPT: { target: "2025-06-30", actual: "2025-06-28", adjusted: null, status: "COMPLETED" }, EVT: { target: "2025-09-30", actual: "2025-10-15", adjusted: null, status: "COMPLETED" }, DVT: { target: "2026-01-31", actual: null, adjusted: "2026-02-14", status: "IN_PROGRESS" }, PVT: { target: "2026-04-15", actual: null, adjusted: "2026-04-29", status: "PLANNED" }, MP: { target: "2026-06-01", actual: null, adjusted: "2026-06-15", status: "PLANNED" } },
    gateChecks: { CONCEPT: { c1: true, c2: true, c3: true }, EVT: { e1: true, e2: true, e3: true, e4: true, e5: true }, DVT: { d1: false, d2: false, d3: false, d4: true, d5: true, d6: false, d7: false, d8: false, d9: true, d10: true, d11: false }, PVT: {}, MP: {} },
  },
  { id: "PRJ-002", name: "RTR-A3 Agri Sprayer", desc: "Agricultural spraying drone 20L payload", descVi: "Drone phun thu\u1ED1c n\u00F4ng nghi\u1EC7p t\u1EA3i 20L", phase: "EVT", phaseOwner: "H\u1ED3ng Ph\u00FAc", startDate: "2025-09-01", targetMP: "2026-09-01",
    milestones: { CONCEPT: { target: "2025-09-30", actual: "2025-09-25", adjusted: null, status: "COMPLETED" }, EVT: { target: "2026-01-15", actual: null, adjusted: "2026-02-01", status: "IN_PROGRESS" }, DVT: { target: "2026-04-01", actual: null, adjusted: "2026-04-15", status: "PLANNED" }, PVT: { target: "2026-07-01", actual: null, adjusted: "2026-07-15", status: "PLANNED" }, MP: { target: "2026-09-01", actual: null, adjusted: "2026-09-15", status: "PLANNED" } },
    gateChecks: { CONCEPT: { c1: true, c2: true, c3: true }, EVT: { e1: true, e2: true, e3: false, e4: false, e5: false }, DVT: {}, PVT: {}, MP: {} },
  },
  { id: "PRJ-003", name: "RTR-D1 Delivery", desc: "Urban delivery drone 5kg payload, autonomous landing on rooftop pads", descVi: "Drone giao h\u00E0ng \u0111\u00F4 th\u1ECB t\u1EA3i 5kg, h\u1EA1 c\u00E1nh t\u1EF1 \u0111\u1ED9ng tr\u00EAn s\u00E2n th\u01B0\u1EE3ng", phase: "CONCEPT", phaseOwner: "Qu\u1EF3nh Anh", startDate: "2026-01-15", targetMP: "2027-06-01",
    milestones: { CONCEPT: { target: "2026-04-15", actual: null, adjusted: null, status: "IN_PROGRESS" }, EVT: { target: "2026-08-01", actual: null, adjusted: null, status: "PLANNED" }, DVT: { target: "2026-12-01", actual: null, adjusted: null, status: "PLANNED" }, PVT: { target: "2027-03-01", actual: null, adjusted: null, status: "PLANNED" }, MP: { target: "2027-06-01", actual: null, adjusted: null, status: "PLANNED" } },
    gateChecks: { CONCEPT: { c1: true, c2: true, c3: false }, EVT: {}, DVT: {}, PVT: {}, MP: {} },
  },
  { id: "PRJ-004", name: "RTR-I2 Inspector", desc: "Industrial inspection drone with thermal camera, LiDAR, and IP67 rating", descVi: "Drone ki\u1EC3m tra c\u00F4ng nghi\u1EC7p v\u1EDBi camera nhi\u1EC7t, LiDAR, chu\u1EA9n IP67", phase: "PVT", phaseOwner: "Ph\u1EA1m Thu Trang", startDate: "2025-03-01", targetMP: "2026-04-15",
    milestones: { CONCEPT: { target: "2025-05-01", actual: "2025-04-28", adjusted: null, status: "COMPLETED" }, EVT: { target: "2025-08-01", actual: "2025-08-15", adjusted: null, status: "COMPLETED" }, DVT: { target: "2025-12-01", actual: "2026-01-10", adjusted: null, status: "COMPLETED" }, PVT: { target: "2026-03-01", actual: null, adjusted: "2026-03-22", status: "IN_PROGRESS" }, MP: { target: "2026-04-15", actual: null, adjusted: "2026-05-06", status: "PLANNED" } },
    gateChecks: { CONCEPT: { c1: true, c2: true, c3: true }, EVT: { e1: true, e2: true, e3: true, e4: true, e5: true }, DVT: { d1: true, d2: true, d3: true, d4: true, d5: true, d6: true, d7: true, d8: true, d9: true, d10: true, d11: true }, PVT: { p1: true, p2: true, p3: false, p4: false, p5: false }, MP: {} },
  },
  { id: "PRJ-005", name: "RTR-M3 Mapper", desc: "High-precision photogrammetry mapping drone with RTK and oblique camera", descVi: "Drone l\u1EADp b\u1EA3n \u0111\u1ED3 tr\u1EAFc \u0111\u1ECBa \u0111\u1ED9 ch\u00EDnh x\u00E1c cao v\u1EDBi RTK v\u00E0 camera xi\u00EAn", phase: "EVT", phaseOwner: "Ph\u1EA1m Thu Trang", startDate: "2025-11-01", targetMP: "2026-12-01",
    milestones: { CONCEPT: { target: "2026-01-01", actual: "2025-12-20", adjusted: null, status: "COMPLETED" }, EVT: { target: "2026-04-01", actual: null, adjusted: null, status: "IN_PROGRESS" }, DVT: { target: "2026-07-01", actual: null, adjusted: null, status: "PLANNED" }, PVT: { target: "2026-10-01", actual: null, adjusted: null, status: "PLANNED" }, MP: { target: "2026-12-01", actual: null, adjusted: null, status: "PLANNED" } },
    gateChecks: { CONCEPT: { c1: true, c2: true, c3: true }, EVT: { e1: true, e2: true, e3: false, e4: true, e5: false }, DVT: {}, PVT: {}, MP: {} },
  },
];

const ISSUES_DATA = [
  { id: "ISS-001", pid: "PRJ-001", title: "FC board brownout during high-G maneuver", titleVi: "Board FC m\u1EA5t ngu\u1ED3n khi c\u01A1 \u0111\u1ED9ng G cao", desc: "Flight controller loses power during aggressive banking at >2G", rootCause: "Voltage regulator insufficient current capacity under transient load", status: "IN_PROGRESS", sev: "CRITICAL", src: "INTERNAL", owner: "\u0110\u1EE9c Anh", phase: "DVT", created: "2026-01-15", due: "2026-02-28",
    impacts: [{ phase: "DVT", desc: "Delay design freeze by 2 weeks", descVi: "Tr\u00EC ho\u00E3n \u0111\u00F3ng b\u0103ng thi\u1EBFt k\u1EBF 2 tu\u1EA7n", days: 14 }, { phase: "PVT", desc: "Auto-shift PVT start by 2 weeks", descVi: "PVT t\u1EF1 \u0111\u1ED9ng d\u1ECBch 2 tu\u1EA7n", days: 14 }],
    updates: [{ date: "2026-01-15", author: "\u0110\u1EE9c Anh", text: "Identified brownout during flight test #47" }, { date: "2026-01-20", author: "\u0110\u1EE9c Anh", text: "Root cause: LDO max 500mA, peak draw 720mA" }, { date: "2026-02-10", author: "Minh Tu\u1EA5n", text: "New regulator TPS62A02 sampled, testing next week" }],
  },
  { id: "ISS-002", pid: "PRJ-001", title: "GPS module cold start >45s", titleVi: "Module GPS kh\u1EDFi \u0111\u1ED9ng l\u1EA1nh >45 gi\u00E2y", desc: "RTK GPS takes too long for first fix in cold conditions", rootCause: "Antenna placement near motor EMI source", status: "OPEN", sev: "HIGH", src: "CROSS_TEAM", owner: "Thanh H\u00E0", phase: "DVT", created: "2026-01-22", due: "2026-03-10",
    impacts: [{ phase: "DVT", desc: "May require PCB respin", descVi: "C\u00F3 th\u1EC3 c\u1EA7n l\u00E0m l\u1EA1i PCB", days: 21 }],
    updates: [{ date: "2026-01-22", author: "Thanh H\u00E0", text: "Measured TTFF consistently >45s in field" }, { date: "2026-02-01", author: "Thanh H\u00E0", text: "EMC scan shows noise at 1.575GHz from motor driver" }],
  },
  { id: "ISS-003", pid: "PRJ-001", title: "Battery connector arcing", titleVi: "\u0110\u1EA7u n\u1ED1i pin ph\u00F3ng tia l\u1EEDa", desc: "XT60 connector arcing after 50 connect cycles", rootCause: "Contact resistance increasing due to plating wear", status: "CLOSED", sev: "MEDIUM", src: "EXTERNAL", owner: "V\u0103n H\u00F9ng", phase: "EVT", created: "2025-10-05", due: "2025-10-25",
    impacts: [],
    updates: [{ date: "2025-10-05", author: "V\u0103n H\u00F9ng", text: "Arcing observed on unit #3" }, { date: "2025-10-12", author: "V\u0103n H\u00F9ng", text: "Switched to gold-plated XT60H from supplier B" }, { date: "2025-10-20", author: "V\u0103n H\u00F9ng", text: "100 cycle test passed. Closed." }],
  },
  { id: "ISS-004", pid: "PRJ-001", title: "ESC firmware CAN bus timeout", titleVi: "ESC firmware CAN bus h\u1EBFt th\u1EDDi gian", desc: "CAN messages from ESC #4 drop intermittently", rootCause: "Pending investigation", status: "OPEN", sev: "CRITICAL", src: "INTERNAL", owner: "\u0110\u1EE9c Anh", phase: "DVT", created: "2026-02-18", due: "2026-03-05",
    impacts: [{ phase: "DVT", desc: "Flight test program halted", descVi: "Ch\u01B0\u01A1ng tr\u00ECnh bay test d\u1EEBng", days: 14 }, { phase: "PVT", desc: "Cannot proceed without stable CAN", descVi: "Kh\u00F4ng th\u1EC3 ti\u1EBFn h\u00E0nh n\u1EBFu CAN ch\u01B0a \u1ED5n", days: 14 }],
    updates: [{ date: "2026-02-18", author: "\u0110\u1EE9c Anh", text: "CAN timeout errors in flight log, motor #4 stutter" }],
  },
  { id: "ISS-005", pid: "PRJ-001", title: "Thermal throttling at 45\u00B0C ambient", titleVi: "Gi\u1EA3m hi\u1EC7u n\u0103ng nhi\u1EC7t \u1EDF 45\u00B0C", desc: "Processor thermal throttles in hot climate conditions", rootCause: "Heat sink undersized for tropical operation", status: "DRAFT", sev: "HIGH", src: "INTERNAL", owner: "\u0110\u1EE9c Anh", phase: "DVT", created: "2026-02-22", due: "2026-03-15",
    impacts: [{ phase: "DVT", desc: "Environmental test may fail", descVi: "Test m\u00F4i tr\u01B0\u1EDDng c\u00F3 th\u1EC3 fail", days: 7 }],
    updates: [{ date: "2026-02-22", author: "\u0110\u1EE9c Anh", text: "Observed CPU freq drop from 1.8GHz to 1.2GHz at 45\u00B0C ambient in chamber" }],
  },
  { id: "ISS-006", pid: "PRJ-002", title: "Spray nozzle clogging at low flow", titleVi: "V\u00F2i phun t\u1EAFc \u1EDF l\u01B0u l\u01B0\u1EE3ng th\u1EA5p", desc: "Nozzle clogs when flow rate drops below 0.5L/min", rootCause: "Nozzle mesh filter too fine for pesticide viscosity", status: "IN_PROGRESS", sev: "HIGH", src: "EXTERNAL", owner: "B\u1EA3o Tr\u00E2m", phase: "EVT", created: "2026-01-10", due: "2026-02-28",
    impacts: [{ phase: "EVT", desc: "Spray system redesign needed", descVi: "C\u1EA7n thi\u1EBFt k\u1EBF l\u1EA1i h\u1EC7 th\u1ED1ng phun", days: 14 }],
    updates: [{ date: "2026-01-10", author: "B\u1EA3o Tr\u00E2m", text: "Clogging after 5 minutes of low-rate spray" }, { date: "2026-01-18", author: "B\u1EA3o Tr\u00E2m", text: "Testing 200-mesh filter from supplier C" }],
  },
  { id: "ISS-007", pid: "PRJ-002", title: "Frame vibration at 40% throttle resonance", titleVi: "Khung rung c\u1ED9ng h\u01B0\u1EDFng \u1EDF 40% ga", desc: "Structural resonance causes excessive vibration", rootCause: "Motor mount natural frequency matches prop RPM at 40%", status: "BLOCKED", sev: "HIGH", src: "INTERNAL", owner: "H\u1ED3ng Ph\u00FAc", phase: "EVT", created: "2026-02-05", due: "2026-03-01",
    impacts: [{ phase: "EVT", desc: "Cannot validate flight endurance", descVi: "Kh\u00F4ng th\u1EC3 x\u00E1c nh\u1EADn th\u1EDDi gian bay", days: 14 }, { phase: "DVT", desc: "May delay DVT entry by 2 weeks", descVi: "C\u00F3 th\u1EC3 tr\u00EC ho\u00E3n b\u1EAFt \u0111\u1EA7u DVT 2 tu\u1EA7n", days: 14 }],
    updates: [{ date: "2026-02-05", author: "H\u1ED3ng Ph\u00FAc", text: "Vibration spike at 40% throttle on accelerometer" }, { date: "2026-02-12", author: "H\u1ED3ng Ph\u00FAc", text: "FEA analysis confirms resonance. Waiting for damper samples." }],
  },
  { id: "ISS-008", pid: "PRJ-002", title: "Radar altimeter drift at low altitude", titleVi: "Cao k\u1EBF radar tr\u00F4i \u1EDF \u0111\u1ED9 cao th\u1EA5p", desc: "Terrain-following radar shows 30cm drift at <3m altitude over vegetation", rootCause: "Radar signal scatter on dense crop canopy", status: "OPEN", sev: "MEDIUM", src: "INTERNAL", owner: "B\u1EA3o Tr\u00E2m", phase: "EVT", created: "2026-02-10", due: "2026-03-15",
    impacts: [{ phase: "EVT", desc: "Spray height inconsistency may affect efficacy", descVi: "\u0110\u1ED9 cao phun kh\u00F4ng \u0111\u1EC1u c\u00F3 th\u1EC3 \u1EA3nh h\u01B0\u1EDFng hi\u1EC7u qu\u1EA3", days: 7 }],
    updates: [{ date: "2026-02-10", author: "B\u1EA3o Tr\u00E2m", text: "Measured altitude drift of \u00B130cm over rice paddy at 2m AGL" }, { date: "2026-02-18", author: "B\u1EA3o Tr\u00E2m", text: "Testing Kalman filter fusion with barometer to compensate" }],
  },
  { id: "ISS-009", pid: "PRJ-002", title: "Pump pressure loss after 10min continuous spray", titleVi: "B\u01A1m m\u1EA5t \u00E1p sau 10 ph\u00FAt phun li\u00EAn t\u1EE5c", desc: "Diaphragm pump output drops 20% after sustained operation", rootCause: "Diaphragm fatigue under continuous chemical exposure", status: "IN_PROGRESS", sev: "HIGH", src: "EXTERNAL", owner: "B\u1EA3o Tr\u00E2m", phase: "EVT", created: "2026-02-15", due: "2026-03-10",
    impacts: [{ phase: "EVT", desc: "May need pump redesign/upgrade", descVi: "C\u00F3 th\u1EC3 c\u1EA7n thi\u1EBFt k\u1EBF l\u1EA1i/n\u00E2ng c\u1EA5p b\u01A1m", days: 14 }],
    updates: [{ date: "2026-02-15", author: "B\u1EA3o Tr\u00E2m", text: "Flow rate drops from 2.5L/min to 2.0L/min after 10min" }, { date: "2026-02-20", author: "H\u1ED3ng Ph\u00FAc", text: "Ordered PTFE-coated diaphragm from alternative supplier" }],
  },
  { id: "ISS-010", pid: "PRJ-002", title: "Battery connector overheating at 60A continuous", titleVi: "\u0110\u1EA7u n\u1ED1i pin qu\u00E1 nhi\u1EC7t \u1EDF 60A li\u00EAn t\u1EE5c", desc: "XT90 connector reaches 85\u00B0C after 8 minutes at full load", rootCause: "Connector rated for 90A peak but only 60A continuous", status: "OPEN", sev: "CRITICAL", src: "INTERNAL", owner: "V\u0103n H\u00F9ng", phase: "EVT", created: "2026-02-20", due: "2026-03-05",
    impacts: [{ phase: "EVT", desc: "Safety concern, blocks full-load testing", descVi: "Nguy c\u01A1 an to\u00E0n, ch\u1EB7n test t\u1EA3i \u0111\u1EA7y", days: 10 }, { phase: "DVT", desc: "May delay DVT if connector redesign needed", descVi: "C\u00F3 th\u1EC3 tr\u00EC ho\u00E3n DVT n\u1EBFu c\u1EA7n thi\u1EBFt k\u1EBF l\u1EA1i \u0111\u1EA7u n\u1ED1i", days: 14 }],
    updates: [{ date: "2026-02-20", author: "V\u0103n H\u00F9ng", text: "Thermal camera shows XT90 at 85\u00B0C after 8min at 55A average draw" }],
  },
  { id: "ISS-011", pid: "PRJ-001", title: "Telemetry radio 915MHz EOL replacement", titleVi: "Thay th\u1EBF radio telemetry 915MHz EOL", desc: "Current telemetry module TELEM-915 has been marked EOL by manufacturer", rootCause: "Component end-of-life, manufacturer discontinued", status: "OPEN", sev: "MEDIUM", src: "EXTERNAL", owner: "Thanh H\u00E0", phase: "DVT", created: "2026-02-20", due: "2026-03-20",
    impacts: [{ phase: "PVT", desc: "Must validate new telemetry before PVT", descVi: "Ph\u1EA3i x\u00E1c nh\u1EADn telemetry m\u1EDBi tr\u01B0\u1EDBc PVT", days: 7 }],
    updates: [{ date: "2026-02-20", author: "Thanh H\u00E0", text: "Evaluating SiK radio V3 and RFD900x as replacements" }],
  },
  // PRJ-003: RTR-D1 Delivery (CONCEPT) — 3 issues
  { id: "ISS-012", pid: "PRJ-003", title: "Payload release mechanism design review needed", titleVi: "C\u1EA7n review thi\u1EBFt k\u1EBF c\u01A1 c\u1EA5u th\u1EA3 h\u00E0ng", desc: "Three payload release mechanisms identified. Electromagnetic is simplest but limited to ferrous containers. Servo-actuated hook is most versatile. Need weight/reliability trade study.", rootCause: "Multiple release mechanism options (electromagnetic, servo, pneumatic) need trade study before EVT", status: "DRAFT", sev: "LOW", src: "INTERNAL", owner: "Tr\u1EA7n Minh Khoa", phase: "CONCEPT", created: "2026-02-10", due: "2026-03-15",
    impacts: [],
    updates: [{ date: "2026-02-10", author: "Tr\u1EA7n Minh Khoa", text: "Created initial trade study document with 3 options" }, { date: "2026-02-15", author: "Qu\u1EF3nh Anh", text: "Requested weight budget from system engineering team" }],
  },
  { id: "ISS-013", pid: "PRJ-003", title: "Urban GPS multipath interference study required", titleVi: "C\u1EA7n nghi\u00EAn c\u1EE9u nhi\u1EC5u GPS \u0111a \u0111\u01B0\u1EDDng trong \u0111\u00F4 th\u1ECB", desc: "Delivery drone must land autonomously on rooftop pads in urban environment. Standard GPS insufficient. Need RTK + visual landing system study.", rootCause: "Urban canyon environment causes GPS multipath errors up to 5m, exceeding landing pad accuracy requirement of 0.5m", status: "OPEN", sev: "HIGH", src: "CROSS_TEAM", owner: "Nguy\u1EC5n H\u1EA3i Nam", phase: "CONCEPT", created: "2026-02-05", due: "2026-04-01",
    impacts: [{ phase: "EVT", desc: "Must resolve before EVT flight tests", descVi: "Ph\u1EA3i gi\u1EA3i quy\u1EBFt tr\u01B0\u1EDBc khi bay test EVT", days: 0 }],
    updates: [{ date: "2026-02-05", author: "Nguy\u1EC5n H\u1EA3i Nam", text: "Initial literature review \u2014 RTK + AprilTag combo shows promise" }, { date: "2026-02-12", author: "Nguy\u1EC5n H\u1EA3i Nam", text: "Contacted DJI SDK team about visual landing API compatibility" }, { date: "2026-02-20", author: "Qu\u1EF3nh Anh", text: "Approved budget for RTK base station + ArUco marker landing pad prototype" }],
  },
  { id: "ISS-014", pid: "PRJ-003", title: "Noise regulation compliance for urban operation", titleVi: "Tu\u00E2n th\u1EE7 quy \u0111\u1ECBnh ti\u1EBFng \u1ED3n cho bay \u0111\u00F4 th\u1ECB", desc: "Need to establish noise targets before propulsion system design freeze. Current estimate: 72dBA at 10m. Target: <65dBA for residential zones.", rootCause: "Vietnam noise regulations for urban UAV operations unclear. EU drone noise standard (EN 4709-005) may apply for export market.", status: "OPEN", sev: "MEDIUM", src: "EXTERNAL", owner: "B\u00F9i Qu\u1ED1c Vi\u1EC7t", phase: "CONCEPT", created: "2026-02-08", due: "2026-03-30",
    impacts: [],
    updates: [{ date: "2026-02-08", author: "B\u00F9i Qu\u1ED1c Vi\u1EC7t", text: "Contacted CAAV for UAV noise regulation guidance" }, { date: "2026-02-18", author: "B\u00F9i Qu\u1ED1c Vi\u1EC7t", text: "CAAV confirmed no specific UAV noise standard yet. Referencing EU EN 4709-005." }],
  },
  // PRJ-004: RTR-I2 Inspector (PVT) — 4 issues
  { id: "ISS-015", pid: "PRJ-004", title: "Thermal camera calibration drift after 1hr continuous operation", titleVi: "Camera nhi\u1EC7t b\u1ECB l\u1EC7ch hi\u1EC7u chu\u1EA9n sau 1 gi\u1EDD ho\u1EA1t \u0111\u1ED9ng li\u00EAn t\u1EE5c", desc: "During PVT field trials, thermal camera accuracy degrades from \u00B12\u00B0C to \u00B18\u00B0C after 60 minutes of continuous capture. FLIR confirmed known issue.", rootCause: "FLIR Lepton 3.5 module internal NUC fails to compensate after prolonged use in ambient >35\u00B0C", status: "IN_PROGRESS", sev: "HIGH", src: "EXTERNAL", owner: "L\u00EA Th\u1ECB Ph\u01B0\u01A1ng", phase: "PVT", created: "2026-01-25", due: "2026-03-10",
    impacts: [{ phase: "PVT", desc: "Firmware update needed, PVT retest +1 week", descVi: "C\u1EA7n c\u1EADp nh\u1EADt firmware, test l\u1EA1i PVT +1 tu\u1EA7n", days: 7 }],
    updates: [{ date: "2026-01-25", author: "L\u00EA Th\u1ECB Ph\u01B0\u01A1ng", text: "Issue discovered during PVT-007 field trial at B\u00ECnh D\u01B0\u01A1ng solar farm" }, { date: "2026-02-01", author: "L\u00EA Th\u1ECB Ph\u01B0\u01A1ng", text: "FLIR support ticket #FL-28841 opened" }, { date: "2026-02-10", author: "L\u00EA Th\u1ECB Ph\u01B0\u01A1ng", text: "FLIR confirmed \u2014 sending firmware v3.2.1 with improved NUC algorithm" }, { date: "2026-02-18", author: "Ph\u1EA1m Thu Trang", text: "Firmware v3.2.1 received, scheduling retest" }],
  },
  { id: "ISS-016", pid: "PRJ-004", title: "LiDAR point cloud processing latency exceeds real-time requirement", titleVi: "\u0110\u1ED9 tr\u1EC5 x\u1EED l\u00FD point cloud LiDAR v\u01B0\u1EE3t y\u00EAu c\u1EA7u real-time", desc: "Current processing latency: 180ms. Requirement: <100ms for real-time obstacle avoidance. Options: reduce point density, upgrade to Jetson Orin Nano, or offload thermal processing.", rootCause: "Onboard Jetson Nano cannot process 300K points/sec while running obstacle avoidance + thermal overlay simultaneously", status: "IN_PROGRESS", sev: "MEDIUM", src: "INTERNAL", owner: "V\u0169 \u0110\u00ECnh To\u00E0n", phase: "PVT", created: "2026-02-01", due: "2026-03-05",
    impacts: [],
    updates: [{ date: "2026-02-01", author: "V\u0169 \u0110\u00ECnh To\u00E0n", text: "Profiling results: 60% CPU on point cloud, 30% on thermal" }, { date: "2026-02-08", author: "V\u0169 \u0110\u00ECnh To\u00E0n", text: "Tested point cloud decimation (50%) \u2192 95ms latency \u2705 but obstacle detection accuracy drops 15%" }, { date: "2026-02-16", author: "V\u0169 \u0110\u00ECnh To\u00E0n", text: "Ordered Jetson Orin Nano eval kit for benchmarking. Delivery: Feb 28" }],
  },
  { id: "ISS-017", pid: "PRJ-004", title: "IP67 seal failure \u2014 water ingress at USB-C diagnostic port", titleVi: "Seal IP67 l\u1ED7i \u2014 n\u01B0\u1EDBc v\u00E0o c\u1ED5ng USB-C ch\u1EA9n \u0111o\u00E1n", desc: "Critical blocker for PVT sign-off. Industrial inspection drones MUST be IP67. Supplier evaluating silicone vs EPDM gasket materials. Blocked until new gasket samples arrive.", rootCause: "USB-C port gasket deforms under thermal cycling (-10\u00B0C to 60\u00B0C). After 50 cycles, IP67 seal fails at 0.5m submersion test.", status: "BLOCKED", sev: "CRITICAL", src: "INTERNAL", owner: "L\u00EA Th\u1ECB Ph\u01B0\u01A1ng", phase: "PVT", created: "2026-02-05", due: "2026-02-28",
    impacts: [{ phase: "PVT", desc: "PVT sign-off blocked until seal redesign verified", descVi: "Nghi\u1EC7m thu PVT b\u1ECB ch\u1EB7n cho \u0111\u1EBFn khi seal m\u1EDBi \u0111\u01B0\u1EE3c x\u00E1c nh\u1EADn", days: 21 }, { phase: "MP", desc: "MP pushed back 3 weeks due to PVT delay", descVi: "MP \u0111\u1EA9y l\u00F9i 3 tu\u1EA7n do PVT tr\u1EC5", days: 21 }],
    updates: [{ date: "2026-02-05", author: "L\u00EA Th\u1ECB Ph\u01B0\u01A1ng", text: "Water ingress detected during PVT environmental test #12" }, { date: "2026-02-07", author: "Ph\u1EA1m Thu Trang", text: "Escalated to CRITICAL. Contacted gasket supplier Seal-Tech JSC" }, { date: "2026-02-12", author: "L\u00EA Th\u1ECB Ph\u01B0\u01A1ng", text: "Root cause: EPDM gasket shore hardness drops from 60A to 45A after thermal cycling" }, { date: "2026-02-20", author: "Ph\u1EA1m Thu Trang", text: "BLOCKED \u2014 Seal-Tech sending silicone samples, ETA March 5. Cannot proceed until tested." }],
  },
  { id: "ISS-018", pid: "PRJ-004", title: "Production jig alignment tolerance causes PCB connector stress", titleVi: "Dung sai jig s\u1EA3n xu\u1EA5t g\u00E2y \u1EE9ng su\u1EA5t connector PCB", desc: "During PVT batch of 10 units, 3 units had intermittent sensor board connection. Need to redesign jig with better alignment pins or switch to more tolerant connector type.", rootCause: "Production assembly jig has \u00B10.8mm tolerance. FPC connector between main PCB and sensor board requires \u00B10.3mm alignment.", status: "OPEN", sev: "MEDIUM", src: "INTERNAL", owner: "V\u0169 \u0110\u00ECnh To\u00E0n", phase: "PVT", created: "2026-02-15", due: "2026-03-15",
    impacts: [],
    updates: [{ date: "2026-02-15", author: "V\u0169 \u0110\u00ECnh To\u00E0n", text: "Identified during PVT unit #4 assembly \u2014 connector partially unseated" }, { date: "2026-02-20", author: "V\u0169 \u0110\u00ECnh To\u00E0n", text: "Requesting jig redesign quote from CNC shop. Also evaluating ZIF connector alternative." }],
  },
  // PRJ-005: RTR-M3 Mapper (EVT) — 3 issues
  { id: "ISS-019", pid: "PRJ-005", title: "Camera trigger sync delay >10ms affects photogrammetry accuracy", titleVi: "\u0110\u1ED9 tr\u1EC5 \u0111\u1ED3ng b\u1ED9 trigger camera >10ms \u1EA3nh h\u01B0\u1EDFng \u0111\u1ED9 ch\u00EDnh x\u00E1c tr\u1EAFc \u0111\u1ECBa", desc: "Photogrammetry mapping requires <5ms trigger sync for cm-level accuracy. Need mid-exposure feedback signal from camera or hardware trigger with deterministic latency.", rootCause: "Hot shoe trigger signal has variable latency 8-25ms. At 15m/s cruise speed, 25ms delay = 37.5cm position error per image.", status: "OPEN", sev: "HIGH", src: "INTERNAL", owner: "\u0110\u1ED7 Ho\u00E0ng S\u01A1n", phase: "EVT", created: "2026-02-12", due: "2026-03-20",
    impacts: [{ phase: "EVT", desc: "Camera integration redesign +1 week", descVi: "Thi\u1EBFt k\u1EBF l\u1EA1i t\u00EDch h\u1EE3p camera +1 tu\u1EA7n", days: 7 }],
    updates: [{ date: "2026-02-12", author: "\u0110\u1ED7 Ho\u00E0ng S\u01A1n", text: "Measured trigger latency with oscilloscope \u2014 8-25ms range, non-deterministic" }, { date: "2026-02-19", author: "\u0110\u1ED7 Ho\u00E0ng S\u01A1n", text: "Sony A7R mid-exposure feedback available via hot shoe pin 4. Designing detection circuit." }],
  },
  { id: "ISS-020", pid: "PRJ-005", title: "IMU/GPS time synchronization drift on missions >30 min", titleVi: "Tr\u00F4i \u0111\u1ED3ng b\u1ED9 th\u1EDDi gian IMU/GPS trong bay d\u00E0i >30 ph\u00FAt", desc: "Not critical for standard mapping but affects high-precision corridor surveys. Can be mitigated by PPS-based re-sync every 10 seconds.", rootCause: "IMU internal clock drifts 2.5ppm. Over 30-minute mission, accumulated drift = 4.5ms, causing position interpolation error.", status: "DRAFT", sev: "MEDIUM", src: "INTERNAL", owner: "Tr\u1EA7n Minh Khoa", phase: "EVT", created: "2026-02-18", due: "2026-04-01",
    impacts: [],
    updates: [{ date: "2026-02-18", author: "Tr\u1EA7n Minh Khoa", text: "Drift measured across 5 flights \u2014 consistent 2.5ppm pattern" }],
  },
  { id: "ISS-021", pid: "PRJ-005", title: "SD card write speed insufficient for 4K 60fps raw capture", titleVi: "T\u1ED1c \u0111\u1ED9 ghi th\u1EBB SD kh\u00F4ng \u0111\u1EE7 cho quay RAW 4K 60fps", desc: "Need to upgrade to V60 or V90 SD card, or switch to CFexpress. Also evaluating NVMe SSD module. Cost impact: $30-80 per unit increase.", rootCause: "Current V30 SD card sustained write: 30MB/s. 4K RAW 60fps requires 45MB/s minimum. Frame drops after 90 seconds.", status: "OPEN", sev: "HIGH", src: "EXTERNAL", owner: "\u0110\u1ED7 Ho\u00E0ng S\u01A1n", phase: "EVT", created: "2026-02-10", due: "2026-03-15",
    impacts: [],
    updates: [{ date: "2026-02-10", author: "\u0110\u1ED7 Ho\u00E0ng S\u01A1n", text: "Tested 3 SD cards: Samsung PRO Plus V30, SanDisk Extreme V30, Lexar V60" }, { date: "2026-02-17", author: "\u0110\u1ED7 Ho\u00E0ng S\u01A1n", text: "Lexar V60 sustained 55MB/s \u2014 passes requirement. Cost +$35/unit" }, { date: "2026-02-22", author: "Ph\u1EA1m Thu Trang", text: "Approved V60 upgrade. Updating BOM." }],
  },
];

const TEAM = [
  { name: "Minh Tu\u1EA5n", role: "pm", projects: ["PRJ-001"] },
  { name: "H\u1ED3ng Ph\u00FAc", role: "pm", projects: ["PRJ-002"] },
  { name: "\u0110\u1EE9c Anh", role: "engineer", projects: ["PRJ-001"] },
  { name: "Thanh H\u00E0", role: "engineer", projects: ["PRJ-001"] },
  { name: "V\u0103n H\u00F9ng", role: "engineer", projects: ["PRJ-001", "PRJ-002"] },
  { name: "B\u1EA3o Tr\u00E2m", role: "engineer", projects: ["PRJ-002"] },
  { name: "Qu\u1EF3nh Anh", role: "admin", projects: ["PRJ-001", "PRJ-002", "PRJ-003"] },
  { name: "Tr\u1EA7n Minh Khoa", role: "engineer", projects: ["PRJ-003", "PRJ-005"] },
  { name: "L\u00EA Th\u1ECB Ph\u01B0\u01A1ng", role: "engineer", projects: ["PRJ-004"] },
  { name: "Nguy\u1EC5n H\u1EA3i Nam", role: "engineer", projects: ["PRJ-003"] },
  { name: "Ph\u1EA1m Thu Trang", role: "pm", projects: ["PRJ-004", "PRJ-005"] },
  { name: "V\u0169 \u0110\u00ECnh To\u00E0n", role: "engineer", projects: ["PRJ-001", "PRJ-004"] },
  { name: "\u0110\u1ED7 Ho\u00E0ng S\u01A1n", role: "engineer", projects: ["PRJ-002", "PRJ-005"] },
  { name: "L\u00FD Thanh Mai", role: "viewer", projects: ["PRJ-001", "PRJ-002", "PRJ-003", "PRJ-004", "PRJ-005"] },
  { name: "B\u00F9i Qu\u1ED1c Vi\u1EC7t", role: "engineer", projects: ["PRJ-001", "PRJ-003"] },
];

const NOTIFICATIONS_DATA = [
  { id: 1, type: "CRITICAL_ISSUE", title: "New CRITICAL: ESC CAN bus timeout", titleVi: "CRITICAL m\u1EDBi: ESC CAN bus h\u1EBFt th\u1EDDi gian", ref: "ISS-004", time: "2h ago", timeVi: "2 gi\u1EDD tr\u01B0\u1EDBc", read: false },
  { id: 2, type: "MILESTONE_IMPACT", title: "DVT milestone shifted +2 weeks (PRJ-001)", titleVi: "DVT milestone d\u1ECBch +2 tu\u1EA7n (PRJ-001)", ref: "PRJ-001", time: "5h ago", timeVi: "5 gi\u1EDD tr\u01B0\u1EDBc", read: false },
  { id: 3, type: "OVERDUE_ISSUE", title: "ISS-006 overdue by 3 days", titleVi: "ISS-006 qu\u00E1 h\u1EA1n 3 ng\u00E0y", ref: "ISS-006", time: "1d ago", timeVi: "1 ng\u00E0y tr\u01B0\u1EDBc", read: true },
  { id: 4, type: "GATE_CHANGE", title: "DVT gate: Thermal test now passed", titleVi: "C\u1ED5ng DVT: Test nhi\u1EC7t \u0111\u00E3 \u0111\u1EA1t", ref: "PRJ-001", time: "2d ago", timeVi: "2 ng\u00E0y tr\u01B0\u1EDBc", read: true },
  { id: 5, type: "CRITICAL_ISSUE", title: "New CRITICAL: Battery connector overheating (PRJ-002)", titleVi: "CRITICAL m\u1EDBi: \u0110\u1EA7u n\u1ED1i pin qu\u00E1 nhi\u1EC7t (PRJ-002)", ref: "ISS-010", time: "4h ago", timeVi: "4 gi\u1EDD tr\u01B0\u1EDBc", read: false },
  { id: 6, type: "MILESTONE_IMPACT", title: "EVT milestone shifted +2 weeks (PRJ-002)", titleVi: "EVT milestone d\u1ECBch +2 tu\u1EA7n (PRJ-002)", ref: "PRJ-002", time: "1d ago", timeVi: "1 ng\u00E0y tr\u01B0\u1EDBc", read: false },
  { id: 7, type: "OVERDUE_ISSUE", title: "ISS-009 pump pressure loss — testing fix", titleVi: "ISS-009 m\u1EA5t \u00E1p b\u01A1m — \u0111ang test s\u1EEDa", ref: "ISS-009", time: "3h ago", timeVi: "3 gi\u1EDD tr\u01B0\u1EDBc", read: false },
  { id: 8, type: "CRITICAL_ISSUE", title: "ISS-017: IP67 seal failure (PRJ-004)", titleVi: "ISS-017: L\u1ED7i seal IP67 (PRJ-004)", ref: "ISS-017", time: "4d ago", timeVi: "4 ng\u00E0y tr\u01B0\u1EDBc", read: false },
  { id: 9, type: "OVERDUE_ISSUE", title: "FLT-103: Environmental test FAIL", titleVi: "FLT-103: Test m\u00F4i tr\u01B0\u1EDDng FAIL", ref: "FLT-103", time: "19d ago", timeVi: "19 ng\u00E0y tr\u01B0\u1EDBc", read: false },
  { id: 10, type: "MILESTONE_IMPACT", title: "PRJ-004: PVT +3 weeks cascade", titleVi: "PRJ-004: PVT +3 tu\u1EA7n cascade", ref: "PRJ-004", time: "4d ago", timeVi: "4 ng\u00E0y tr\u01B0\u1EDBc", read: true },
  { id: 11, type: "OVERDUE_ISSUE", title: "ISS-017: 4 days overdue", titleVi: "ISS-017: Qu\u00E1 h\u1EA1n 4 ng\u00E0y", ref: "ISS-017", time: "1d ago", timeVi: "1 ng\u00E0y tr\u01B0\u1EDBc", read: true },
  { id: 12, type: "GATE_CHANGE", title: "ISS-020: IMU sync drift \u2014 pending review", titleVi: "ISS-020: Tr\u00F4i \u0111\u1ED3ng b\u1ED9 IMU \u2014 ch\u1EDD duy\u1EC7t", ref: "ISS-020", time: "6d ago", timeVi: "6 ng\u00E0y tr\u01B0\u1EDBc", read: false },
  { id: 13, type: "MILESTONE_IMPACT", title: "PRJ-004: DVT \u2192 PVT completed", titleVi: "PRJ-004: DVT \u2192 PVT ho\u00E0n th\u00E0nh", ref: "PRJ-004", time: "45d ago", timeVi: "45 ng\u00E0y tr\u01B0\u1EDBc", read: true },
  { id: 14, type: "GATE_CHANGE", title: "PRJ-005 EVT: RTK accuracy verified", titleVi: "PRJ-005 EVT: X\u00E1c nh\u1EADn RTK", ref: "PRJ-005", time: "23d ago", timeVi: "23 ng\u00E0y tr\u01B0\u1EDBc", read: true },
  { id: 15, type: "CRITICAL_ISSUE", title: "ISS-019 assigned to \u0110\u1ED7 Ho\u00E0ng S\u01A1n", titleVi: "ISS-019 giao cho \u0110\u1ED7 Ho\u00E0ng S\u01A1n", ref: "ISS-019", time: "12d ago", timeVi: "12 ng\u00E0y tr\u01B0\u1EDBc", read: true },
];

// ===================================================================
// REUSABLE COMPONENTS
// ===================================================================

// mono, sans imported from ./constants/

function Badge({ label, color, size = "sm", glow, icon: IconComp }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: size === "sm" ? "1px 7px" : "3px 10px", borderRadius: 3, background: color + "15", color, fontSize: size === "sm" ? 9 : 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", border: `1px solid ${color}25`, fontFamily: mono, whiteSpace: "nowrap", boxShadow: glow ? `0 0 8px ${color}30` : "none" }}>
      {IconComp ? <IconComp size={size === "sm" ? 10 : 12} /> : <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />}
      {label}
    </span>
  );
}

function Metric({ label, value, color = "var(--text-primary)", sub, icon: IconComp, onClick, active, sparkData, sparkTrend }) {
  return (
    <div onClick={onClick} style={{ background: "var(--bg-input)", border: `1px solid ${active ? color : "var(--border)"}`, borderRadius: 6, padding: "12px 14px", position: "relative", overflow: "hidden", flex: 1, minWidth: 0, cursor: onClick ? "pointer" : "default", transition: "border-color 0.2s, box-shadow 0.2s", boxShadow: active ? `0 0 0 1px ${color}40` : "none" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: active ? 3 : 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div style={{ fontSize: 12, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, fontWeight: 600, fontFamily: sans, display: "flex", alignItems: "center", gap: 4 }}>
        {IconComp && <IconComp size={11} />}
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 6 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: mono, lineHeight: 1 }}>{value}</div>
        {sparkData && sparkTrend && (() => {
          const delta = sparkData[sparkData.length - 1] - sparkData[sparkData.length - 2];
          const isGood = sparkTrend === "neutral" ? null : (sparkTrend === "up-good" ? delta >= 0 : delta <= 0);
          const arrowColor = isGood === null ? "var(--text-faint)" : isGood ? "#22C55E" : "#EF4444";
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 10, fontFamily: mono, color: arrowColor, fontWeight: 700 }}>
              {delta > 0 ? "▲" : delta < 0 ? "▼" : "─"}{Math.abs(delta)}
            </div>
          );
        })()}
      </div>
      {sparkData && (
        <div style={{ marginTop: 4, height: 28, minWidth: 50, minHeight: 28 }}>
          <SafeResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <LineChart data={sparkData.map(v => ({ v }))}>
              <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </SafeResponsiveContainer>
        </div>
      )}
      {sub && <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 3, fontFamily: sans }}>{sub}</div>}
    </div>
  );
}

function Btn({ children, onClick, variant = "default", small, disabled }) {
  const styles = {
    default: { bg: "var(--hover-bg)", border: "var(--border)", color: "var(--text-secondary)" },
    primary: { bg: "#1D4ED8", border: "#2563EB", color: "#fff" },
    danger: { bg: "#7F1D1D", border: "#991B1B", color: "#FCA5A5" },
    success: { bg: "#065F46", border: "#047857", color: "#6EE7B7" },
    ghost: { bg: "transparent", border: "transparent", color: "var(--text-dim)" },
  };
  const s = styles[variant];
  return (
    <button onClick={onClick} disabled={disabled} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 4, padding: small ? "3px 8px" : "6px 12px", color: s.color, fontSize: small ? 9 : 10, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, fontFamily: sans, transition: "all 0.15s", letterSpacing: "0.03em", display: "inline-flex", alignItems: "center", gap: 4 }}>
      {children}
    </button>
  );
}

function Section({ title, children, actions, noPad }) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      {title && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: sans, display: "flex", alignItems: "center", gap: 6, flex: 1 }}>{title}</div>
          {actions && <div style={{ display: "flex", gap: 6 }}>{actions}</div>}
        </div>
      )}
      <div style={{ padding: noPad ? 0 : 16 }}>{children}</div>
    </div>
  );
}

function NotifIcon({ type }) {
  if (type === "CRITICAL_ISSUE") return <CircleAlert size={13} color="#EF4444" />;
  if (type === "MILESTONE_IMPACT") return <Zap size={13} color="#F59E0B" />;
  if (type === "OVERDUE_ISSUE") return <Timer size={13} color="#F97316" />;
  return <DoorOpen size={13} color="#8B5CF6" />;
}

// ===================================================================
// GATE ITEM
// ===================================================================
function GateItem({ cond, lang, t, checked, onClick, disabled }) {
  return (
    <div onClick={disabled ? undefined : onClick}
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 4, background: checked ? "#10B98108" : "#1E2A3A08", cursor: disabled ? "default" : "pointer", border: `1px solid ${checked ? "#10B98120" : "transparent"}`, marginBottom: 3 }}>
      <div style={{ width: 15, height: 15, borderRadius: 3, border: `2px solid ${checked ? "#10B981" : "var(--text-faint)"}`, background: checked ? "#10B981" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {checked && <Check size={9} color="#000" strokeWidth={3} />}
      </div>
      <span style={{ fontSize: 13, color: checked ? "var(--text-dim)" : "var(--text-secondary)", textDecoration: checked ? "line-through" : "none", flex: 1 }}>
        {lang === "vi" ? cond.label_vi : cond.label}
      </span>
      {cond.required && <span style={{ fontSize: 10, color: "#EF4444", fontWeight: 700, letterSpacing: "0.05em" }}>{t.gate.required}</span>}
    </div>
  );
}

// ===================================================================
// CREATE ISSUE FORM
// ===================================================================
function CreateIssueForm({ t, lang, selProject, onClose, onCreate, initialStatus = "DRAFT", teamMembers }) {
  const [form, setForm] = useState({ title: "", titleVi: "", desc: "", rootCause: "Investigating", sev: "HIGH", src: "INTERNAL", owner: "", phase: "DVT", due: "" });
  const owners = (teamMembers || TEAM).filter(m => m.role === "engineer").map(m => m.name);
  const isDirty = form.title || form.titleVi || form.desc || form.owner || form.due || form.rootCause !== "Investigating" || form.sev !== "HIGH" || form.src !== "INTERNAL" || form.phase !== "DVT";
  const handleClose = () => { if (!isDirty || window.confirm(t.unsavedChanges)) onClose(); };

  const handleCreate = () => {
    if (!form.title || !form.owner) return;
    const newIssue = {
      id: `ISS-${String(ISSUES_DATA.length + Math.floor(Math.random() * 100) + 1).padStart(3, "0")}`,
      pid: selProject, title: form.title, titleVi: form.titleVi || form.title, desc: form.desc,
      rootCause: form.rootCause, status: initialStatus, sev: form.sev, src: form.src,
      owner: form.owner, phase: form.phase, created: new Date().toISOString().split("T")[0],
      due: form.due || "", impacts: [], updates: [{ date: new Date().toISOString().split("T")[0], author: form.owner, text: "Issue created" }],
    };
    onCreate(newIssue);
  };

  const inputStyle = { background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 4, padding: "6px 10px", color: "var(--text-primary)", fontSize: 14, width: "100%", outline: "none", fontFamily: sans };
  const selectStyle = { ...inputStyle, cursor: "pointer" };
  const labelStyle = { fontSize: 12, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 3, fontWeight: 600 };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>{t.issue.title} (EN) *</label>
        <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Issue title in English..." />
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>{t.issue.title} (VI)</label>
        <input style={inputStyle} value={form.titleVi} onChange={e => setForm(f => ({ ...f, titleVi: e.target.value }))} placeholder="Tiêu đề tiếng Việt..." />
      </div>
      <div>
        <label style={labelStyle}>{t.issue.severity} *</label>
        <select style={selectStyle} value={form.sev} onChange={e => setForm(f => ({ ...f, sev: e.target.value }))}>
          {SEV_LIST.map(s => <option key={s} value={s}>{t.severity[s]}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>{t.issue.source} *</label>
        <select style={selectStyle} value={form.src} onChange={e => setForm(f => ({ ...f, src: e.target.value }))}>
          {SRC_LIST.map(s => <option key={s} value={s}>{t.source[s]}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>{t.issue.owner} *</label>
        <select style={selectStyle} value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}>
          <option value="">Select...</option>
          {owners.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>{t.issue.phase} *</label>
        <select style={selectStyle} value={form.phase} onChange={e => setForm(f => ({ ...f, phase: e.target.value }))}>
          {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>{t.issue.rootCause}</label>
        <input style={inputStyle} value={form.rootCause} onChange={e => setForm(f => ({ ...f, rootCause: e.target.value }))} />
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>{t.issue.dueDate}</label>
        <input type="date" style={inputStyle} value={form.due} onChange={e => setForm(f => ({ ...f, due: e.target.value }))} />
      </div>
      <div style={{ gridColumn: "1 / -1", display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <Btn onClick={handleClose}><X size={11} /> {t.cancel}</Btn>
        <Btn variant="primary" onClick={handleCreate} disabled={!form.title || !form.owner}><Plus size={11} /> {t.issue.create} ({initialStatus})</Btn>
      </div>
    </div>
  );
}

// ===================================================================
// MAIN APP
// ===================================================================
export default function App() {
  const { user: currentUser, isAuthenticated, isLoading, logout, switchUser, demoUsers } = useAuth();
  const perm = usePermission();
  const audit = useAuditLog();
  const [lang, setLang] = useState(() => localStorage.getItem('rtr-lang') || "vi");
  const [tab, setTab] = useState(() => localStorage.getItem('rtr-tab') || "tower");
  const [selProject, setSelProject] = useState(() => localStorage.getItem('rtr-project') || "PRJ-001");
  const [selIssue, setSelIssue] = useState(null);
  const [filters, setFilters] = useState({ status: "ALL", sev: "ALL", src: "ALL" });
  const [issueSearch, setIssueSearch] = useState("");

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
  const [offlineProjects, setOfflineProjects] = useState(PROJECTS);
  const [offlineIssues, setOfflineIssues] = useState(ISSUES_DATA);
  const [offlineNotifications, setOfflineNotifications] = useState(NOTIFICATIONS_DATA);

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
  const teamMembers = online && sbTeam.length > 0 ? sbTeam : TEAM;

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

  useEffect(() => { const i = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(i); }, []);
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
    return f;
  }, [issues, selProject, filters, issueSearch]);

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

  // Auth guard — loading spinner
  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-main)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <RefreshCw size={24} color="#3B82F6" style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
      </div>
    );
  }

  // Auth guard — show login screen
  if (!isAuthenticated) {
    return <LoginScreen onLogin={(user, selectedLang) => { setLang(selectedLang); audit.log("USER_LOGIN", "user", user.id, user.name, null, user.role, { _asUser: user }); }} initialLang={lang} />;
  }

  // --- Computed metrics ---
  const allOpen = issues.filter(i => i.status !== "CLOSED");
  const allCrit = issues.filter(i => i.sev === "CRITICAL" && i.status !== "CLOSED");
  const allBlocked = issues.filter(i => i.status === "BLOCKED");
  const cascadeIssues = issues.filter(i => i.status !== "CLOSED" && i.impacts.length > 0);
  const draftIssues = issues.filter(i => i.pid === selProject && i.status === "DRAFT");

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

  // --- Role icon ---
  const RoleIcon = ({ role }) => {
    if (role === "admin") return <Shield size={10} />;
    if (role === "pm") return <UserCog size={10} />;
    if (role === "engineer") return <Wrench size={10} />;
    return <Eye size={10} />;
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)", color: "var(--text-primary)", fontFamily: sans, fontSize: 14, display: "flex", flexDirection: "column" }}>

      {/* === HEADER === */}
      <div style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 48, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.3 }}>{t.appName}</div>
            <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{t.appSub}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Offline indicator */}
          {!online && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 8px", height: 28, background: "#F59E0B15", border: "1px solid #F59E0B30", borderRadius: 4 }}>
              <WifiOff size={12} color="#F59E0B" />
              <span style={{ fontSize: 11, color: "#F59E0B", fontWeight: 700 }}>{t.offline}</span>
            </div>
          )}
          {/* Project selector */}
          <div style={{ display: "flex", gap: 3 }}>
            {projects.map(p => (
              <button key={p.id} onClick={() => { setSelProject(p.id); setSelIssue(null); setIssueSearch(""); }}
                aria-label={p.name} aria-pressed={selProject === p.id}
                style={{ background: selProject === p.id ? "var(--hover-bg)" : "transparent", border: `1px solid ${selProject === p.id ? "#3B82F6" : "var(--border)"}`, borderRadius: 4, padding: "0 8px", height: 28, color: selProject === p.id ? "var(--text-primary)" : "var(--text-dim)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center" }}>
                {p.name.split(" ")[0]}
              </button>
            ))}
          </div>
          {/* Lang toggle */}
          <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden", alignItems: "center", height: 28 }}>
            <Globe size={11} style={{ margin: "0 4px", color: "var(--text-faint)" }} />
            {["vi", "en"].map(l => (
              <button key={l} onClick={() => setLang(l)} aria-label={l === "vi" ? "Tiếng Việt" : "English"} style={{ background: lang === l ? "var(--hover-bg)" : "transparent", border: "none", padding: "0 8px", height: 28, color: lang === l ? "var(--text-primary)" : "var(--text-faint)", fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "uppercase" }}>{l}</button>
            ))}
          </div>
          {/* Connection status indicator */}
          {(connStatus === 'connecting' || showOnline) && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 8px", height: 28, borderRadius: 4, border: "1px solid var(--border)", fontSize: 11, fontWeight: 600, color: connStatus === 'online' ? "#22C55E" : "#F59E0B", background: connStatus === 'online' ? "#22C55E10" : "#F59E0B10" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: connStatus === 'online' ? "#22C55E" : "#F59E0B", animation: connStatus === 'connecting' ? "pulse 1.5s infinite" : "none" }} />
              {connStatus === 'online' ? (lang === "vi" ? "Đã kết nối" : "Connected") : (lang === "vi" ? "Đang kết nối..." : "Connecting...")}
            </div>
          )}
          {/* Theme toggle */}
          <button onClick={() => setTheme(th => th === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "0 8px", height: 28, color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowNotif(!showNotif)} aria-label={t.notifications} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "0 8px", height: 28, color: "var(--text-muted)", cursor: "pointer", fontSize: 14, position: "relative", display: "flex", alignItems: "center" }}>
              <Bell size={14} />
              {unreadCount > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "#EF4444", color: "#fff", borderRadius: "50%", width: 14, height: 14, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{unreadCount}</span>}
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
          {/* User Menu */}
          <div style={{ position: "relative" }}>
            <button onClick={() => { setShowUserMenu(!showUserMenu); setShowNotif(false); }}
              aria-label={lang === "vi" ? "Menu người dùng" : "User menu"}
              style={{ background: showUserMenu ? "var(--hover-bg)" : "transparent", border: "1px solid var(--border)", borderRadius: 4, padding: "0 8px", height: 28, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--hover-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", flexShrink: 0 }}>{currentUser.avatar || currentUser.name[0]}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1, whiteSpace: "nowrap" }}>{currentUser.name}</div>
              <ChevronDown size={10} color="var(--text-faint)" />
            </button>
            {showUserMenu && (
              <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 6, width: 240, background: "var(--bg-modal)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "0 20px 40px var(--shadow-color)", zIndex: 200, overflow: "hidden" }}>
                {/* Current user info */}
                <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--hover-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--text-muted)" }}>{currentUser.avatar || currentUser.name[0]}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{currentUser.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{currentUser.email}</div>
                  </div>
                </div>
                {/* Switch Role — only in offline demo mode or for admin users */}
                {(!online || currentUser.role === "admin") && <div style={{ padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ padding: "4px 14px", fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                    {lang === "vi" ? "Chuyển vai trò" : "Switch Role"} {!online && <span style={{ fontSize: 9, color: "#F59E0B" }}>(DEMO)</span>}
                  </div>
                  {demoUsers.filter(u => u.id !== currentUser.id).map(u => {
                    const RIcon = { admin: Shield, pm: UserCog, engineer: Wrench, viewer: Eye }[u.role];
                    const rColor = { admin: "#EF4444", pm: "#3B82F6", engineer: "#F59E0B", viewer: "#6B7280" }[u.role];
                    return (
                      <button key={u.id} onClick={() => { audit.log("USER_ROLE_SWITCHED", "user", u.id, u.name, currentUser.role, u.role); switchUser(u.id); setShowUserMenu(false); }}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", width: "100%", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 13 }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--hover-bg)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${rColor}15`, border: `1px solid ${rColor}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <RIcon size={10} color={rColor} />
                        </div>
                        <div style={{ textAlign: "left" }}>
                          <div style={{ fontWeight: 600 }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: rColor, fontWeight: 700, textTransform: "uppercase" }}>{t.role[u.role]}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>}
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
          <div style={{ fontFamily: mono, fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3, fontWeight: 600 }}>
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
      <div className="tab-bar" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)", padding: "0 20px", display: "flex", gap: 0, overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => { setTab(tb.id); setSelMetric(null); setSelProjMetric(null); }}
            style={{ background: "none", border: "none", borderBottom: tab === tb.id ? "2px solid #3B82F6" : "2px solid transparent", padding: "9px 14px", color: tab === tb.id ? "var(--text-primary)" : "var(--text-dim)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: sans, flexShrink: 0, whiteSpace: "nowrap" }}>
            <tb.Icon size={13} />
            {tb.label}
            {tb.badge > 0 && <span style={{ background: "#EF4444", color: "#fff", borderRadius: 8, padding: "0 5px", fontSize: 11, fontWeight: 800, minWidth: 14, textAlign: "center" }}>{tb.badge}</span>}
          </button>
        ))}
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

        {/* === CONTROL TOWER === */}
        {tab === "tower" && project && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Export Buttons */}
            <div ref={headerActionsRef} style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
              {perm.canCreateIssue() && <Btn variant="primary" small onClick={() => setShowCreate(true)}><Plus size={11} /> {t.issue.create}</Btn>}
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
                  }} />
              </Section>
            )}
            {/* Global Metrics */}
            <div className="metric-row" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Metric label={t.metrics.activeProjects} value={projects.length} color="#3B82F6" icon={Layers} onClick={() => setSelMetric(s => s === "projects" ? null : "projects")} active={selMetric === "projects"} sparkData={sparklines.projects} sparkTrend="neutral" />
              <Metric label={t.metrics.openIssues} value={allOpen.length} color="#EF4444" icon={CircleAlert} onClick={() => setSelMetric(s => s === "open" ? null : "open")} active={selMetric === "open"} sparkData={sparklines.open} sparkTrend="down-good" />
              <Metric label={t.metrics.critical} value={allCrit.length} color={allCrit.length > 0 ? "#EF4444" : "#10B981"} icon={Flame} onClick={() => setSelMetric(s => s === "critical" ? null : "critical")} active={selMetric === "critical"} sparkData={sparklines.critical} sparkTrend="down-good" />
              <Metric label={t.metrics.blocked} value={allBlocked.length} color={allBlocked.length > 0 ? "#DC2626" : "#10B981"} icon={Ban} onClick={() => setSelMetric(s => s === "blocked" ? null : "blocked")} active={selMetric === "blocked"} sparkData={sparklines.blocked} sparkTrend="down-good" />
              <Metric label={t.metrics.closureRate} value={`${issues.length > 0 ? Math.round(issues.filter(i => i.status === "CLOSED").length / issues.length * 100) : 0}%`} color="#10B981" icon={CheckCircle2} onClick={() => setSelMetric(s => s === "closure" ? null : "closure")} active={selMetric === "closure"} sparkData={sparklines.closure} sparkTrend="up-good" />
              <Metric label={t.metrics.cascadeAlerts} value={cascadeIssues.length} color={cascadeIssues.length > 0 ? "#F59E0B" : "#10B981"} icon={Zap} onClick={() => setSelMetric(s => s === "cascade" ? null : "cascade")} active={selMetric === "cascade"} sparkData={sparklines.cascade} sparkTrend="down-good" />
            </div>

            {/* Metric Detail Panel */}
            {selMetric && (() => {
              const closedIssues = issues.filter(i => i.status === "CLOSED");
              const thStyle = { padding: "6px 10px", textAlign: "left", fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, borderBottom: "1px solid var(--border)", fontFamily: sans, whiteSpace: "nowrap", background: "var(--bg-card)" };
              const tdStyle = { padding: "6px 10px", fontSize: 13, color: "var(--text-secondary)", borderBottom: "1px solid var(--border)", fontFamily: sans };
              const rowHover = { cursor: "pointer" };
              const navigateToIssue = (issue) => { setSelProject(issue.pid); setTab("issues"); setSelIssue(issue); setSelMetric(null); };
              const navigateToProject = (projId) => { setSelProject(projId); setSelMetric(null); };
              const panelTitles = {
                projects: lang === "vi" ? "Tất cả dự án" : "All Projects",
                open: lang === "vi" ? "Vấn đề đang mở" : "Open Issues",
                critical: lang === "vi" ? "Vấn đề nghiêm trọng" : "Critical Issues",
                blocked: lang === "vi" ? "Vấn đề bị chặn" : "Blocked Issues",
                closure: lang === "vi" ? "Tỷ lệ đóng" : "Closure Summary",
                cascade: lang === "vi" ? "Cảnh báo cascade" : "Cascade Alerts",
              };
              const renderIssueTable = (issueList, showRootCause) => (
                <div style={{ overflowX: "auto", maxHeight: "60vh", overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr style={{ position: "sticky", top: 0, zIndex: 5 }}>
                      <th style={thStyle}>{t.issue.id}</th>
                      <th style={thStyle}>{t.issue.title}</th>
                      <th style={thStyle}>{t.issue.severity}</th>
                      <th style={thStyle}>{t.issue.status}</th>
                      <th style={thStyle}>{t.issue.owner}</th>
                      <th style={thStyle}>{lang === "vi" ? "Dự án" : "Project"}</th>
                      {showRootCause && <th style={thStyle}>{t.issue.rootCause}</th>}
                    </tr></thead>
                    <tbody>
                      {issueList.length === 0 && <tr><td colSpan={showRootCause ? 7 : 6} style={{ ...tdStyle, textAlign: "center", color: "var(--text-faint)", padding: 20 }}>{t.issue.noIssues}</td></tr>}
                      {issueList.map(issue => (
                        <tr key={issue.id} onClick={() => navigateToIssue(issue)} style={{ ...rowHover, transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "var(--hover-bg)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <td style={{ ...tdStyle, fontFamily: mono, fontWeight: 700, color: "#3B82F6", fontSize: 12 }}>{issue.id}</td>
                          <td style={{ ...tdStyle, maxWidth: 300 }}>{lang === "vi" ? (issue.titleVi || issue.title) : issue.title}</td>
                          <td style={tdStyle}><Badge label={t.severity[issue.sev]} color={SEV_COLORS[issue.sev]} /></td>
                          <td style={tdStyle}><Badge label={t.status[issue.status]} color={STATUS_COLORS[issue.status]} /></td>
                          <td style={tdStyle}>{issue.owner}</td>
                          <td style={{ ...tdStyle, fontFamily: mono, fontSize: 12 }}>{issue.pid}</td>
                          {showRootCause && <td style={{ ...tdStyle, fontSize: 12, color: "var(--text-faint)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{issue.rootCause || "—"}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
              return (
                <Section title={<><span style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>{panelTitles[selMetric]}</span></>} actions={<button onClick={() => setSelMetric(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", padding: 2, display: "flex" }}><X size={16} /></button>}>
                  {selMetric === "projects" && (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead><tr>
                          <th style={thStyle}>{t.issue.id}</th>
                          <th style={thStyle}>{lang === "vi" ? "Tên" : "Name"}</th>
                          <th style={thStyle}>{t.issue.phase}</th>
                          <th style={thStyle}>{t.phaseOwner}</th>
                          <th style={thStyle}>{lang === "vi" ? "Vấn đề mở" : "Open Issues"}</th>
                          <th style={thStyle}>{t.targetMP}</th>
                        </tr></thead>
                        <tbody>
                          {projects.map(proj => {
                            const pOpen = issues.filter(i => i.pid === proj.id && i.status !== "CLOSED").length;
                            return (
                              <tr key={proj.id} onClick={() => navigateToProject(proj.id)} style={{ ...rowHover, transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "var(--hover-bg)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                <td style={{ ...tdStyle, fontFamily: mono, fontWeight: 700, color: "#3B82F6", fontSize: 12 }}>{proj.id}</td>
                                <td style={{ ...tdStyle, fontWeight: 600 }}>{proj.name}</td>
                                <td style={tdStyle}><Badge label={proj.phase} color={PHASE_COLORS[proj.phase]} size="md" /></td>
                                <td style={tdStyle}>{proj.phaseOwner}</td>
                                <td style={{ ...tdStyle, fontFamily: mono }}>{pOpen}</td>
                                <td style={{ ...tdStyle, fontFamily: mono, fontSize: 12 }}>{proj.targetMP}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {selMetric === "open" && renderIssueTable(allOpen, false)}
                  {selMetric === "critical" && renderIssueTable(allCrit, false)}
                  {selMetric === "blocked" && renderIssueTable(allBlocked, true)}
                  {selMetric === "closure" && (
                    <div>
                      <div style={{ display: "flex", gap: 16, marginBottom: 14, padding: "8px 0" }}>
                        <div style={{ fontFamily: mono, fontSize: 14, color: "var(--text-secondary)" }}><span style={{ color: "#10B981", fontWeight: 800, fontSize: 20 }}>{closedIssues.length}</span> / {issues.length} {lang === "vi" ? "đã đóng" : "closed"}</div>
                        <div style={{ fontFamily: mono, fontSize: 14, color: "var(--text-secondary)" }}><span style={{ color: "#10B981", fontWeight: 800, fontSize: 20 }}>{Math.round(closedIssues.length / issues.length * 100)}%</span> {lang === "vi" ? "tỷ lệ" : "rate"}</div>
                      </div>
                      {renderIssueTable(closedIssues, false)}
                    </div>
                  )}
                  {selMetric === "cascade" && (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead><tr>
                          <th style={thStyle}>{t.issue.id}</th>
                          <th style={thStyle}>{t.issue.title}</th>
                          <th style={thStyle}>{t.issue.severity}</th>
                          <th style={thStyle}>{lang === "vi" ? "Ảnh hưởng" : "Impact Chain"}</th>
                        </tr></thead>
                        <tbody>
                          {cascadeIssues.length === 0 && <tr><td colSpan={4} style={{ ...tdStyle, textAlign: "center", color: "var(--text-faint)", padding: 20 }}>{t.issue.noIssues}</td></tr>}
                          {cascadeIssues.map(issue => (
                            <tr key={issue.id} onClick={() => navigateToIssue(issue)} style={{ ...rowHover, transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "var(--hover-bg)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                              <td style={{ ...tdStyle, fontFamily: mono, fontWeight: 700, color: "#3B82F6", fontSize: 12 }}>{issue.id}</td>
                              <td style={{ ...tdStyle, maxWidth: 250 }}>{lang === "vi" ? (issue.titleVi || issue.title) : issue.title}</td>
                              <td style={tdStyle}><Badge label={t.severity[issue.sev]} color={SEV_COLORS[issue.sev]} /></td>
                              <td style={tdStyle}>
                                <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                                  {issue.impacts.map((imp, ii) => (
                                    <span key={ii} style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                      <span style={{ background: `${PHASE_COLORS[imp.phase]}15`, border: `1px solid ${PHASE_COLORS[imp.phase]}25`, borderRadius: 3, padding: "1px 6px", fontSize: 11, color: PHASE_COLORS[imp.phase], fontWeight: 700, fontFamily: mono }}>{imp.phase} +{Math.ceil(imp.days / 7)}w</span>
                                      {ii < issue.impacts.length - 1 && <ArrowRight size={10} color="var(--text-faint)" />}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Section>
              );
            })()}

            {/* AI Risk Assessment */}
            <AIRiskPanel projects={projects} issues={issues} gateConfig={activeGateConfig} flightTests={allFlights} lang={lang} />

            {/* Business Overview */}
            {(() => {
              const fmtV = (n) => n >= 1000000 ? `$${(n/1000000).toFixed(1)}M` : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${n.toFixed(0)}`;
              const pipelineValue = ordersList.filter(o => !['CANCELLED', 'CLOSED', 'PAID'].includes(o.status)).reduce((s, o) => s + (o.totalAmount || 0), 0);
              const overdueOrders = ordersList.filter(o => o.requiredDeliveryDate && new Date(o.requiredDeliveryDate) < new Date() && !['DELIVERED','SHIPPED','PAID','CLOSED','CANCELLED'].includes(o.status)).length;
              const activeWOs = productionOrdersList.filter(w => ['IN_PROGRESS', 'QC', 'MATERIAL_READY'].includes(w.status)).length;
              const critStock = inventoryList.filter(i => i.stockStatus === 'CRITICAL').length;
              const lowStock = inventoryList.filter(i => i.stockStatus === 'LOW').length;
              const hasBizData = ordersList.length > 0 || productionOrdersList.length > 0 || inventoryList.length > 0;
              if (!hasBizData) return null;
              return (
                <Section title={<><BarChart3 size={14} color="#3B82F6" /> {lang === "vi" ? "Tổng Quan Kinh Doanh" : "Business Overview"}</>}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Metric label={lang === "vi" ? "Đơn hàng" : "Orders"} value={ordersList.length} color="#3B82F6" icon={ShoppingCart} onClick={() => setTab("orders")} />
                    <Metric label="Pipeline" value={fmtV(pipelineValue)} color="#10B981" icon={DollarSign} onClick={() => setTab("orders")} />
                    <Metric label={lang === "vi" ? "Quá hạn" : "Overdue"} value={overdueOrders} color={overdueOrders > 0 ? "#EF4444" : "#64748B"} icon={AlertTriangle} onClick={() => setTab("orders")} />
                    <Metric label={lang === "vi" ? "WO đang chạy" : "Active WOs"} value={activeWOs} color="#F59E0B" icon={Factory} onClick={() => setTab("production")} />
                    <Metric label={lang === "vi" ? "Tồn kho cảnh báo" : "Stock Alerts"} value={critStock + lowStock} color={critStock > 0 ? "#EF4444" : lowStock > 0 ? "#F59E0B" : "#64748B"} icon={Warehouse} onClick={() => setTab("inventory")} />
                  </div>
                </Section>
              );
            })()}

            {/* Project Cards */}
            {projects.map(proj => {
              const pIssues = issues.filter(i => i.pid === proj.id);
              const pOpen = pIssues.filter(i => i.status !== "CLOSED");
              const pCrit = pOpen.filter(i => i.sev === "CRITICAL");
              const gp = getGateProgress(proj, proj.phase);
              const phaseIdx = PHASES.indexOf(proj.phase);
              return (
                <Section key={proj.id} title={null}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 13, color: "#3B82F6", fontFamily: mono, fontWeight: 700 }}>{proj.id}</span>
                        <Badge label={proj.phase} color={PHASE_COLORS[proj.phase]} size="md" glow />
                        {(() => { const ps = intel.getProjectScore(proj.id); if (!ps) return null; const lc = { healthy: "#10B981", attention: "#F59E0B", warning: "#F97316", critical: "#EF4444" }[ps.level] || "#6B7280"; return <Badge label={`PHI ${Math.round(ps.score)}`} color={lc} />; })()}
                        {intel.getProjectConvergences(proj.id).length > 0 && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444", display: "inline-block", animation: "pulse 1.5s infinite" }} />}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>{proj.name}</div>
                      <div style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 1 }}>{lang === "vi" ? proj.descVi : proj.desc}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}><User size={9} /> {t.phaseOwner}</div>
                      <div style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 700 }}>{proj.phaseOwner}</div>
                      <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4, display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}><Target size={9} /> {t.targetMP}: {proj.targetMP}</div>
                    </div>
                  </div>
                  {/* Phase Timeline */}
                  <div style={{ display: "flex", alignItems: "center", gap: 0, width: "100%", marginBottom: 14 }}>
                    {PHASES.map((ph, i) => {
                      const active = i === phaseIdx;
                      const done = i < phaseIdx;
                      const c = PHASE_COLORS[ph];
                      const ms = proj.milestones[ph];
                      const shifted = ms.adjusted && ms.adjusted !== ms.target;
                      return (
                        <div key={ph} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                          {i > 0 && <div style={{ position: "absolute", top: 11, right: "50%", width: "100%", height: 2, background: done ? c : "var(--hover-bg)", zIndex: 0 }} />}
                          <div style={{ width: active ? 24 : 18, height: active ? 24 : 18, borderRadius: "50%", background: done ? c : active ? c : "var(--bg-input)", border: `2px solid ${done || active ? c : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1, boxShadow: active ? `0 0 12px ${c}40` : "none" }}>
                            {done && <Check size={10} color="#000" strokeWidth={3} />}
                            {active && <Circle size={6} fill="#000" color="#000" />}
                          </div>
                          <div style={{ marginTop: 4, fontSize: 12, fontWeight: active ? 800 : 600, color: active ? c : done ? "var(--text-muted)" : "var(--text-faint)" }}>{ph}</div>
                          <div style={{ fontSize: 11, color: shifted ? "#F59E0B" : "var(--text-faint)", marginTop: 1, fontFamily: mono, display: "flex", alignItems: "center", gap: 2 }}>
                            {ms.status === "COMPLETED" ? <><Check size={8} color="#10B981" /> {ms.actual}</> : shifted ? <><AlertTriangle size={8} /> {ms.adjusted}</> : ms.target}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Mini Metrics */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <Metric label={t.metrics.openIssues} value={pOpen.length} color={pOpen.length > 0 ? "#EF4444" : "#10B981"} icon={CircleAlert}
                      onClick={() => setSelProjMetric(s => s?.projId === proj.id && s?.type === "open" ? null : { projId: proj.id, type: "open" })}
                      active={selProjMetric?.projId === proj.id && selProjMetric?.type === "open"} />
                    <Metric label={t.metrics.critical} value={pCrit.length} color={pCrit.length > 0 ? "#EF4444" : "#10B981"} icon={Flame}
                      onClick={() => setSelProjMetric(s => s?.projId === proj.id && s?.type === "critical" ? null : { projId: proj.id, type: "critical" })}
                      active={selProjMetric?.projId === proj.id && selProjMetric?.type === "critical"} />
                    <Metric label={t.gateProgress} value={`${gp.pct}%`} color={gp.canPass ? "#10B981" : "#3B82F6"} icon={DoorOpen} sub={`${gp.passed}/${gp.total} ${t.gate.passed}`}
                      onClick={() => setSelProjMetric(s => s?.projId === proj.id && s?.type === "gate" ? null : { projId: proj.id, type: "gate" })}
                      active={selProjMetric?.projId === proj.id && selProjMetric?.type === "gate"} />
                    <Metric label={t.metrics.cascadeAlerts} value={getCascade(proj).length} color={getCascade(proj).length > 0 ? "#F59E0B" : "#10B981"} icon={Zap}
                      onClick={() => setSelProjMetric(s => s?.projId === proj.id && s?.type === "cascade" ? null : { projId: proj.id, type: "cascade" })}
                      active={selProjMetric?.projId === proj.id && selProjMetric?.type === "cascade"} />
                  </div>
                  {/* Per-Project Metric Detail */}
                  {selProjMetric?.projId === proj.id && (() => {
                    const pmThStyle = { padding: "5px 10px", textAlign: "left", fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, borderBottom: "1px solid var(--border)", fontFamily: sans, whiteSpace: "nowrap" };
                    const pmTdStyle = { padding: "5px 10px", fontSize: 13, color: "var(--text-secondary)", borderBottom: "1px solid var(--border)", fontFamily: sans };
                    const pmNavigate = (issue) => { setSelProject(issue.pid); setTab("issues"); setSelIssue(issue); setSelProjMetric(null); };
                    const pmType = selProjMetric.type;
                    const pBlocked = pOpen.filter(i => i.status === "BLOCKED");
                    const pCascade = getCascade(proj);
                    const gateConds = activeGateConfig[proj.phase]?.conditions || [];
                    const gateChecks = proj.gateChecks[proj.phase] || {};
                    const pmTitles = {
                      open: `${proj.id} — ${lang === "vi" ? "Vấn đề đang mở" : "Open Issues"} (${pOpen.length})`,
                      critical: `${proj.id} — ${lang === "vi" ? "Vấn đề nghiêm trọng" : "Critical Issues"} (${pCrit.length})`,
                      gate: `${proj.id} — ${t.gateProgress} ${proj.phase} (${gp.passed}/${gp.total})`,
                      cascade: `${proj.id} — ${lang === "vi" ? "Cảnh báo cascade" : "Cascade Alerts"} (${pCascade.length})`,
                    };
                    const pmRenderIssues = (list) => (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead><tr>
                            <th style={pmThStyle}>{t.issue.id}</th>
                            <th style={pmThStyle}>{t.issue.title}</th>
                            <th style={pmThStyle}>{t.issue.severity}</th>
                            <th style={pmThStyle}>{t.issue.status}</th>
                            <th style={pmThStyle}>{t.issue.owner}</th>
                          </tr></thead>
                          <tbody>
                            {list.length === 0 && <tr><td colSpan={5} style={{ ...pmTdStyle, textAlign: "center", color: "var(--text-faint)", padding: 16 }}>{t.issue.noIssues}</td></tr>}
                            {list.map(issue => (
                              <tr key={issue.id} onClick={() => pmNavigate(issue)} style={{ cursor: "pointer", transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "var(--hover-bg)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                <td style={{ ...pmTdStyle, fontFamily: mono, fontWeight: 700, color: "#3B82F6", fontSize: 12 }}>{issue.id}</td>
                                <td style={{ ...pmTdStyle, maxWidth: 280 }}>{lang === "vi" ? (issue.titleVi || issue.title) : issue.title}</td>
                                <td style={pmTdStyle}><Badge label={t.severity[issue.sev]} color={SEV_COLORS[issue.sev]} /></td>
                                <td style={pmTdStyle}><Badge label={t.status[issue.status]} color={STATUS_COLORS[issue.status]} /></td>
                                <td style={pmTdStyle}>{issue.owner}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                    return (
                      <div style={{ marginTop: 10, background: "var(--bg-main)", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: sans }}>{pmTitles[pmType]}</div>
                          <button onClick={() => setSelProjMetric(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", padding: 2, display: "flex" }}><X size={14} /></button>
                        </div>
                        <div style={{ padding: 12 }}>
                          {pmType === "open" && pmRenderIssues(pOpen)}
                          {pmType === "critical" && pmRenderIssues(pCrit)}
                          {pmType === "gate" && (
                            <div style={{ overflowX: "auto" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead><tr>
                                  <th style={pmThStyle}>#</th>
                                  <th style={pmThStyle}>{lang === "vi" ? "Điều kiện" : "Condition"}</th>
                                  <th style={pmThStyle}>{lang === "vi" ? "Bắt buộc" : "Required"}</th>
                                  <th style={pmThStyle}>{lang === "vi" ? "Trạng thái" : "Status"}</th>
                                </tr></thead>
                                <tbody>
                                  {gateConds.length === 0 && <tr><td colSpan={4} style={{ ...pmTdStyle, textAlign: "center", color: "var(--text-faint)", padding: 16 }}>{lang === "vi" ? "Chưa có điều kiện" : "No conditions"}</td></tr>}
                                  {gateConds.map((cond, ci) => {
                                    const checked = !!gateChecks[cond.id];
                                    return (
                                      <tr key={cond.id}>
                                        <td style={{ ...pmTdStyle, fontFamily: mono, fontSize: 12, color: "var(--text-faint)" }}>{ci + 1}</td>
                                        <td style={pmTdStyle}>{lang === "vi" ? cond.label_vi : cond.label}</td>
                                        <td style={pmTdStyle}>{cond.required ? <Badge label={t.gate.required} color="#F59E0B" /> : <span style={{ fontSize: 11, color: "var(--text-faint)" }}>—</span>}</td>
                                        <td style={pmTdStyle}>{checked ? <Badge label={lang === "vi" ? "Đạt" : "Passed"} color="#10B981" icon={CheckCircle2} /> : <Badge label={lang === "vi" ? "Chưa" : "Pending"} color="#6B7280" icon={Circle} />}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                              {gp.canPass && <div style={{ marginTop: 8, padding: "6px 10px", background: "#10B98110", borderRadius: 4, fontSize: 12, color: "#10B981", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={13} /> {t.gate.ready}</div>}
                              {!gp.canPass && <div style={{ marginTop: 8, padding: "6px 10px", background: "#EF444410", borderRadius: 4, fontSize: 12, color: "#EF4444", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><Ban size={13} /> {t.gate.blocked} — {gp.reqTotal - gp.reqPassed} {lang === "vi" ? "điều kiện bắt buộc còn thiếu" : "required conditions remaining"}</div>}
                            </div>
                          )}
                          {pmType === "cascade" && (
                            pCascade.length === 0
                              ? <div style={{ textAlign: "center", color: "var(--text-faint)", padding: 16, fontSize: 13 }}>{lang === "vi" ? "Không có cảnh báo cascade" : "No cascade alerts"}</div>
                              : <div style={{ overflowX: "auto" }}>
                                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead><tr>
                                      <th style={pmThStyle}>{t.issue.id}</th>
                                      <th style={pmThStyle}>{t.issue.title}</th>
                                      <th style={pmThStyle}>{t.issue.severity}</th>
                                      <th style={pmThStyle}>{lang === "vi" ? "Ảnh hưởng" : "Impact Chain"}</th>
                                    </tr></thead>
                                    <tbody>
                                      {pCascade.map(c => (
                                        <tr key={c.issue.id} onClick={() => pmNavigate(c.issue)} style={{ cursor: "pointer", transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "var(--hover-bg)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                          <td style={{ ...pmTdStyle, fontFamily: mono, fontWeight: 700, color: "#3B82F6", fontSize: 12 }}>{c.issue.id}</td>
                                          <td style={{ ...pmTdStyle, maxWidth: 250 }}>{lang === "vi" ? (c.issue.titleVi || c.issue.title) : c.issue.title}</td>
                                          <td style={pmTdStyle}><Badge label={t.severity[c.issue.sev]} color={SEV_COLORS[c.issue.sev]} /></td>
                                          <td style={pmTdStyle}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                                              {c.chain.map((step, si) => (
                                                <span key={si} style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                                  <span style={{ background: `${PHASE_COLORS[step.phase]}15`, border: `1px solid ${PHASE_COLORS[step.phase]}25`, borderRadius: 3, padding: "1px 6px", fontSize: 11, color: PHASE_COLORS[step.phase], fontWeight: 700, fontFamily: mono }}>{step.phase} +{Math.ceil(step.days / 7)}w</span>
                                                  {si < c.chain.length - 1 && <ArrowRight size={10} color="var(--text-faint)" />}
                                                </span>
                                              ))}
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </Section>
              );
            })}

            {/* Cascade Alerts Panel */}
            {getCascade(projects.find(p => p.id === selProject)).length > 0 && (
              <Section title={<><Zap size={14} color="#F59E0B" /> {t.cascade.title}</>}>
                {getCascade(projects.find(p => p.id === selProject)).map((c, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0", borderBottom: idx < getCascade(projects.find(p => p.id === selProject)).length - 1 ? "1px solid var(--border)" : "none", flexWrap: "wrap" }}>
                    <Badge label={c.issue.id} color="#3B82F6" />
                    <Badge label={t.severity[c.issue.sev]} color={SEV_COLORS[c.issue.sev]} />
                    <span style={{ fontSize: 13, color: "var(--text-muted)", flex: "0 0 auto" }}>{c.issue.title.slice(0, 35)}...</span>
                    <ArrowRight size={14} color="var(--text-faint)" />
                    {c.chain.map((step, si) => (
                      <span key={si} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <span style={{ background: `${PHASE_COLORS[step.phase]}15`, border: `1px solid ${PHASE_COLORS[step.phase]}25`, borderRadius: 3, padding: "2px 6px", fontSize: 12, color: PHASE_COLORS[step.phase], fontWeight: 700 }}>
                          {step.phase} +{Math.ceil(step.days / 7)}w
                        </span>
                        {si < c.chain.length - 1 && <ArrowRight size={12} color="#EF4444" />}
                      </span>
                    ))}
                  </div>
                ))}
              </Section>
            )}
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
                {perm.canImport() && <Btn small onClick={() => setShowImport("issues")}><Upload size={11} /> {t.importExport?.import || "Import"}</Btn>}
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
                  }} />
              </Section>
            )}

            {/* Table */}
            <div style={{ border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden", background: "var(--bg-card)", maxHeight: "70vh", overflowY: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "64px 1fr 82px 72px 76px 80px 56px", gap: 6, padding: "7px 12px", background: "var(--bg-modal)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 10 }}>
                {[t.issue.id, t.issue.title + " / " + t.issue.rootCause, t.issue.status, t.issue.severity, t.issue.source, t.issue.owner, t.issue.phase].map(h => (
                  <span key={h} style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</span>
                ))}
              </div>
              {filteredIssues.map(issue => (
                <div key={issue.id} tabIndex={0} role="button" onClick={() => setSelIssue(selIssue?.id === issue.id ? null : issue)}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelIssue(selIssue?.id === issue.id ? null : issue); } }}
                  style={{ display: "grid", gridTemplateColumns: "64px 1fr 82px 72px 76px 80px 56px", gap: 6, padding: "8px 12px", borderBottom: "1px solid var(--border-a10)", cursor: "pointer", background: selIssue?.id === issue.id ? "var(--hover-bg)" : "transparent", alignItems: "center", transition: "background 0.1s" }}
                  onMouseEnter={e => { if (selIssue?.id !== issue.id) e.currentTarget.style.background = "var(--bg-input)"; }}
                  onMouseLeave={e => { if (selIssue?.id !== issue.id) e.currentTarget.style.background = "transparent"; }}>
                  <span style={{ fontSize: 12, color: "#3B82F6", fontFamily: mono, fontWeight: 600 }}>{issue.id}</span>
                  <div>
                    <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 600, lineHeight: 1.4 }}>{lang === "vi" ? issue.titleVi : issue.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 1 }}>{issue.rootCause}</div>
                  </div>
                  <Badge label={t.status[issue.status]} color={STATUS_COLORS[issue.status]} />
                  <Badge label={t.severity[issue.sev]} color={SEV_COLORS[issue.sev]} />
                  <Badge label={t.source[issue.src]} color={SRC_COLORS[issue.src]} />
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{issue.owner}</span>
                  <span style={{ fontSize: 12, color: "var(--text-faint)", fontFamily: mono }}>{issue.phase}</span>
                </div>
              ))}
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

            {/* Issue Detail */}
            {selIssue && (
              <Section title={null}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, color: "#3B82F6", fontFamily: mono, fontWeight: 700 }}>{selIssue.id}</span>
                      <Badge label={t.status[selIssue.status]} color={STATUS_COLORS[selIssue.status]} size="md" />
                      <Badge label={t.severity[selIssue.sev]} color={SEV_COLORS[selIssue.sev]} size="md" />
                      <Badge label={t.source[selIssue.src]} color={SRC_COLORS[selIssue.src]} size="md" />
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{lang === "vi" ? selIssue.titleVi : selIssue.title}</div>
                  </div>
                  {!perm.isReadOnly() && <div style={{ display: "flex", gap: 4 }}>
                    {selIssue.status === "DRAFT" && perm.canReviewIssue() && <Btn variant="success" small onClick={() => updateIssueStatus(selIssue.id, "OPEN")}><Check size={11} /> {t.review.approve}</Btn>}
                    {selIssue.status === "OPEN" && perm.canEditIssue(selIssue) && <Btn variant="primary" small onClick={() => updateIssueStatus(selIssue.id, "IN_PROGRESS")}><Activity size={11} /> Start</Btn>}
                    {selIssue.status !== "CLOSED" && perm.canCloseIssue(selIssue) && <Btn variant="success" small onClick={() => updateIssueStatus(selIssue.id, "CLOSED")}><CheckCircle2 size={11} /> {t.close}</Btn>}
                    {perm.canDeleteIssue(selIssue) && <Btn variant="danger" small onClick={() => { if (confirm(t.deleteConfirm)) { const id = selIssue.id; setIssues(prev => prev.filter(i => i.id !== id)); setSelIssue(null); audit.log("ISSUE_DELETED", "issue", id, selIssue.title, selIssue.status, null); setToast({ type: "success", message: `${id} ${t.deleted}` }); setTimeout(() => setToast(null), 3000); } }}><Trash2 size={11} /></Btn>}
                    <Btn small onClick={() => setSelIssue(null)}><X size={11} /></Btn>
                  </div>}
                  {perm.isReadOnly() && <Btn small onClick={() => setSelIssue(null)}><X size={11} /></Btn>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                  {[[t.issue.owner, selIssue.owner, User], [t.issue.phase, selIssue.phase, Layers], [t.issue.dueDate, selIssue.due, Calendar], ["Created", selIssue.created, Clock]].map(([k, v, Icon]) => (
                    <div key={k} style={{ background: "var(--bg-input)", borderRadius: 4, padding: "6px 10px" }}>
                      <div style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 3 }}><Icon size={9} /> {k}</div>
                      <div style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 600, marginTop: 1 }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><GitBranch size={10} /> {t.issue.rootCause}</div>
                  <div style={{ fontSize: 14, color: "var(--text-secondary)", background: "var(--bg-input)", borderRadius: 4, padding: "6px 10px", borderLeft: "3px solid #F59E0B" }}>{selIssue.rootCause}</div>
                </div>
                {selIssue.impacts.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: "#EF4444", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><Zap size={10} /> {t.issue.impactMap}</div>
                    {selIssue.impacts.map((imp, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", marginBottom: 3, background: "#EF444410", borderRadius: 4, borderLeft: "3px solid #EF4444" }}>
                        <Badge label={imp.phase} color={PHASE_COLORS[imp.phase]} />
                        <span style={{ fontSize: 13, color: "#FCA5A5" }}>{lang === "vi" ? imp.descVi : imp.desc}</span>
                        <span style={{ fontSize: 12, color: "#F59E0B", fontFamily: mono, marginLeft: "auto" }}>+{Math.ceil(imp.days / 7)}w</span>
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><Activity size={10} /> {t.issue.activityLog}</div>
                  {(() => {
                    const AUDIT_ACTION_COLORS = { ISSUE_CREATED: "#10B981", ISSUE_STATUS_CHANGED: "#3B82F6", ISSUE_REVIEWED: "#8B5CF6", ISSUE_CLOSED: "#6B7280", GATE_CHECK_TOGGLED: "#F59E0B" };
                    const auditEntries = audit.getLogsByEntity("issue", selIssue.id).map(a => ({
                      date: a.timestamp.split("T")[0],
                      sortKey: a.timestamp,
                      author: a.userName,
                      text: a.action.replace(/_/g, " ") + (a.oldValue && a.newValue ? `: ${a.oldValue} → ${a.newValue}` : a.newValue ? `: ${a.newValue}` : ""),
                      isAudit: true,
                      action: a.action,
                      color: AUDIT_ACTION_COLORS[a.action] || "var(--text-dim)",
                    }));
                    const manualEntries = selIssue.updates.map(u => ({
                      ...u,
                      sortKey: u.date + "T00:00:00",
                      isAudit: false,
                    }));
                    const merged = [...manualEntries, ...auditEntries].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
                    return (
                      <div style={{ borderLeft: "2px solid var(--border)", paddingLeft: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                        {merged.map((u, i) => (
                          <div key={i} style={{ position: "relative" }}>
                            <div style={{ position: "absolute", left: -19, top: 3, width: 8, height: 8, borderRadius: "50%", background: u.isAudit ? (u.color || "var(--text-dim)") : (i === merged.length - 1 ? "#3B82F6" : "var(--hover-bg)"), border: "2px solid var(--bg-card)" }} />
                            <div style={{ display: "flex", gap: 6, marginBottom: 1, alignItems: "center" }}>
                              <span style={{ fontSize: 12, color: u.isAudit ? "var(--text-dim)" : "#3B82F6", fontFamily: mono }}>{u.date}</span>
                              <span style={{ fontSize: 12, color: u.isAudit ? "var(--text-dim)" : "var(--text-muted)", fontWeight: 600 }}>{u.author}</span>
                              {u.isAudit && <span style={{ fontSize: 10, color: u.color, background: `${u.color}15`, border: `1px solid ${u.color}30`, borderRadius: 3, padding: "1px 4px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{u.action.replace(/_/g, " ")}</span>}
                            </div>
                            <div style={{ fontSize: 13, color: u.isAudit ? "var(--text-dim)" : "var(--text-secondary)", lineHeight: 1.5, fontStyle: u.isAudit ? "italic" : "normal" }}>{u.isAudit ? u.text : u.text}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </Section>
            )}
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
              {teamMembers.map(m => {
                const memberIssues = issues.filter(i => i.owner === m.name && i.status !== "CLOSED");
                const crit = memberIssues.filter(i => i.sev === "CRITICAL").length;
                const blocked = memberIssues.filter(i => i.status === "BLOCKED").length;
                return (
                  <div key={m.name} style={{ background: "var(--bg-modal)", borderRadius: 6, padding: "12px 14px", border: `1px solid ${crit > 0 ? "#EF444430" : "var(--border)"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--hover-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--text-muted)" }}>{m.name.split(" ").pop()[0]}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-dim)", display: "flex", alignItems: "center", gap: 3 }}>
                          <RoleIcon role={m.role} />
                          {t.role[m.role]} • {m.projects.join(", ")}
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
                {perm.canImport() && <Btn small onClick={() => setShowImport("bom")}><Upload size={11} /> {t.importExport?.import || "Import"}</Btn>}
                <Btn small onClick={() => exportBomExcel(allBom.filter(b => b.projectId === selProject), allSuppliers, lang)}><FileSpreadsheet size={11} /> {t.importExport?.exportExcel || "Export Excel"}</Btn>
              </div>
            </div>
            {bomSubTab === "tree" && <BomModule lang={lang} t={t} project={project} perm={perm} />}
            {bomSubTab === "suppliers" && <SupplierModule lang={lang} t={t} project={project} perm={perm} />}
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
                {perm.canImport() && <Btn small onClick={() => setShowImport("flightTests")}><Upload size={11} /> {t.importExport?.import || "Import"}</Btn>}
                <Btn small onClick={() => exportFlightTestsExcel(allFlights.filter(ft => ft.projectId === selProject), lang)}><FileSpreadsheet size={11} /> {t.importExport?.exportExcel || "Export Excel"}</Btn>
              </div>
            </div>
            {testSubTab === "flights" && <FlightTestModule lang={lang} t={t} project={project} issues={issues} perm={perm}
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
            />}
            {testSubTab === "decisions" && <DecisionsModule lang={lang} t={t} project={project} issues={issues} perm={perm} onViewIssue={(id) => { setTab("issues"); setSelIssue(issues.find(i => i.id === id) || null); }} />}
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
          <OrdersModule
            orders={ordersList}
            customers={customersList}
            loading={ordersLoading}
            lang={lang}
            perm={perm}
          />
        )}

        {/* === PRODUCTION === */}
        {tab === "production" && (
          <ProductionModule
            productionOrders={productionOrdersList}
            loading={productionLoading}
            lang={lang}
            perm={perm}
          />
        )}

        {/* === INVENTORY === */}
        {tab === "inventory" && (
          <InventoryModule
            inventory={inventoryList}
            transactions={inventoryTxns}
            loading={inventoryLoading}
            lang={lang}
            perm={perm}
          />
        )}

        {/* === FINANCE === */}
        {tab === "finance" && (
          <FinanceModule
            financeSummary={financeSummaryList}
            invoices={invoicesList}
            costEntries={costEntriesList}
            loading={financeLoading}
            lang={lang}
          />
        )}

        {/* === INTELLIGENCE === */}
        {tab === "intelligence" && (
          <IntelligencePanel
            intel={intel}
            projects={projects}
            lang={lang}
            t={t}
          />
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

      {/* === FAB: Floating Action Button === */}
      {showFab && perm.canCreateIssue() && (
        <button onClick={() => { setTab("tower"); setShowCreate(true); window.scrollTo({ top: 0, behavior: "smooth" }); }} title={t.issue.create}
          style={{ position: "fixed", bottom: 28, right: 28, width: 52, height: 52, borderRadius: "50%", background: "#3B82F6", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(59,130,246,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, transition: "transform 0.2s, box-shadow 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(59,130,246,0.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(59,130,246,0.4)"; }}>
          <Plus size={22} />
        </button>
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
