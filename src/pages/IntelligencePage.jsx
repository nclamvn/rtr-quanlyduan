import { lazy, Suspense } from "react";
import { TabErrorBoundary } from "../components/ErrorBoundary";
import { useData } from "../contexts/DataContext";
import { useAppStore } from "../stores/appStore";
import { LANG } from "../constants";

const IntelligencePanel = lazy(() => import("../components/IntelligencePanel"));

export default function IntelligencePage() {
  const { intel, projects, issues } = useData();
  const lang = useAppStore((s) => s.lang);
  const t = LANG[lang];

  return (
    <Suspense fallback={null}>
      <TabErrorBoundary name="Intelligence" lang={lang}>
        <IntelligencePanel intel={intel} projects={projects} lang={lang} t={t} issues={issues} />
      </TabErrorBoundary>
    </Suspense>
  );
}
