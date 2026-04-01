// ═══ AI Sheet Classifier — Auto-detect data type from Excel sheet headers & content ═══
import { HEADER_ALIASES, IMPORT_TYPE_FIELDS, autoMatchColumn, mapEnumValue } from "./importExport";

/**
 * Detect if a sheet is a workplan/Gantt (col0=id, col1=tasks, col2=owner, rest=dates/updates)
 */
function detectWorkplan(headers, _rawData) {
  if (headers.length < 5) return false;
  const h = headers.map((h) => (h || "").toLowerCase());
  // Check for "tasks" or "responsible" in first 3 columns
  const hasTaskCol = h.slice(0, 3).some((x) => x.includes("task") || x.includes("việc") || x.includes("công việc"));
  const hasOwnerCol = h
    .slice(0, 4)
    .some((x) => x.includes("responsible") || x.includes("owner") || x.includes("party") || x.includes("phụ trách"));
  // Check if many columns are dates (numeric serial or date strings)
  let dateCols = 0;
  for (let j = 3; j < Math.min(headers.length, 20); j++) {
    const val = headers[j];
    if (!val) continue;
    // Excel date serial numbers (40000-50000 range) or date strings
    if (typeof val === "number" && val > 40000 && val < 55000) dateCols++;
    else if (
      String(val).match(
        /\d{4}[-/]\d{1,2}[-/]\d{1,2}|mon|tue|wed|thu|fri|sat|sun|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i,
      )
    )
      dateCols++;
  }
  return hasTaskCol || hasOwnerCol || dateCols > 3;
}

/**
 * Extract workplan rows from raw sheet data
 * @returns {Array<Object>} mapped rows with title, owner, description, status
 */
function extractWorkplanRows(rawData, projectId) {
  const headers = (rawData[0] || []).map((h) => String(h || "").trim());
  const rows = [];

  // Determine column indices
  let taskIdx = 1; // default: col B
  let ownerIdx = 2; // default: col C
  const hLower = headers.map((h) => h.toLowerCase());

  // Find task column
  for (let j = 0; j < Math.min(hLower.length, 4); j++) {
    if (hLower[j].includes("task") || hLower[j].includes("việc")) {
      taskIdx = j;
      break;
    }
  }
  // Find owner column
  for (let j = 0; j < Math.min(hLower.length, 5); j++) {
    if (
      hLower[j].includes("responsible") ||
      hLower[j].includes("owner") ||
      hLower[j].includes("party") ||
      hLower[j].includes("phụ trách")
    ) {
      ownerIdx = j;
      break;
    }
  }

  for (let i = 1; i < rawData.length; i++) {
    const raw = rawData[i];
    if (!raw) continue;

    const taskName = raw[taskIdx] ? String(raw[taskIdx]).trim() : "";
    if (taskName.length < 2) continue; // skip empty/header-like rows

    const owner = raw[ownerIdx] ? String(raw[ownerIdx]).trim() : "";
    const stt = raw[0] ? String(raw[0]).trim() : "";

    // Get latest update — scan from col 3 rightward, pick first non-empty
    let latestUpdate = "";
    let updateDate = "";
    for (let j = 3; j < raw.length; j++) {
      const val = raw[j];
      if (val && String(val).trim().length > 2) {
        latestUpdate = String(val).trim();
        // Try to get date from header
        const hdr = headers[j] || "";
        if (hdr) {
          if (typeof rawData[0][j] === "number" && rawData[0][j] > 40000) {
            // Excel date serial → convert
            const d = new Date((rawData[0][j] - 25569) * 86400 * 1000);
            updateDate = d.toISOString().split("T")[0];
          } else {
            updateDate = hdr;
          }
        }
        break;
      }
    }

    // Auto-detect status from content
    const lower = latestUpdate.toLowerCase();
    let status = "OPEN";
    if (lower.includes("done") || lower.includes("hoàn thành") || lower.includes("xong")) status = "CLOSED";
    else if (lower.includes("postpone") || lower.includes("hold") || lower.includes("tạm")) status = "BLOCKED";
    else if (latestUpdate.length > 5) status = "IN_PROGRESS";

    // Auto-detect phase from content
    let phase = "DVT";
    if (lower.includes("pvt")) phase = "PVT";
    else if (lower.includes("evt")) phase = "EVT";
    else if (lower.includes("concept")) phase = "CONCEPT";
    else if (lower.includes("mp") || lower.includes("mass prod")) phase = "MP";

    // Severity from keywords
    let severity = "MEDIUM";
    if (lower.includes("urgent") || lower.includes("gấp") || lower.includes("critical")) severity = "CRITICAL";
    else if (lower.includes("important") || lower.includes("quan trọng")) severity = "HIGH";

    rows.push({
      projectId,
      stt,
      title: taskName.substring(0, 200),
      owner,
      description: latestUpdate.substring(0, 1000),
      status,
      severity,
      phase,
      source: "INTERNAL",
      rootCause: latestUpdate.substring(0, 300) || "See workplan",
      created: updateDate || new Date().toISOString().split("T")[0],
      _raw: true,
    });
  }

  return rows;
}

/**
 * Classify a single sheet
 */
