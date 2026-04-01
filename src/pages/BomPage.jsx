import { lazy, Suspense } from "react";
import { useData } from "../contexts/DataContext";
import { useAppStore } from "../stores/appStore";
import { useProjectStore } from "../stores/projectStore";
import { usePermission } from "../hooks/usePermission";
import { useUIStore } from "../stores/uiStore";
import { LANG } from "../constants";

const BomTab = lazy(() => import("../components/BomTab"));

export default function BomPage() {
  const { projects, allBom, allSuppliers } = useData();
  const lang = useAppStore((s) => s.lang);
  const selProject = useProjectStore((s) => s.selectedProjectId);
  const perm = usePermission();
  const openAIImport = useUIStore((s) => s.openAIImport);
  const t = LANG[lang];
  const project = projects.find((p) => p.id === selProject);

  if (!project) return null;

  return (
    <Suspense fallback={null}>
      <BomTab
        project={project}
        selProject={selProject}
        lang={lang}
        t={t}
        perm={perm}
        allBom={allBom}
        allSuppliers={allSuppliers}
        onAIImport={openAIImport}
      />
    </Suspense>
  );
}
