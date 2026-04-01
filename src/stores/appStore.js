import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAppStore = create(
  persist(
    (set) => ({
      lang: "vi",
      theme: "dark",

      setLang: (lang) => set({ lang }),
      setTheme: (theme) => {
        document.documentElement.setAttribute("data-theme", theme);
        set({ theme });
      },
    }),
    {
      name: "rtr-app",
      partialize: (state) => ({ lang: state.lang, theme: state.theme }),
    },
  ),
);
