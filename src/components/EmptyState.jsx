import { AlertCircle, Package, Plane, Truck, Scale, FileText, CheckSquare, ShoppingCart, Factory, Warehouse, DollarSign } from "lucide-react";

const ICONS = { AlertCircle, Package, Plane, Truck, Scale, FileText, CheckSquare, ShoppingCart, Factory, Warehouse, DollarSign };

export default function EmptyState({ icon = "AlertCircle", title, description, actionLabel, onAction }) {
  const Icon = ICONS[icon] || AlertCircle;
  return (
    <div style={{ padding: "48px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <Icon size={48} color="var(--text-disabled)" strokeWidth={1.2} />
      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-faint)", marginTop: 4 }}>{title}</div>
      {description && <div style={{ fontSize: 13, color: "var(--text-disabled)", maxWidth: 320 }}>{description}</div>}
      {actionLabel && onAction && (
        <button onClick={onAction}
          style={{ marginTop: 8, background: "#3B82F6", color: "#fff", border: "none", borderRadius: 6, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', 'Segoe UI', system-ui, sans-serif" }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export const EMPTY_MESSAGES = {
  vi: {
    issues: { icon: "AlertCircle", title: "Chưa có vấn đề nào", desc: "Tạo vấn đề đầu tiên cho dự án này", action: "Tạo vấn đề" },
    bom: { icon: "Package", title: "Chưa có BOM", desc: "Dự án này chưa có danh mục linh kiện" },
    flights: { icon: "Plane", title: "Chưa có bài bay thử", desc: "Dự án này chưa có dữ liệu bay thử" },
    suppliers: { icon: "Truck", title: "Chưa có nhà cung cấp", desc: "Chưa có nhà cung cấp nào được liên kết" },
    decisions: { icon: "Scale", title: "Chưa có quyết định", desc: "Dự án này chưa có quyết định nào" },
    audit: { icon: "FileText", title: "Chưa có nhật ký", desc: "Chưa có hoạt động nào được ghi nhận" },
    review: { icon: "CheckSquare", title: "Không có gì cần duyệt", desc: "Tất cả vấn đề đã được xử lý" },
    orders: { icon: "ShoppingCart", title: "Chưa có đơn hàng", description: "Nhập đơn hàng đầu tiên hoặc import từ Excel" },
    production: { icon: "Factory", title: "Chưa có lệnh sản xuất", description: "Tạo lệnh sản xuất từ đơn hàng" },
    inventory: { icon: "Warehouse", title: "Chưa có dữ liệu tồn kho", description: "Nhập danh mục linh kiện hoặc import từ Excel" },
    finance: { icon: "DollarSign", title: "Chưa có dữ liệu tài chính", description: "Dữ liệu tài chính sẽ tự động tổng hợp từ đơn hàng và chi phí" },
  },
  en: {
    issues: { icon: "AlertCircle", title: "No issues yet", desc: "Create the first issue for this project", action: "Create Issue" },
    bom: { icon: "Package", title: "No BOM data", desc: "This project has no bill of materials" },
    flights: { icon: "Plane", title: "No flight tests", desc: "This project has no flight test data" },
    suppliers: { icon: "Truck", title: "No suppliers", desc: "No suppliers have been linked" },
    decisions: { icon: "Scale", title: "No decisions", desc: "This project has no decisions" },
    audit: { icon: "FileText", title: "No audit entries", desc: "No activities have been recorded" },
    review: { icon: "CheckSquare", title: "Nothing to review", desc: "All issues have been handled" },
    orders: { icon: "ShoppingCart", title: "No orders yet", description: "Create the first order or import from Excel" },
    production: { icon: "Factory", title: "No production orders", description: "Create work orders from customer orders" },
    inventory: { icon: "Warehouse", title: "No inventory data", description: "Add inventory items or import from Excel" },
    finance: { icon: "DollarSign", title: "No financial data", description: "Financial data will be aggregated from orders and costs" },
  },
};
