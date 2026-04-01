import { lazy, Suspense } from "react";
import { TabErrorBoundary } from "../components/ErrorBoundary";
import { useData } from "../contexts/DataContext";
import { useAppStore } from "../stores/appStore";
import { usePermission } from "../hooks/usePermission";

const OrdersModule = lazy(() => import("../components/OrdersModule"));

export default function OrdersPage() {
  const { ordersList, customersList, ordersLoading } = useData();
  const lang = useAppStore((s) => s.lang);
  const perm = usePermission();

  return (
    <Suspense fallback={null}>
      <TabErrorBoundary name="Orders" lang={lang}>
        <OrdersModule orders={ordersList} customers={customersList} loading={ordersLoading} lang={lang} perm={perm} />
      </TabErrorBoundary>
    </Suspense>
  );
}
