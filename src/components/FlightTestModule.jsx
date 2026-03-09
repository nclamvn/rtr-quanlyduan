import { useState, useMemo } from "react";
import {
  Plane, Clock, MapPin, User, Gauge, Thermometer,
  Battery, Zap, Radio, Wind, ChevronLeft,
  AlertTriangle, FileText, Video, Camera, ExternalLink,
  ArrowRight, Check, X, FilterX, SearchX
} from "lucide-react";
import {
  FLIGHT_TEST_TYPES, FLIGHT_RESULT_COLORS,
} from "../data/v2Data";
import { useFlightTestData } from "../hooks/useV2Data";
import EmptyState, { EMPTY_MESSAGES } from "./EmptyState";

const mono = "'JetBrains Mono', 'Fira Code', monospace";
const sans = "'Outfit', 'Segoe UI', system-ui, sans-serif";

function Badge({ label, color, size = "sm", icon: IconComp }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: size === "sm" ? "1px 7px" : "3px 10px", borderRadius: 3, background: color + "15", color, fontSize: size === "sm" ? 9 : 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", border: `1px solid ${color}25`, fontFamily: mono, whiteSpace: "nowrap" }}>
      {IconComp ? <IconComp size={size === "sm" ? 10 : 12} /> : <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />}
      {label}
    </span>
  );
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function SensorBar({ label, value, unit, min, max, warn, color = "#3B82F6" }) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const isWarn = warn != null && value >= warn;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
      <span style={{ fontSize: 11, color: "var(--text-dim)", width: 70, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: "var(--hover-bg)", borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: isWarn ? "#EF4444" : color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 12, fontFamily: mono, color: isWarn ? "#EF4444" : "var(--text-muted)", width: 55, textAlign: "right", fontWeight: isWarn ? 700 : 400 }}>
        {value}{unit} {isWarn && <AlertTriangle size={8} style={{ display: "inline", verticalAlign: "middle" }} />}
      </span>
    </div>
  );
}

const ATTACH_ICONS = { VIDEO: Video, LOG: FileText, PHOTO: Camera };

