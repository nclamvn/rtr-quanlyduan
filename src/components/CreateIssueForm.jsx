// ═══════════════════════════════════════════════════════════
// RtR Control Tower — Create Issue Form
// ═══════════════════════════════════════════════════════════
import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Btn } from "./ui";
import { PHASES, SEV_LIST, SRC_LIST, sans } from "../constants";

export default function CreateIssueForm({
  t,
  lang,
  selProject,
  onClose,
  onCreate,
  initialStatus = "DRAFT",
  teamMembers,
}) {
  const [form, setForm] = useState({
    title: "",
    titleVi: "",
    desc: "",
    rootCause: "Investigating",
    sev: "HIGH",
    src: "INTERNAL",
    owner: "",
    phase: "DVT",
    due: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const owners = (teamMembers || []).filter((m) => m.role === "engineer").map((m) => m.name);
  const isDirty =
    form.title ||
    form.titleVi ||
    form.desc ||
    form.owner ||
    form.due ||
    form.rootCause !== "Investigating" ||
    form.sev !== "HIGH" ||
    form.src !== "INTERNAL" ||
    form.phase !== "DVT";
  const handleClose = () => {
    if (!isDirty || window.confirm(t.unsavedChanges)) onClose();
  };

  const [touched, setTouched] = useState({});
  const errors = {
    title: touched.title && !form.title ? (lang === "vi" ? "Tiêu đề là bắt buộc" : "Title is required") : null,
    owner:
      touched.owner && !form.owner ? (lang === "vi" ? "Vui lòng chọn người phụ trách" : "Owner is required") : null,
  };
  const handleCreate = () => {
    setTouched({ title: true, owner: true });
    if (!form.title || !form.owner || submitting) return;
    setSubmitting(true);
    const newIssue = {
      id: `ISS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
      pid: selProject,
      title: form.title,
      titleVi: form.titleVi || form.title,
      desc: form.desc,
      rootCause: form.rootCause,
      status: initialStatus,
      sev: form.sev,
      src: form.src,
      owner: form.owner,
      phase: form.phase,
      created: new Date().toISOString().split("T")[0],
      due: form.due || "",
      impacts: [],
      updates: [{ date: new Date().toISOString().split("T")[0], author: form.owner, text: "Issue created" }],
    };
    onCreate(newIssue);
  };

  const inputStyle = {
    background: "var(--bg-input)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    padding: "6px 10px",
    color: "var(--text-primary)",
    fontSize: 14,
    width: "100%",
    outline: "none",
    fontFamily: sans,
  };
  const selectStyle = { ...inputStyle, cursor: "pointer" };
  const labelStyle = {
    fontSize: 12,
    color: "var(--text-dim)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    display: "block",
    marginBottom: 3,
    fontWeight: 600,
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>{t.issue.title} (EN) *</label>
        <input
          style={{ ...inputStyle, borderColor: errors.title ? "#EF4444" : undefined }}
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          onBlur={() => setTouched((p) => ({ ...p, title: true }))}
          placeholder="Issue title in English..."
        />
        {errors.title && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 2 }}>{errors.title}</div>}
      </div>
      <div>
        <label style={labelStyle}>{t.issue.severity} *</label>
        <select style={selectStyle} value={form.sev} onChange={(e) => setForm((f) => ({ ...f, sev: e.target.value }))}>
          {SEV_LIST.map((s) => (
            <option key={s} value={s}>
              {t.severity[s]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label style={labelStyle}>{t.issue.source} *</label>
        <select style={selectStyle} value={form.src} onChange={(e) => setForm((f) => ({ ...f, src: e.target.value }))}>
          {SRC_LIST.map((s) => (
            <option key={s} value={s}>
              {t.source[s]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label style={labelStyle}>{t.issue.owner} *</label>
        <select
          style={{ ...selectStyle, borderColor: errors.owner ? "#EF4444" : undefined }}
          value={form.owner}
          onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
          onBlur={() => setTouched((p) => ({ ...p, owner: true }))}
        >
          <option value="">{lang === "vi" ? "Chọn..." : "Select..."}</option>
          {owners.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {errors.owner && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 2 }}>{errors.owner}</div>}
      </div>
      <div>
        <label style={labelStyle}>{t.issue.phase} *</label>
        <select
          style={selectStyle}
          value={form.phase}
          onChange={(e) => setForm((f) => ({ ...f, phase: e.target.value }))}
        >
          {PHASES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      {/* Toggle optional fields */}
      <div style={{ gridColumn: "1 / -1" }}>
        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          style={{
            background: "none",
            border: "none",
            color: "#3B82F6",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            padding: "4px 0",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontFamily: sans,
          }}
        >
          {showMore ? "▾" : "▸"}{" "}
          {showMore
            ? lang === "vi"
              ? "Ẩn chi tiết"
              : "Hide details"
            : lang === "vi"
              ? "Thêm chi tiết (mô tả, deadline...)"
              : "More details (description, deadline...)"}
        </button>
      </div>
      {showMore && (
        <>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>{t.issue.title} (VI)</label>
            <input
              style={inputStyle}
              value={form.titleVi}
              onChange={(e) => setForm((f) => ({ ...f, titleVi: e.target.value }))}
              placeholder="Tiêu đề tiếng Việt..."
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>{t.issue.description}</label>
            <textarea
              style={{ ...inputStyle, minHeight: 56, resize: "vertical" }}
              value={form.desc}
              onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
              placeholder={lang === "vi" ? "Mô tả chi tiết vấn đề..." : "Describe the issue in detail..."}
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>{t.issue.rootCause}</label>
            <input
              style={inputStyle}
              value={form.rootCause}
              onChange={(e) => setForm((f) => ({ ...f, rootCause: e.target.value }))}
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>{t.issue.dueDate}</label>
            <input
              type="date"
              style={inputStyle}
              value={form.due}
              onChange={(e) => setForm((f) => ({ ...f, due: e.target.value }))}
            />
          </div>
        </>
      )}
      <div style={{ gridColumn: "1 / -1", display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <Btn onClick={handleClose}>
          <X size={11} /> {t.cancel}
        </Btn>
        <Btn variant="primary" onClick={handleCreate} disabled={!form.title || !form.owner || submitting}>
          <Plus size={11} /> {submitting ? "..." : `${t.issue.create} (${initialStatus})`}
        </Btn>
      </div>
    </div>
  );
}
