import { lazy, Suspense } from "react";
import { TabErrorBoundary } from "../components/ErrorBoundary";
import { useData } from "../contexts/DataContext";
import { useAppStore } from "../stores/appStore";

const FinanceModule = lazy(() => import("../components/FinanceModule"));

export default function FinancePage() {
  const { financeSummaryList, invoicesList, costEntriesList, financeLoading } = useData();
  const lang = useAppStore((s) => s.lang);

  return (
    <Suspense fallback={null}>
      <TabErrorBoundary name="Finance" lang={lang}>
        <FinanceModule
          financeSummary={financeSummaryList}
          invoices={invoicesList}
          costEntries={costEntriesList}
          loading={financeLoading}
          lang={lang}
        />
      </TabErrorBoundary>
    </Suspense>
  );
}
