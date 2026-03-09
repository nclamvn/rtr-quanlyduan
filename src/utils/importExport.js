// ===================================================================
// RtR CONTROL TOWER V3 — Import/Export Utilities
// SheetJS (xlsx) for Excel, jsPDF + html2canvas for PDF
// ===================================================================
import * as XLSX from "xlsx";

// ── FILE READING ──────────────────────────────────────────────────

/**
 * Read an Excel/CSV file and return workbook data
 * @param {File} file - The uploaded file
 * @returns {Promise<{workbook, sheetNames, sheets}>}
 */
export function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheetNames = workbook.SheetNames;
        const sheets = {};
        sheetNames.forEach((name) => {
          const sheet = workbook.Sheets[name];
          sheets[name] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        });
        resolve({ workbook, sheetNames, sheets });
      } catch (err) {
        reject(new Error("Failed to parse file: " + err.message));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Extract headers and data rows from a sheet
 * @param {Array<Array>} sheetData - Raw sheet data (array of arrays)
 * @param {number} headerRow - 0-indexed header row number
 * @returns {{headers: string[], rows: Array<Object>}}
 */
export function parseSheetData(sheetData, headerRow = 0) {
  if (!sheetData || sheetData.length <= headerRow) {
    return { headers: [], rows: [] };
  }
  const headers = sheetData[headerRow].map((h) => String(h || "").trim());
  const rows = [];
  for (let i = headerRow + 1; i < sheetData.length; i++) {
    const row = {};
    let hasData = false;
    headers.forEach((h, j) => {
      const val = sheetData[i]?.[j];
      row[h] = val !== undefined && val !== null ? val : "";
      if (val !== undefined && val !== null && String(val).trim() !== "") hasData = true;
    });
    if (hasData) rows.push(row);
  }
  return { headers, rows };
}

// ── SMART COLUMN MAPPER ───────────────────────────────────────────

/** Vietnamese + English header aliases for each data type */
export const HEADER_ALIASES = {
  // Issues
  title: ["vấn đề", "tiêu đề", "title", "tên", "mô tả vấn đề", "issue", "lỗi", "bug", "tên vấn đề", "issue title"],
  titleVi: ["tiêu đề vi", "title vi", "tên tiếng việt", "tiêu đề tiếng việt"],
  owner: ["người phụ trách", "owner", "chịu trách nhiệm", "assignee", "phụ trách", "người xử lý", "pic", "assigned to", "chủ sở hữu"],
  severity: ["mức độ", "severity", "độ ưu tiên", "priority", "mức nghiêm trọng", "cấp độ", "sev"],
  status: ["tình trạng", "status", "trạng thái", "state", "tiến độ"],
  source: ["nguồn", "source", "loại nguồn", "type", "phân loại", "nguồn gốc"],
  rootCause: ["nguyên nhân", "root cause", "nguyên nhân gốc", "cause", "lý do", "root"],
  dueDate: ["deadline", "hạn", "due date", "ngày hạn", "hạn xử lý", "target date", "due", "hạn chót"],
  createdDate: ["ngày tạo", "created", "created date", "ngày", "ngày phát hiện", "date created"],
  phase: ["phase", "giai đoạn", "phase/stage", "gđ"],
  description: ["mô tả", "description", "ghi chú", "chi tiết", "notes", "detail", "desc"],

  // BOM
  partNumber: ["mã", "part number", "part #", "p/n", "mã linh kiện", "item code", "sku", "part no", "mã sp"],
  partDescription: ["mô tả linh kiện", "part description", "tên linh kiện", "component", "tên", "name"],
  quantity: ["số lượng", "qty", "quantity", "sl", "s.l.", "so luong"],
  unitCost: ["đơn giá", "unit cost", "giá", "price", "cost", "đơn giá (usd)", "unit price", "giá đơn vị"],
  supplier: ["nhà cung cấp", "supplier", "vendor", "ncc", "nhà cc"],
  leadTime: ["thời gian giao", "lead time", "delivery", "ngày giao", "leadtime", "lt"],
  lifecycle: ["vòng đời", "lifecycle", "life cycle", "tình trạng lk", "active/eol"],
  category: ["danh mục", "category", "loại", "nhóm", "phân loại lk"],
  unit: ["đơn vị", "unit", "uom", "đvt"],

  // Flight Test
  testDate: ["ngày bay", "test date", "date", "ngày", "flight date", "ngày test"],
  pilot: ["phi công", "pilot", "người bay", "test pilot"],
  testType: ["loại test", "test type", "type", "loại", "hạng mục"],
  result: ["kết quả", "result", "pass/fail", "đạt/không", "outcome"],
  duration: ["thời gian", "duration", "thời gian bay", "flight time", "tg bay"],
  location: ["địa điểm", "location", "nơi bay", "bãi bay", "site"],
  droneUnit: ["máy bay", "drone unit", "unit", "tàu", "drone id", "aircraft"],
  testNumber: ["số hiệu", "test number", "flight #", "số bay", "flt #", "#"],

  // Milestones
  milestone: ["milestone", "mốc", "cột mốc", "phase gate", "tên mốc"],
  targetDate: ["ngày mục tiêu", "target", "target date", "kế hoạch", "planned", "kh"],
  actualDate: ["ngày thực tế", "actual", "actual date", "thực tế", "tt"],

  // Orders
  orderNumber: ["mã đơn", "order number", "order #", "order no", "số đơn", "mã đơn hàng", "so don"],
  customerName: ["khách hàng", "customer", "customer name", "tên khách", "kh"],
  poNumber: ["po", "po number", "po#", "purchase order", "số po", "mã po"],
  totalAmount: ["tổng tiền", "total", "total amount", "amount", "giá trị", "tổng", "value"],
  orderDate: ["ngày đặt", "order date", "date", "ngày", "ngày tạo đơn"],
  requiredDeliveryDate: ["hạn giao", "delivery date", "required date", "deadline", "ngày giao"],
  shippingMethod: ["vận chuyển", "shipping", "shipping method", "phương thức giao"],
  paymentStatus: ["thanh toán", "payment", "payment status", "tt thanh toán"],
  orderPriority: ["ưu tiên", "priority", "mức ưu tiên", "độ ưu tiên đơn"],
  orderStatus: ["trạng thái đơn", "order status", "tình trạng đơn"],

  // Production
  woNumber: ["mã wo", "wo number", "wo#", "work order", "lệnh sx", "mã lệnh", "wo"],
  productName: ["sản phẩm", "product", "product name", "tên sp", "tên sản phẩm"],
  woQuantity: ["số lượng sx", "quantity", "qty", "sl", "số lượng"],
  currentStation: ["công đoạn", "station", "current station", "trạm", "giai đoạn sx"],
  woStatus: ["trạng thái wo", "wo status", "tình trạng wo", "status wo"],
  plannedStart: ["ngày bắt đầu", "planned start", "start date", "bắt đầu"],
  plannedEnd: ["ngày kết thúc", "planned end", "end date", "kết thúc", "deadline wo"],
  assignedTo: ["phụ trách", "assigned", "assigned to", "người phụ trách"],

  // Inventory
  partName: ["tên linh kiện", "part name", "tên", "name", "tên sp"],
  warehouse: ["kho", "warehouse", "tên kho", "vị trí kho"],
  inventoryLocation: ["vị trí", "location", "bin", "shelf", "kệ"],
  quantityOnHand: ["tồn kho", "on hand", "qty on hand", "sl tồn", "số lượng tồn"],
  minStock: ["tồn tối thiểu", "min stock", "min", "reorder point", "mức tối thiểu"],
  maxStock: ["tồn tối đa", "max stock", "max", "mức tối đa"],
  inventoryUnitCost: ["đơn giá tồn", "unit cost", "giá", "cost", "đơn giá"],
  leadTimeDays: ["lead time", "thời gian giao", "lt", "ngày giao hàng"],

  // Cost Entries
  costCategory: ["loại chi phí", "cost category", "category", "nhóm chi phí", "phân loại cp"],
  costDescription: ["mô tả chi phí", "cost description", "description", "mô tả", "nội dung"],
  costAmount: ["số tiền", "amount", "cost amount", "chi phí", "giá trị cp"],
  costDate: ["ngày chi phí", "cost date", "date", "ngày", "ngày phát sinh"],
  vendorName: ["nhà cung cấp", "vendor", "vendor name", "ncc", "nhà cc"],
  invoiceRef: ["số hóa đơn", "invoice ref", "invoice", "hóa đơn", "ref"],
};

/** Value mapping for enum fields */
export const VALUE_ALIASES = {
  severity: {
    CRITICAL: ["nghiêm trọng", "critical", "khẩn cấp", "cực kỳ", "p0", "rất cao", "crit"],
    HIGH: ["cao", "high", "quan trọng", "p1", "lớn"],
    MEDIUM: ["trung bình", "medium", "tb", "vừa", "p2", "bình thường", "med"],
    LOW: ["thấp", "low", "nhỏ", "p3", "không gấp"],
  },
  status: {
    DRAFT: ["nháp", "draft", "mới tạo"],
    OPEN: ["mở", "open", "mới", "chờ", "new", "chưa xử lý", "pending", "chờ xử lý"],
    IN_PROGRESS: ["đang xử lý", "in progress", "đang làm", "wip", "processing", "in_progress", "đang"],
    BLOCKED: ["blocked", "bị chặn", "tắc", "hold", "on hold", "chặn"],
    CLOSED: ["đóng", "closed", "xong", "done", "hoàn thành", "resolved", "đã đóng", "đã xong"],
  },
  source: {
    INTERNAL: ["nội bộ", "internal", "trong", "int"],
    EXTERNAL: ["bên ngoài", "external", "ngoài", "ext", "khách hàng"],
    CROSS_TEAM: ["liên nhóm", "cross", "cross-team", "nhiều nhóm", "cross_team"],
  },
  result: {
    PASS: ["đạt", "pass", "passed", "ok", "tốt", "yes"],
    FAIL: ["không đạt", "fail", "failed", "ko đạt", "hỏng", "no"],
    PARTIAL: ["một phần", "partial", "đạt 1 phần", "conditional", "đạt một phần"],
    ABORTED: ["hủy", "aborted", "abort", "dừng", "cancelled", "cancel"],
  },
  phase: {
    CONCEPT: ["concept", "ý tưởng", "khái niệm"],
    EVT: ["evt", "engineering validation", "test kỹ thuật"],
    DVT: ["dvt", "design validation", "test thiết kế"],
    PVT: ["pvt", "production validation", "test sản xuất"],
    MP: ["mp", "mass production", "sản xuất hàng loạt", "sản xuất"],
  },
  lifecycle: {
    ACTIVE: ["active", "hoạt động", "đang dùng", "sẵn có"],
    NRND: ["nrnd", "not recommended", "không khuyến nghị"],
    EOL: ["eol", "end of life", "ngừng sản xuất", "hết vòng đời"],
    OBSOLETE: ["obsolete", "lỗi thời", "ngưng", "đã ngừng"],
  },
  testType: {
    ENDURANCE: ["endurance", "bền bỉ", "bay lâu", "thời gian bay"],
    STABILITY: ["stability", "ổn định", "cân bằng"],
    PAYLOAD: ["payload", "tải trọng", "tải"],
    SPEED: ["speed", "tốc độ", "vận tốc"],
    RANGE: ["range", "tầm bay", "phạm vi"],
    ENVIRONMENTAL: ["environmental", "môi trường", "env"],
    INTEGRATION: ["integration", "tích hợp", "tổng hợp"],
  },
  orderStatus: {
    QUOTE: ["báo giá", "quote", "quotation"],
    PO_RECEIVED: ["đã nhận po", "po received", "po_received", "nhận po"],
    CONFIRMED: ["xác nhận", "confirmed", "đã xác nhận"],
    IN_PRODUCTION: ["đang sản xuất", "in production", "in_production", "sx"],
    QC_PASSED: ["qc đạt", "qc passed", "qc_passed"],
    PACKED: ["đóng gói", "packed", "đã đóng gói"],
    SHIPPED: ["đã giao", "shipped", "đang giao"],
    DELIVERED: ["đã nhận", "delivered", "giao thành công"],
    INVOICED: ["đã xuất hđ", "invoiced", "xuất hóa đơn"],
    PAID: ["đã thanh toán", "paid", "tt xong"],
    CLOSED: ["đóng", "closed", "hoàn tất"],
    CANCELLED: ["hủy", "cancelled", "đã hủy"],
  },
  orderPriority: {
    URGENT: ["khẩn cấp", "urgent", "gấp"],
    HIGH: ["cao", "high"],
    NORMAL: ["bình thường", "normal", "bt"],
    LOW: ["thấp", "low"],
  },
  paymentStatus: {
    UNPAID: ["chưa tt", "unpaid", "chưa thanh toán"],
    PARTIAL: ["tt 1 phần", "partial", "thanh toán 1 phần"],
    PAID: ["đã tt", "paid", "đã thanh toán"],
    OVERDUE: ["quá hạn", "overdue", "trễ hạn tt"],
  },
  woStatus: {
    PLANNED: ["kế hoạch", "planned", "đã lên kh"],
    MATERIAL_READY: ["sẵn vật tư", "material ready", "material_ready", "vtư sẵn"],
    IN_PROGRESS: ["đang sx", "in progress", "in_progress", "đang chạy"],
    QC: ["kiểm tra", "qc", "đang qc"],
    COMPLETED: ["hoàn thành", "completed", "xong"],
    SHIPPED: ["đã giao", "shipped"],
    ON_HOLD: ["tạm dừng", "on hold", "on_hold"],
    CANCELLED: ["hủy", "cancelled"],
  },
  currentStation: {
    SMT: ["smt", "hàn smt"],
    ASSEMBLY: ["lắp ráp", "assembly", "assy"],
    FIRMWARE: ["firmware", "fw", "nạp fw"],
    CALIBRATION: ["hiệu chuẩn", "calibration", "calib"],
    FLIGHT_TEST: ["bay thử", "flight test", "flight_test"],
    QC: ["qc", "kiểm tra", "quality"],
    PACKING: ["đóng gói", "packing", "pack"],
  },
  inventoryCategory: {
    MECHANICAL: ["cơ khí", "mechanical", "mech"],
    ELECTRICAL: ["điện tử", "electrical", "elec"],
    SOFTWARE: ["phần mềm", "software", "sw"],
    CONSUMABLE: ["tiêu hao", "consumable", "vật tư tiêu hao"],
  },
  costCategory: {
    MATERIAL: ["vật tư", "material", "nguyên vật liệu"],
    LABOR: ["nhân công", "labor", "nc"],
    TOOLING: ["dụng cụ", "tooling", "công cụ"],
    SHIPPING: ["vận chuyển", "shipping", "giao hàng"],
    CERTIFICATION: ["chứng nhận", "certification", "cert"],
    OVERHEAD: ["chi phí chung", "overhead", "cpc"],
    OTHER: ["khác", "other", "cp khác"],
  },
};

/**
 * Auto-match an Excel column header to a system field
 * @param {string} excelHeader
 * @param {string[]} contextFields - which fields are relevant for this import type
 * @returns {{field: string|null, confidence: "exact"|"partial"|"none"}}
 */
export function autoMatchColumn(excelHeader, contextFields = null) {
  const normalized = excelHeader.toLowerCase().trim();
  if (!normalized) return { field: null, confidence: "none" };

  const entries = contextFields
    ? Object.entries(HEADER_ALIASES).filter(([k]) => contextFields.includes(k))
    : Object.entries(HEADER_ALIASES);

  // 1. Exact match
  for (const [field, aliases] of entries) {
    if (aliases.includes(normalized)) return { field, confidence: "exact" };
  }

  // 2. Partial match (contains)
  for (const [field, aliases] of entries) {
    for (const alias of aliases) {
      if (normalized.includes(alias) || alias.includes(normalized)) {
        return { field, confidence: "partial" };
      }
    }
  }

  return { field: null, confidence: "none" };
}

/**
 * Map a raw value to an enum value using aliases
 * @param {string} rawValue
 * @param {string} enumType - key in VALUE_ALIASES
 * @returns {{value: string|null, confidence: "exact"|"partial"|"none"}}
 */
export function mapEnumValue(rawValue, enumType) {
  if (!rawValue || !VALUE_ALIASES[enumType]) return { value: null, confidence: "none" };
  const normalized = String(rawValue).toLowerCase().trim();

  for (const [enumVal, aliases] of Object.entries(VALUE_ALIASES[enumType])) {
    // Exact
    if (aliases.includes(normalized) || normalized === enumVal.toLowerCase()) {
      return { value: enumVal, confidence: "exact" };
    }
  }
  // Partial
  for (const [enumVal, aliases] of Object.entries(VALUE_ALIASES[enumType])) {
    for (const alias of aliases) {
      if (normalized.includes(alias) || alias.includes(normalized)) {
        return { value: enumVal, confidence: "partial" };
      }
    }
  }
  return { value: null, confidence: "none" };
}

// ── FIELDS PER IMPORT TYPE ────────────────────────────────────────

export const IMPORT_TYPE_FIELDS = {
  issues: {
    required: ["title"],
    optional: ["titleVi", "owner", "severity", "status", "source", "rootCause", "dueDate", "createdDate", "phase", "description"],
    enums: { severity: "severity", status: "status", source: "source", phase: "phase" },
    defaults: { status: "DRAFT", severity: "MEDIUM", source: "INTERNAL", rootCause: "Investigating" },
  },
  bom: {
    required: ["partNumber", "partDescription"],
    optional: ["quantity", "unitCost", "supplier", "leadTime", "lifecycle", "category", "unit"],
    enums: { lifecycle: "lifecycle", category: "category" },
    defaults: { quantity: 1, lifecycle: "ACTIVE", unitCost: 0, unit: "pcs" },
  },
  flightTests: {
    required: ["testDate", "testType", "result"],
    optional: ["testNumber", "pilot", "duration", "location", "droneUnit"],
    enums: { testType: "testType", result: "result" },
    defaults: { pilot: "Unknown" },
  },
  milestones: {
    required: ["milestone", "targetDate"],
    optional: ["actualDate"],
    enums: { milestone: "phase" },
    defaults: {},
  },
  orders: {
    required: ["orderNumber", "customerName"],
    optional: ["poNumber", "totalAmount", "orderDate", "requiredDeliveryDate", "shippingMethod", "paymentStatus", "orderPriority", "orderStatus", "description"],
    enums: { orderStatus: "orderStatus", orderPriority: "orderPriority", paymentStatus: "paymentStatus" },
    defaults: { orderStatus: "QUOTE", orderPriority: "NORMAL", paymentStatus: "UNPAID", totalAmount: 0 },
  },
  production: {
    required: ["woNumber", "productName", "woQuantity"],
    optional: ["currentStation", "woStatus", "plannedStart", "plannedEnd", "assignedTo", "orderNumber", "customerName"],
    enums: { woStatus: "woStatus", currentStation: "currentStation" },
    defaults: { woStatus: "PLANNED", woQuantity: 1 },
  },
  inventory: {
    required: ["partNumber", "partName"],
    optional: ["category", "warehouse", "inventoryLocation", "quantityOnHand", "minStock", "maxStock", "inventoryUnitCost", "unit", "leadTimeDays", "supplier"],
    enums: { category: "inventoryCategory" },
    defaults: { warehouse: "HCM-MAIN", quantityOnHand: 0, unit: "pcs", inventoryUnitCost: 0 },
  },
  costs: {
    required: ["costCategory", "costAmount"],
    optional: ["costDescription", "costDate", "vendorName", "invoiceRef"],
    enums: { costCategory: "costCategory" },
    defaults: { costCategory: "OTHER" },
  },
};

// ── EXCEL EXPORT ──────────────────────────────────────────────────

/**
 * Export data to Excel file
 * @param {Array<{name: string, data: Array<Object>, columns?: Array<{key, header, width}>}>} sheets
 * @param {string} filename
 */
export function exportToExcel(sheets, filename) {
  const wb = XLSX.utils.book_new();

  sheets.forEach(({ name, data, columns }) => {
    let ws;
    if (columns) {
      // Custom headers
      const headers = columns.map((c) => c.header);
      const rows = data.map((row) => columns.map((c) => row[c.key] ?? ""));
      ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws["!cols"] = columns.map((c) => ({ wch: c.width || 15 }));
    } else {
      ws = XLSX.utils.json_to_sheet(data);
    }
    XLSX.utils.book_append_sheet(wb, ws, name);
  });

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ── VALIDATION ────────────────────────────────────────────────────

/**
 * Validate a single imported row
 * @param {Object} row - Mapped row data
 * @param {string} importType - "issues" | "bom" | "flightTests" | "milestones"
 * @param {Array} existingItems - Existing items for duplicate detection
 * @returns {{status: "valid"|"warning"|"error", messages: string[]}}
 */
export function validateRow(row, importType, existingItems = []) {
  const config = IMPORT_TYPE_FIELDS[importType];
  const messages = [];
  let status = "valid";

  // Check required fields
  for (const field of config.required) {
    if (!row[field] || String(row[field]).trim() === "") {
      messages.push(`Missing required: ${field}`);
      status = "error";
    }
  }

  // Check enum values
  for (const [field, enumType] of Object.entries(config.enums)) {
    if (row[field] && !Object.keys(VALUE_ALIASES[enumType] || {}).includes(row[field])) {
      messages.push(`Unknown ${field}: "${row[field]}"`);
      if (status !== "error") status = "warning";
    }
  }

  // Duplicate detection (fuzzy title match for issues)
  if (importType === "issues" && row.title && existingItems.length > 0) {
    const titleLower = row.title.toLowerCase();
    const duplicate = existingItems.find(
      (item) => item.title && item.title.toLowerCase() === titleLower
    );
    if (duplicate) {
      messages.push(`Possible duplicate of ${duplicate.id}`);
      if (status !== "error") status = "warning";
    }
  }

  return { status, messages };
}

// ── PDF GENERATION ────────────────────────────────────────────────

/**
 * Generate PDF from an HTML element using html2canvas + jsPDF
 * @param {HTMLElement} element - The DOM element to capture
 * @param {string} filename - Output filename (without .pdf)
 * @param {Object} options - {orientation: "portrait"|"landscape", format: "a4"|"letter"}
 */
export async function generatePdfFromElement(element, filename, options = {}) {
  const { default: html2canvas } = await import("html2canvas");
  const { jsPDF } = await import("jspdf");

  const orientation = options.orientation || "portrait";
  const format = options.format || "a4";

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#060A0F",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF(orientation, "mm", format);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let y = 0;
  while (y < imgHeight) {
    if (y > 0) pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, -y, imgWidth, imgHeight);
    y += pageHeight;
  }

  pdf.save(`${filename}.pdf`);
}

/**
 * Generate slides PDF from an array of HTML elements
 * @param {HTMLElement[]} slideElements - Array of slide DOM elements
 * @param {string} filename
 */
export async function generateSlidesPdf(slideElements, filename) {
  const { default: html2canvas } = await import("html2canvas");
  const { jsPDF } = await import("jspdf");

  const pdf = new jsPDF("landscape", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < slideElements.length; i++) {
    if (i > 0) pdf.addPage();
    const canvas = await html2canvas(slideElements[i], {
      scale: 2,
      useCORS: true,
      backgroundColor: "#060A0F",
      logging: false,
    });
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
  }

  pdf.save(`${filename}.pdf`);
}

// ── FILE HELPERS ──────────────────────────────────────────────────

/** Accepted file extensions */
export const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv"];

/** Max file size (5MB) */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Max rows per import */
export const MAX_IMPORT_ROWS = 500;

/**
 * Validate uploaded file
 * @param {File} file
 * @returns {{valid: boolean, error?: string}}
 */
export function validateFile(file) {
  if (!file) return { valid: false, error: "No file selected" };

  const ext = "." + file.name.split(".").pop().toLowerCase();
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `Unsupported file type: ${ext}. Use .xlsx, .xls, or .csv` };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB.` };
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
