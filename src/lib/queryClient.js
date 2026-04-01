import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

// Query key factories for consistent key management
export const queryKeys = {
  projects: {
    all: ["projects"],
    list: () => [...queryKeys.projects.all, "list"],
  },
  issues: {
    all: ["issues"],
    list: () => [...queryKeys.issues.all, "list"],
  },
  notifications: {
    all: ["notifications"],
    byUser: (userId) => [...queryKeys.notifications.all, userId],
  },
  orders: {
    all: ["orders"],
    byProject: (projectId) => [...queryKeys.orders.all, projectId],
  },
  customers: {
    all: ["customers"],
  },
  production: {
    all: ["production"],
    byProject: (projectId) => [...queryKeys.production.all, projectId],
  },
  inventory: {
    all: ["inventory"],
    list: () => [...queryKeys.inventory.all, "list"],
    transactions: (id) => [...queryKeys.inventory.all, "transactions", id],
  },
  finance: {
    summary: () => ["finance", "summary"],
    invoices: () => ["finance", "invoices"],
    costs: (projectId) => ["finance", "costs", projectId],
  },
  team: {
    all: ["team"],
  },
  flights: {
    byProject: (projectId) => ["flights", projectId],
  },
  deliveries: {
    byProject: (projectId) => ["deliveries", projectId],
  },
  bom: {
    byProject: (projectId) => ["bom", projectId],
  },
  suppliers: {
    all: ["suppliers"],
  },
};
