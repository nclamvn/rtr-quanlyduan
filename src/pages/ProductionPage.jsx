import { lazy, Suspense } from "react";
import { TabErrorBoundary } from "../components/ErrorBoundary";
import { useData } from "../contexts/DataContext";
import { useAppStore } from "../stores/appStore";
import { usePermission } from "../hooks/usePermission";

const ProductionModule = lazy(() => import("../components/ProductionModule"));

export default function ProductionPage() {
  const { productionOrdersList, productionLoading } = useData();
  const lang = useAppStore((s) => s.lang);
  const perm = usePermission();

  return (
    <Suspense fallback={null}>
      <TabErrorBoundary name="Production" lang={lang}>
        <ProductionModule productionOrders={productionOrdersList} loading={productionLoading} lang={lang} perm={perm} />
      </TabErrorBoundary>
    </Suspense>
  );
}
