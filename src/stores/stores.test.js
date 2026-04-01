import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "./appStore";
import { useProjectStore } from "./projectStore";
import { useIssueStore } from "./issueStore";
import { useUIStore } from "./uiStore";

describe("useAppStore", () => {
  beforeEach(() => {
    useAppStore.setState({ lang: "vi", theme: "dark" });
  });

  it("has correct initial state", () => {
    const state = useAppStore.getState();
    expect(state.lang).toBe("vi");
    expect(state.theme).toBe("dark");
  });

  it("setLang updates language", () => {
    useAppStore.getState().setLang("en");
    expect(useAppStore.getState().lang).toBe("en");
  });

  it("setTheme updates theme", () => {
    useAppStore.getState().setTheme("light");
    expect(useAppStore.getState().theme).toBe("light");
  });
});

describe("useProjectStore", () => {
  beforeEach(() => {
    useProjectStore.setState({ selectedProjectId: "PRJ-001" });
  });

  it("has correct initial state", () => {
    expect(useProjectStore.getState().selectedProjectId).toBe("PRJ-001");
  });

  it("setSelectedProject updates ID", () => {
    useProjectStore.getState().setSelectedProject("PRJ-002");
    expect(useProjectStore.getState().selectedProjectId).toBe("PRJ-002");
  });
});

describe("useIssueStore", () => {
  beforeEach(() => {
    useIssueStore.setState({
      filters: { status: "ALL", sev: "ALL", src: "ALL" },
      search: "",
      sort: { col: null, dir: "desc" },
      selectedIssueId: null,
      issueSubTab: "list",
    });
  });

  it("has correct initial state", () => {
    const state = useIssueStore.getState();
    expect(state.filters).toEqual({ status: "ALL", sev: "ALL", src: "ALL" });
    expect(state.search).toBe("");
    expect(state.selectedIssueId).toBeNull();
  });

  it("setFilter updates single filter key", () => {
    useIssueStore.getState().setFilter("status", "OPEN");
    expect(useIssueStore.getState().filters.status).toBe("OPEN");
    expect(useIssueStore.getState().filters.sev).toBe("ALL");
  });

  it("resetFilters clears all filters and search", () => {
    useIssueStore.getState().setFilter("status", "BLOCKED");
    useIssueStore.getState().setSearch("test");
    useIssueStore.getState().resetFilters();
    expect(useIssueStore.getState().filters).toEqual({ status: "ALL", sev: "ALL", src: "ALL" });
    expect(useIssueStore.getState().search).toBe("");
  });

  it("setSort updates sort config", () => {
    useIssueStore.getState().setSort("sev", "asc");
    expect(useIssueStore.getState().sort).toEqual({ col: "sev", dir: "asc" });
  });

  it("selectIssue updates selectedIssueId", () => {
    useIssueStore.getState().selectIssue("ISS-001");
    expect(useIssueStore.getState().selectedIssueId).toBe("ISS-001");
  });

  it("setIssueSubTab switches tab", () => {
    useIssueStore.getState().setIssueSubTab("charts");
    expect(useIssueStore.getState().issueSubTab).toBe("charts");
  });
});

describe("useUIStore", () => {
  beforeEach(() => {
    useUIStore.setState({
      showNotif: false,
      showCreate: false,
      showUserMenu: false,
      showImport: false,
      showAIImport: false,
      showExport: null,
      toast: null,
      showFab: false,
    });
  });

  it("toggleNotif toggles notification panel and closes user menu", () => {
    useUIStore.setState({ showUserMenu: true });
    useUIStore.getState().toggleNotif();
    expect(useUIStore.getState().showNotif).toBe(true);
    expect(useUIStore.getState().showUserMenu).toBe(false);
  });

  it("toggleUserMenu toggles menu and closes notif", () => {
    useUIStore.setState({ showNotif: true });
    useUIStore.getState().toggleUserMenu();
    expect(useUIStore.getState().showUserMenu).toBe(true);
    expect(useUIStore.getState().showNotif).toBe(false);
  });

  it("openExport / closeExport manages export modal", () => {
    useUIStore.getState().openExport("pdf");
    expect(useUIStore.getState().showExport).toBe("pdf");
    useUIStore.getState().closeExport();
    expect(useUIStore.getState().showExport).toBeNull();
  });

  it("showToast / clearToast manages toast", () => {
    useUIStore.getState().showToast({ type: "success", message: "Done" });
    expect(useUIStore.getState().toast).toEqual({ type: "success", message: "Done" });
    useUIStore.getState().clearToast();
    expect(useUIStore.getState().toast).toBeNull();
  });

  it("openCreate / closeCreate toggles create form", () => {
    useUIStore.getState().openCreate();
    expect(useUIStore.getState().showCreate).toBe(true);
    useUIStore.getState().closeCreate();
    expect(useUIStore.getState().showCreate).toBe(false);
  });

  it("openAIImport / closeAIImport toggles AI import modal", () => {
    useUIStore.getState().openAIImport();
    expect(useUIStore.getState().showAIImport).toBe(true);
    useUIStore.getState().closeAIImport();
    expect(useUIStore.getState().showAIImport).toBe(false);
  });
});
