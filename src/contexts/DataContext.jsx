import { createContext, useContext, useState, useMemo } from "react";
import { useAuth } from "./AuthContext";
import {
  useProjectsQuery,
  useIssuesQuery,
  useNotificationsQuery,
  useOrdersQuery,
  useCustomersQuery,
  useProductionQuery,
  useInventoryQuery,
  useInventoryTxnQuery,
  useFinanceSummaryQuery,
  useInvoicesQuery,
  useCostEntriesQuery,
} from "../hooks/useQueryData";
import { useFlightTestData, useDeliveryData, useBomData, useSupplierData } from "../hooks/useV2Data";
import { useTeamData } from "../hooks/useTeamData";
import { useSignalHub } from "../intelligence";
import { getConnectionStatus, onConnectionStatusChange } from "../lib/supabase";
import { useProjectStore } from "../stores/projectStore";
import { GATE_CONFIG } from "../constants/gates";
import { useEffect } from "react";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user: currentUser } = useAuth();
  const selProject = useProjectStore((s) => s.selectedProjectId);

  // Connection status
  const [connStatus, setConnStatus] = useState(getConnectionStatus);
  useEffect(() => onConnectionStatusChange(setConnStatus), []);
  const online = connStatus === "online";

  // ═══ TanStack Query hooks (replace old useState+useEffect hooks) ═══
  const {
    projects,
    gateConfig: sbGateConfig,
    loading: projLoading,
    setProjects,
    toggleGate: sbToggleGate,
  } = useProjectsQuery();

  const {
    issues,
    loading: issLoading,
    setIssues,
    createIssue: sbCreateIssue,
    updateStatus: sbUpdateStatus,
  } = useIssuesQuery();

  const {
    notifications,
    setNotifications,
    markRead: sbMarkRead,
    markAllAsRead: sbMarkAllRead,
  } = useNotificationsQuery(currentUser?.id);

  // V2 data (still use original hooks — simple pattern, no benefit from TQ)
  const { data: allFlights } = useFlightTestData(null);
  const { data: allDeliveries } = useDeliveryData(null);
  const { data: allBom } = useBomData(null);
  const { data: allSuppliers } = useSupplierData();
  const { data: sbTeam } = useTeamData();
  const teamMembers = online && sbTeam.length > 0 ? sbTeam : [];

  // Business data (TanStack Query)
  const { data: ordersList, loading: ordersLoading } = useOrdersQuery(selProject);
  const { data: customersList } = useCustomersQuery();
  const { data: productionOrdersList, loading: productionLoading } = useProductionQuery(selProject);
  const { data: inventoryList, loading: inventoryLoading } = useInventoryQuery();
  const { data: inventoryTxns } = useInventoryTxnQuery(null);
  const { data: financeSummaryList, loading: financeLoading } = useFinanceSummaryQuery();
  const { data: invoicesList } = useInvoicesQuery();
  const { data: costEntriesList } = useCostEntriesQuery(selProject);

  // Intelligence
  const intel = useSignalHub(
    issues,
    projects,
    allFlights,
    allDeliveries,
    allBom,
    ordersList,
    productionOrdersList,
    inventoryList,
  );

  // Gate config
  const activeGateConfig = online && sbGateConfig ? sbGateConfig : GATE_CONFIG;

  const value = useMemo(
    () => ({
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
      sbCreateIssue,
      sbUpdateStatus,
      sbToggleGate,
      sbMarkRead,
      sbMarkAllRead,
      activeGateConfig,
      sbGateConfig,
      allFlights,
      allDeliveries,
      allBom,
      allSuppliers,
      teamMembers,
      ordersList,
      customersList,
      ordersLoading,
      productionOrdersList,
      productionLoading,
      inventoryList,
      inventoryTxns,
      inventoryLoading,
      financeSummaryList,
      invoicesList,
      costEntriesList,
      financeLoading,
      intel,
    }),
    [
      connStatus,
      projects,
      issues,
      notifications,
      projLoading,
      issLoading,
      activeGateConfig,
      allFlights,
      allDeliveries,
      allBom,
      allSuppliers,
      teamMembers,
      ordersList,
      customersList,
      productionOrdersList,
      inventoryList,
      inventoryTxns,
      financeSummaryList,
      invoicesList,
      costEntriesList,
      intel,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
