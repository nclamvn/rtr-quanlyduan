import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "./App";

// Lazy page imports
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const ProductionPage = lazy(() => import("./pages/ProductionPage"));
const InventoryPage = lazy(() => import("./pages/InventoryPage"));
const FinancePage = lazy(() => import("./pages/FinancePage"));
const IntelligencePage = lazy(() => import("./pages/IntelligencePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const GatesPage = lazy(() => import("./pages/GatesPage"));
const ImpactPage = lazy(() => import("./pages/ImpactPage"));
const TeamPage = lazy(() => import("./pages/TeamPage"));
const ReviewPage = lazy(() => import("./pages/ReviewPage"));
const AuditPage = lazy(() => import("./pages/AuditPage"));
const BomPage = lazy(() => import("./pages/BomPage"));
const TestingPage = lazy(() => import("./pages/TestingPage"));
const IssuesPage = lazy(() => import("./pages/IssuesPage"));
const TowerPage = lazy(() => import("./pages/TowerPage"));

// Tab ID → URL path mapping
export const TAB_ROUTES = {
  tower: "/",
  issues: "/issues",
  gates: "/gates",
  impact: "/impact",
  bom: "/bom",
  testing: "/testing",
  team: "/team",
  review: "/review",
  audit: "/audit",
  orders: "/orders",
  production: "/production",
  inventory: "/inventory",
  finance: "/finance",
  intelligence: "/intelligence",
  settings: "/settings",
};

// Reverse lookup: path → tab ID
export const PATH_TO_TAB = Object.fromEntries(Object.entries(TAB_ROUTES).map(([tab, path]) => [path, tab]));

// Page component lookup (used by App.jsx to render route pages instead of inline)
export const TAB_PAGES = {
  tower: TowerPage,
  issues: IssuesPage,
  orders: OrdersPage,
  production: ProductionPage,
  inventory: InventoryPage,
  finance: FinancePage,
  intelligence: IntelligencePage,
  settings: SettingsPage,
  gates: GatesPage,
  impact: ImpactPage,
  team: TeamPage,
  review: ReviewPage,
  audit: AuditPage,
  bom: BomPage,
  testing: TestingPage,
};

export const router = createBrowserRouter([
  {
    path: "*",
    element: <App />,
  },
]);
