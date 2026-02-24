// ===================================================================
// RtR CONTROL TOWER V2 — Data Models & Sample Data
// Modules: BOM, Flight Test, Supplier, Decisions
// ===================================================================

// --- SUPPLIERS ---
export const SUPPLIERS_DATA = [
  {
    id: "SUP-001", code: "ACM", name: "ACM Composites Ltd.", nameVi: "Cty TNHH ACM Composites",
    country: "VN", contactName: "Nguyễn Văn Bình", contactEmail: "binh@acm.vn",
    contactPhone: "+84 28 1234 5678", website: "https://acm-composites.vn",
    partCategories: ["MECHANICAL"],
    qualityRating: 4.2, deliveryOnTimeRate: 87, totalOrders: 12, lateDeliveries: 2, defectRate: 1.5,
    qualificationStatus: "QUALIFIED", certifications: ["ISO 9001", "IATF 16949"],
    lastAuditDate: "2025-11-15", nextAuditDate: "2026-05-15",
    paymentTerms: "Net 30", currency: "VND",
  },
  {
    id: "SUP-002", code: "DJX", name: "DJX Motor Technology", nameVi: "Cty CP DJX Motor",
    country: "VN", contactName: "Trần Minh Đức", contactEmail: "duc@djxmotor.vn",
    contactPhone: "+84 28 2345 6789", website: "https://djxmotor.vn",
    partCategories: ["ELECTRICAL"],
    qualityRating: 4.5, deliveryOnTimeRate: 93, totalOrders: 18, lateDeliveries: 1, defectRate: 0.8,
    qualificationStatus: "QUALIFIED", certifications: ["ISO 9001", "UL"],
    lastAuditDate: "2025-12-01", nextAuditDate: "2026-06-01",
    paymentTerms: "Net 45", currency: "USD",
  },
  {
    id: "SUP-003", code: "SZE", name: "SZ Electronics Co.", nameVi: "Cty SZ Electronics",
    country: "CN", contactName: "Li Wei", contactEmail: "liwei@sze.cn",
    contactPhone: "+86 755 1234 5678", website: "https://sze-electronics.cn",
    partCategories: ["ELECTRICAL"],
    qualityRating: 3.8, deliveryOnTimeRate: 78, totalOrders: 24, lateDeliveries: 5, defectRate: 2.3,
    qualificationStatus: "PROBATION", certifications: ["ISO 9001"],
    lastAuditDate: "2025-09-20", nextAuditDate: "2026-03-20",
    paymentTerms: "Net 30", currency: "USD",
  },
  {
    id: "SUP-004", code: "RBR", name: "RBR Vietnam Rubber", nameVi: "Cty TNHH RBR Cao Su VN",
    country: "VN", contactName: "Phạm Thị Lan", contactEmail: "lan@rbr.vn",
    contactPhone: "+84 28 3456 7890", website: "https://rbr-vietnam.vn",
    partCategories: ["MECHANICAL", "CONSUMABLE"],
    qualityRating: 4.0, deliveryOnTimeRate: 95, totalOrders: 8, lateDeliveries: 0, defectRate: 1.0,
    qualificationStatus: "QUALIFIED", certifications: ["ISO 9001"],
    lastAuditDate: "2025-10-10", nextAuditDate: "2026-04-10",
    paymentTerms: "Net 15", currency: "VND",
  },
  {
    id: "SUP-005", code: "UBX", name: "u-blox AG (Distributor VN)", nameVi: "u-blox AG (NPP Việt Nam)",
    country: "CH", contactName: "Nguyễn Hoàng Sơn", contactEmail: "son@ublox-vn.com",
    contactPhone: "+84 28 4567 8901", website: "https://ublox.com",
    partCategories: ["ELECTRICAL"],
    qualityRating: 4.8, deliveryOnTimeRate: 91, totalOrders: 6, lateDeliveries: 1, defectRate: 0.2,
    qualificationStatus: "QUALIFIED", certifications: ["ISO 9001", "ISO 14001", "IATF 16949"],
    lastAuditDate: "2025-08-01", nextAuditDate: "2026-08-01",
    paymentTerms: "Net 60", currency: "USD",
  },
  {
    id: "SUP-006", code: "SAT", name: "Shenzhen AeroTech Co., Ltd.", nameVi: "C\u00F4ng ty TNHH Shenzhen AeroTech",
    country: "CN", contactName: "David Chen (\u9648\u5927\u4F1F)", contactEmail: "david.chen@szaerotech.cn",
    contactPhone: "+86 755 8832 4567", website: "https://szaerotech.cn",
    partCategories: ["ELECTRICAL"],
    qualityRating: 3.8, deliveryOnTimeRate: 72, totalOrders: 18, lateDeliveries: 5, defectRate: 3.2,
    qualificationStatus: "PROBATION", certifications: ["ISO 9001"],
    lastAuditDate: "2025-09-10", nextAuditDate: "2026-03-10",
    paymentTerms: "TT 50/50", currency: "USD",
  },
  {
    id: "SUP-007", code: "NNX", name: "N\u00F4ng Nghi\u1EC7p Xanh JSC", nameVi: "CTCP N\u00F4ng Nghi\u1EC7p Xanh",
    country: "VN", contactName: "Tr\u1EA7n V\u0103n \u0110\u1EA1t", contactEmail: "dat.tv@nongxanh.vn",
    contactPhone: "+84 28 6262 7890", website: "https://nongxanh.vn",
    partCategories: ["MECHANICAL", "CONSUMABLE"],
    qualityRating: 4.5, deliveryOnTimeRate: 95, totalOrders: 8, lateDeliveries: 0, defectRate: 0.5,
    qualificationStatus: "QUALIFIED", certifications: ["ISO 9001", "VietGAP Compatible"],
    lastAuditDate: "2025-12-01", nextAuditDate: "2026-06-01",
    paymentTerms: "Net 30", currency: "VND",
  },
  {
    id: "SUP-008", code: "FLR", name: "FLIR Systems Vietnam LLC", nameVi: "C\u00F4ng ty TNHH FLIR Systems Vi\u1EC7t Nam",
    country: "VN", contactName: "Nguy\u1EC5n Ho\u00E0ng Minh", contactEmail: "hminh@flir.com",
    contactPhone: "+84 28 3822 5678", website: "https://flir.com",
    partCategories: ["ELECTRICAL"],
    qualityRating: 4.8, deliveryOnTimeRate: 90, totalOrders: 6, lateDeliveries: 1, defectRate: 0.2,
    qualificationStatus: "QUALIFIED", certifications: ["ISO 9001", "ISO 14001", "ITAR Exempt (Lepton)"],
    lastAuditDate: "2025-10-15", nextAuditDate: "2026-04-15",
    paymentTerms: "Net 45", currency: "USD",
  },
];

// --- DELIVERY RECORDS ---
export const DELIVERY_RECORDS_DATA = [
  { id: "DEL-001", supplierId: "SUP-001", bomPartId: "BOM-006", projectId: "PRJ-001", orderDate: "2026-01-15", promisedDate: "2026-01-29", actualDate: "2026-02-02", quantity: 16, unitPrice: 7.50, status: "DELIVERED_LATE", delayDays: 4 },
  { id: "DEL-002", supplierId: "SUP-001", bomPartId: "BOM-009", projectId: "PRJ-001", orderDate: "2025-12-20", promisedDate: "2026-01-03", actualDate: "2026-01-03", quantity: 2, unitPrice: 95.00, status: "DELIVERED_ON_TIME", delayDays: 0 },
  { id: "DEL-003", supplierId: "SUP-001", bomPartId: "BOM-007", projectId: "PRJ-001", orderDate: "2025-12-01", promisedDate: "2025-12-15", actualDate: "2025-12-15", quantity: 8, unitPrice: 20.00, status: "DELIVERED_ON_TIME", delayDays: 0 },
  { id: "DEL-004", supplierId: "SUP-001", bomPartId: "BOM-006", projectId: "PRJ-001", orderDate: "2025-11-01", promisedDate: "2025-11-15", actualDate: "2025-11-17", quantity: 8, unitPrice: 7.50, status: "DELIVERED_LATE", delayDays: 2 },
  { id: "DEL-005", supplierId: "SUP-002", bomPartId: "BOM-011", projectId: "PRJ-001", orderDate: "2026-01-05", promisedDate: "2026-01-19", actualDate: "2026-01-18", quantity: 4, unitPrice: 70.00, status: "DELIVERED_ON_TIME", delayDays: 0 },
  { id: "DEL-006", supplierId: "SUP-002", bomPartId: "BOM-012", projectId: "PRJ-001", orderDate: "2026-01-05", promisedDate: "2026-01-19", actualDate: "2026-01-19", quantity: 4, unitPrice: 40.00, status: "DELIVERED_ON_TIME", delayDays: 0 },
  { id: "DEL-007", supplierId: "SUP-003", bomPartId: "BOM-016", projectId: "PRJ-001", orderDate: "2026-01-10", promisedDate: "2026-01-31", actualDate: "2026-02-05", quantity: 2, unitPrice: 180.00, status: "DELIVERED_LATE", delayDays: 5 },
  { id: "DEL-008", supplierId: "SUP-005", bomPartId: "BOM-017", projectId: "PRJ-001", orderDate: "2025-12-15", promisedDate: "2026-01-15", actualDate: "2026-01-12", quantity: 2, unitPrice: 320.00, status: "DELIVERED_ON_TIME", delayDays: 0 },
  { id: "DEL-009", supplierId: "SUP-004", bomPartId: "BOM-010", projectId: "PRJ-001", orderDate: "2026-02-01", promisedDate: "2026-02-08", actualDate: "2026-02-07", quantity: 8, unitPrice: 2.80, status: "DELIVERED_ON_TIME", delayDays: 0 },
  { id: "DEL-010", supplierId: "SUP-003", bomPartId: "BOM-019", projectId: "PRJ-001", orderDate: "2026-02-10", promisedDate: "2026-02-28", actualDate: null, quantity: 4, unitPrice: 25.00, status: "IN_TRANSIT", delayDays: 0 },
  // PRJ-002 deliveries
  { id: "DEL-011", supplierId: "SUP-001", bomPartId: "BOM-A06", projectId: "PRJ-002", orderDate: "2025-12-01", promisedDate: "2025-12-15", actualDate: "2025-12-14", quantity: 6, unitPrice: 38.00, status: "DELIVERED_ON_TIME", delayDays: 0 },
  { id: "DEL-012", supplierId: "SUP-001", bomPartId: "BOM-A07", projectId: "PRJ-002", orderDate: "2025-12-01", promisedDate: "2025-12-15", actualDate: "2025-12-16", quantity: 1, unitPrice: 120.00, status: "DELIVERED_LATE", delayDays: 1 },
  { id: "DEL-013", supplierId: "SUP-002", bomPartId: "BOM-A11", projectId: "PRJ-002", orderDate: "2025-12-10", promisedDate: "2025-12-24", actualDate: "2025-12-23", quantity: 6, unitPrice: 95.00, status: "DELIVERED_ON_TIME", delayDays: 0 },
  { id: "DEL-014", supplierId: "SUP-002", bomPartId: "BOM-A12", projectId: "PRJ-002", orderDate: "2025-12-10", promisedDate: "2025-12-24", actualDate: "2025-12-24", quantity: 6, unitPrice: 55.00, status: "DELIVERED_ON_TIME", delayDays: 0 },
  { id: "DEL-015", supplierId: "SUP-003", bomPartId: "BOM-A14", projectId: "PRJ-002", orderDate: "2025-12-15", promisedDate: "2026-01-05", actualDate: "2026-01-08", quantity: 2, unitPrice: 420.00, status: "DELIVERED_LATE", delayDays: 3 },
  { id: "DEL-016", supplierId: "SUP-004", bomPartId: "BOM-A16", projectId: "PRJ-002", orderDate: "2025-12-20", promisedDate: "2025-12-30", actualDate: "2025-12-29", quantity: 1, unitPrice: 85.00, status: "DELIVERED_ON_TIME", delayDays: 0 },
  { id: "DEL-017", supplierId: "SUP-005", bomPartId: "BOM-A23", projectId: "PRJ-002", orderDate: "2026-01-10", promisedDate: "2026-02-07", actualDate: "2026-02-05", quantity: 1, unitPrice: 180.00, status: "DELIVERED_ON_TIME", delayDays: 0 },
  { id: "DEL-018", supplierId: "SUP-002", bomPartId: "BOM-A17", projectId: "PRJ-002", orderDate: "2026-02-01", promisedDate: "2026-02-15", actualDate: null, quantity: 1, unitPrice: 145.00, status: "IN_TRANSIT", delayDays: 0 },
  // SUP-006 (SAT — Shenzhen AeroTech) deliveries
  { id: "DEL-020", supplierId: "SUP-006", bomPartId: "BOM-A11", projectId: "PRJ-002", orderDate: "2025-10-01", promisedDate: "2025-10-21", actualDate: "2025-10-28", quantity: 24, unitPrice: 32.00, status: "DELIVERED_LATE", delayDays: 7 },
  { id: "DEL-021", supplierId: "SUP-006", bomPartId: "BOM-A12", projectId: "PRJ-002", orderDate: "2025-10-15", promisedDate: "2025-11-05", actualDate: "2025-11-12", quantity: 24, unitPrice: 18.50, status: "DELIVERED_LATE", delayDays: 7 },
  { id: "DEL-022", supplierId: "SUP-006", bomPartId: "BOM-A11", projectId: "PRJ-002", orderDate: "2025-12-01", promisedDate: "2025-12-21", actualDate: "2025-12-29", quantity: 12, unitPrice: 31.50, status: "DELIVERED_LATE", delayDays: 8 },
  { id: "DEL-023", supplierId: "SUP-006", bomPartId: "BOM-A12", projectId: "PRJ-002", orderDate: "2026-01-10", promisedDate: "2026-01-30", actualDate: "2026-01-29", quantity: 12, unitPrice: 18.50, status: "DELIVERED_ON_TIME", delayDays: 0 },
  // SUP-007 (NNX — Nông Nghiệp Xanh) deliveries
  { id: "DEL-030", supplierId: "SUP-007", bomPartId: "BOM-A16", projectId: "PRJ-002", orderDate: "2025-11-01", promisedDate: "2025-11-10", actualDate: "2025-11-09", quantity: 5, unitPrice: 45.00, status: "DELIVERED_ON_TIME", delayDays: 0 },
  { id: "DEL-031", supplierId: "SUP-007", bomPartId: "BOM-A17", projectId: "PRJ-002", orderDate: "2025-11-15", promisedDate: "2025-12-01", actualDate: "2025-11-29", quantity: 5, unitPrice: 85.00, status: "DELIVERED_ON_TIME", delayDays: 0 },
  { id: "DEL-032", supplierId: "SUP-007", bomPartId: "BOM-A18", projectId: "PRJ-002", orderDate: "2025-12-10", promisedDate: "2025-12-18", actualDate: "2025-12-17", quantity: 20, unitPrice: 12.00, status: "DELIVERED_ON_TIME", delayDays: 0 },
  // SUP-008 (FLR — FLIR Systems) deliveries
  { id: "DEL-040", supplierId: "SUP-008", bomPartId: "BOM-017", projectId: "PRJ-004", orderDate: "2025-07-01", promisedDate: "2025-08-15", actualDate: "2025-08-12", quantity: 3, unitPrice: 250.00, status: "DELIVERED_ON_TIME", delayDays: 0 },
  { id: "DEL-041", supplierId: "SUP-008", bomPartId: "BOM-017", projectId: "PRJ-004", orderDate: "2025-10-01", promisedDate: "2025-11-15", actualDate: "2025-11-22", quantity: 5, unitPrice: 245.00, status: "DELIVERED_LATE", delayDays: 7 },
  { id: "DEL-042", supplierId: "SUP-008", bomPartId: "BOM-017", projectId: "PRJ-004", orderDate: "2026-01-10", promisedDate: "2026-02-25", actualDate: null, quantity: 10, unitPrice: 240.00, status: "IN_TRANSIT", delayDays: 0 },
];

