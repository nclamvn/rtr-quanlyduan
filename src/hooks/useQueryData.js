/**
 * TanStack Query wrappers for all data hooks.
 * Each hook wraps the existing service fetch + transform logic
 * with proper caching, dedup, and stale-while-revalidate.
 *
 * Realtime subscriptions still use useRealtimeSubscription
 * but trigger queryClient.invalidateQueries instead of setState.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { getConnectionStatus, withTimeout, warmUpSupabase } from "../lib/supabase";
import { queryKeys } from "../lib/queryClient";
import { useRealtimeSubscription } from "./useRealtime";

// Re-import service functions
import { fetchProjects, fetchMilestones, fetchGateConditions, toggleGateCondition } from "../services/projectService";
import {
  fetchIssues,
  createIssue as createIssueService,
  updateIssueStatus as updateIssueStatusService,
} from "../services/issueService";
import { fetchNotifications, markNotificationRead, markAllRead } from "../services/notificationService";
import { fetchOrders, fetchCustomers } from "../services/orderService";
import { fetchProductionOrders } from "../services/productionService";
import { fetchInventory, fetchInventoryTransactions } from "../services/inventoryService";
import { fetchFinanceSummary, fetchInvoices, fetchCostEntries } from "../services/financeService";

// Re-use existing transform functions (imported from original hooks)
// We inline the transforms here to avoid circular deps

// ═══ Shared query function wrapper ═══
async function queryFn(fetchFn, transformFn, fallback = []) {
  await warmUpSupabase();
  if (getConnectionStatus() !== "online") return fallback;
  try {
    const { data } = await withTimeout(fetchFn());
    return data?.length ? data.map(transformFn) : fallback;
  } catch {
    return fallback;
  }
}

// ═══ Transform functions (copied from original hooks) ═══

function buildMilestonesMap(milestoneRows) {
  const map = {};
  for (const m of milestoneRows) {
    const statusMap = { DONE: "COMPLETED", DELAYED: "IN_PROGRESS" };
    map[m.phase] = {
      target: m.target_date,
      actual: m.actual_date,
      adjusted: m.adjusted_date || null,
      status: statusMap[m.status] || m.status,
    };
  }
  return map;
}

function buildGateChecksMap(gateRows) {
  const checks = {};
  const configByPhase = {};
  for (const g of gateRows) {
    if (!checks[g.phase]) checks[g.phase] = {};
    checks[g.phase][g.id] = !!g.is_checked;
    if (!configByPhase[g.phase]) configByPhase[g.phase] = { conditions: [] };
    configByPhase[g.phase].conditions.push({
      id: g.id,
      label: g.label,
      label_vi: g.label_vi,
      required: g.is_required,
      cat: g.category || "general",
    });
  }
  return { checks, config: configByPhase };
}

function transformIssue(row) {
  return {
    ...row,
    pid: row.project_id,
    titleVi: row.title_vi,
    desc: row.description,
    sev: row.severity,
    src: row.source,
    owner: row.owner_name,
    owner_id: row.owner_id,
    created_by: row.created_by,
    rootCause: row.root_cause,
    created: row.created_at?.split("T")[0],
    due: row.due_date,
    impacts: (row.issue_impacts || []).map((imp) => ({
      ...imp,
      phase: imp.affected_phase,
      days: (imp.delay_weeks || 0) * 7,
      desc: imp.description,
      descVi: imp.description_vi,
    })),
    updates: (row.issue_updates || []).map((upd) => ({
      ...upd,
      date: upd.created_at?.split("T")[0],
      author: upd.author_name,
      text: upd.content,
    })),
  };
}

function transformOrder(row) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerId: row.customer_id,
    customerName: row.customers?.name || "",
    customerCode: row.customers?.code || "",
    projectId: row.project_id,
    status: row.status,
    priority: row.priority,
    orderDate: row.order_date,
    poNumber: row.po_number,
    totalAmount: parseFloat(row.total_amount) || 0,
    currency: row.currency,
    paymentStatus: row.payment_status,
    paidAmount: parseFloat(row.paid_amount) || 0,
    subtotal: parseFloat(row.subtotal) || 0,
    taxAmount: parseFloat(row.tax_amount) || 0,
    requiredDeliveryDate: row.required_delivery_date,
    actualDeliveryDate: row.actual_delivery_date,
    items: (row.order_items || []).map((item) => ({
      id: item.id,
      productName: item.product_name,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unit_price) || 0,
      lineTotal: parseFloat(item.line_total) || 0,
    })),
  };
}

function transformProductionOrder(row) {
  return {
    id: row.id,
    woNumber: row.wo_number,
    orderId: row.order_id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    projectId: row.project_id,
    productName: row.product_name,
    quantity: row.quantity,
    status: row.status,
    priority: row.priority,
    plannedStart: row.planned_start,
    plannedEnd: row.planned_end,
    actualStart: row.actual_start,
    actualEnd: row.actual_end,
    currentStation: row.current_station,
    assignedTo: row.assigned_to,
    yieldQuantity: row.yield_quantity || 0,
    defectQuantity: row.defect_quantity || 0,
    logs: (row.production_logs || []).map((l) => ({
      ...l,
      station: l.station,
      action: l.action,
      operator: l.operator_name,
    })),
  };
}

function transformInventory(row) {
  return {
    id: row.id,
    partId: row.part_id,
    partNumber: row.part_number,
    partName: row.part_name,
    category: row.category,
    warehouse: row.warehouse,
    location: row.location,
    quantityOnHand: row.quantity_on_hand,
    quantityReserved: row.quantity_reserved || 0,
    quantityOnOrder: row.quantity_on_order || 0,
    quantityAvailable: (row.quantity_on_hand || 0) - (row.quantity_reserved || 0),
    unit: row.unit,
    unitCost: parseFloat(row.unit_cost) || 0,
    totalValue: parseFloat(row.total_value) || 0,
    minStock: row.min_stock || 0,
    maxStock: row.max_stock || 0,
    reorderQuantity: row.reorder_quantity || 0,
    leadTimeDays: row.lead_time_days || 0,
    supplierId: row.supplier_id,
    supplierName: row.supplier_name,
    stockStatus:
      (row.quantity_on_hand || 0) <= 0
        ? "CRITICAL"
        : (row.quantity_on_hand || 0) <= (row.min_stock || 0)
          ? "LOW"
          : "OK",
  };
}

// ═══ QUERY HOOKS ═══

export function useProjectsQuery() {
  const qc = useQueryClient();

  const { data: projectsData, isLoading } = useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: async () => {
      await warmUpSupabase();
      if (getConnectionStatus() !== "online") return { projects: [], gateConfig: null };
      try {
        const { data: projData } = await withTimeout(fetchProjects());
        if (!projData?.length) return { projects: [], gateConfig: null };
        const allMilestones = {};
        const allGateData = {};
        const mergedConfig = {};
        await withTimeout(
          Promise.all(
            projData.map(async (proj) => {
              const [milRes, gateRes] = await Promise.all([fetchMilestones(proj.id), fetchGateConditions(proj.id)]);
              allMilestones[proj.id] = buildMilestonesMap(milRes.data || []);
              const gd = buildGateChecksMap(gateRes.data || []);
              allGateData[proj.id] = gd;
              Object.entries(gd.config).forEach(([phase, cfg]) => {
                if (!mergedConfig[phase]) mergedConfig[phase] = cfg;
              });
            }),
          ),
          8000,
        );
        const transformed = projData.map((p) => ({
          ...p,
          desc: p.description,
          descVi: p.description_vi,
          milestones: allMilestones[p.id] || {},
          gateChecks: allGateData[p.id]?.checks || {},
          _gateConfig: allGateData[p.id]?.config || {},
        }));
        return { projects: transformed, gateConfig: mergedConfig };
      } catch {
        return { projects: [], gateConfig: null };
      }
    },
  });

  useRealtimeSubscription("gate_conditions", {
    onUpdate: () => qc.invalidateQueries({ queryKey: queryKeys.projects.all }),
  });
  useRealtimeSubscription("projects", { onUpdate: () => qc.invalidateQueries({ queryKey: queryKeys.projects.all }) });

  const toggleGate = useCallback(
    async (gateId, isChecked, userId) => {
      if (getConnectionStatus() !== "online") return;
      await toggleGateCondition(gateId, isChecked, userId);
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
    [qc],
  );

  return {
    projects: projectsData?.projects || [],
    gateConfig: projectsData?.gateConfig || null,
    loading: isLoading,
    setProjects: (updater) => {
      qc.setQueryData(queryKeys.projects.list(), (old) => {
        if (!old) return old;
        const newProjects = typeof updater === "function" ? updater(old.projects) : updater;
        return { ...old, projects: newProjects };
      });
    },
    toggleGate,
    refetch: () => qc.invalidateQueries({ queryKey: queryKeys.projects.all }),
  };
}

export function useIssuesQuery() {
  const qc = useQueryClient();

  const { data: issues = [], isLoading } = useQuery({
    queryKey: queryKeys.issues.list(),
    queryFn: async () => {
      await warmUpSupabase();
      if (getConnectionStatus() !== "online") return [];
      try {
        const { data } = await withTimeout(fetchIssues());
        return (data || []).map(transformIssue);
      } catch {
        return [];
      }
    },
  });

  useRealtimeSubscription("issues", {
    onInsert: () => qc.invalidateQueries({ queryKey: queryKeys.issues.all }),
    onUpdate: () => qc.invalidateQueries({ queryKey: queryKeys.issues.all }),
    onDelete: () => qc.invalidateQueries({ queryKey: queryKeys.issues.all }),
  });

  const createIssue = useCallback(
    async (issueData) => {
      if (getConnectionStatus() !== "online") return null;
      const { data } = await createIssueService(issueData);
      if (data) qc.invalidateQueries({ queryKey: queryKeys.issues.all });
      return data;
    },
    [qc],
  );

  const updateStatus = useCallback(
    async (issueId, newStatus) => {
      if (getConnectionStatus() !== "online") return;
      await updateIssueStatusService(issueId, newStatus);
      qc.setQueryData(queryKeys.issues.list(), (old) =>
        (old || []).map((i) => (i.id === issueId ? { ...i, status: newStatus } : i)),
      );
    },
    [qc],
  );

  return {
    issues,
    loading: isLoading,
    setIssues: (updater) => {
      qc.setQueryData(queryKeys.issues.list(), (old) => (typeof updater === "function" ? updater(old || []) : updater));
    },
    createIssue,
    updateStatus,
    refetch: () => qc.invalidateQueries({ queryKey: queryKeys.issues.all }),
  };
}

export function useNotificationsQuery(userId) {
  const qc = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: queryKeys.notifications.byUser(userId),
    queryFn: async () => {
      await warmUpSupabase();
      if (getConnectionStatus() !== "online" || !userId) return [];
      try {
        const { data } = await withTimeout(fetchNotifications(userId));
        return (data || []).map((n) => ({
          ...n,
          titleVi: n.title_vi,
          time: n.time_ago,
          read: n.is_read,
          ref: n.reference_id,
        }));
      } catch {
        return [];
      }
    },
    enabled: !!userId,
  });

  useRealtimeSubscription("notifications", {
    onInsert: (row) => {
      if (row.user_id === userId) qc.invalidateQueries({ queryKey: queryKeys.notifications.byUser(userId) });
    },
  });

  return {
    notifications,
    setNotifications: (updater) => {
      qc.setQueryData(queryKeys.notifications.byUser(userId), (old) =>
        typeof updater === "function" ? updater(old || []) : updater,
      );
    },
    markRead: async (id) => {
      if (getConnectionStatus() !== "online") return;
      await markNotificationRead(id);
      qc.setQueryData(queryKeys.notifications.byUser(userId), (old) =>
        (old || []).map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    },
    markAllAsRead: async () => {
      if (getConnectionStatus() !== "online" || !userId) return;
      await markAllRead(userId);
      qc.setQueryData(queryKeys.notifications.byUser(userId), (old) => (old || []).map((n) => ({ ...n, read: true })));
    },
  };
}

export function useOrdersQuery(projectId) {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: queryKeys.orders.byProject(projectId),
    queryFn: () => queryFn(() => fetchOrders(projectId), transformOrder),
  });
  useRealtimeSubscription("orders", {
    onInsert: () => qc.invalidateQueries({ queryKey: queryKeys.orders.all }),
    onUpdate: () => qc.invalidateQueries({ queryKey: queryKeys.orders.all }),
  });
  return { data, loading: isLoading };
}

export function useCustomersQuery() {
  const { data = [], isLoading } = useQuery({
    queryKey: queryKeys.customers.all,
    queryFn: () =>
      queryFn(fetchCustomers, (r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        type: r.type,
        country: r.country,
        contactName: r.contact_name,
        contactEmail: r.contact_email,
      })),
  });
  return { data, loading: isLoading };
}

export function useProductionQuery(projectId) {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: queryKeys.production.byProject(projectId),
    queryFn: () => queryFn(() => fetchProductionOrders(projectId), transformProductionOrder),
  });
  useRealtimeSubscription("production_orders", {
    onInsert: () => qc.invalidateQueries({ queryKey: queryKeys.production.all }),
    onUpdate: () => qc.invalidateQueries({ queryKey: queryKeys.production.all }),
  });
  return { data, loading: isLoading };
}

export function useInventoryQuery() {
  const { data = [], isLoading } = useQuery({
    queryKey: queryKeys.inventory.list(),
    queryFn: () => queryFn(fetchInventory, transformInventory),
  });
  return { data, loading: isLoading };
}

export function useInventoryTxnQuery(inventoryId) {
  const { data = [] } = useQuery({
    queryKey: queryKeys.inventory.transactions(inventoryId),
    queryFn: () =>
      queryFn(
        () => fetchInventoryTransactions(inventoryId),
        (r) => r,
      ),
    enabled: inventoryId != null,
  });
  return { data };
}

export function useFinanceSummaryQuery() {
  const { data = [], isLoading } = useQuery({
    queryKey: queryKeys.finance.summary(),
    queryFn: () => queryFn(fetchFinanceSummary, (r) => r),
  });
  return { data, loading: isLoading };
}

export function useInvoicesQuery() {
  const { data = [] } = useQuery({
    queryKey: queryKeys.finance.invoices(),
    queryFn: () => queryFn(fetchInvoices, (r) => r),
  });
  return { data };
}

export function useCostEntriesQuery(projectId) {
  const { data = [] } = useQuery({
    queryKey: queryKeys.finance.costs(projectId),
    queryFn: () =>
      queryFn(
        () => fetchCostEntries(projectId),
        (r) => r,
      ),
    enabled: !!projectId,
  });
  return { data };
}
