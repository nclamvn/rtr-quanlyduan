import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useIssueStore = create(
  persist(
    (set) => ({
      filters: { status: "ALL", sev: "ALL", src: "ALL" },
      search: "",
      sort: { col: null, dir: "desc" },
      selectedIssueId: null,
      issueSubTab: "list",

      setFilter: (key, value) => set((s) => ({ filters: { ...s.filters, [key]: value } })),
      resetFilters: () => set({ filters: { status: "ALL", sev: "ALL", src: "ALL" }, search: "" }),
      setSearch: (search) => set({ search }),
      setSort: (col, dir) => set({ sort: { col, dir } }),
      selectIssue: (id) => set({ selectedIssueId: id }),
      setIssueSubTab: (issueSubTab) => set({ issueSubTab }),
    }),
    {
      name: "rtr-issue-store",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        filters: state.filters,
        search: state.search,
        selectedIssueId: state.selectedIssueId,
        issueSubTab: state.issueSubTab,
      }),
    },
  ),
);
