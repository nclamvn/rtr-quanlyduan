import { useState, lazy, Suspense } from "react";
import { Package, Truck, Brain, FileSpreadsheet } from "lucide-react";
import { sans } from "../constants";
import { Btn } from "./ui";
import { TabErrorBoundary } from "./ErrorBoundary";
import { exportBomExcel } from "./ExportEngine";

const BomModule = lazy(() => import("./BomModule"));
const SupplierModule = lazy(() => import("./SupplierModule"));

export default function BomTab({ project, selProject, lang, t, perm, allBom, allSuppliers, onAIImport }) {
  const [bomSubTab, setBomSubTab] = useState("tree");

  const subTabs = [
    { id: "tree", label: lang === "vi" ? "Cây BOM" : "BOM Tree", Icon: Package },
    { id: "suppliers", label: lang === "vi" ? "Nhà Cung Cấp" : "Suppliers", Icon: Truck },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
        {subTabs.map((st) => (
          <button
            key={st.id}
            onClick={() => setBomSubTab(st.id)}
            style={{
              background: bomSubTab === st.id ? "#1D4ED815" : "transparent",
              border: `1px solid ${bomSubTab === st.id ? "#1D4ED840" : "transparent"}`,
              borderRadius: 4,
              padding: "5px 12px",
              fontSize: 13,
              fontWeight: 600,
              color: bomSubTab === st.id ? "#60A5FA" : "var(--text-dim)",
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
              exportBomExcel(
                allBom.filter((b) => b.projectId === selProject),
                allSuppliers,
                lang,
              )
            }
          >
            <FileSpreadsheet size={11} /> {t.importExport?.exportExcel || "Export Excel"}
          </Btn>
        </div>
      </div>
      <Suspense fallback={null}>
        {bomSubTab === "tree" && (
          <TabErrorBoundary name="BOM" lang={lang}>
            <BomModule lang={lang} t={t} project={project} perm={perm} />
          </TabErrorBoundary>
        )}
        {bomSubTab === "suppliers" && (
          <TabErrorBoundary name="Suppliers" lang={lang}>
            <SupplierModule lang={lang} t={t} project={project} perm={perm} />
          </TabErrorBoundary>
        )}
      </Suspense>
    </div>
  );
}