export function classifySheet(sheetName, headers, _sampleRows = [], rawData = null) {
  const isWorkplan = detectWorkplan(headers, rawData);

  if (isWorkplan) {
    // Quick return — workplan is always classified as issues
    const taskCount = rawData ? rawData.slice(1).filter((r) => r && r[1] && String(r[1]).trim().length > 1).length : 0;
    return {
      type: "issues",
      confidence: 85,
      matchedFields: {},
      allScores: { issues: 85 },
      reason: `Workplan detected — ${taskCount} tasks, ${headers.length} date columns`,
      isWorkplan: true,
    };
  }

  // Standard classification for non-workplan sheets
  const scores = {};
  const matchDetails = {};

  for (const [type, config] of Object.entries(IMPORT_TYPE_FIELDS)) {
    scores[type] = 0;
    matchDetails[type] = { matched: {} };
    const allFields = [...config.required, ...config.optional];

    for (const header of headers) {
      if (!header || !String(header).trim()) continue;
      const match = autoMatchColumn(String(header), allFields);
      if (match.field) {
        matchDetails[type].matched[header] = match;
        scores[type] += config.required.includes(match.field) ? 15 : 8;
      }
    }
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [bestType, bestScore] = sorted[0];
  const confidence = Math.min(100, Math.round(bestScore * 2));

  return {
    type: bestType,
    confidence: Math.max(confidence, 30), // minimum 30% for any sheet with data
    matchedFields: matchDetails[bestType]?.matched || {},
    allScores: scores,
    reason:
      confidence > 50
        ? `${Object.keys(matchDetails[bestType]?.matched || {}).length} columns matched`
        : "Auto-import as tasks",
    isWorkplan: false,
  };
}

/**
 * Classify all sheets in a workbook
 */
export function classifyAllSheets(sheets) {
  const results = [];
  for (const [sheetName, rawData] of Object.entries(sheets)) {
    if (!rawData || rawData.length < 2) continue;

    const headers = (rawData[0] || []).map((h) => {
      if (h === undefined || h === null || h === "") return "";
      return String(h).trim();
    });
    if (headers.filter(Boolean).length < 2) continue;

    const classification = classifySheet(sheetName, headers, [], rawData);
    const taskCount = rawData.slice(1).filter((r) => r && r[1] && String(r[1]).trim().length > 1).length;

    results.push({
      sheetName,
      headers: headers.filter(Boolean).slice(0, 10), // Show first 10 non-empty headers
      rowCount: taskCount,
      ...classification,
    });
  }
  return results;
}

/**
 * Auto-map and transform — handles both workplan and standard formats
 */
export function autoMapAndTransform(classification, rawData, projectId) {
  const headers = (rawData[0] || []).map((h) => String(h || "").trim());

  // Build raw preview
  const rawPreview = [];
  const previewHeaders = ["Tasks", "Responsible party"].filter((h) => headers.includes(h));
  if (previewHeaders.length === 0) previewHeaders.push(...headers.slice(0, 3).filter(Boolean));

  for (let i = 1; i < Math.min(rawData.length, 8); i++) {
    const row = rawData[i];
    if (!row) continue;
    const preview = {};
    // Show task (col 1), owner (col 2), and latest update (first non-empty from col 3+)
    if (row[1]) preview["Task"] = String(row[1]).substring(0, 60);
    if (row[2]) preview["Owner"] = String(row[2]).substring(0, 30);
    let update = "";
    for (let j = 3; j < row.length; j++) {
      if (row[j] && String(row[j]).trim().length > 2) {
        update = String(row[j]).substring(0, 80);
        break;
      }
    }
    if (update) preview["Latest Update"] = update;
    if (Object.keys(preview).length > 0) rawPreview.push(preview);
  }

  // Extract rows
  let mappedRows;
  if (classification.isWorkplan) {
    mappedRows = extractWorkplanRows(rawData, projectId);
  } else {
    // Standard extraction using matched fields
    const { matchedFields } = classification;
    const config = IMPORT_TYPE_FIELDS[classification.type];
    mappedRows = [];

    if (config && Object.keys(matchedFields).length > 0) {
      for (let i = 1; i < rawData.length; i++) {
        const rawRow = rawData[i];
        if (!rawRow || rawRow.every((c) => !c && c !== 0)) continue;
        const mapped = { ...config.defaults, projectId };
        for (const [headerName, matchInfo] of Object.entries(matchedFields)) {
          const colIdx = headers.indexOf(headerName);
          if (colIdx === -1) continue;
          const rawVal = rawRow[colIdx];
          if (rawVal === undefined || rawVal === null || String(rawVal).trim() === "") continue;
          const enumType = config.enums?.[matchInfo.field];
          if (enumType) {
            const r = mapEnumValue(String(rawVal), enumType);
            mapped[matchInfo.field] = r.value || String(rawVal);
          } else {
            mapped[matchInfo.field] =
              rawVal instanceof Date ? rawVal.toISOString().split("T")[0] : String(rawVal).trim();
          }
        }
        const missing = config.required.filter((f) => !mapped[f]);
        if (missing.length === 0) mappedRows.push(mapped);
      }
    }

    // Fallback: if standard mapping found nothing, use workplan extraction
    if (mappedRows.length === 0) {
      mappedRows = extractWorkplanRows(rawData, projectId);
    }
  }

  return {
    mappedRows,
    rawPreview,
    warnings: [],
    stats: {
      total: rawData.length - 1,
      valid: mappedRows.length,
      warnings: 0,
      errors: 0,
      skipped: rawData.length - 1 - mappedRows.length,
    },
  };
}