export default function FlightTestModule({ lang, t, project, issues, onViewIssue, onCreateAutoIssue, perm }) {
  const canCreateIssue = perm?.canCreateIssue ? perm.canCreateIssue() : true;
  const [selectedTest, setSelectedTest] = useState(null);
  const [filterType, setFilterType] = useState("ALL");
  const [filterResult, setFilterResult] = useState("ALL");

  // Fetch from Supabase (or static fallback)
  const { data: flightTests, loading: flightsLoading } = useFlightTestData(project?.id);

  const tests = useMemo(() =>
    flightTests
      .filter(ft => filterType === "ALL" || ft.testType === filterType)
      .filter(ft => filterResult === "ALL" || ft.result === filterResult)
      .sort((a, b) => b.testNumber - a.testNumber),
    [flightTests, filterType, filterResult]
  );

  const stats = useMemo(() => ({
    total: flightTests.length,
    pass: flightTests.filter(f => f.result === "PASS").length,
    fail: flightTests.filter(f => f.result === "FAIL").length,
    partial: flightTests.filter(f => f.result === "PARTIAL").length,
  }), [flightTests]);

  if (flightsLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, color: "var(--text-dim)", fontSize: 14 }}>
        <Plane size={16} style={{ marginRight: 8, opacity: 0.5 }} />
        {lang === "vi" ? "Đang tải dữ liệu bay..." : "Loading flight tests..."}
      </div>
    );
  }

  if (selectedTest) {
    const ft = selectedTest;
    const sd = ft.sensorData;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Back button */}
        <div>
          <button onClick={() => setSelectedTest(null)}
            style={{ background: "none", border: "none", color: "var(--text-dim)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
            <ChevronLeft size={12} /> {lang === "vi" ? "Quay lại danh sách" : "Back to list"}
          </button>
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Plane size={16} color="#3B82F6" />
          <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>FLT-{String(ft.testNumber).padStart(3, "0")}</span>
          <Badge label={ft.testType} color="#3B82F6" />
          <Badge label={ft.result} color={FLIGHT_RESULT_COLORS[ft.result]} />
          <Badge label={ft.testPhase} color="#8B5CF6" />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {/* Flight Info */}
          <div style={{ flex: 1, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 12, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 8 }}>
              {lang === "vi" ? "Thông tin chuyến bay" : "Flight Info"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { icon: Clock, label: lang === "vi" ? "Ngày" : "Date", value: ft.date },
                { icon: MapPin, label: lang === "vi" ? "Địa điểm" : "Location", value: lang === "vi" ? ft.locationVi : ft.location },
                { icon: User, label: lang === "vi" ? "Phi công" : "Pilot", value: ft.pilot },
                { icon: Plane, label: lang === "vi" ? "Máy bay" : "Unit", value: ft.droneUnit },
                { icon: Clock, label: lang === "vi" ? "Thời gian" : "Duration", value: formatDuration(ft.duration) },
                { icon: Gauge, label: lang === "vi" ? "Tốc độ max" : "Max Speed", value: `${ft.maxSpeed} m/s` },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <f.icon size={10} color="var(--text-faint)" />
                  <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{f.label}:</span>
                  <span style={{ fontSize: 13, color: "var(--text-primary)", fontFamily: mono }}>{f.value}</span>
                </div>
              ))}
            </div>

            {/* Linked entities */}
            {ft.autoIssueId && (
              <div style={{ marginTop: 10, padding: "6px 8px", background: "#EF444410", border: "1px solid #EF444420", borderRadius: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={10} color="#EF4444" />
                <span style={{ fontSize: 12, color: "#FCA5A5" }}>{lang === "vi" ? "Issue tự tạo" : "Auto-created Issue"}: </span>
                <button onClick={() => onViewIssue && onViewIssue(ft.autoIssueId)}
                  style={{ background: "none", border: "none", color: "#60A5FA", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: mono, textDecoration: "underline" }}>
                  {ft.autoIssueId}
                </button>
              </div>
            )}
            {!ft.autoIssueId && (ft.result === "FAIL" || ft.result === "PARTIAL") && onCreateAutoIssue && canCreateIssue && (
              <div style={{ marginTop: 10 }}>
                <button onClick={() => onCreateAutoIssue(ft)}
                  style={{ background: "#EF444415", border: "1px solid #EF444430", borderRadius: 4, padding: "6px 12px", color: "#FCA5A5", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: sans }}>
                  <AlertTriangle size={12} />
                  {lang === "vi" ? "Tạo Issue từ chuyến bay này" : "Create Issue from this Flight"}
                </button>
              </div>
            )}
          </div>

          {/* Sensor Summary */}
          <div style={{ flex: 1, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 12, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 8 }}>
              {lang === "vi" ? "Dữ liệu cảm biến" : "Sensor Summary"}
            </div>
            <SensorBar label="Battery" value={sd.batteryEnd} unit="V" min={18} max={26} warn={20.5} color="#10B981" />
            <SensorBar label="Min Cell" value={sd.batteryMinCell} unit="V" min={3.0} max={4.2} warn={3.4} color="#10B981" />
            <SensorBar label="Max Curr" value={sd.maxCurrent} unit="A" min={0} max={60} warn={35} color="#F59E0B" />
            <SensorBar label="Avg Curr" value={sd.avgCurrent} unit="A" min={0} max={40} color="#3B82F6" />
            <SensorBar label="Vibration" value={sd.maxVibration} unit="mm/s" min={0} max={50} warn={25} color="#8B5CF6" />
            <SensorBar label="GPS Acc" value={sd.gpsAccuracy} unit="m" min={0} max={2} color="#06B6D4" />
            <SensorBar label="Wind" value={sd.maxWind} unit="m/s" min={0} max={15} warn={10} color="var(--text-dim)" />
            <SensorBar label="Temp" value={sd.ambientTemp} unit="°C" min={15} max={50} warn={40} color="#EF4444" />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {/* Anomalies */}
          <div style={{ flex: 1, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 12, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 8 }}>
              {lang === "vi" ? "Bất thường" : "Anomalies"} ({ft.anomalies.length})
            </div>
            {ft.anomalies.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text-faint)", display: "flex", alignItems: "center", gap: 4 }}>
                <Check size={12} color="#10B981" /> {lang === "vi" ? "Không có bất thường" : "No anomalies detected"}
              </div>
            ) : ft.anomalies.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 8px", marginBottom: 4, background: a.severity === "HIGH" ? "#EF444408" : "#F59E0B08", borderLeft: `3px solid ${a.severity === "HIGH" ? "#EF4444" : "#F59E0B"}`, borderRadius: "0 4px 4px 0" }}>
                <span style={{ fontSize: 11, fontFamily: mono, color: "var(--text-dim)", flexShrink: 0, marginTop: 1 }}>{formatDuration(a.timestamp)}</span>
                <div>
                  <div style={{ fontSize: 13, color: a.severity === "HIGH" ? "#FCA5A5" : "#FDE68A" }}>
                    {lang === "vi" && a.descriptionVi ? a.descriptionVi : a.description}
                  </div>
                  <Badge label={a.severity} color={a.severity === "HIGH" ? "#EF4444" : "#F59E0B"} />
                </div>
              </div>
            ))}
          </div>

          {/* Attachments */}
          <div style={{ width: 200, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 14, flexShrink: 0 }}>
            <div style={{ fontSize: 12, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 8 }}>
              {lang === "vi" ? "Đính kèm" : "Attachments"} ({ft.attachments.length})
            </div>
            {ft.attachments.map((att, i) => {
              const AttIcon = ATTACH_ICONS[att.type] || FileText;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 6px", marginBottom: 3, background: "var(--bg-input)", borderRadius: 4, cursor: "pointer" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--hover-bg)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-input)"; }}>
                  <AttIcon size={11} color="var(--text-dim)" />
                  <span style={{ fontSize: 12, color: "var(--text-muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{att.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 12, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 4 }}>
            {lang === "vi" ? "Ghi chú" : "Notes"}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
            {lang === "vi" && ft.notesVi ? ft.notesVi : ft.notes}
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Plane size={16} color="#3B82F6" />
          <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>{project?.name}</span>
          <span style={{ fontSize: 13, color: "var(--text-dim)" }}>—</span>
          <span style={{ fontSize: 13, color: "var(--text-dim)" }}>
            {stats.total} {lang === "vi" ? "chuyến bay" : "flights"}
            <span style={{ color: "#10B981", marginLeft: 6 }}>{stats.pass} PASS</span>
            <span style={{ color: "#EF4444", marginLeft: 6 }}>{stats.fail} FAIL</span>
            {stats.partial > 0 && <span style={{ color: "#F59E0B", marginLeft: 6 }}>{stats.partial} PARTIAL</span>}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 8px", color: "var(--text-muted)", fontSize: 12, outline: "none" }}>
          <option value="ALL">{lang === "vi" ? "Tất cả loại test" : "All Types"}</option>
          {FLIGHT_TEST_TYPES.map(tt => <option key={tt} value={tt}>{tt}</option>)}
        </select>
        <select value={filterResult} onChange={e => setFilterResult(e.target.value)}
          style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 8px", color: "var(--text-muted)", fontSize: 12, outline: "none" }}>
          <option value="ALL">{lang === "vi" ? "Tất cả kết quả" : "All Results"}</option>
          {["PASS", "FAIL", "PARTIAL", "ABORTED"].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {(filterType !== "ALL" || filterResult !== "ALL") && (
          <button onClick={() => { setFilterType("ALL"); setFilterResult("ALL"); }}
            style={{ background: "#EF444415", border: "1px solid #EF444430", borderRadius: 4, padding: "4px 8px", color: "#EF4444", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
            <FilterX size={11} /> {lang === "vi" ? "Xoá lọc" : "Reset"}
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", padding: "6px 12px", borderBottom: "1px solid var(--border)", fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, position: "sticky", top: 0, zIndex: 10, background: "var(--bg-card)" }}>
          <span style={{ width: 40 }}>#</span>
          <span style={{ width: 80 }}>{lang === "vi" ? "Ngày" : "Date"}</span>
          <span style={{ width: 90 }}>{lang === "vi" ? "Loại" : "Type"}</span>
          <span style={{ width: 70 }}>{lang === "vi" ? "Phi công" : "Pilot"}</span>
          <span style={{ width: 60, textAlign: "right" }}>{lang === "vi" ? "Thời gian" : "Duration"}</span>
          <span style={{ width: 70, textAlign: "center" }}>{lang === "vi" ? "Kết quả" : "Result"}</span>
          <span style={{ flex: 1, textAlign: "right" }}>Issues</span>
        </div>

        {/* Rows */}
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {tests.length === 0 && flightTests.length === 0 && (
            <EmptyState icon={EMPTY_MESSAGES[lang].flights.icon} title={EMPTY_MESSAGES[lang].flights.title} description={EMPTY_MESSAGES[lang].flights.desc} />
          )}
          {tests.length === 0 && flightTests.length > 0 && (
            <div style={{ padding: 40, textAlign: "center" }}>
              <SearchX size={24} color="var(--text-disabled)" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 14, color: "var(--text-faint)" }}>{lang === "vi" ? "Không có chuyến bay nào khớp bộ lọc" : "No flights match filters"}</div>
              {(filterType !== "ALL" || filterResult !== "ALL") && (
                <button onClick={() => { setFilterType("ALL"); setFilterResult("ALL"); }}
                  style={{ marginTop: 10, background: "var(--hover-bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 12px", color: "var(--text-muted)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <FilterX size={12} /> {lang === "vi" ? "Xoá bộ lọc" : "Clear filters"}
                </button>
              )}
            </div>
          )}
          {tests.map(ft => (
            <div key={ft.id} onClick={() => setSelectedTest(ft)}
              style={{ display: "flex", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid var(--bg-input)", cursor: "pointer", transition: "background 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--border-a20)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
              <span style={{ width: 40, fontSize: 13, fontFamily: mono, color: "var(--text-dim)" }}>{ft.testNumber}</span>
              <span style={{ width: 80, fontSize: 13, fontFamily: mono, color: "var(--text-muted)" }}>{ft.date}</span>
              <span style={{ width: 90 }}><Badge label={ft.testType} color="#3B82F6" /></span>
              <span style={{ width: 70, fontSize: 13, color: "var(--text-secondary)" }}>{ft.pilot}</span>
              <span style={{ width: 60, fontSize: 13, fontFamily: mono, color: "var(--text-muted)", textAlign: "right" }}>{formatDuration(ft.duration)}</span>
              <span style={{ width: 70, textAlign: "center" }}><Badge label={ft.result} color={FLIGHT_RESULT_COLORS[ft.result]} /></span>
              <span style={{ flex: 1, textAlign: "right" }}>
                {ft.autoIssueId ? (
                  <span style={{ fontSize: 12, fontFamily: mono, color: "#60A5FA" }}>{ft.autoIssueId}</span>
                ) : (
                  <span style={{ fontSize: 12, color: "var(--text-disabled)" }}>—</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
