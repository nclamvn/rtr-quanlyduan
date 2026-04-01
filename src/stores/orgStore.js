import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useOrgStore = create(
  persist(
    (set) => ({
      currentOrgId: null,
      orgs: [],

      setCurrentOrg: (orgId) => set({ currentOrgId: orgId }),
      setOrgs: (orgs) => set({ orgs }),
      addOrg: (org) => set((s) => ({ orgs: [...s.orgs, org] })),
    }),
    {
      name: "rtr-org",
      partialize: (state) => ({ currentOrgId: state.currentOrgId }),
    },
  ),
);
