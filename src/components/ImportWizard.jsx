// ===================================================================
// RtR CONTROL TOWER V3 — Universal Import Wizard
// 5-step modal: Select → Upload → Map → Preview → Import
// ===================================================================
import { useState, useCallback, useRef, useMemo } from "react";
import {
  Upload, FileSpreadsheet, AlertTriangle, Package, Plane,
  Milestone, X, ChevronRight, ChevronLeft, Check,
  FileText, GripVertical, ArrowRight, CheckCircle2,
  CircleAlert, CircleDot, TriangleAlert, Download,
  ShoppingCart, Factory, Warehouse, DollarSign,
} from "lucide-react";
import {
  readExcelFile, parseSheetData, validateFile, formatFileSize,
  autoMatchColumn, mapEnumValue, validateRow,
  IMPORT_TYPE_FIELDS, VALUE_ALIASES, MAX_IMPORT_ROWS,
} from "../utils/importExport";

const mono = "'JetBrains Mono', 'Fira Code', monospace";
const sans = "'Outfit', 'Segoe UI', system-ui, sans-serif";

const IMPORT_TYPES = [
  { id: "issues", icon: AlertTriangle, label: "Issues", labelVi: "Vấn Đề", desc: "Import issue tracking data", descVi: "Import dữ liệu theo dõi vấn đề" },
  { id: "bom", icon: Package, label: "BOM", labelVi: "BOM", desc: "Import Bill of Materials", descVi: "Import danh sách linh kiện" },
  { id: "flightTests", icon: Plane, label: "Flight Tests", labelVi: "Bay Thử", desc: "Import test log records", descVi: "Import nhật ký bay thử" },
  { id: "milestones", icon: Milestone, label: "Milestones", labelVi: "Mốc", desc: "Import phase timeline data", descVi: "Import mốc thời gian" },
  { id: "orders", icon: ShoppingCart, label: "Orders", labelVi: "Đơn Hàng", desc: "Import customer orders", descVi: "Import đơn hàng khách hàng" },
  { id: "production", icon: Factory, label: "Production", labelVi: "Sản Xuất", desc: "Import work orders", descVi: "Import lệnh sản xuất" },
  { id: "inventory", icon: Warehouse, label: "Inventory", labelVi: "Tồn Kho", desc: "Import inventory items", descVi: "Import dữ liệu tồn kho" },
  { id: "costs", icon: DollarSign, label: "Costs", labelVi: "Chi Phí", desc: "Import cost entries", descVi: "Import dữ liệu chi phí" },
];

const STEPS = [
  { id: 1, label: "Select", labelVi: "Chọn" },
  { id: 2, label: "Upload", labelVi: "Tải lên" },
  { id: 3, label: "Map", labelVi: "Ánh xạ" },
  { id: 4, label: "Preview", labelVi: "Xem trước" },
  { id: 5, label: "Import", labelVi: "Nhập" },
];

const CONFIDENCE_STYLES = {
  exact: { color: "#10B981", label: "Auto-matched", labelVi: "Tự khớp", icon: Check },
  partial: { color: "#F59E0B", label: "Best guess", labelVi: "Đoán", icon: CircleDot },
  none: { color: "var(--text-dim)", label: "Unmapped", labelVi: "Chưa khớp", icon: CircleAlert },
};

