// ═══ Demo data for business modules (offline fallback) ═══

export const DEMO_ORDERS = [
  {
    id: "ORD-001", projectId: "PRJ-001", customerId: "CUS-001",
    customerName: "Vietnam Airlines", status: "CONFIRMED", priority: "HIGH",
    orderDate: "2026-02-01", deliveryDate: "2026-06-15",
    totalAmount: 125000, currency: "USD",
    items: [
      { id: "OI-001", productName: "RTR-X7 Surveyor Unit", quantity: 2, unitPrice: 45000, total: 90000 },
      { id: "OI-002", productName: "RTK Base Station", quantity: 1, unitPrice: 15000, total: 15000 },
      { id: "OI-003", productName: "Training Package", quantity: 1, unitPrice: 20000, total: 20000 },
    ],
    notes: "Deployment for infrastructure survey fleet",
  },
  {
    id: "ORD-002", projectId: "PRJ-002", customerId: "CUS-002",
    customerName: "Lộc Trời Group", status: "QUOTE",  priority: "MEDIUM",
    orderDate: "2026-02-15", deliveryDate: "2026-09-01",
    totalAmount: 280000, currency: "USD",
    items: [
      { id: "OI-004", productName: "RTR-A3 Agri Sprayer", quantity: 5, unitPrice: 35000, total: 175000 },
      { id: "OI-005", productName: "Spray System Upgrade Kit", quantity: 5, unitPrice: 8000, total: 40000 },
      { id: "OI-006", productName: "Pilot Training (5 days)", quantity: 5, unitPrice: 5000, total: 25000 },
      { id: "OI-007", productName: "1-Year Maintenance Contract", quantity: 5, unitPrice: 8000, total: 40000 },
    ],
    notes: "Agricultural fleet for Mekong Delta operations",
  },
  {
    id: "ORD-003", projectId: "PRJ-004", customerId: "CUS-003",
    customerName: "PetroVietnam", status: "PAID", priority: "HIGH",
    orderDate: "2026-01-10", deliveryDate: "2026-04-30",
    totalAmount: 95000, currency: "USD",
    items: [
      { id: "OI-008", productName: "RTR-I2 Inspector", quantity: 1, unitPrice: 65000, total: 65000 },
      { id: "OI-009", productName: "Thermal Camera Module", quantity: 1, unitPrice: 18000, total: 18000 },
      { id: "OI-010", productName: "Pilot Certification", quantity: 2, unitPrice: 6000, total: 12000 },
    ],
    notes: "Pipeline inspection drone",
  },
];

export const DEMO_CUSTOMERS = [
  { id: "CUS-001", name: "Vietnam Airlines", contactName: "Nguyễn Văn Hùng", email: "hung.nv@vietnamairlines.com", phone: "+84-28-3832-0320", country: "Vietnam" },
  { id: "CUS-002", name: "Lộc Trời Group", contactName: "Trần Thị Lan", email: "lan.tt@loctroigroup.com", phone: "+84-296-3852-512", country: "Vietnam" },
  { id: "CUS-003", name: "PetroVietnam", contactName: "Lê Minh Đức", email: "duc.lm@pvn.vn", phone: "+84-24-3825-2526", country: "Vietnam" },
];

export const DEMO_PRODUCTION_ORDERS = [
  {
    id: "WO-001", orderId: "ORD-001", projectId: "PRJ-001",
    productName: "RTR-X7 Surveyor", quantity: 2, status: "IN_PROGRESS",
    startDate: "2026-03-01", targetDate: "2026-05-15",
    station: "Assembly", yieldRate: 100, defectCount: 0,
    logs: [
      { id: "PL-001", station: "PCB Assembly", status: "COMPLETED", date: "2026-03-05", operator: "Văn Hùng", notes: "PCB lot A passed all checks" },
      { id: "PL-002", station: "Frame Assembly", status: "COMPLETED", date: "2026-03-10", operator: "Đức Anh", notes: "Carbon fiber frame assembled" },
      { id: "PL-003", station: "Motor & ESC", status: "IN_PROGRESS", date: "2026-03-15", operator: "Thanh Hà", notes: "Motor calibration in progress" },
    ],
  },
  {
    id: "WO-002", orderId: "ORD-003", projectId: "PRJ-004",
    productName: "RTR-I2 Inspector", quantity: 1, status: "QC",
    startDate: "2026-02-15", targetDate: "2026-04-01",
    station: "QC", yieldRate: 100, defectCount: 0,
    logs: [
      { id: "PL-004", station: "PCB Assembly", status: "COMPLETED", date: "2026-02-20", operator: "Lê Thị Phương", notes: "Main board + thermal interface" },
      { id: "PL-005", station: "Integration", status: "COMPLETED", date: "2026-03-01", operator: "Vũ Đình Toàn", notes: "LiDAR + thermal camera integrated" },
      { id: "PL-006", station: "QC", status: "IN_PROGRESS", date: "2026-03-12", operator: "Lý Thanh Mai", notes: "Final QC inspection" },
    ],
  },
];

