import { create } from "zustand";

export const useUIStore = create((set) => ({
  showNotif: false,
  showCreate: false,
  showUserMenu: false,
  showImport: false,
  showAIImport: false,
  showExport: null,
  toast: null,
  showFab: false,

  toggleNotif: () => set((s) => ({ showNotif: !s.showNotif, showUserMenu: false })),
  closeNotif: () => set({ showNotif: false }),
  toggleCreate: () => set((s) => ({ showCreate: !s.showCreate })),
  openCreate: () => set({ showCreate: true }),
  closeCreate: () => set({ showCreate: false }),
  toggleUserMenu: () => set((s) => ({ showUserMenu: !s.showUserMenu, showNotif: false })),
  closeUserMenu: () => set({ showUserMenu: false }),
  openImport: () => set({ showImport: true }),
  closeImport: () => set({ showImport: false }),
  openAIImport: () => set({ showAIImport: true }),
  closeAIImport: () => set({ showAIImport: false }),
  openExport: (type) => set({ showExport: type }),
  closeExport: () => set({ showExport: null }),
  showToast: (toast) => set({ toast }),
  clearToast: () => set({ toast: null }),
  setShowFab: (showFab) => set({ showFab }),
}));