export default function ImportWizard({ lang, project, issues = [], onImport, onClose, initialType }) {
  const [step, setStep] = useState(initialType ? 2 : 1);
  const [importType, setImportType] = useState(initialType || null);

  // Step 2 state
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [workbookData, setWorkbookData] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [headerRow, setHeaderRow] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Step 3 state
  const [columnMapping, setColumnMapping] = useState({});
  const [valueMapping, setValueMapping] = useState({});

  // Step 4-5 state
  const [importOptions, setImportOptions] = useState({ asDraft: true });
  const [importResult, setImportResult] = useState(null);

  const t = lang === "vi";

  // ── Parsed sheet data ────────────────────────────────────────
  const sheetData = useMemo(() => {
    if (!workbookData || !selectedSheet) return null;
    return parseSheetData(workbookData.sheets[selectedSheet], headerRow);
  }, [workbookData, selectedSheet, headerRow]);

  // ── Context fields for current import type ───────────────────
  const contextFields = useMemo(() => {
    if (!importType) return [];
    const config = IMPORT_TYPE_FIELDS[importType];
    return [...config.required, ...config.optional];
  }, [importType]);

  // ── Auto-mapping ─────────────────────────────────────────────
  const autoMapping = useMemo(() => {
    if (!sheetData?.headers || !importType) return {};
    const mapping = {};
    sheetData.headers.forEach((h) => {
      if (!h) return;
      const match = autoMatchColumn(h, contextFields);
      mapping[h] = match;
    });
    return mapping;
  }, [sheetData, importType, contextFields]);

  // ── Initialize column mapping from auto-mapping ──────────────
  const effectiveMapping = useMemo(() => {
    const m = { ...columnMapping };
    if (sheetData?.headers && Object.keys(m).length === 0) {
      sheetData.headers.forEach((h) => {
        if (autoMapping[h]?.field) {
          m[h] = autoMapping[h].field;
        }
      });
    }
    return m;
  }, [columnMapping, autoMapping, sheetData]);

  // ── Mapped + validated rows ──────────────────────────────────
  const previewRows = useMemo(() => {
    if (!sheetData?.rows || !importType) return [];
    const config = IMPORT_TYPE_FIELDS[importType];
    return sheetData.rows.slice(0, MAX_IMPORT_ROWS).map((rawRow, idx) => {
      const mapped = { _raw: rawRow, _idx: idx };
      // Apply column mapping
      for (const [excelCol, sysField] of Object.entries(effectiveMapping)) {
        if (sysField && sysField !== "_skip") {
          let val = rawRow[excelCol];
          // Apply enum value mapping
          if (config.enums[sysField]) {
            const enumResult = mapEnumValue(val, config.enums[sysField]);
            if (enumResult.value) val = enumResult.value;
          }
          mapped[sysField] = val;
        }
      }
      // Apply defaults
      for (const [field, defVal] of Object.entries(config.defaults)) {
        if (!mapped[field] || String(mapped[field]).trim() === "") {
          mapped[field] = defVal;
        }
      }
      // Validate
      const validation = validateRow(mapped, importType, issues);
      return { ...mapped, _validation: validation };
    });
  }, [sheetData, effectiveMapping, importType, issues]);

  const validCount = previewRows.filter((r) => r._validation.status === "valid").length;
  const warnCount = previewRows.filter((r) => r._validation.status === "warning").length;
  const errorCount = previewRows.filter((r) => r._validation.status === "error").length;

  // ── File handling ────────────────────────────────────────────
  const handleFile = useCallback(async (f) => {
    setFileError(null);
    const check = validateFile(f);
    if (!check.valid) { setFileError(check.error); return; }
    setFile(f);
    try {
      const wb = await readExcelFile(f);
      setWorkbookData(wb);
      setSelectedSheet(wb.sheetNames[0]);
      setHeaderRow(0);
      setColumnMapping({});
    } catch (err) {
      setFileError(err.message);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  // ── Execute import ───────────────────────────────────────────
  const executeImport = () => {
    const toImport = previewRows.filter((r) => r._validation.status !== "error");
    const result = {
      type: importType,
      total: previewRows.length,
      imported: toImport.length,
      skipped: errorCount,
      warnings: warnCount,
      items: toImport,
      filename: file?.name,
    };
    setImportResult(result);
    if (onImport) onImport(result);
    setStep(5);
  };

  // ── Styles ───────────────────────────────────────────────────
  const overlayStyle = { position: "fixed", inset: 0, background: "var(--overlay)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" };
  const modalStyle = { background: "var(--bg-modal)", border: "1px solid var(--border)", borderRadius: 12, width: "90vw", maxWidth: 900, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" };
  const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border)" };
  const bodyStyle = { flex: 1, padding: 20, overflowY: "auto" };
  const footerStyle = { display: "flex", justifyContent: "space-between", padding: "12px 20px", borderTop: "1px solid var(--border)" };
  const btnStyle = (primary) => ({
    background: primary ? "#3B82F6" : "transparent", border: `1px solid ${primary ? "#3B82F6" : "var(--text-disabled)"}`,
    borderRadius: 4, padding: "6px 16px", color: primary ? "#fff" : "var(--text-muted)", fontSize: 14, fontWeight: 600,
    cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: sans,
  });

  // ── Can proceed? ─────────────────────────────────────────────
  const canNext = () => {
    if (step === 1) return !!importType;
    if (step === 2) return !!workbookData && !!selectedSheet;
    if (step === 3) {
      const config = IMPORT_TYPE_FIELDS[importType];
      const mappedFields = Object.values(effectiveMapping);
      return config.required.every((f) => mappedFields.includes(f));
    }
    if (step === 4) return previewRows.length > 0 && validCount + warnCount > 0;
    return false;
  };

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Download size={16} color="#3B82F6" />
            <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
              {t ? "Nhập Dữ Liệu" : "Import Wizard"}
            </span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: 4, padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
          {STEPS.map((s) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: step > s.id ? "#10B981" : step === s.id ? "#3B82F6" : "var(--hover-bg)",
                color: step >= s.id ? "#fff" : "var(--text-faint)", fontSize: 12, fontWeight: 700,
              }}>
                {step > s.id ? <Check size={11} /> : s.id}
              </div>
              <span style={{ fontSize: 12, color: step >= s.id ? "var(--text-primary)" : "var(--text-faint)", fontWeight: step === s.id ? 700 : 400 }}>
                {t ? s.labelVi : s.label}
              </span>
              {s.id < 5 && <ChevronRight size={10} color="var(--text-disabled)" />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={bodyStyle}>
          {/* ── STEP 1: SELECT ── */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
                {t ? "Bạn muốn nhập dữ liệu gì?" : "What are you importing?"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {IMPORT_TYPES.map((it) => (
                  <div key={it.id} onClick={() => setImportType(it.id)}
                    style={{
                      background: importType === it.id ? "#3B82F610" : "var(--bg-card)",
                      border: `1px solid ${importType === it.id ? "#3B82F640" : "var(--border)"}`,
                      borderRadius: 8, padding: 16, cursor: "pointer", transition: "all 0.2s",
                    }}>
                    <it.icon size={20} color={importType === it.id ? "#3B82F6" : "var(--text-faint)"} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginTop: 8 }}>
                      {t ? it.labelVi : it.label}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>
                      {t ? it.descVi : it.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: UPLOAD ── */}
          {step === 2 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
                {t ? "Tải lên file Excel" : "Upload your Excel file"}
              </div>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? "#3B82F6" : "var(--border)"}`, borderRadius: 8,
                  padding: 40, textAlign: "center", cursor: "pointer",
                  background: isDragging ? "#3B82F608" : "var(--bg-card)", transition: "all 0.2s",
                }}>
                <Upload size={32} color={isDragging ? "#3B82F6" : "var(--text-faint)"} style={{ margin: "0 auto 8px" }} />
                <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
                  {t ? "Kéo thả file vào đây hoặc click để chọn" : "Drag & drop your file here or click to browse"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 4 }}>
                  .xlsx .xls .csv
                </div>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv"
                  style={{ display: "none" }} onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
              </div>

              {fileError && (
                <div style={{ marginTop: 8, padding: "6px 10px", background: "#EF444410", border: "1px solid #EF444430", borderRadius: 4, color: "#FCA5A5", fontSize: 13 }}>
                  <AlertTriangle size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> {fileError}
                </div>
              )}

              {file && workbookData && (
                <div style={{ marginTop: 12, padding: 12, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <FileSpreadsheet size={14} color="#10B981" />
                    <span style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 600 }}>{file.name}</span>
                    <span style={{ fontSize: 12, fontFamily: mono, color: "var(--text-dim)" }}>({formatFileSize(file.size)})</span>
                    <span style={{ fontSize: 12, color: "#10B981" }}>
                      {sheetData?.rows.length || 0} {t ? "dòng dữ liệu" : "rows detected"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {t ? "Sheet" : "Sheet"}
                      </label>
                      <select value={selectedSheet} onChange={(e) => { setSelectedSheet(e.target.value); setColumnMapping({}); }}
                        style={{ display: "block", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 3, padding: "4px 8px", color: "var(--text-muted)", fontSize: 13, marginTop: 2 }}>
                        {workbookData.sheetNames.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {t ? "Hàng tiêu đề" : "Header row"}
                      </label>
                      <select value={headerRow} onChange={(e) => { setHeaderRow(Number(e.target.value)); setColumnMapping({}); }}
                        style={{ display: "block", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 3, padding: "4px 8px", color: "var(--text-muted)", fontSize: 13, marginTop: 2 }}>
                        {Array.from({ length: Math.min(10, workbookData.sheets[selectedSheet]?.length || 1) }, (_, i) => (
                          <option key={i} value={i}>{t ? `Hàng ${i + 1}` : `Row ${i + 1}`}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: MAP ── */}
          {step === 3 && sheetData && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                {t ? "Ánh xạ cột Excel với hệ thống" : "Map your Excel columns to system fields"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 12 }}>
                {(() => {
                  const counts = { exact: 0, partial: 0, none: 0 };
                  sheetData.headers.forEach((h) => {
                    if (!h) return;
                    const mapped = effectiveMapping[h];
                    const conf = autoMapping[h]?.confidence || "none";
                    if (mapped && mapped !== "_skip") counts[conf === "none" ? "partial" : conf]++;
                    else counts.none++;
                  });
                  return `${t ? "Tự khớp" : "Auto-matched"}: ${counts.exact}  |  ${t ? "Đoán" : "Best guess"}: ${counts.partial}  |  ${t ? "Chưa khớp" : "Unmapped"}: ${counts.none}`;
                })()}
              </div>

              {/* Column mapping table */}
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 30px 1fr 100px", gap: 8, padding: "8px 12px", borderBottom: "1px solid var(--border)", fontSize: 11, color: "var(--text-faint)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  <span>{t ? "Cột Excel" : "Your Excel Column"}</span>
                  <span />
                  <span>{t ? "Trường hệ thống" : "System Field"}</span>
                  <span>{t ? "Trạng thái" : "Status"}</span>
                </div>
                {sheetData.headers.filter(Boolean).map((h) => {
                  const mapped = effectiveMapping[h];
                  const conf = autoMapping[h]?.confidence || "none";
                  const actualConf = mapped && mapped !== "_skip" ? conf : "none";
                  const confStyle = CONFIDENCE_STYLES[actualConf];
                  const ConfIcon = confStyle.icon;
                  return (
                    <div key={h} style={{ display: "grid", gridTemplateColumns: "1fr 30px 1fr 100px", gap: 8, padding: "6px 12px", borderBottom: "1px solid var(--bg-input)", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: mono }}>{h}</span>
                      <ArrowRight size={10} color="var(--text-disabled)" />
                      <select value={mapped || "_skip"}
                        onChange={(e) => setColumnMapping((prev) => ({ ...prev, [h]: e.target.value }))}
                        style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 3, padding: "3px 6px", color: "var(--text-muted)", fontSize: 12 }}>
                        <option value="_skip">— {t ? "Bỏ qua" : "Skip"} —</option>
                        {contextFields.map((f) => (
                          <option key={f} value={f}>{f} {IMPORT_TYPE_FIELDS[importType]?.required.includes(f) ? "*" : ""}</option>
                        ))}
                      </select>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: confStyle.color }}>
                        <ConfIcon size={10} /> {t ? confStyle.labelVi : confStyle.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Required fields check */}
              {(() => {
                const config = IMPORT_TYPE_FIELDS[importType];
                const mappedFields = Object.values(effectiveMapping);
                const missing = config.required.filter((f) => !mappedFields.includes(f));
                if (missing.length === 0) return null;
                return (
                  <div style={{ marginTop: 8, padding: "6px 10px", background: "#F59E0B10", border: "1px solid #F59E0B30", borderRadius: 4, color: "#FDE68A", fontSize: 12 }}>
                    <TriangleAlert size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                    {t ? "Trường bắt buộc thiếu" : "Required fields missing"}: {missing.join(", ")}
                  </div>
                );
              })()}

              {/* Value mapping preview */}
              {(() => {
                const config = IMPORT_TYPE_FIELDS[importType];
                const enumFields = Object.entries(config.enums).filter(
                  ([field]) => Object.values(effectiveMapping).includes(field)
                );
                if (enumFields.length === 0) return null;
                return (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 6 }}>
                      {t ? "Ánh xạ giá trị" : "Value Mapping"}
                    </div>
                    {enumFields.map(([field, enumType]) => {
                      const excelCol = Object.entries(effectiveMapping).find(([, v]) => v === field)?.[0];
                      if (!excelCol) return null;
                      const uniqueVals = [...new Set(sheetData.rows.map((r) => r[excelCol]).filter(Boolean).map(String))];
                      if (uniqueVals.length === 0) return null;
                      return (
                        <div key={field} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 4, padding: 8, marginBottom: 6 }}>
                          <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 4 }}>"{excelCol}" → {field}</div>
                          {uniqueVals.slice(0, 10).map((v) => {
                            const result = mapEnumValue(v, enumType);
                            return (
                              <div key={v} style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 0", fontSize: 12 }}>
                                <span style={{ color: "var(--text-muted)", fontFamily: mono, width: 120 }}>"{v}"</span>
                                <ArrowRight size={8} color="var(--text-disabled)" />
                                <span style={{ color: result.value ? "#10B981" : "#EF4444", fontFamily: mono }}>
                                  {result.value || "???"}
                                </span>
                                {result.confidence === "exact" && <Check size={8} color="#10B981" />}
                                {result.confidence === "partial" && <CircleDot size={8} color="#F59E0B" />}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── STEP 4: PREVIEW ── */}
          {step === 4 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                {t ? "Xem trước dữ liệu" : "Preview"}: {previewRows.length} {t ? "dòng sẽ được nhập" : "items will be imported"}
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: "#10B981" }}><Check size={10} style={{ display: "inline", verticalAlign: "middle" }} /> {validCount} {t ? "hợp lệ" : "valid"}</span>
                <span style={{ fontSize: 13, color: "#F59E0B" }}><TriangleAlert size={10} style={{ display: "inline", verticalAlign: "middle" }} /> {warnCount} {t ? "cảnh báo" : "warnings"}</span>
                <span style={{ fontSize: 13, color: "#EF4444" }}><X size={10} style={{ display: "inline", verticalAlign: "middle" }} /> {errorCount} {t ? "lỗi" : "errors"}</span>
              </div>

              {/* Preview table */}
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden", maxHeight: 300, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "var(--bg-modal)", borderBottom: "1px solid var(--border)" }}>
                      <th style={{ padding: "6px 8px", color: "var(--text-faint)", fontWeight: 700, textAlign: "left", width: 30 }}>#</th>
                      {Object.entries(effectiveMapping).filter(([, v]) => v && v !== "_skip").slice(0, 6).map(([, field]) => (
                        <th key={field} style={{ padding: "6px 8px", color: "var(--text-faint)", fontWeight: 700, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.04em" }}>{field}</th>
                      ))}
                      <th style={{ padding: "6px 8px", color: "var(--text-faint)", fontWeight: 700, textAlign: "center", width: 80 }}>{t ? "Kiểm tra" : "Validate"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.slice(0, 50).map((row, i) => {
                      const v = row._validation;
                      const rowColor = v.status === "error" ? "#EF444410" : v.status === "warning" ? "#F59E0B08" : "transparent";
                      return (
                        <tr key={i} style={{ background: rowColor, borderBottom: "1px solid var(--bg-input)" }}>
                          <td style={{ padding: "4px 8px", color: "var(--text-faint)", fontFamily: mono }}>{i + 1}</td>
                          {Object.entries(effectiveMapping).filter(([, v]) => v && v !== "_skip").slice(0, 6).map(([, field]) => (
                            <td key={field} style={{ padding: "4px 8px", color: "var(--text-secondary)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {String(row[field] ?? "")}
                            </td>
                          ))}
                          <td style={{ padding: "4px 8px", textAlign: "center" }}>
                            {v.status === "valid" && <Check size={12} color="#10B981" />}
                            {v.status === "warning" && (
                              <span title={v.messages.join(", ")} style={{ color: "#F59E0B", cursor: "help" }}>
                                <TriangleAlert size={12} />
                              </span>
                            )}
                            {v.status === "error" && (
                              <span title={v.messages.join(", ")} style={{ color: "#EF4444", cursor: "help" }}>
                                <X size={12} />
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Options */}
              <div style={{ marginTop: 12, display: "flex", gap: 16, alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", cursor: "pointer" }}>
                  <input type="checkbox" checked={importOptions.asDraft}
                    onChange={(e) => setImportOptions((o) => ({ ...o, asDraft: e.target.checked }))}
                    style={{ accentColor: "#3B82F6" }} />
                  {t ? "Nhập dạng DRAFT (PM duyệt trước khi kích hoạt)" : "Import as DRAFT (PM reviews before activating)"}
                </label>
              </div>
            </div>
          )}

          {/* ── STEP 5: COMPLETE ── */}
          {step === 5 && importResult && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <CheckCircle2 size={48} color="#10B981" style={{ margin: "0 auto 12px" }} />
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
                {t ? "Nhập hoàn tất!" : "Import Complete!"}
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 16 }}>
                <div style={{ background: "#10B98110", border: "1px solid #10B98130", borderRadius: 6, padding: "8px 16px" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#10B981", fontFamily: mono }}>{importResult.imported}</div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase" }}>{t ? "Đã nhập" : "Imported"}</div>
                </div>
                {importResult.warnings > 0 && (
                  <div style={{ background: "#F59E0B10", border: "1px solid #F59E0B30", borderRadius: 6, padding: "8px 16px" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#F59E0B", fontFamily: mono }}>{importResult.warnings}</div>
                    <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase" }}>{t ? "Cảnh báo" : "Warnings"}</div>
                  </div>
                )}
                {importResult.skipped > 0 && (
                  <div style={{ background: "#EF444410", border: "1px solid #EF444430", borderRadius: 6, padding: "8px 16px" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#EF4444", fontFamily: mono }}>{importResult.skipped}</div>
                    <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase" }}>{t ? "Bỏ qua" : "Skipped"}</div>
                  </div>
                )}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 16 }}>
                {t ? "Tổng" : "Total"}: {importResult.imported}/{importResult.total} | {t ? "Trạng thái" : "Status"}: DRAFT
              </div>
              <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 8 }}>
                {t ? "Đi đến hàng đợi Duyệt để kích hoạt các mục đã nhập." : "Go to Review Queue to activate imported items."}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          {step > 1 && step < 5 ? (
            <button onClick={() => setStep((s) => s - 1)} style={btnStyle(false)}>
              <ChevronLeft size={12} /> {t ? "Quay lại" : "Back"}
            </button>
          ) : <div />}
          {step < 4 && (
            <button onClick={() => setStep((s) => s + 1)} disabled={!canNext()} style={{ ...btnStyle(true), opacity: canNext() ? 1 : 0.4 }}>
              {t ? "Tiếp" : "Next"} <ChevronRight size={12} />
            </button>
          )}
          {step === 4 && (
            <button onClick={executeImport} disabled={!canNext()} style={{ ...btnStyle(true), opacity: canNext() ? 1 : 0.4 }}>
              {t ? `Nhập ${validCount + warnCount} mục` : `Import ${validCount + warnCount} items`} <ChevronRight size={12} />
            </button>
          )}
          {step === 5 && (
            <button onClick={onClose} style={btnStyle(true)}>
              {t ? "Xong" : "Done"} <Check size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