export const DEMO_INVENTORY = [
  { id: "INV-001", partNumber: "MOT-2806-920", name: "Brushless Motor 2806 920KV", category: "ELECTRICAL", quantity: 24, reorderPoint: 10, unit: "pcs", unitCost: 35, supplierId: "SUP-001", location: "Shelf A3", status: "OK" },
  { id: "INV-002", partNumber: "ESC-40A-BL", name: "ESC 40A BLHeli_S", category: "ELECTRICAL", quantity: 18, reorderPoint: 8, unit: "pcs", unitCost: 28, supplierId: "SUP-001", location: "Shelf A4", status: "OK" },
  { id: "INV-003", partNumber: "BAT-6S-8000", name: "LiPo 6S 8000mAh 25C", category: "ELECTRICAL", quantity: 6, reorderPoint: 5, unit: "pcs", unitCost: 120, supplierId: "SUP-002", location: "Shelf B1", status: "LOW" },
  { id: "INV-004", partNumber: "FC-F7-V3", name: "Flight Controller F7 V3", category: "ELECTRICAL", quantity: 3, reorderPoint: 4, unit: "pcs", unitCost: 85, supplierId: "SUP-003", location: "Shelf A1", status: "CRITICAL" },
  { id: "INV-005", partNumber: "CF-ARM-350", name: "Carbon Fiber Arm 350mm", category: "MECHANICAL", quantity: 40, reorderPoint: 16, unit: "pcs", unitCost: 22, supplierId: "SUP-004", location: "Shelf C2", status: "OK" },
  { id: "INV-006", partNumber: "PROP-15X5", name: "Propeller 15x5 CF", category: "MECHANICAL", quantity: 32, reorderPoint: 20, unit: "pairs", unitCost: 18, supplierId: "SUP-004", location: "Shelf C3", status: "OK" },
  { id: "INV-007", partNumber: "GPS-RTK-F9P", name: "u-blox F9P RTK Module", category: "ELECTRICAL", quantity: 5, reorderPoint: 3, unit: "pcs", unitCost: 195, supplierId: "SUP-005", location: "Shelf A2", status: "OK" },
  { id: "INV-008", partNumber: "CAM-SONY-A7R", name: "Sony A7R Mapping Camera", category: "ELECTRICAL", quantity: 2, reorderPoint: 2, unit: "pcs", unitCost: 2800, supplierId: "SUP-006", location: "Safe D1", status: "LOW" },
];

export const DEMO_FINANCE_SUMMARY = [
  { id: "FS-001", projectId: "PRJ-001", period: "2026-Q1", revenue: 125000, cogs: 78000, grossMargin: 47000, operatingExpenses: 22000, netIncome: 25000, currency: "USD" },
  { id: "FS-002", projectId: "PRJ-004", period: "2026-Q1", revenue: 95000, cogs: 55000, grossMargin: 40000, operatingExpenses: 18000, netIncome: 22000, currency: "USD" },
];

export const DEMO_INVOICES = [
  { id: "INV-2026-001", orderId: "ORD-003", customerId: "CUS-003", customerName: "PetroVietnam", amount: 95000, status: "PAID", issueDate: "2026-01-15", dueDate: "2026-02-15", paidDate: "2026-02-10", currency: "USD" },
  { id: "INV-2026-002", orderId: "ORD-001", customerId: "CUS-001", customerName: "Vietnam Airlines", amount: 62500, status: "CURRENT", issueDate: "2026-02-01", dueDate: "2026-03-01", paidDate: null, currency: "USD" },
  { id: "INV-2026-003", orderId: "ORD-001", customerId: "CUS-001", customerName: "Vietnam Airlines", amount: 62500, status: "PENDING", issueDate: "2026-05-01", dueDate: "2026-06-01", paidDate: null, currency: "USD" },
];

export const DEMO_COST_ENTRIES = [
  { id: "CE-001", projectId: "PRJ-001", category: "MATERIALS", description: "BOM components batch 1", amount: 45000, date: "2026-02-15", currency: "USD" },
  { id: "CE-002", projectId: "PRJ-001", category: "LABOR", description: "Assembly team Q1", amount: 18000, date: "2026-03-01", currency: "USD" },
  { id: "CE-003", projectId: "PRJ-004", category: "MATERIALS", description: "Inspector BOM + thermal", amount: 38000, date: "2026-02-01", currency: "USD" },
  { id: "CE-004", projectId: "PRJ-004", category: "TESTING", description: "IP67 certification + DVT tests", amount: 12000, date: "2026-01-20", currency: "USD" },
];
