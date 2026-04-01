import ImpactTab from "../components/ImpactTab";
import { useData } from "../contexts/DataContext";
import { useAppStore } from "../stores/appStore";
import { useProjectStore } from "../stores/projectStore";
import { LANG } from "../constants";

export default function ImpactPage() {
  const { projects, issues } = useData();
  const lang = useAppStore((s) => s.lang);
  const selProject = useProjectStore((s) => s.selectedProjectId);
  const t = LANG[lang];
  const project = projects.find((p) => p.id === selProject);

  if (!project) return null;

  return <ImpactTab project={project} selProject={selProject} issues={issues} lang={lang} t={t} />;
}
