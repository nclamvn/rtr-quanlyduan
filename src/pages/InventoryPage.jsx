import { lazy, Suspense } from "react";
import { TabErrorBoundary } from "../components/ErrorBoundary";
import { useData } from "../contexts/DataContext";
import { useAppStore } from "../stores/appStore";
import { usePermission } from "../hooks/usePermission";

const InventoryModule = lazy(() => import("../components/InventoryModule"));

export default function InventoryPage() {
  const { inventoryList, inventoryTxns, inventoryLoading } = useData();
  const lang = useAppStore((s) => s.lang);
  const perm = usePermission();

  return (
    <Suspense fallback={null}>
      <TabErrorBoundary name="Inventory" lang={lang}>
        <InventoryModule
          inventory={inventoryList}
          transactions={inventoryTxns}
          loading={inventoryLoading}
          lang={lang}
          perm={perm}
        />
      </TabErrorBoundary>
    </Suspense>
  );
}
