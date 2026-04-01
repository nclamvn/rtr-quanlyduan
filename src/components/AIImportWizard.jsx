// ═══ RtR Control Tower — AI Master Import Wizard ═══
// Upload master Excel → AI classifies sheets → auto-map → distribute to modules
import { useState, useCallback, useRef } from "react";
import {
  Brain,
  Upload,
  FileSpreadsheet,
  X,
  Check,
  ChevronRight,
  AlertTriangle,
  Package,
  Plane,
  Milestone as MilestoneIcon,
  ShoppingCart,
  Factory,
  Warehouse,
  DollarSign,
  Zap,
  CheckCircle2,
  CircleAlert,
  RefreshCw,
  ArrowRight,
  Layers,
} from "lucide-react";
import { readExcelFile, validateFile, formatFileSize } from "../utils/importExport";
import { classifyAllSheets, autoMapAndTransform } from "../utils/aiClassifier";

const mono = "'JetBrains Mono', 'Fira Code', monospace";
const sans = "'Outfit', 'Segoe UI', system-ui, sans-serif";

const TYPE_META = {
  issues: { icon: AlertTriangle, color: "#EF4444", label: "Issues", labelVi: "Vấn Đề" },
  bom: { icon: Package, color: "#8B5CF6", label: "BOM", labelVi: "BOM" },
  flightTests: { icon: Plane, color: "#3B82F6", label: "Flight Tests", labelVi: "Bay Thử" },
  milestones: { icon: MilestoneIcon, color: "#10B981", label: "Milestones", labelVi: "Mốc" },
  orders: { icon: ShoppingCart, color: "#F97316", label: "Orders", labelVi: "Đơn Hàng" },
  production: { icon: Factory, color: "#06B6D4", label: "Production", labelVi: "Sản Xuất" },
  inventory: { icon: Warehouse, color: "#F59E0B", label: "Inventory", labelVi: "Tồn Kho" },
  costs: { icon: DollarSign, color: "#10B981", label: "Costs", labelVi: "Chi Phí" },
};

function ConfidenceBadge({ confidence }) {
  const color = confidence >= 80 ? "#10B981" : confidence >= 50 ? "#F59E0B" : "#EF4444";
  const label = confidence >= 80 ? "HIGH" : confidence >= 50 ? "MED" : "LOW";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: "1px 6px",
        borderRadius: 3,
        background: color + "15",
        color,
        fontSize: 9,
        fontWeight: 700,
        fontFamily: mono,
        border: `1px solid ${color}25`,
      }}
    >
      {confidence}% {label}
    </span>
  );
}