// --- BOM ITEMS (Multi-level tree) ---
// Level 0 = Assembly, Level 1 = Sub-assembly, Level 2 = Component
export const BOM_DATA = [
  // Top-level assembly
  { id: "BOM-001", projectId: "PRJ-001", parentId: null, level: 0, partNumber: "RTR-X7-ASY", description: "RTR-X7 Surveyor Drone Assembly", descriptionVi: "Bộ Drone RTR-X7 Surveyor hoàn chỉnh", category: "MECHANICAL", quantity: 1, unit: "set", unitCost: null, currency: "USD", supplierId: null, leadTimeDays: null, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },

  // Sub-assemblies (Level 1)
  { id: "BOM-002", projectId: "PRJ-001", parentId: "BOM-001", level: 1, partNumber: "RTR-X7-FRAME-ASY", description: "Frame Assembly", descriptionVi: "Bộ khung", category: "MECHANICAL", quantity: 1, unit: "set", unitCost: null, currency: "USD", supplierId: null, leadTimeDays: null, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-003", projectId: "PRJ-001", parentId: "BOM-001", level: 1, partNumber: "RTR-X7-PWR-ASY", description: "Power Assembly", descriptionVi: "Bộ nguồn", category: "ELECTRICAL", quantity: 1, unit: "set", unitCost: null, currency: "USD", supplierId: null, leadTimeDays: null, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-004", projectId: "PRJ-001", parentId: "BOM-001", level: 1, partNumber: "RTR-X7-AVI-ASY", description: "Avionics Assembly", descriptionVi: "Bộ điện tử hàng không", category: "ELECTRICAL", quantity: 1, unit: "set", unitCost: null, currency: "USD", supplierId: null, leadTimeDays: null, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-005", projectId: "PRJ-001", parentId: "BOM-001", level: 1, partNumber: "RTR-X7-HARNESS", description: "Wiring Harness", descriptionVi: "Bộ dây điện", category: "ELECTRICAL", quantity: 1, unit: "set", unitCost: null, currency: "USD", supplierId: null, leadTimeDays: null, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },

  // Frame Assembly components (Level 2)
  { id: "BOM-006", projectId: "PRJ-001", parentId: "BOM-002", level: 2, partNumber: "CF-TUBE-500", description: "Carbon fiber tube 500mm", descriptionVi: "Ống carbon 500mm", category: "MECHANICAL", quantity: 4, unit: "pcs", unitCost: 30.00, currency: "USD", supplierId: "SUP-001", leadTimeDays: 14, lifecycleStatus: "ACTIVE", alternatePartIds: ["BOM-006B"], designator: "" },
  { id: "BOM-007", projectId: "PRJ-001", parentId: "BOM-002", level: 2, partNumber: "MTR-MNT-AL", description: "Motor mount aluminum", descriptionVi: "Giá đỡ motor nhôm", category: "MECHANICAL", quantity: 4, unit: "pcs", unitCost: 20.00, currency: "USD", supplierId: "SUP-001", leadTimeDays: 14, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-008", projectId: "PRJ-001", parentId: "BOM-002", level: 2, partNumber: "LG-SET-01", description: "Landing gear set", descriptionVi: "Bộ chân đáp", category: "MECHANICAL", quantity: 1, unit: "set", unitCost: 45.00, currency: "USD", supplierId: "SUP-002", leadTimeDays: 21, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-009", projectId: "PRJ-001", parentId: "BOM-002", level: 2, partNumber: "CNTR-PLT-CF", description: "Center plate carbon fiber", descriptionVi: "Tấm trung tâm carbon", category: "MECHANICAL", quantity: 1, unit: "pcs", unitCost: 95.00, currency: "USD", supplierId: "SUP-001", leadTimeDays: 14, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-010", projectId: "PRJ-001", parentId: "BOM-002", level: 2, partNumber: "DAMP-RBR-4", description: "Vibration damper rubber", descriptionVi: "Đệm chống rung cao su", category: "MECHANICAL", quantity: 4, unit: "pcs", unitCost: 11.25, currency: "USD", supplierId: "SUP-004", leadTimeDays: 7, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },

  // Power Assembly components (Level 2)
  { id: "BOM-011", projectId: "PRJ-001", parentId: "BOM-003", level: 2, partNumber: "MOT-2810-KV920", description: "Motor 2810 920KV", descriptionVi: "Motor 2810 920KV", category: "ELECTRICAL", quantity: 4, unit: "pcs", unitCost: 70.00, currency: "USD", supplierId: "SUP-002", leadTimeDays: 14, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-012", projectId: "PRJ-001", parentId: "BOM-003", level: 2, partNumber: "ESC-40A-BL", description: "ESC 40A BLHeli", descriptionVi: "ESC 40A BLHeli", category: "ELECTRICAL", quantity: 4, unit: "pcs", unitCost: 40.00, currency: "USD", supplierId: "SUP-002", leadTimeDays: 14, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-013", projectId: "PRJ-001", parentId: "BOM-003", level: 2, partNumber: "PROP-1555-CF", description: "Propeller 15x5.5 CF", descriptionVi: "Cánh quạt 15x5.5 CF", category: "MECHANICAL", quantity: 4, unit: "pcs", unitCost: 25.00, currency: "USD", supplierId: "SUP-002", leadTimeDays: 7, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-014", projectId: "PRJ-001", parentId: "BOM-003", level: 2, partNumber: "BAT-6S-10AH", description: "Battery 6S 10000mAh", descriptionVi: "Pin 6S 10000mAh", category: "ELECTRICAL", quantity: 1, unit: "pcs", unitCost: 220.00, currency: "USD", supplierId: "SUP-003", leadTimeDays: 21, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-015", projectId: "PRJ-001", parentId: "BOM-003", level: 2, partNumber: "PDB-V2", description: "Power distribution board", descriptionVi: "Board phân phối nguồn", category: "ELECTRICAL", quantity: 1, unit: "pcs", unitCost: 45.00, currency: "USD", supplierId: "SUP-003", leadTimeDays: 14, lifecycleStatus: "NRND", alternatePartIds: [], designator: "" },
  { id: "BOM-016", projectId: "PRJ-001", parentId: "BOM-003", level: 2, partNumber: "CONN-XT60H", description: "XT60H Connector", descriptionVi: "Đầu nối XT60H", category: "ELECTRICAL", quantity: 2, unit: "pcs", unitCost: 7.50, currency: "USD", supplierId: "SUP-003", leadTimeDays: 7, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },

  // Avionics Assembly components (Level 2)
  { id: "BOM-017", projectId: "PRJ-001", parentId: "BOM-004", level: 2, partNumber: "FC-H7-V3", description: "Flight controller H7 V3", descriptionVi: "Bộ điều khiển bay H7 V3", category: "ELECTRICAL", quantity: 1, unit: "pcs", unitCost: 180.00, currency: "USD", supplierId: "SUP-003", leadTimeDays: 21, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "U1" },
  { id: "BOM-018", projectId: "PRJ-001", parentId: "BOM-004", level: 2, partNumber: "GPS-RTK-F9P", description: "RTK GPS module u-blox F9P", descriptionVi: "Module GPS RTK u-blox F9P", category: "ELECTRICAL", quantity: 1, unit: "pcs", unitCost: 320.00, currency: "USD", supplierId: "SUP-005", leadTimeDays: 28, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "U2" },
  { id: "BOM-019", projectId: "PRJ-001", parentId: "BOM-004", level: 2, partNumber: "GPS-ANT-L1L2", description: "GPS antenna L1/L2", descriptionVi: "Anten GPS L1/L2", category: "ELECTRICAL", quantity: 1, unit: "pcs", unitCost: 85.00, currency: "USD", supplierId: "SUP-005", leadTimeDays: 14, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-020", projectId: "PRJ-001", parentId: "BOM-004", level: 2, partNumber: "RC-RX-ELRS", description: "ELRS receiver", descriptionVi: "Bộ thu ELRS", category: "ELECTRICAL", quantity: 1, unit: "pcs", unitCost: 25.00, currency: "USD", supplierId: "SUP-003", leadTimeDays: 7, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-021", projectId: "PRJ-001", parentId: "BOM-004", level: 2, partNumber: "TELEM-915", description: "Telemetry radio 915MHz", descriptionVi: "Radio telemetry 915MHz", category: "ELECTRICAL", quantity: 1, unit: "pcs", unitCost: 65.00, currency: "USD", supplierId: "SUP-003", leadTimeDays: 10, lifecycleStatus: "EOL", alternatePartIds: ["BOM-021B"], designator: "" },
  { id: "BOM-022", projectId: "PRJ-001", parentId: "BOM-004", level: 2, partNumber: "CAM-SONY-20MP", description: "Survey camera 20MP", descriptionVi: "Camera khảo sát 20MP", category: "ELECTRICAL", quantity: 1, unit: "pcs", unitCost: 480.00, currency: "USD", supplierId: "SUP-003", leadTimeDays: 14, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-023", projectId: "PRJ-001", parentId: "BOM-004", level: 2, partNumber: "SD-128GB", description: "SD card 128GB industrial", descriptionVi: "Thẻ SD 128GB công nghiệp", category: "ELECTRICAL", quantity: 1, unit: "pcs", unitCost: 35.00, currency: "USD", supplierId: "SUP-003", leadTimeDays: 5, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },

  // Wiring Harness components (Level 2)
  { id: "BOM-024", projectId: "PRJ-001", parentId: "BOM-005", level: 2, partNumber: "WIRE-14AWG-2M", description: "14AWG silicone wire 2m", descriptionVi: "Dây silicone 14AWG 2m", category: "ELECTRICAL", quantity: 4, unit: "pcs", unitCost: 8.00, currency: "USD", supplierId: "SUP-004", leadTimeDays: 5, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-025", projectId: "PRJ-001", parentId: "BOM-005", level: 2, partNumber: "WIRE-22AWG-5M", description: "22AWG signal wire 5m", descriptionVi: "Dây tín hiệu 22AWG 5m", category: "ELECTRICAL", quantity: 1, unit: "pcs", unitCost: 18.00, currency: "USD", supplierId: "SUP-004", leadTimeDays: 5, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-026", projectId: "PRJ-001", parentId: "BOM-005", level: 2, partNumber: "CONN-JST-10", description: "JST connector set", descriptionVi: "Bộ đầu nối JST", category: "ELECTRICAL", quantity: 10, unit: "pcs", unitCost: 2.20, currency: "USD", supplierId: "SUP-003", leadTimeDays: 7, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-027", projectId: "PRJ-001", parentId: "BOM-005", level: 2, partNumber: "SHRINK-KIT", description: "Heat shrink kit", descriptionVi: "Bộ ống co nhiệt", category: "CONSUMABLE", quantity: 1, unit: "set", unitCost: 10.00, currency: "USD", supplierId: "SUP-004", leadTimeDays: 3, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },

  // ═══════════════════════════════════════════════════════════════
  // PRJ-002: RTR-A3 Agri Sprayer — Full BOM Tree
  // ═══════════════════════════════════════════════════════════════

  // Top-level assembly
  { id: "BOM-A01", projectId: "PRJ-002", parentId: null, level: 0, partNumber: "RTR-A3-ASY", description: "RTR-A3 Agri Sprayer Drone Assembly", descriptionVi: "Bộ Drone RTR-A3 Phun Nông Nghiệp hoàn chỉnh", category: "MECHANICAL", quantity: 1, unit: "set", unitCost: null, currency: "USD", supplierId: null, leadTimeDays: null, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },

  // Sub-assemblies (Level 1)
  { id: "BOM-A02", projectId: "PRJ-002", parentId: "BOM-A01", level: 1, partNumber: "RTR-A3-FRAME", description: "Hexa-Frame Assembly", descriptionVi: "Bộ khung Hexa", category: "MECHANICAL", quantity: 1, unit: "set", unitCost: null, currency: "USD", supplierId: null, leadTimeDays: null, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-A03", projectId: "PRJ-002", parentId: "BOM-A01", level: 1, partNumber: "RTR-A3-PWR", description: "Power System", descriptionVi: "Hệ thống nguồn", category: "ELECTRICAL", quantity: 1, unit: "set", unitCost: null, currency: "USD", supplierId: null, leadTimeDays: null, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-A04", projectId: "PRJ-002", parentId: "BOM-A01", level: 1, partNumber: "RTR-A3-SPRAY", description: "Spray System", descriptionVi: "Hệ thống phun", category: "MECHANICAL", quantity: 1, unit: "set", unitCost: null, currency: "USD", supplierId: null, leadTimeDays: null, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-A05", projectId: "PRJ-002", parentId: "BOM-A01", level: 1, partNumber: "RTR-A3-AVI", description: "Avionics & Navigation", descriptionVi: "Điện tử hàng không & Dẫn đường", category: "ELECTRICAL", quantity: 1, unit: "set", unitCost: null, currency: "USD", supplierId: null, leadTimeDays: null, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },

  // Frame Assembly components (Level 2)
  { id: "BOM-A06", projectId: "PRJ-002", parentId: "BOM-A02", level: 2, partNumber: "CF-ARM-680", description: "Carbon fiber arm 680mm", descriptionVi: "Cánh tay carbon 680mm", category: "MECHANICAL", quantity: 6, unit: "pcs", unitCost: 38.00, currency: "USD", supplierId: "SUP-001", leadTimeDays: 14, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-A07", projectId: "PRJ-002", parentId: "BOM-A02", level: 2, partNumber: "CNTR-PLT-A3", description: "Center plate assembly", descriptionVi: "Bộ tấm trung tâm", category: "MECHANICAL", quantity: 1, unit: "set", unitCost: 120.00, currency: "USD", supplierId: "SUP-001", leadTimeDays: 14, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-A08", projectId: "PRJ-002", parentId: "BOM-A02", level: 2, partNumber: "LG-AGRI-01", description: "Folding landing gear 400mm", descriptionVi: "Chân đáp gập 400mm", category: "MECHANICAL", quantity: 1, unit: "set", unitCost: 65.00, currency: "USD", supplierId: "SUP-001", leadTimeDays: 21, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-A09", projectId: "PRJ-002", parentId: "BOM-A02", level: 2, partNumber: "MTR-MNT-A3", description: "Motor mount w/ damper", descriptionVi: "Giá đỡ motor có đệm chống rung", category: "MECHANICAL", quantity: 6, unit: "pcs", unitCost: 22.00, currency: "USD", supplierId: "SUP-001", leadTimeDays: 14, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-A10", projectId: "PRJ-002", parentId: "BOM-A02", level: 2, partNumber: "TANK-MNT-20L", description: "Tank mounting bracket 20L", descriptionVi: "Bracket gắn bình 20L", category: "MECHANICAL", quantity: 1, unit: "set", unitCost: 35.00, currency: "USD", supplierId: "SUP-001", leadTimeDays: 10, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },

  // Power System components (Level 2)
  { id: "BOM-A11", projectId: "PRJ-002", parentId: "BOM-A03", level: 2, partNumber: "MOT-4008-KV620", description: "Motor 4008 620KV", descriptionVi: "Motor 4008 620KV", category: "ELECTRICAL", quantity: 6, unit: "pcs", unitCost: 95.00, currency: "USD", supplierId: "SUP-002", leadTimeDays: 14, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-A12", projectId: "PRJ-002", parentId: "BOM-A03", level: 2, partNumber: "ESC-60A-FD", description: "ESC 60A FOC drive", descriptionVi: "ESC 60A điều khiển FOC", category: "ELECTRICAL", quantity: 6, unit: "pcs", unitCost: 55.00, currency: "USD", supplierId: "SUP-002", leadTimeDays: 14, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-A13", projectId: "PRJ-002", parentId: "BOM-A03", level: 2, partNumber: "PROP-2170-AGRI", description: "Propeller 21x7.0 agricultural", descriptionVi: "Cánh quạt 21x7.0 nông nghiệp", category: "MECHANICAL", quantity: 6, unit: "pcs", unitCost: 18.00, currency: "USD", supplierId: "SUP-002", leadTimeDays: 7, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-A14", projectId: "PRJ-002", parentId: "BOM-A03", level: 2, partNumber: "BAT-12S-16AH", description: "Battery 12S 16000mAh", descriptionVi: "Pin 12S 16000mAh", category: "ELECTRICAL", quantity: 2, unit: "pcs", unitCost: 420.00, currency: "USD", supplierId: "SUP-003", leadTimeDays: 21, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-A15", projectId: "PRJ-002", parentId: "BOM-A03", level: 2, partNumber: "PDB-120A-HV", description: "Power distribution board 120A HV", descriptionVi: "Board phân phối nguồn 120A HV", category: "ELECTRICAL", quantity: 1, unit: "pcs", unitCost: 68.00, currency: "USD", supplierId: "SUP-003", leadTimeDays: 14, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },

  // Spray System components (Level 2)
  { id: "BOM-A16", projectId: "PRJ-002", parentId: "BOM-A04", level: 2, partNumber: "TANK-PE-20L", description: "PE spray tank 20L", descriptionVi: "Bình phun PE 20L", category: "MECHANICAL", quantity: 1, unit: "pcs", unitCost: 85.00, currency: "USD", supplierId: "SUP-004", leadTimeDays: 10, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-A17", projectId: "PRJ-002", parentId: "BOM-A04", level: 2, partNumber: "PUMP-BR-12V", description: "Brushless diaphragm pump 12V", descriptionVi: "Bơm màng không chổi than 12V", category: "ELECTRICAL", quantity: 1, unit: "pcs", unitCost: 145.00, currency: "USD", supplierId: "SUP-002", leadTimeDays: 14, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-A18", projectId: "PRJ-002", parentId: "BOM-A04", level: 2, partNumber: "NOZZLE-FAN-4", description: "Fan nozzle set (4 nozzles)", descriptionVi: "Bộ vòi phun quạt (4 vòi)", category: "CONSUMABLE", quantity: 1, unit: "set", unitCost: 32.00, currency: "USD", supplierId: "SUP-004", leadTimeDays: 7, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-A19", projectId: "PRJ-002", parentId: "BOM-A04", level: 2, partNumber: "FLOW-SENS-01", description: "Flow rate sensor", descriptionVi: "Cảm biến lưu lượng", category: "ELECTRICAL", quantity: 1, unit: "pcs", unitCost: 45.00, currency: "USD", supplierId: "SUP-003", leadTimeDays: 10, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-A20", projectId: "PRJ-002", parentId: "BOM-A04", level: 2, partNumber: "TUBE-SILI-6MM", description: "Silicone tubing 6mm 3m kit", descriptionVi: "Bộ ống silicone 6mm 3m", category: "CONSUMABLE", quantity: 1, unit: "set", unitCost: 12.00, currency: "USD", supplierId: "SUP-004", leadTimeDays: 3, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-A21", projectId: "PRJ-002", parentId: "BOM-A04", level: 2, partNumber: "FILTER-100M", description: "Inline filter 100-mesh", descriptionVi: "Bộ lọc inline 100-mesh", category: "CONSUMABLE", quantity: 2, unit: "pcs", unitCost: 8.50, currency: "USD", supplierId: "SUP-004", leadTimeDays: 5, lifecycleStatus: "NRND", alternatePartIds: ["FILTER-200M"], designator: "" },

  // Avionics & Navigation (Level 2)
  { id: "BOM-A22", projectId: "PRJ-002", parentId: "BOM-A05", level: 2, partNumber: "FC-A3-V1", description: "Flight controller agri-grade", descriptionVi: "Bộ điều khiển bay cấp nông nghiệp", category: "ELECTRICAL", quantity: 1, unit: "pcs", unitCost: 210.00, currency: "USD", supplierId: "SUP-003", leadTimeDays: 21, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "U1" },
  { id: "BOM-A23", projectId: "PRJ-002", parentId: "BOM-A05", level: 2, partNumber: "GPS-RTK-M9N", description: "RTK GPS u-blox M9N", descriptionVi: "Module GPS RTK u-blox M9N", category: "ELECTRICAL", quantity: 1, unit: "pcs", unitCost: 180.00, currency: "USD", supplierId: "SUP-005", leadTimeDays: 28, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "U2" },
  { id: "BOM-A24", projectId: "PRJ-002", parentId: "BOM-A05", level: 2, partNumber: "RADAR-ALT-01", description: "Radar altimeter (terrain follow)", descriptionVi: "Cao kế radar (theo địa hình)", category: "ELECTRICAL", quantity: 1, unit: "pcs", unitCost: 120.00, currency: "USD", supplierId: "SUP-003", leadTimeDays: 14, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-A25", projectId: "PRJ-002", parentId: "BOM-A05", level: 2, partNumber: "RC-RX-ELRS-A3", description: "ELRS receiver long-range", descriptionVi: "Bộ thu ELRS tầm xa", category: "ELECTRICAL", quantity: 1, unit: "pcs", unitCost: 35.00, currency: "USD", supplierId: "SUP-003", leadTimeDays: 7, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
  { id: "BOM-A26", projectId: "PRJ-002", parentId: "BOM-A05", level: 2, partNumber: "TELEM-4G-01", description: "4G telemetry module", descriptionVi: "Module telemetry 4G", category: "ELECTRICAL", quantity: 1, unit: "pcs", unitCost: 95.00, currency: "USD", supplierId: "SUP-003", leadTimeDays: 14, lifecycleStatus: "ACTIVE", alternatePartIds: [], designator: "" },
];

// --- BOM HELPER: Calculate costs ---
export function calcBomCosts(bomItems) {
  const map = new Map(bomItems.map(b => [b.id, { ...b }]));
  const children = new Map();
  for (const item of bomItems) {
    if (item.parentId) {
      if (!children.has(item.parentId)) children.set(item.parentId, []);
      children.get(item.parentId).push(item.id);
    }
  }
  function calc(id) {
    const item = map.get(id);
    const kids = children.get(id);
    if (!kids || kids.length === 0) {
      item.totalCost = (item.unitCost || 0) * item.quantity;
    } else {
      let sum = 0;
      for (const cid of kids) {
        calc(cid);
        sum += map.get(cid).totalCost || 0;
      }
      item.totalCost = sum;
      item.unitCost = sum;
    }
    return item;
  }
  for (const item of bomItems) {
    if (!item.parentId) calc(item.id);
  }
  return Array.from(map.values());
}

// --- FLIGHT TESTS ---
export const FLIGHT_TESTS_DATA = [
  {
    id: "FLT-047", projectId: "PRJ-001", testNumber: 47, date: "2026-02-20",
    location: "RtR Test Field Alpha", locationVi: "Bãi bay RtR Alpha",
    pilot: "Đức Anh", droneUnit: "X7-DVT-003",
    testType: "ENDURANCE", testPhase: "DVT", relatedGateCondition: "d2",
    result: "FAIL", duration: 1847, maxAltitude: 120, maxSpeed: 15.2, distanceCovered: 4500,
    sensorData: { batteryStart: 25.2, batteryEnd: 21.8, batteryMinCell: 3.45, maxCurrent: 42.5, avgCurrent: 18.3, maxVibration: 28.5, gpsAccuracy: 0.02, maxWind: 8.2, ambientTemp: 35 },
    anomalies: [
      { timestamp: 1234, description: "Motor #4 current spike to 42A", descriptionVi: "Motor #4 dòng tăng vọt 42A", severity: "HIGH" },
      { timestamp: 1567, description: "GPS fix lost for 3 seconds", descriptionVi: "Mất tín hiệu GPS 3 giây", severity: "MEDIUM" },
    ],
    attachments: [
      { type: "VIDEO", name: "FLT47-onboard.mp4" },
      { type: "LOG", name: "FLT47-blackbox.bin" },
      { type: "PHOTO", name: "FLT47-damage-esc4.jpg" },
    ],
    notes: "Test aborted at 30min due to ESC #4 overtemp. Motor mount showed vibration marks.",
    notesVi: "Test dừng ở phút 30 do ESC #4 quá nhiệt. Giá đỡ motor có dấu hiệu rung.",
    autoIssueId: "ISS-004",
    createdBy: "usr-003",
  },
  {
    id: "FLT-046", projectId: "PRJ-001", testNumber: 46, date: "2026-02-18",
    location: "RtR Test Field Alpha", locationVi: "Bãi bay RtR Alpha",
    pilot: "Đức Anh", droneUnit: "X7-DVT-003",
    testType: "STABILITY", testPhase: "DVT", relatedGateCondition: "d3",
    result: "PASS", duration: 1335, maxAltitude: 80, maxSpeed: 12.0, distanceCovered: 2100,
    sensorData: { batteryStart: 25.1, batteryEnd: 23.2, batteryMinCell: 3.82, maxCurrent: 22.0, avgCurrent: 14.5, maxVibration: 12.3, gpsAccuracy: 0.015, maxWind: 5.1, ambientTemp: 30 },
    anomalies: [],
    attachments: [{ type: "LOG", name: "FLT46-blackbox.bin" }],
    notes: "Stable hover and waypoint navigation. All parameters nominal.",
    notesVi: "Bay treo và điều hướng waypoint ổn định. Mọi thông số bình thường.",
    autoIssueId: null,
    createdBy: "usr-003",
  },
  {
    id: "FLT-045", projectId: "PRJ-001", testNumber: 45, date: "2026-02-15",
    location: "RtR Test Field Bravo", locationVi: "Bãi bay RtR Bravo",
    pilot: "Thanh Hà", droneUnit: "X7-DVT-002",
    testType: "PAYLOAD", testPhase: "DVT", relatedGateCondition: null,
    result: "PASS", duration: 1110, maxAltitude: 60, maxSpeed: 8.5, distanceCovered: 1800,
    sensorData: { batteryStart: 25.0, batteryEnd: 22.1, batteryMinCell: 3.62, maxCurrent: 28.0, avgCurrent: 20.1, maxVibration: 15.0, gpsAccuracy: 0.018, maxWind: 4.0, ambientTemp: 28 },
    anomalies: [],
    attachments: [{ type: "LOG", name: "FLT45-blackbox.bin" }, { type: "PHOTO", name: "FLT45-payload-config.jpg" }],
    notes: "Full payload test at 2.5kg. Flight time 18:30. Within spec.",
    notesVi: "Test đầy tải 2.5kg. Thời gian bay 18:30. Trong spec.",
    autoIssueId: null,
    createdBy: "usr-004",
  },
  {
    id: "FLT-044", projectId: "PRJ-001", testNumber: 44, date: "2026-02-12",
    location: "RtR Test Field Alpha", locationVi: "Bãi bay RtR Alpha",
    pilot: "Đức Anh", droneUnit: "X7-DVT-003",
    testType: "ENDURANCE", testPhase: "DVT", relatedGateCondition: "d2",
    result: "PASS", duration: 2702, maxAltitude: 100, maxSpeed: 14.0, distanceCovered: 8200,
    sensorData: { batteryStart: 25.2, batteryEnd: 20.5, batteryMinCell: 3.38, maxCurrent: 25.0, avgCurrent: 16.8, maxVibration: 11.0, gpsAccuracy: 0.012, maxWind: 6.5, ambientTemp: 32 },
    anomalies: [],
    attachments: [{ type: "LOG", name: "FLT44-blackbox.bin" }],
    notes: "45-minute endurance flight. Battery to 20.5V. Clean flight.",
    notesVi: "Bay 45 phút. Pin còn 20.5V. Bay sạch.",
    autoIssueId: null,
    createdBy: "usr-003",
  },
  {
    id: "FLT-043", projectId: "PRJ-001", testNumber: 43, date: "2026-02-10",
    location: "RtR Test Field Alpha", locationVi: "Bãi bay RtR Alpha",
    pilot: "Thanh Hà", droneUnit: "X7-DVT-002",
    testType: "SPEED", testPhase: "DVT", relatedGateCondition: null,
    result: "PARTIAL", duration: 525, maxAltitude: 50, maxSpeed: 22.5, distanceCovered: 3500,
    sensorData: { batteryStart: 25.0, batteryEnd: 23.8, batteryMinCell: 3.90, maxCurrent: 38.0, avgCurrent: 25.0, maxVibration: 22.0, gpsAccuracy: 0.025, maxWind: 3.2, ambientTemp: 29 },
    anomalies: [
      { timestamp: 420, description: "GPS TTFF 48s on cold start", descriptionVi: "GPS TTFF 48 giây khi khởi động lạnh", severity: "HIGH" },
    ],
    attachments: [{ type: "LOG", name: "FLT43-blackbox.bin" }],
    notes: "Max speed achieved 22.5m/s but GPS cold start took 48s. Speed test passed but GPS issue noted.",
    notesVi: "Tốc độ tối đa 22.5m/s nhưng GPS khởi động lạnh mất 48 giây. Test tốc độ đạt nhưng ghi nhận vấn đề GPS.",
    autoIssueId: "ISS-002",
    createdBy: "usr-004",
  },
  {
    id: "FLT-042", projectId: "PRJ-001", testNumber: 42, date: "2026-02-08",
    location: "RtR Test Field Alpha", locationVi: "Bãi bay RtR Alpha",
    pilot: "Đức Anh", droneUnit: "X7-DVT-001",
    testType: "INTEGRATION", testPhase: "DVT", relatedGateCondition: null,
    result: "PASS", duration: 900, maxAltitude: 50, maxSpeed: 10.0, distanceCovered: 1200,
    sensorData: { batteryStart: 25.1, batteryEnd: 24.0, batteryMinCell: 3.95, maxCurrent: 18.0, avgCurrent: 12.0, maxVibration: 8.5, gpsAccuracy: 0.01, maxWind: 2.0, ambientTemp: 27 },
    anomalies: [],
    attachments: [{ type: "LOG", name: "FLT42-blackbox.bin" }],
    notes: "Camera integration test. Trigger + geotag working correctly.",
    notesVi: "Test tích hợp camera. Trigger + geotag hoạt động đúng.",
    autoIssueId: null,
    createdBy: "usr-003",
  },
  {
    id: "FLT-048", projectId: "PRJ-001", testNumber: 48, date: "2026-02-22",
    location: "RtR Alpha Field", locationVi: "Bãi bay RtR Alpha",
    pilot: "Thanh Hà", droneUnit: "X7-DVT-003",
    testType: "ENVIRONMENTAL", testPhase: "DVT", relatedGateCondition: "d9",
    result: "FAIL", duration: 1020, maxAltitude: 80, maxSpeed: 12.0, distanceCovered: 2800,
    sensorData: { batteryStart: 25.2, batteryEnd: 22.1, batteryMinCell: 3.38, maxCurrent: 38.0, avgCurrent: 22.0, maxVibration: 15.0, gpsAccuracy: 0.03, maxWind: 6.5, ambientTemp: 46 },
    anomalies: [
      { timestamp: 780, description: "CPU thermal throttle triggered at 46°C ambient", descriptionVi: "CPU giảm xung do nhiệt ở 46°C", severity: "HIGH" },
      { timestamp: 900, description: "Battery cell voltage imbalance >0.15V", descriptionVi: "Chênh lệch điện áp cell pin >0.15V", severity: "MEDIUM" },
    ],
    attachments: [{ type: "LOG", name: "FLT48-blackbox.bin" }, { type: "PHOTO", name: "FLT48-thermal-camera.jpg" }],
    notes: "Environmental test at peak heat. CPU throttled after 13min, battery imbalance triggered RTL.",
    notesVi: "Test môi trường ở đỉnh nóng. CPU giảm xung sau 13 phút, mất cân bằng pin kích hoạt RTL.",
    autoIssueId: null,
    createdBy: "usr-003",
  },
  {
    id: "FLT-010", projectId: "PRJ-002", testNumber: 10, date: "2026-02-05",
    location: "Nông trại Bình Dương", locationVi: "Nông trại Bình Dương",
    pilot: "Hồng Phúc", droneUnit: "A3-EVT-001",
    testType: "STABILITY", testPhase: "EVT", relatedGateCondition: "e5",
    result: "FAIL", duration: 600, maxAltitude: 15, maxSpeed: 6.0, distanceCovered: 800,
    sensorData: { batteryStart: 50.4, batteryEnd: 48.2, batteryMinCell: 3.85, maxCurrent: 55.0, avgCurrent: 30.0, maxVibration: 45.0, gpsAccuracy: 1.2, maxWind: 4.5, ambientTemp: 33 },
    anomalies: [
      { timestamp: 360, description: "Excessive vibration at 40% throttle", descriptionVi: "Rung quá mức ở 40% ga", severity: "HIGH" },
      { timestamp: 480, description: "Spray system pressure drop", descriptionVi: "Áp suất hệ thống phun giảm", severity: "MEDIUM" },
    ],
    attachments: [{ type: "LOG", name: "FLT10-blackbox.bin" }, { type: "VIDEO", name: "FLT10-vibration.mp4" }],
    notes: "Severe frame resonance at 40% throttle. Had to land early. Spray nozzle also clogged.",
    notesVi: "Cộng hưởng khung nghiêm trọng ở 40% ga. Phải hạ cánh sớm. Vòi phun cũng bị tắc.",
    autoIssueId: "ISS-007",
    createdBy: "usr-002",
  },
  {
    id: "FLT-009", projectId: "PRJ-002", testNumber: 9, date: "2026-02-01",
    location: "Nông trại Bình Dương", locationVi: "Nông trại Bình Dương",
    pilot: "Bảo Trâm", droneUnit: "A3-EVT-001",
    testType: "PAYLOAD", testPhase: "EVT", relatedGateCondition: null,
    result: "PASS", duration: 780, maxAltitude: 10, maxSpeed: 5.5, distanceCovered: 1200,
    sensorData: { batteryStart: 50.4, batteryEnd: 46.8, batteryMinCell: 3.72, maxCurrent: 48.0, avgCurrent: 28.0, maxVibration: 18.0, gpsAccuracy: 0.8, maxWind: 3.0, ambientTemp: 31 },
    anomalies: [],
    attachments: [{ type: "LOG", name: "FLT09-blackbox.bin" }, { type: "PHOTO", name: "FLT09-spray-pattern.jpg" }],
    notes: "Full 20L payload test. Flight time 13min at cruise. Stable at low altitude. Spray coverage acceptable.",
    notesVi: "Test tải 20L đầy. Thời gian bay 13 phút ở tốc độ cruise. Ổn định ở độ cao thấp. Diện tích phun chấp nhận được.",
    autoIssueId: null,
    createdBy: "usr-006",
  },
  {
    id: "FLT-008", projectId: "PRJ-002", testNumber: 8, date: "2026-01-28",
    location: "Nông trại Long An", locationVi: "Nông trại Long An",
    pilot: "Hồng Phúc", droneUnit: "A3-EVT-001",
    testType: "ENDURANCE", testPhase: "EVT", relatedGateCondition: "e5",
    result: "PARTIAL", duration: 1020, maxAltitude: 8, maxSpeed: 4.5, distanceCovered: 2200,
    sensorData: { batteryStart: 50.4, batteryEnd: 43.1, batteryMinCell: 3.40, maxCurrent: 52.0, avgCurrent: 32.0, maxVibration: 14.0, gpsAccuracy: 0.9, maxWind: 5.8, ambientTemp: 34 },
    anomalies: [
      { timestamp: 840, description: "Battery cell imbalance >0.2V at 15% SoC", descriptionVi: "Chênh lệch cell pin >0.2V ở 15% SoC", severity: "MEDIUM" },
    ],
    attachments: [{ type: "LOG", name: "FLT08-blackbox.bin" }],
    notes: "17min flight with 15L payload. Endurance target 20min not reached. Battery imbalance triggered early RTL.",
    notesVi: "Bay 17 phút với tải 15L. Mục tiêu bay 20 phút chưa đạt. Mất cân bằng pin kích hoạt RTL sớm.",
    autoIssueId: null,
    createdBy: "usr-002",
  },
  {
    id: "FLT-007", projectId: "PRJ-002", testNumber: 7, date: "2026-01-22",
    location: "Nông trại Bình Dương", locationVi: "Nông trại Bình Dương",
    pilot: "Bảo Trâm", droneUnit: "A3-EVT-001",
    testType: "INTEGRATION", testPhase: "EVT", relatedGateCondition: "e4",
    result: "PASS", duration: 540, maxAltitude: 12, maxSpeed: 3.0, distanceCovered: 600,
    sensorData: { batteryStart: 50.4, batteryEnd: 49.0, batteryMinCell: 3.92, maxCurrent: 35.0, avgCurrent: 20.0, maxVibration: 10.0, gpsAccuracy: 0.5, maxWind: 2.0, ambientTemp: 29 },
    anomalies: [],
    attachments: [{ type: "LOG", name: "FLT07-blackbox.bin" }, { type: "VIDEO", name: "FLT07-spray-test.mp4" }],
    notes: "First integrated spray test. Pump, nozzle, flow sensor all functional. Terrain-following radar OK.",
    notesVi: "Test phun tích hợp đầu tiên. Bơm, vòi, cảm biến lưu lượng đều hoạt động. Radar theo địa hình OK.",
    autoIssueId: null,
    createdBy: "usr-006",
  },
  {
    id: "FLT-006", projectId: "PRJ-002", testNumber: 6, date: "2026-01-15",
    location: "RtR Test Field Alpha", locationVi: "Bãi bay RtR Alpha",
    pilot: "Hồng Phúc", droneUnit: "A3-EVT-001",
    testType: "SPEED", testPhase: "EVT", relatedGateCondition: null,
    result: "PASS", duration: 420, maxAltitude: 20, maxSpeed: 8.2, distanceCovered: 1500,
    sensorData: { batteryStart: 50.4, batteryEnd: 49.2, batteryMinCell: 3.95, maxCurrent: 58.0, avgCurrent: 22.0, maxVibration: 12.0, gpsAccuracy: 0.4, maxWind: 2.5, ambientTemp: 28 },
    anomalies: [],
    attachments: [{ type: "LOG", name: "FLT06-blackbox.bin" }],
    notes: "Speed test empty payload. Max 8.2m/s meets agri cruise spec of 6m/s with margin.",
    notesVi: "Test tốc độ không tải. Tốc độ max 8.2m/s đạt spec cruise nông nghiệp 6m/s với biên dự.",
    autoIssueId: null,
    createdBy: "usr-002",
  },
  // PRJ-004: RTR-I2 Inspector — 4 flight tests
  {
    id: "FLT-101", projectId: "PRJ-004", testNumber: 101, date: "2026-01-15",
    location: "B\u00ECnh D\u01B0\u01A1ng Solar Farm", locationVi: "Trang tr\u1EA1i \u0111i\u1EC7n m\u1EB7t tr\u1EDDi B\u00ECnh D\u01B0\u01A1ng",
    pilot: "L\u00EA Th\u1ECB Ph\u01B0\u01A1ng", droneUnit: "I2-PVT-002",
    testType: "INTEGRATION", testPhase: "PVT", relatedGateCondition: null,
    result: "PASS", duration: 1500, maxAltitude: 80, maxSpeed: 12.0, distanceCovered: 3200,
    sensorData: { batteryStart: 25.1, batteryEnd: 22.3, batteryMinCell: 3.58, maxCurrent: 28.5, avgCurrent: 14.2, maxVibration: 15.3, gpsAccuracy: 0.015, maxWind: 6.5, ambientTemp: 32 },
    anomalies: [],
    attachments: [{ type: "VIDEO", name: "FLT101-thermal-scan.mp4" }, { type: "LOG", name: "FLT101-blackbox.bin" }],
    notes: "Successful integration test. Thermal + LiDAR simultaneous capture. Solar panel hotspot detection verified.",
    notesVi: "Test t\u00EDch h\u1EE3p th\u00E0nh c\u00F4ng. Camera nhi\u1EC7t + LiDAR ch\u1EE5p \u0111\u1ED3ng th\u1EDDi. X\u00E1c nh\u1EADn ph\u00E1t hi\u1EC7n \u0111i\u1EC3m n\u00F3ng pin m\u1EB7t tr\u1EDDi.",
    autoIssueId: null, createdBy: "usr-008",
  },
  {
    id: "FLT-102", projectId: "PRJ-004", testNumber: 102, date: "2026-01-22",
    location: "RtR Test Field Bravo", locationVi: "B\u00E3i bay RtR Bravo",
    pilot: "V\u0169 \u0110\u00ECnh To\u00E0n", droneUnit: "I2-PVT-003",
    testType: "ENDURANCE", testPhase: "PVT", relatedGateCondition: "p5",
    result: "PASS", duration: 2550, maxAltitude: 100, maxSpeed: 14.0, distanceCovered: 6500,
    sensorData: { batteryStart: 25.2, batteryEnd: 21.1, batteryMinCell: 3.42, maxCurrent: 32.0, avgCurrent: 15.8, maxVibration: 18.2, gpsAccuracy: 0.018, maxWind: 8.0, ambientTemp: 30 },
    anomalies: [],
    attachments: [{ type: "LOG", name: "FLT102-blackbox.bin" }, { type: "PHOTO", name: "FLT102-battery-after.jpg" }],
    notes: "42.5 min flight time achieved with full sensor payload (thermal + LiDAR + onboard compute). Exceeds 40 min requirement.",
    notesVi: "\u0110\u1EA1t 42.5 ph\u00FAt bay v\u1EDBi t\u1EA3i \u0111\u1EA7y \u0111\u1EE7 (camera nhi\u1EC7t + LiDAR + m\u00E1y t\u00EDnh onboard). V\u01B0\u1EE3t y\u00EAu c\u1EA7u 40 ph\u00FAt.",
    autoIssueId: null, createdBy: "usr-009",
  },
  {
    id: "FLT-103", projectId: "PRJ-004", testNumber: 103, date: "2026-02-05",
    location: "RtR Test Field Alpha", locationVi: "B\u00E3i bay RtR Alpha",
    pilot: "L\u00EA Th\u1ECB Ph\u01B0\u01A1ng", droneUnit: "I2-PVT-001",
    testType: "ENVIRONMENTAL", testPhase: "PVT", relatedGateCondition: "p3",
    result: "FAIL", duration: 1080, maxAltitude: 50, maxSpeed: 8.0, distanceCovered: 1500,
    sensorData: { batteryStart: 25.0, batteryEnd: 23.5, batteryMinCell: 3.62, maxCurrent: 22.0, avgCurrent: 12.5, maxVibration: 12.8, gpsAccuracy: 0.02, maxWind: 4.2, ambientTemp: 28 },
    anomalies: [
      { timestamp: 900, description: "Water droplets detected on thermal camera lens after simulated rain exposure", descriptionVi: "Ph\u00E1t hi\u1EC7n gi\u1ECDt n\u01B0\u1EDBc tr\u00EAn \u1ED1ng k\u00EDnh camera nhi\u1EC7t sau m\u00F4 ph\u1ECFng m\u01B0a", severity: "HIGH" },
      { timestamp: 1020, description: "USB-C port area moisture alarm triggered", descriptionVi: "C\u1EA3nh b\u00E1o \u1EA9m khu v\u1EF1c c\u1ED5ng USB-C k\u00EDch ho\u1EA1t", severity: "CRITICAL" },
    ],
    attachments: [{ type: "VIDEO", name: "FLT103-rain-test.mp4" }, { type: "PHOTO", name: "FLT103-water-ingress.jpg" }, { type: "LOG", name: "FLT103-blackbox.bin" }],
    notes: "FAIL \u2014 water ingress detected at USB-C port during rain simulation. Camera lens also affected. Test aborted at 18 min.",
    notesVi: "FAIL \u2014 ph\u00E1t hi\u1EC7n n\u01B0\u1EDBc v\u00E0o c\u1ED5ng USB-C trong m\u00F4 ph\u1ECFng m\u01B0a. \u1ED0ng k\u00EDnh camera c\u0169ng b\u1ECB \u1EA3nh h\u01B0\u1EDFng. D\u1EEBng test \u1EDF ph\u00FAt 18.",
    autoIssueId: "ISS-017", createdBy: "usr-008",
  },
  {
    id: "FLT-104", projectId: "PRJ-004", testNumber: 104, date: "2026-02-12",
    location: "B\u00E0 R\u1ECBa Power Plant", locationVi: "Nh\u00E0 m\u00E1y \u0111i\u1EC7n B\u00E0 R\u1ECBa",
    pilot: "L\u00EA Th\u1ECB Ph\u01B0\u01A1ng", droneUnit: "I2-PVT-002",
    testType: "PAYLOAD", testPhase: "PVT", relatedGateCondition: null,
    result: "PASS", duration: 1215, maxAltitude: 60, maxSpeed: 10.0, distanceCovered: 2800,
    sensorData: { batteryStart: 25.1, batteryEnd: 22.8, batteryMinCell: 3.55, maxCurrent: 35.0, avgCurrent: 16.5, maxVibration: 20.1, gpsAccuracy: 0.02, maxWind: 7.5, ambientTemp: 34 },
    anomalies: [],
    attachments: [{ type: "VIDEO", name: "FLT104-inspection-demo.mp4" }, { type: "LOG", name: "FLT104-blackbox.bin" }, { type: "PHOTO", name: "FLT104-thermal-output.jpg" }],
    notes: "Full payload test at real industrial site. Thermal + LiDAR + 4G telemetry all operational. Client (EVN) satisfied with demo.",
    notesVi: "Test t\u1EA3i \u0111\u1EA7y \u0111\u1EE7 t\u1EA1i nh\u00E0 m\u00E1y th\u1EF1c t\u1EBF. Camera nhi\u1EC7t + LiDAR + 4G telemetry \u0111\u1EC1u ho\u1EA1t \u0111\u1ED9ng. Kh\u00E1ch h\u00E0ng (EVN) h\u00E0i l\u00F2ng v\u1EDBi demo.",
    autoIssueId: null, createdBy: "usr-008",
  },
  // PRJ-005: RTR-M3 Mapper — 2 flight tests
  {
    id: "FLT-201", projectId: "PRJ-005", testNumber: 201, date: "2026-02-01",
    location: "\u0110\u1ED3ng Nai Survey Site", locationVi: "B\u00E3i kh\u1EA3o s\u00E1t \u0110\u1ED3ng Nai",
    pilot: "\u0110\u1ED7 Ho\u00E0ng S\u01A1n", droneUnit: "M3-EVT-001",
    testType: "INTEGRATION", testPhase: "EVT", relatedGateCondition: "e4",
    result: "PARTIAL", duration: 1650, maxAltitude: 100, maxSpeed: 15.0, distanceCovered: 5200,
    sensorData: { batteryStart: 25.2, batteryEnd: 21.5, batteryMinCell: 3.45, maxCurrent: 30.0, avgCurrent: 15.0, maxVibration: 14.5, gpsAccuracy: 0.025, maxWind: 5.8, ambientTemp: 31 },
    anomalies: [
      { timestamp: 600, description: "Camera trigger sync delay measured 18ms (requirement: <5ms)", descriptionVi: "\u0110\u1ED9 tr\u1EC5 \u0111\u1ED3ng b\u1ED9 trigger camera \u0111o \u0111\u01B0\u1EE3c 18ms (y\u00EAu c\u1EA7u: <5ms)", severity: "HIGH" },
      { timestamp: 1200, description: "SD card buffer overflow \u2014 12 frames dropped in 5 seconds", descriptionVi: "Tr\u00E0n buffer th\u1EBB SD \u2014 m\u1EA5t 12 frame trong 5 gi\u00E2y", severity: "MEDIUM" },
    ],
    attachments: [{ type: "LOG", name: "FLT201-blackbox.bin" }, { type: "PHOTO", name: "FLT201-gcp-test.jpg" }],
    notes: "Mapping flight completed but image quality affected by trigger sync delay. GCP accuracy: 4.2cm (target: 2cm). SD card buffer insufficient for 4K RAW.",
    notesVi: "Bay l\u1EADp b\u1EA3n \u0111\u1ED3 ho\u00E0n th\u00E0nh nh\u01B0ng ch\u1EA5t l\u01B0\u1EE3ng \u1EA3nh b\u1ECB \u1EA3nh h\u01B0\u1EDFng b\u1EDFi tr\u1EC5 \u0111\u1ED3ng b\u1ED9 trigger. \u0110\u1ED9 ch\u00EDnh x\u00E1c GCP: 4.2cm (m\u1EE5c ti\u00EAu: 2cm).",
    autoIssueId: null, createdBy: "usr-010",
  },
  {
    id: "FLT-202", projectId: "PRJ-005", testNumber: 202, date: "2026-02-15",
    location: "RtR Test Field Alpha", locationVi: "B\u00E3i bay RtR Alpha",
    pilot: "Tr\u1EA7n Minh Khoa", droneUnit: "M3-EVT-001",
    testType: "ENDURANCE", testPhase: "EVT", relatedGateCondition: "e5",
    result: "PASS", duration: 2280, maxAltitude: 120, maxSpeed: 16.0, distanceCovered: 7500,
    sensorData: { batteryStart: 25.0, batteryEnd: 21.0, batteryMinCell: 3.40, maxCurrent: 28.0, avgCurrent: 14.0, maxVibration: 16.0, gpsAccuracy: 0.02, maxWind: 6.0, ambientTemp: 29 },
    anomalies: [],
    attachments: [{ type: "LOG", name: "FLT202-blackbox.bin" }],
    notes: "38 min flight time with camera payload. Exceeds 35 min target. Battery healthy after landing, min cell 3.40V at cutoff.",
    notesVi: "38 ph\u00FAt bay v\u1EDBi t\u1EA3i camera. V\u01B0\u1EE3t m\u1EE5c ti\u00EAu 35 ph\u00FAt. Pin kh\u1ECFe m\u1EA1nh sau h\u1EA1 c\u00E1nh, cell th\u1EA5p nh\u1EA5t 3.40V.",
    autoIssueId: null, createdBy: "usr-007",
  },
];

export const FLIGHT_TEST_TYPES = ["ENDURANCE", "STABILITY", "PAYLOAD", "SPEED", "RANGE", "ENVIRONMENTAL", "INTEGRATION"];
export const FLIGHT_RESULT_TYPES = ["PASS", "FAIL", "PARTIAL", "ABORTED"];
export const FLIGHT_RESULT_COLORS = { PASS: "#10B981", FAIL: "#EF4444", PARTIAL: "#F59E0B", ABORTED: "#6B7280" };

// --- DECISIONS ---
export const DECISIONS_DATA = [
  {
    id: "DEC-001", projectId: "PRJ-001",
    title: "Replace LDO regulator with buck converter",
    titleVi: "Thay thế LDO regulator bằng buck converter",
    date: "2026-02-10", decisionMaker: "Minh Tuấn", phase: "DVT",
    options: [
      { label: "A: Keep LDO, add capacitor bank", pros: "Simple, cheap", prosVi: "Đơn giản, rẻ", cons: "May not solve peak current", consVi: "Có thể không giải quyết dòng đỉnh" },
      { label: "B: Switch to TPS62A02 buck converter", pros: "Handles 2A peak, 95% efficient", prosVi: "Xử lý dòng đỉnh 2A, hiệu suất 95%", cons: "$2.50 more per unit, PCB respin", consVi: "Thêm $2.50/đơn vị, phải respin PCB" },
      { label: "C: Dual LDO parallel", pros: "No PCB change", prosVi: "Không thay đổi PCB", cons: "Thermal concern, reliability", consVi: "Lo ngại nhiệt, độ tin cậy" },
    ],
    chosenOption: "B",
    rationale: "Peak current requirement 720mA exceeds LDO spec. Buck converter is proper solution despite PCB respin cost. Long-term reliability is worth the investment.",
    rationaleVi: "Yêu cầu dòng đỉnh 720mA vượt quá spec LDO. Buck converter là giải pháp đúng dù tốn thêm chi phí respin PCB. Độ tin cậy dài hạn xứng đáng đầu tư.",
    impactDescription: "PCB respin adds 2 weeks to DVT timeline",
    impactDescriptionVi: "Respin PCB thêm 2 tuần vào lịch trình DVT",
    costImpact: "+$2.50/unit BOM, +$500 PCB respin NRE",
    linkedIssueIds: ["ISS-001"],
    linkedFlightTestIds: ["FLT-047"],
    linkedGateConditions: ["d11"],
    status: "APPROVED",
    createdBy: "usr-002",
  },
  {
    id: "DEC-002", projectId: "PRJ-001",
    title: "Relocate GPS antenna to top plate",
    titleVi: "Di chuyển anten GPS lên tấm trên",
    date: "2026-02-05", decisionMaker: "Minh Tuấn", phase: "DVT",
    options: [
      { label: "A: Add EMI shielding to current position", pros: "No mechanical change", prosVi: "Không thay đổi cơ khí", cons: "Shielding adds 15g weight", consVi: "Tấm chắn thêm 15g" },
      { label: "B: Relocate antenna to top plate center", pros: "Best GPS reception, clear sky view", prosVi: "Thu GPS tốt nhất, tầm nhìn trời rõ", cons: "Requires new mounting bracket", consVi: "Cần bracket gắn mới" },
      { label: "C: Use active antenna with built-in filter", pros: "Works in current position", prosVi: "Hoạt động ở vị trí hiện tại", cons: "Expensive ($45 more), power draw", consVi: "Đắt ($45 thêm), tiêu thụ điện" },
    ],
    chosenOption: "B",
    rationale: "GPS antenna needs clear sky view. Top plate relocation is cleanest solution. Bracket cost is minimal ($8) vs ongoing signal issues.",
    rationaleVi: "Anten GPS cần tầm nhìn trời rõ. Di chuyển lên tấm trên là giải pháp sạch nhất. Chi phí bracket rất nhỏ ($8) so với vấn đề tín hiệu liên tục.",
    impactDescription: "Minor frame assembly change, 1 day rework",
    impactDescriptionVi: "Thay đổi nhỏ bộ khung, 1 ngày làm lại",
    costImpact: "+$8/unit for bracket",
    linkedIssueIds: ["ISS-002"],
    linkedFlightTestIds: ["FLT-043"],
    linkedGateConditions: ["d2"],
    status: "APPROVED",
    createdBy: "usr-002",
  },
  {
    id: "DEC-003", projectId: "PRJ-001",
    title: "Switch to gold-plated XT60H connectors",
    titleVi: "Chuyển sang đầu nối XT60H mạ vàng",
    date: "2025-10-12", decisionMaker: "Văn Hùng", phase: "EVT",
    options: [
      { label: "A: Continue with standard XT60", pros: "Cheapest option", prosVi: "Rẻ nhất", cons: "Arcing will worsen", consVi: "Hiện tượng phóng tia sẽ nặng hơn" },
      { label: "B: Gold-plated XT60H", pros: "Low contact resistance, long life", prosVi: "Điện trở tiếp xúc thấp, bền", cons: "$5 more per connector", consVi: "Thêm $5/đầu nối" },
    ],
    chosenOption: "B",
    rationale: "Safety critical — arcing on power connector is unacceptable for field deployment. Gold plating eliminates the issue.",
    rationaleVi: "An toàn quan trọng — phóng tia trên đầu nối nguồn không chấp nhận được khi triển khai thực địa. Mạ vàng loại bỏ vấn đề.",
    impactDescription: "BOM cost increase minimal, no timeline impact",
    impactDescriptionVi: "Tăng chi phí BOM nhỏ, không ảnh hưởng lịch trình",
    costImpact: "+$5/unit for gold-plated connectors",
    linkedIssueIds: ["ISS-003"],
    linkedFlightTestIds: [],
    linkedGateConditions: [],
    status: "APPROVED",
    createdBy: "usr-005",
  },
  {
    id: "DEC-004", projectId: "PRJ-002",
    title: "Add vibration dampers to motor mounts",
    titleVi: "Thêm đệm chống rung cho giá đỡ motor",
    date: "2026-02-12", decisionMaker: "Hồng Phúc", phase: "EVT",
    options: [
      { label: "A: Stiffen frame arms", pros: "Moves resonance freq higher", prosVi: "Dịch tần số cộng hưởng lên cao", cons: "Heavier frame, may not fix", consVi: "Khung nặng hơn, có thể không sửa được" },
      { label: "B: Add rubber dampers to mounts", pros: "Isolates motor vibration", prosVi: "Cách ly rung motor", cons: "Slight motor alignment concern", consVi: "Lo ngại căn chỉnh motor nhẹ" },
      { label: "C: Change propeller to different pitch", pros: "Avoids resonance RPM", prosVi: "Tránh RPM cộng hưởng", cons: "Reduces efficiency at cruise", consVi: "Giảm hiệu suất khi bay cruise" },
    ],
    chosenOption: "B",
    rationale: "FEA analysis confirms motor mount is the vibration path. Rubber dampers are proven solution from X7 project. Quick to implement.",
    rationaleVi: "Phân tích FEA xác nhận giá đỡ motor là đường truyền rung. Đệm cao su là giải pháp đã chứng minh từ dự án X7. Triển khai nhanh.",
    impactDescription: "2 days for prototyping and test, minimal BOM impact",
    impactDescriptionVi: "2 ngày để tạo mẫu và test, ảnh hưởng BOM tối thiểu",
    costImpact: "+$3/unit for damper set",
    linkedIssueIds: ["ISS-007"],
    linkedFlightTestIds: ["FLT-010"],
    linkedGateConditions: ["e5"],
    status: "PROPOSED",
    createdBy: "usr-002",
  },
  {
    id: "DEC-005", projectId: "PRJ-001",
    title: "Upgrade GPS module from u-blox M8 to F9P",
    titleVi: "N\u00E2ng c\u1EA5p GPS t\u1EEB u-blox M8 l\u00EAn F9P",
    date: "2025-09-15", decisionMaker: "Minh Tu\u1EA5n", phase: "EVT",
    options: [
      { label: "A: Keep u-blox M8N", pros: "Cheap ($15), proven, sufficient for most survey", prosVi: "R\u1EBB ($15), \u0111\u00E3 ch\u1EE9ng minh, \u0111\u1EE7 cho h\u1EA7u h\u1EBFt kh\u1EA3o s\u00E1t", cons: "2.5m accuracy, no RTK capability", consVi: "\u0110\u1ED9 ch\u00EDnh x\u00E1c 2.5m, kh\u00F4ng c\u00F3 RTK" },
      { label: "B: u-blox F9P with RTK", pros: "2cm accuracy with RTK, future-proof", prosVi: "\u0110\u1ED9 ch\u00EDnh x\u00E1c 2cm v\u1EDBi RTK, s\u1EB5n s\u00E0ng t\u01B0\u01A1ng lai", cons: "$320/unit, needs RTK base station", consVi: "$320/\u0111\u01A1n v\u1ECB, c\u1EA7n tr\u1EA1m RTK" },
      { label: "C: Trimble BD940", pros: "Best accuracy (1cm), dual antenna heading", prosVi: "\u0110\u1ED9 ch\u00EDnh x\u00E1c t\u1ED1t nh\u1EA5t (1cm), heading k\u00E9p", cons: "$2,400/unit, overkill", consVi: "$2,400/\u0111\u01A1n v\u1ECB, qu\u00E1 m\u1EE9c c\u1EA7n" },
    ],
    chosenOption: "B",
    rationale: "Survey market trending toward cm-level accuracy. F9P at $320 is cost-effective for professional survey drones. RTK base station is one-time investment shared across fleet.",
    rationaleVi: "Th\u1ECB tr\u01B0\u1EDDng kh\u1EA3o s\u00E1t h\u01B0\u1EDBng \u0111\u1EBFn \u0111\u1ED9 ch\u00EDnh x\u00E1c cm. F9P v\u1EDBi $320 l\u00E0 hi\u1EC7u qu\u1EA3 chi ph\u00ED cho drone kh\u1EA3o s\u00E1t. Tr\u1EA1m RTK \u0111\u1EA7u t\u01B0 1 l\u1EA7n d\u00F9ng chung.",
    impactDescription: "BOM cost +$305/unit. GPS mount redesign needed.",
    impactDescriptionVi: "Chi ph\u00ED BOM +$305/\u0111\u01A1n v\u1ECB. C\u1EA7n thi\u1EBFt k\u1EBF l\u1EA1i gi\u00E1 \u0111\u1EE1 GPS.",
    costImpact: "+$305/unit BOM, +$3,500 RTK base station (one-time)",
    linkedIssueIds: [],
    linkedFlightTestIds: ["FLT-046"],
    linkedGateConditions: [],
    status: "APPROVED",
    createdBy: "usr-002",
  },
  {
    id: "DEC-006", projectId: "PRJ-001",
    title: "Frame material: aluminum 6061 to carbon fiber composite",
    titleVi: "V\u1EADt li\u1EC7u khung: nh\u00F4m 6061 sang composite carbon fiber",
    date: "2025-06-20", decisionMaker: "Qu\u1EF3nh Anh", phase: "CONCEPT",
    options: [
      { label: "A: Aluminum 6061-T6", pros: "Low tooling cost, easy to machine, repairable", prosVi: "Chi ph\u00ED khu\u00F4n th\u1EA5p, d\u1EC5 gia c\u00F4ng, s\u1EEDa \u0111\u01B0\u1EE3c", cons: "Heavy (1.2kg frame), vibration transmission", consVi: "N\u1EB7ng (1.2kg khung), truy\u1EC1n rung" },
      { label: "B: Carbon fiber composite", pros: "Light (0.65kg frame), vibration damping, professional look", prosVi: "Nh\u1EB9 (0.65kg khung), gi\u1EA3m rung, chuy\u00EAn nghi\u1EC7p", cons: "3\u00D7 material cost, harder to repair", consVi: "3\u00D7 chi ph\u00ED v\u1EADt li\u1EC7u, kh\u00F3 s\u1EEDa" },
      { label: "C: Hybrid (CF arms + Al center)", pros: "Good compromise on weight and repairability", prosVi: "Th\u1ECFa hi\u1EC7p t\u1ED1t gi\u1EEFa tr\u1ECDng l\u01B0\u1EE3ng v\u00E0 s\u1EEDa ch\u1EEFa", cons: "Complex assembly, mixed thermal expansion", consVi: "L\u1EAFp r\u00E1p ph\u1EE9c t\u1EA1p, gi\u00E3n n\u1EDF nhi\u1EC7t h\u1ED7n h\u1EE3p" },
    ],
    chosenOption: "B",
    rationale: "For professional survey drone, weight directly impacts flight time and payload capacity. 550g savings = +15% flight time. CF also provides natural vibration damping critical for camera stability.",
    rationaleVi: "Cho drone kh\u1EA3o s\u00E1t chuy\u00EAn nghi\u1EC7p, tr\u1ECDng l\u01B0\u1EE3ng \u1EA3nh h\u01B0\u1EDFng tr\u1EF1c ti\u1EBFp \u0111\u1EBFn th\u1EDDi gian bay. Gi\u1EA3m 550g = +15% th\u1EDDi gian bay. CF gi\u1EA3m rung t\u1EF1 nhi\u00EAn, quan tr\u1ECDng cho camera.",
    impactDescription: "Frame supplier change. Need CF manufacturing capability.",
    impactDescriptionVi: "Thay \u0111\u1ED5i NCC khung. C\u1EA7n n\u0103ng l\u1EF1c s\u1EA3n xu\u1EA5t CF.",
    costImpact: "+$120/unit BOM",
    linkedIssueIds: [],
    linkedFlightTestIds: [],
    linkedGateConditions: [],
    status: "APPROVED",
    createdBy: "usr-001",
  },
  {
    id: "DEC-007", projectId: "PRJ-002",
    title: "Select spray nozzle supplier: N\u00F4ng Nghi\u1EC7p Xanh over TeeJet import",
    titleVi: "Ch\u1ECDn NCC \u0111\u1EA7u phun: N\u00F4ng Nghi\u1EC7p Xanh thay v\u00EC TeeJet nh\u1EADp kh\u1EA9u",
    date: "2025-12-05", decisionMaker: "Minh Tu\u1EA5n", phase: "EVT",
    options: [
      { label: "A: TeeJet XR11004 (imported)", pros: "Industry standard, wide droplet range", prosVi: "Ti\u00EAu chu\u1EA9n ng\u00E0nh, d\u1EA3i gi\u1ECDt r\u1ED9ng", cons: "$28/nozzle, 4-6 week lead time from US", consVi: "$28/v\u00F2i, lead time 4-6 tu\u1EA7n t\u1EEB M\u1EF9" },
      { label: "B: N\u00F4ng Nghi\u1EC7p Xanh NX-110 (domestic)", pros: "$12/nozzle, 1 week lead time, Vietnamese support", prosVi: "$12/v\u00F2i, lead time 1 tu\u1EA7n, h\u1ED7 tr\u1EE3 ti\u1EBFng Vi\u1EC7t", cons: "Less brand recognition", consVi: "\u00CDt \u0111\u01B0\u1EE3c bi\u1EBFt \u0111\u1EBFn" },
    ],
    chosenOption: "B",
    rationale: "NX-110 tested equivalent to TeeJet for our flow rate range. 57% cost saving per nozzle \u00D7 4 nozzles = $64/drone saved. Lead time 4\u00D7 faster. Domestic support critical for agricultural season deadlines.",
    rationaleVi: "NX-110 test t\u01B0\u01A1ng \u0111\u01B0\u01A1ng TeeJet. Ti\u1EBFt ki\u1EC7m 57% m\u1ED7i \u0111\u1EA7u phun \u00D7 4 = $64/drone. Lead time nhanh g\u1EA5p 4. H\u1ED7 tr\u1EE3 n\u1ED9i \u0111\u1ECBa quan tr\u1ECDng cho deadline m\u00F9a v\u1EE5.",
    impactDescription: "BOM cost -$64/unit. Supplier risk: single source",
    impactDescriptionVi: "Chi ph\u00ED BOM -$64/\u0111\u01A1n v\u1ECB. R\u1EE7i ro NCC: ngu\u1ED3n duy nh\u1EA5t",
    costImpact: "-$64/unit BOM savings",
    linkedIssueIds: [],
    linkedFlightTestIds: [],
    linkedGateConditions: [],
    status: "APPROVED",
    createdBy: "usr-002",
  },
  {
    id: "DEC-008", projectId: "PRJ-001",
    title: "Adopt MAVLink v2 as standard communication protocol",
    titleVi: "\u00C1p d\u1EE5ng MAVLink v2 l\u00E0m giao th\u1EE9c truy\u1EC1n th\u00F4ng chu\u1EA9n",
    date: "2025-08-10", decisionMaker: "Qu\u1EF3nh Anh", phase: "CONCEPT",
    options: [
      { label: "A: Custom protocol", pros: "Optimized for our hardware, minimal overhead", prosVi: "T\u1ED1i \u01B0u cho ph\u1EA7n c\u1EE9ng c\u1EE7a ta, overhead t\u1ED1i thi\u1EC3u", cons: "Development cost, no ecosystem", consVi: "Chi ph\u00ED ph\u00E1t tri\u1EC3n, kh\u00F4ng h\u1EC7 sinh th\u00E1i" },
      { label: "B: MAVLink v2", pros: "Industry standard, huge ecosystem, GCS compatibility", prosVi: "Ti\u00EAu chu\u1EA9n ng\u00E0nh, h\u1EC7 sinh th\u00E1i l\u1EDBn, t\u01B0\u01A1ng th\u00EDch GCS", cons: "Some overhead, learning curve", consVi: "M\u1ED9t s\u1ED1 overhead, \u0111\u01B0\u1EDDng cong h\u1ECDc h\u1ECFi" },
      { label: "C: DroneCAN/UAVCAN", pros: "Modern, CAN-bus native, type-safe", prosVi: "Hi\u1EC7n \u0111\u1EA1i, CAN-bus native, type-safe", cons: "Smaller ecosystem, limited GCS", consVi: "H\u1EC7 sinh th\u00E1i nh\u1ECF h\u01A1n, GCS h\u1EA1n ch\u1EBF" },
    ],
    chosenOption: "B",
    rationale: "MAVLink v2 is de facto standard. Ecosystem value (QGroundControl, Mission Planner) outweighs any protocol overhead. Applies to all RtR products.",
    rationaleVi: "MAVLink v2 l\u00E0 ti\u00EAu chu\u1EA9n th\u1EF1c t\u1EBF. Gi\u00E1 tr\u1ECB h\u1EC7 sinh th\u00E1i v\u01B0\u1EE3t xa overhead. \u00C1p d\u1EE5ng cho t\u1EA5t c\u1EA3 s\u1EA3n ph\u1EA9m RtR.",
    impactDescription: "Cross-project decision affecting all RtR drone platforms",
    impactDescriptionVi: "Quy\u1EBFt \u0111\u1ECBnh xuy\u00EAn d\u1EF1 \u00E1n \u1EA3nh h\u01B0\u1EDFng m\u1ECDi n\u1EC1n t\u1EA3ng drone RtR",
    costImpact: "$0 (MAVLink is open source)",
    linkedIssueIds: ["ISS-004"],
    linkedFlightTestIds: [],
    linkedGateConditions: [],
    status: "APPROVED",
    createdBy: "usr-001",
  },
  {
    id: "DEC-009", projectId: "PRJ-004",
    title: "IP67 seal redesign: silicone gasket replacing EPDM",
    titleVi: "Thi\u1EBFt k\u1EBF l\u1EA1i seal IP67: gasket silicone thay EPDM",
    date: "2026-02-20", decisionMaker: "Ph\u1EA1m Thu Trang", phase: "PVT",
    options: [
      { label: "A: Keep EPDM, add thermal shield", pros: "No gasket change, low cost", prosVi: "Kh\u00F4ng thay gasket, chi ph\u00ED th\u1EA5p", cons: "Doesn't address root cause", consVi: "Kh\u00F4ng gi\u1EA3i quy\u1EBFt nguy\u00EAn nh\u00E2n g\u1ED1c" },
      { label: "B: Switch to silicone (VMQ) gasket", pros: "Wider temp range (-60 to +230\u00B0C), no degradation", prosVi: "D\u1EA3i nhi\u1EC7t r\u1ED9ng h\u01A1n, kh\u00F4ng suy gi\u1EA3m", cons: "+$1.20/unit, 3 week lead time", consVi: "+$1.20/\u0111\u01A1n v\u1ECB, lead time 3 tu\u1EA7n" },
      { label: "C: O-ring seal replacing gasket", pros: "Better compression set, standard sizes", prosVi: "N\u00E9n t\u1ED1t h\u01A1n, k\u00EDch th\u01B0\u1EDBc chu\u1EA9n", cons: "Requires housing redesign, adds 4 weeks", consVi: "C\u1EA7n thi\u1EBFt k\u1EBF l\u1EA1i v\u1ECF, th\u00EAm 4 tu\u1EA7n" },
    ],
    chosenOption: "B",
    rationale: "Silicone gasket is drop-in replacement \u2014 same dimensions as EPDM. Temp range covers all operating conditions. Minimal cost impact. Fastest path to unblocking PVT.",
    rationaleVi: "Gasket silicone thay th\u1EBF tr\u1EF1c ti\u1EBFp \u2014 c\u00F9ng k\u00EDch th\u01B0\u1EDBc EPDM. D\u1EA3i nhi\u1EC7t bao ph\u1EE7 m\u1ECDi \u0111i\u1EC1u ki\u1EC7n. Chi ph\u00ED t\u0103ng t\u1ED1i thi\u1EC3u. Nhanh nh\u1EA5t \u0111\u1EC3 m\u1EDF kh\u00F3a PVT.",
    impactDescription: "Unblocks ISS-017 (IP67 seal failure). PVT retest +1 week after sample arrival.",
    impactDescriptionVi: "M\u1EDF kh\u00F3a ISS-017 (l\u1ED7i seal IP67). Test l\u1EA1i PVT +1 tu\u1EA7n sau khi m\u1EABu v\u1EC1.",
    costImpact: "+$1.20/unit BOM",
    linkedIssueIds: ["ISS-017"],
    linkedFlightTestIds: [],
    linkedGateConditions: [],
    status: "PROPOSED",
    createdBy: "usr-008",
  },
  {
    id: "DEC-010", projectId: "PRJ-004",
    title: "Thermal camera selection: FLIR Lepton 3.5 over Boson 320",
    titleVi: "Ch\u1ECDn camera nhi\u1EC7t: FLIR Lepton 3.5 thay v\u00EC Boson 320",
    date: "2025-07-15", decisionMaker: "Ph\u1EA1m Thu Trang", phase: "EVT",
    options: [
      { label: "A: FLIR Lepton 3.5 (160\u00D7120)", pros: "ITAR-exempt, small, $240, SPI interface", prosVi: "Mi\u1EC5n ITAR, nh\u1ECF g\u1ECDn, $240, giao ti\u1EBFp SPI", cons: "Lower resolution, \u00B15\u00B0C accuracy", consVi: "\u0110\u1ED9 ph\u00E2n gi\u1EA3i th\u1EA5p h\u01A1n, \u0111\u1ED9 ch\u00EDnh x\u00E1c \u00B15\u00B0C" },
      { label: "B: FLIR Boson 320 (320\u00D7256)", pros: "Higher resolution, \u00B13\u00B0C accuracy", prosVi: "\u0110\u1ED9 ph\u00E2n gi\u1EA3i cao h\u01A1n, \u0111\u1ED9 ch\u00EDnh x\u00E1c \u00B13\u00B0C", cons: "$800/unit, ITAR restricted, larger module", consVi: "$800/\u0111\u01A1n v\u1ECB, gi\u1EDBi h\u1EA1n ITAR, module l\u1EDBn h\u01A1n" },
      { label: "C: InfiRay Tiny1-C (256\u00D7192)", pros: "No ITAR, good resolution, $180", prosVi: "Kh\u00F4ng ITAR, \u0111\u1ED9 ph\u00E2n gi\u1EA3i t\u1ED1t, $180", cons: "Chinese brand, limited SDK", consVi: "Th\u01B0\u01A1ng hi\u1EC7u TQ, SDK h\u1EA1n ch\u1EBF" },
    ],
    chosenOption: "A",
    rationale: "ITAR exemption critical for Vietnamese manufacturing and potential export to ASEAN markets. Lepton 3.5 meets inspection requirements. Cost savings allow inclusion in standard configuration.",
    rationaleVi: "Mi\u1EC5n ITAR quan tr\u1ECDng cho s\u1EA3n xu\u1EA5t t\u1EA1i Vi\u1EC7t Nam v\u00E0 xu\u1EA5t kh\u1EA9u ASEAN. Lepton 3.5 \u0111\u00E1p \u1EE9ng y\u00EAu c\u1EA7u ki\u1EC3m tra. Ti\u1EBFt ki\u1EC7m cho c\u1EA5u h\u00ECnh ti\u00EAu chu\u1EA9n.",
    impactDescription: "Camera module integration complete. ITAR compliance ensured.",
    impactDescriptionVi: "T\u00EDch h\u1EE3p module camera ho\u00E0n th\u00E0nh. \u0110\u1EA3m b\u1EA3o tu\u00E2n th\u1EE7 ITAR.",
    costImpact: "-$560/unit vs Boson option",
    linkedIssueIds: ["ISS-015"],
    linkedFlightTestIds: [],
    linkedGateConditions: [],
    status: "APPROVED",
    createdBy: "usr-008",
  },
];

export const DECISION_STATUSES = ["PROPOSED", "APPROVED", "SUPERSEDED", "REJECTED"];
export const DECISION_STATUS_COLORS = { PROPOSED: "#F59E0B", APPROVED: "#10B981", SUPERSEDED: "#6B7280", REJECTED: "#EF4444" };

// --- BOM CATEGORIES ---
export const BOM_CATEGORIES = ["MECHANICAL", "ELECTRICAL", "SOFTWARE", "CONSUMABLE"];
export const BOM_CATEGORY_COLORS = { MECHANICAL: "#3B82F6", ELECTRICAL: "#F59E0B", SOFTWARE: "#8B5CF6", CONSUMABLE: "#6B7280" };
export const BOM_LIFECYCLE_STATUSES = ["ACTIVE", "NRND", "EOL", "OBSOLETE"];
export const BOM_LIFECYCLE_COLORS = { ACTIVE: "#10B981", NRND: "#F59E0B", EOL: "#F97316", OBSOLETE: "#EF4444" };

// --- SUPPLIER QUALIFICATION ---
export const SUPPLIER_QUAL_STATUSES = ["PENDING", "QUALIFIED", "PROBATION", "DISQUALIFIED"];
export const SUPPLIER_QUAL_COLORS = { PENDING: "#F59E0B", QUALIFIED: "#10B981", PROBATION: "#F97316", DISQUALIFIED: "#EF4444" };
export const DELIVERY_STATUSES = ["ORDERED", "IN_TRANSIT", "DELIVERED_ON_TIME", "DELIVERED_LATE", "CANCELLED"];
export const DELIVERY_STATUS_COLORS = { ORDERED: "#3B82F6", IN_TRANSIT: "#F59E0B", DELIVERED_ON_TIME: "#10B981", DELIVERED_LATE: "#F97316", CANCELLED: "#EF4444" };
