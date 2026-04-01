import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useProjectStore = create(
  persist(
    (set) => ({
      selectedProjectId: "PRJ-001",

      setSelectedProject: (id) => set({ selectedProjectId: id }),
    }),
    {
      name: "rtr-project-store",
      partialize: (state) => ({ selectedProjectId: state.selectedProjectId }),
    },
  ),
);