export default function AIImportWizard({ lang, project, onImport, onClose }) {
  const vi = lang === "vi";
  const [step, setStep] = useState(1); // 1: upload, 2: analysis, 3: review, 4: importing, 5: done
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [classifications, setClassifications] = useState([]);
  const [transformResults, setTransformResults] = useState({});
  const [selectedSheets, setSelectedSheets] = useState({});
  const [importProgress, setImportProgress] = useState({});
  const [importResults, setImportResults] = useState([]);
  const fileInputRef = useRef(null);

  // Step 1: File upload + AI analysis
  const handleFile = useCallback(
    async (f) => {
      setFileError(null);
      const validation = validateFile(f);
      if (!validation.valid) {
        setFileError(validation.error);
        return;
      }

      setFile(f);
      setStep(2); // Show analyzing state

      try {
        const { sheets } = await readExcelFile(f);
        const results = classifyAllSheets(sheets);

        // Auto-transform each classified sheet
        const transforms = {};
        const selected = {};
        for (const cls of results) {
          // Always process every sheet — the smart fallback will create rows even without matched fields
          transforms[cls.sheetName] = autoMapAndTransform(cls, sheets[cls.sheetName], project?.id);
          selected[cls.sheetName] = (transforms[cls.sheetName]?.stats?.valid || 0) > 0;
        }

        setClassifications(results);
        setTransformResults(transforms);
        setSelectedSheets(selected);
        setStep(3); // Show review
      } catch (err) {
        setFileError(vi ? "Không thể đọc file: " + err.message : "Failed to read file: " + err.message);
        setStep(1);
      }
    },
    [project?.id, vi],
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  // Step 4: Execute import
  const handleImportAll = useCallback(async () => {
    setStep(4);
    const results = [];
    const sheetsToImport = classifications.filter((c) => selectedSheets[c.sheetName]);

    for (const cls of sheetsToImport) {
      const transform = transformResults[cls.sheetName];
      if (!transform || transform.mappedRows.length === 0) {
        results.push({
          sheetName: cls.sheetName,
          type: cls.type,
          status: "skipped",
          count: 0,
          reason: "No valid rows",
        });
        continue;
      }

      setImportProgress((prev) => ({ ...prev, [cls.sheetName]: "importing" }));

      try {
        // Call onImport for each type — the parent handles actual persistence
        await onImport(transform.mappedRows, cls.type, cls.sheetName);
        results.push({
          sheetName: cls.sheetName,
          type: cls.type,
          status: "success",
          count: transform.mappedRows.length,
        });
        setImportProgress((prev) => ({ ...prev, [cls.sheetName]: "done" }));
      } catch (err) {
        results.push({ sheetName: cls.sheetName, type: cls.type, status: "error", count: 0, reason: err.message });
        setImportProgress((prev) => ({ ...prev, [cls.sheetName]: "error" }));
      }
    }

    setImportResults(results);
    setStep(5);
  }, [classifications, selectedSheets, transformResults, onImport]);

  const totalSelected = Object.values(selectedSheets).filter(Boolean).length;
  const totalRows = classifications
    .filter((c) => selectedSheets[c.sheetName])
    .reduce((sum, c) => sum + (transformResults[c.sheetName]?.stats?.valid || 0), 0);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--overlay)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "var(--bg-modal)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          width: "90%",
          maxWidth: 800,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "linear-gradient(135deg, #8B5CF6, #3B82F6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Brain size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
                {vi ? "AI Master Import" : "AI Master Import"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                {vi ? "Tải file Excel → AI tự phân bổ dữ liệu" : "Upload Excel → AI auto-distributes data"}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {/* Step 1: Upload */}
          {step === 1 && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? "#3B82F6" : "var(--border)"}`,
                borderRadius: 12,
                padding: 60,
                textAlign: "center",
                cursor: "pointer",
                background: isDragging ? "#3B82F610" : "var(--bg-input)",
                transition: "all 0.2s",
              }}
            >
              <Upload size={40} color={isDragging ? "#3B82F6" : "var(--text-faint)"} style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                {vi ? "Kéo thả file Master Excel vào đây" : "Drag & drop your Master Excel file here"}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 12 }}>
                {vi
                  ? "hoặc click để chọn file • .xlsx, .xls, .csv • Tối đa 5MB"
                  : "or click to browse • .xlsx, .xls, .csv • Max 5MB"}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-faint)",
                  background: "var(--bg-card)",
                  display: "inline-block",
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                }}
              >
                <Brain size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                {vi
                  ? "AI sẽ tự động nhận diện Issues, BOM, Orders, Production, Inventory..."
                  : "AI auto-detects Issues, BOM, Orders, Production, Inventory..."}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files[0]) handleFile(e.target.files[0]);
                }}
              />
            </div>
          )}

          {fileError && (
            <div
              style={{
                marginTop: 12,
                padding: "8px 14px",
                background: "#EF444415",
                border: "1px solid #EF444430",
                borderRadius: 6,
                color: "#FCA5A5",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AlertTriangle size={14} /> {fileError}
            </div>
          )}

          {/* Step 2: Analyzing */}
          {step === 2 && (
            <div style={{ textAlign: "center", padding: 60 }}>
              <RefreshCw size={32} color="#3B82F6" style={{ animation: "spin 1s linear infinite", marginBottom: 12 }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                {vi ? "AI đang phân tích..." : "AI is analyzing..."}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 4 }}>
                {vi
                  ? "Nhận diện loại dữ liệu, ánh xạ cột, kiểm tra dữ liệu"
                  : "Detecting data types, mapping columns, validating data"}
              </div>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Step 3: Review classifications */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Summary bar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Zap size={14} color="#F59E0B" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                    {vi
                      ? `AI phát hiện ${classifications.length} sheets`
                      : `AI detected ${classifications.length} sheets`}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-dim)" }}>
                  {file?.name} ({formatFileSize(file?.size || 0)})
                </div>
              </div>

              {/* Sheet cards */}
              {classifications.map((cls) => {
                const meta = TYPE_META[cls.type] || TYPE_META.issues;
                const Icon = meta.icon;
                const transform = transformResults[cls.sheetName];
                const isSelected = selectedSheets[cls.sheetName];

                return (
                  <div
                    key={cls.sheetName}
                    style={{
                      background: "var(--bg-card)",
                      border: `1px solid ${isSelected ? meta.color + "40" : "var(--border)"}`,
                      borderRadius: 8,
                      overflow: "hidden",
                      opacity: isSelected ? 1 : 0.6,
                      transition: "all 0.2s",
                    }}
                  >
                    {/* Card header */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 14px",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() =>
                          setSelectedSheets((prev) => ({ ...prev, [cls.sheetName]: !prev[cls.sheetName] }))
                        }
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          border: `2px solid ${isSelected ? meta.color : "var(--text-faint)"}`,
                          background: isSelected ? meta.color : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        {isSelected && <Check size={10} color="#fff" strokeWidth={3} />}
                      </button>

                      {/* Sheet icon + name */}
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          background: meta.color + "15",
                          border: `1px solid ${meta.color}25`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={14} color={meta.color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                            {cls.sheetName}
                          </span>
                          <ArrowRight size={10} color="var(--text-faint)" />
                          <span style={{ fontSize: 12, fontWeight: 700, color: meta.color }}>
                            {vi ? meta.labelVi : meta.label}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{cls.reason}</div>
                      </div>

                      {/* Stats */}
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <ConfidenceBadge confidence={cls.confidence} />
                        <div style={{ textAlign: "center" }}>
                          <div
                            style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", fontFamily: mono }}
                          >
                            {transform?.stats?.valid || 0}
                          </div>
                          <div style={{ fontSize: 9, color: "var(--text-faint)", textTransform: "uppercase" }}>
                            {vi ? "hàng" : "rows"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Matched columns or raw data preview */}
                    {isSelected && Object.keys(cls.matchedFields).length > 0 && (
                      <div style={{ padding: "8px 14px", display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {Object.entries(cls.matchedFields).map(([header, match]) => (
                          <span
                            key={header}
                            style={{
                              padding: "1px 6px",
                              borderRadius: 3,
                              fontSize: 10,
                              fontFamily: mono,
                              background: match.confidence === "exact" ? "#10B98110" : "#F59E0B10",
                              color: match.confidence === "exact" ? "#10B981" : "#F59E0B",
                              border: `1px solid ${match.confidence === "exact" ? "#10B98120" : "#F59E0B20"}`,
                            }}
                          >
                            {header} → {match.field}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Raw data preview when no columns matched */}
                    {(isSelected || cls.confidence < 50) && transform?.rawPreview?.length > 0 && (
                      <div style={{ padding: "8px 14px", borderTop: "1px solid var(--border)" }}>
                        <div
                          style={{
                            fontSize: 10,
                            color: "var(--text-faint)",
                            marginBottom: 4,
                            fontWeight: 700,
                            textTransform: "uppercase",
                          }}
                        >
                          {vi ? "Dữ liệu mẫu (3 hàng đầu)" : "Sample data (first 3 rows)"}
                        </div>
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ borderCollapse: "collapse", fontSize: 10, fontFamily: mono, width: "100%" }}>
                            <thead>
                              <tr>
                                {cls.headers.slice(0, 8).map((h, i) => (
                                  <th
                                    key={i}
                                    style={{
                                      padding: "2px 6px",
                                      textAlign: "left",
                                      color: "var(--text-dim)",
                                      borderBottom: "1px solid var(--border)",
                                      whiteSpace: "nowrap",
                                      maxWidth: 120,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {h}
                                  </th>
                                ))}
                                {cls.headers.length > 8 && (
                                  <th style={{ padding: "2px 6px", color: "var(--text-faint)" }}>
                                    +{cls.headers.length - 8}
                                  </th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {transform.rawPreview.slice(0, 3).map((row, ri) => (
                                <tr key={ri}>
                                  {cls.headers.slice(0, 8).map((h, ci) => (
                                    <td
                                      key={ci}
                                      style={{
                                        padding: "2px 6px",
                                        color: "var(--text-secondary)",
                                        borderBottom: "1px solid var(--border)",
                                        whiteSpace: "nowrap",
                                        maxWidth: 120,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                    >
                                      {row[h] !== undefined ? String(row[h]).substring(0, 30) : ""}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {transform?.warnings?.length > 0 && (
                          <div style={{ marginTop: 4, fontSize: 10, color: "#FCA5A5" }}>
                            {transform.warnings.length} {vi ? "cảnh báo" : "warnings"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {classifications.length === 0 && (
                <div style={{ textAlign: "center", padding: 40, color: "var(--text-faint)" }}>
                  {vi ? "Không phát hiện dữ liệu hợp lệ trong file" : "No valid data detected in the file"}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Importing */}
          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                {vi ? "Đang import..." : "Importing..."}
              </div>
              {classifications
                .filter((c) => selectedSheets[c.sheetName])
                .map((cls) => {
                  const meta = TYPE_META[cls.type] || TYPE_META.issues;
                  const Icon = meta.icon;
                  const progress = importProgress[cls.sheetName];
                  return (
                    <div
                      key={cls.sheetName}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 14px",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                      }}
                    >
                      <Icon size={14} color={meta.color} />
                      <span style={{ flex: 1, fontSize: 13, color: "var(--text-primary)" }}>{cls.sheetName}</span>
                      {progress === "importing" && (
                        <RefreshCw size={12} color="#3B82F6" style={{ animation: "spin 1s linear infinite" }} />
                      )}
                      {progress === "done" && <CheckCircle2 size={14} color="#10B981" />}
                      {progress === "error" && <CircleAlert size={14} color="#EF4444" />}
                      {!progress && (
                        <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{vi ? "Chờ..." : "Waiting..."}</span>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {/* Step 5: Done */}
          {step === 5 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <CheckCircle2 size={40} color="#10B981" style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>
                  {vi ? "Import hoàn tất!" : "Import Complete!"}
                </div>
              </div>
              {importResults.map((r) => {
                const meta = TYPE_META[r.type] || TYPE_META.issues;
                const Icon = meta.icon;
                return (
                  <div
                    key={r.sheetName}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 14px",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                    }}
                  >
                    <Icon size={14} color={meta.color} />
                    <span style={{ flex: 1, fontSize: 13, color: "var(--text-primary)" }}>{r.sheetName}</span>
                    {r.status === "success" && (
                      <span style={{ fontSize: 12, color: "#10B981", fontWeight: 700 }}>
                        <Check size={10} style={{ display: "inline", verticalAlign: "middle" }} /> {r.count}{" "}
                        {vi ? "bản ghi" : "records"}
                      </span>
                    )}
                    {r.status === "error" && <span style={{ fontSize: 12, color: "#EF4444" }}>{r.reason}</span>}
                    {r.status === "skipped" && (
                      <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{vi ? "Bỏ qua" : "Skipped"}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 20px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <div style={{ fontSize: 12, color: "var(--text-faint)" }}>
            {step === 3 &&
              `${totalSelected} ${vi ? "sheets đã chọn" : "sheets selected"} • ${totalRows} ${vi ? "hàng" : "rows"}`}
            {step === 5 &&
              `${importResults.filter((r) => r.status === "success").reduce((s, r) => s + r.count, 0)} ${vi ? "bản ghi đã import" : "records imported"}`}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {step < 4 && (
              <button
                onClick={onClose}
                style={{
                  background: "var(--hover-bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "6px 16px",
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: sans,
                }}
              >
                {vi ? "Hủy" : "Cancel"}
              </button>
            )}
            {step === 3 && totalSelected > 0 && (
              <button
                onClick={handleImportAll}
                style={{
                  background: "linear-gradient(135deg, #8B5CF6, #3B82F6)",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 20px",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: sans,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Brain size={14} />
                {vi
                  ? `Import ${totalSelected} sheets (${totalRows} hàng)`
                  : `Import ${totalSelected} sheets (${totalRows} rows)`}
              </button>
            )}
            {step === 5 && (
              <button
                onClick={onClose}
                style={{
                  background: "#10B981",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 20px",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: sans,
                }}
              >
                {vi ? "Hoàn tất" : "Done"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
