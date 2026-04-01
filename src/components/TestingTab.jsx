import { useState, lazy, Suspense } from "react";
import { Plane, Scale, Brain, FileSpreadsheet } from "lucide-react";
import { sans } from "../constants";
import { Btn } from "./ui";
import { TabErrorBoundary } from "./ErrorBoundary";
import { exportFlightTestsExcel } from "./ExportEngine";

const FlightTestModule = lazy(() => import("./FlightTestModule"));
const DecisionsModule = lazy(() => import("./DecisionsModule"));

export default function TestingTab({
  project,
  selProject,
  issues,
  lang,
  t,
  perm,
  allFlights,
  online,
  sbCreateIssue,
  setIssues,
  audit,
  intel: _intel,
  setTab,
  setSelIssue,
  onAIImport,
}) {
  const [testSubTab, setTestSubTab] = useState("flights");

  const subTabs = [
    { id: "flights", label: lang === "vi" ? "Bay Thử" : "Flight Tests", Icon: Plane },
    { id: "decisions", label: lang === "vi" ? "Quyết Định" : "Decisions", Icon: Scale },
  ];

  const handleCreateAutoIssue = (ft) => {
    const sevMap = { FAIL: "CRITICAL", PARTIAL: "HIGH" };
    const issueId = `ISS-${String(issues.length + Math.floor(Math.random() * 100) + 10).padStart(3, "0")}`;
    const anomalyText = ft.anomalies.map((a) => `[${a.severity}] ${a.description}`).join("; ");
    const newIssue = {
      id: issueId,
      pid: project.id,
      title: `Flight FLT-${String(ft.testNumber).padStart(3, "0")} ${ft.result}: ${ft.anomalies[0]?.description || ft.testType + " test failed"}`,
      titleVi: `Bay FLT-${String(ft.testNumber).padStart(3, "0")} ${ft.result}: ${ft.anomalies[0]?.descriptionVi || ft.anomalies[0]?.description || ft.testType + " test failed"}`,
      desc: `Auto-created from flight test FLT-${String(ft.testNumber).padStart(3, "0")}. Anomalies: ${anomalyText || "None recorded"}`,
      rootCause: "Pending investigation",
      status: "DRAFT",
      sev: sevMap[ft.result] || "HIGH",
      src: "INTERNAL",
      owner: ft.pilot,
      phase: ft.testPhase,
      created: new Date().toISOString().split("T")[0],
      due: "",
      impacts: [],
      updates: [
        {
          date: new Date().toISOString().split("T")[0],
          author: "System",
          text: `Auto-created from flight FLT-${String(ft.testNumber).padStart(3, "0")} (${ft.result})`,
        },
      ],
    };
    ft.autoIssueId = issueId;
    if (online) {
      sbCreateIssue(newIssue);
    } else {
      setIssues((prev) => [newIssue, ...prev]);
    }
    audit.log("ISSUE_CREATED", "issue", issueId, newIssue.title, null, "DRAFT", {
      source: "flight_test",
      flightId: ft.id,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
        {subTabs.map((st) => (
          <button
            key={st.id}
            onClick={() => setTestSubTab(st.id)}
            style={{
              background: testSubTab === st.id ? "#1D4ED815" : "transparent",
              border: `1px solid ${testSubTab === st.id ? "#1D4ED840" : "transparent"}`,
              borderRadius: 4,
              padding: "5px 12px",
              fontSize: 13,
              fontWeight: 600,
              color: testSubTab === st.id ? "#60A5FA" : "var(--text-dim)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontFamily: sans,
            }}
          >
            <st.Icon size={12} />
            {st.label}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {perm.canImport() && (
            <Btn small onClick={onAIImport}>
              <Brain size={11} /> AI Import
            </Btn>
          )}
          <Btn
            small
            onClick={() =>
              exportFlightTestsExcel(
                allFlights.filter((ft) => ft.projectId === selProject),
                lang,
              )
            }
          >
            <FileSpreadsheet size={11} /> {t.importExport?.exportExcel || "Export Excel"}
          </Btn>
        </div>
      </div>
      <Suspense fallback={null}>
        {testSubTab === "flights" && (
          <TabErrorBoundary name="Flight Tests" lang={lang}>
            <FlightTestModule
              lang={lang}
              t={t}
              project={project}
              issues={issues}
              perm={perm}
              onViewIssue={(id) => {
                setTab("issues");
                setSelIssue(issues.find((i) => i.id === id) || null);
              }}
              onCreateAutoIssue={handleCreateAutoIssue}
            />
          </TabErrorBoundary>
        )}
        {testSubTab === "decisions" && (
          <TabErrorBoundary name="Decisions" lang={lang}>
            <DecisionsModule
              lang={lang}
              t={t}
              project={project}
              issues={issues}
              perm={perm}
              onViewIssue={(id) => {
                setTab("issues");
                setSelIssue(issues.find((i) => i.id === id) || null);
              }}
            />
          </TabErrorBoundary>
        )}
      </Suspense>
    </div>
  );
}
