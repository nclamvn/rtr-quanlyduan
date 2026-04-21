import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { fetchAlerts, subscribeToAlerts, countOpenAlerts } from "../services/alertsService";

export const useAlertsStore = create(
  persist(
    (set, get) => ({
      alerts: [],
      filters: { status: "open", severity: "ALL", agent: "ALL" },
      selectedAlertId: null,
      loading: false,
      error: null,
      openCount: 0,
      _unsubscribe: null,

      loadAlerts: async () => {
        set({ loading: true, error: null });
        const { filters } = get();
        const { data, error } = await fetchAlerts(filters);
        set({ alerts: data, loading: false, error: error?.message || null });
      },

      loadOpenCount: async () => {
        const count = await countOpenAlerts();
        set({ openCount: count });
      },

      setFilter: (key, value) => {
        set((s) => ({ filters: { ...s.filters, [key]: value } }));
        get().loadAlerts();
      },

      selectAlert: (id) => set({ selectedAlertId: id }),
      clearSelection: () => set({ selectedAlertId: null }),

      setupRealtime: () => {
        const unsub = subscribeToAlerts((payload) => {
          const { eventType, new: newRow, old: oldRow } = payload;
          set((state) => {
            let alerts = [...state.alerts];
            if (eventType === "INSERT") {
              alerts = [newRow, ...alerts];
            } else if (eventType === "UPDATE") {
              alerts = alerts.map((a) => (a.id === newRow.id ? newRow : a));
            } else if (eventType === "DELETE") {
              alerts = alerts.filter((a) => a.id !== oldRow.id);
            }
            return { alerts };
          });
          get().loadOpenCount();
        });
        set({ _unsubscribe: unsub });
      },

      teardownRealtime: () => {
        const { _unsubscribe } = get();
        if (_unsubscribe) _unsubscribe();
        set({ _unsubscribe: null });
      },
    }),
    {
      name: "rtr-alerts-store",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        filters: state.filters,
        selectedAlertId: state.selectedAlertId,
      }),
    },
  ),
);
