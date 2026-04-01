import { useState } from "react";
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Circle, CircleDot, CheckCircle2, XCircle, Ban, User, Calendar, Flame, GripVertical } from "lucide-react";
import { Badge } from "./ui";
import { STATUS_COLORS, SEV_COLORS, mono, sans } from "../constants";

const STATUS_CONFIG = [
  { id: "DRAFT", label: "Draft", labelVi: "Nháp", Icon: Circle, color: "#94A3B8" },
  { id: "OPEN", label: "Open", labelVi: "Mở", Icon: CircleDot, color: "#EF4444" },
  { id: "IN_PROGRESS", label: "In Progress", labelVi: "Đang xử lý", Icon: CircleDot, color: "#F59E0B" },
  { id: "BLOCKED", label: "Blocked", labelVi: "Bị chặn", Icon: Ban, color: "#DC2626" },
  { id: "CLOSED", label: "Closed", labelVi: "Đóng", Icon: CheckCircle2, color: "#10B981" },
];

function KanbanCard({ issue, lang, onClick, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: issue.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group" onClick={() => onClick?.(issue)}>
      <div
        style={{
          background: "var(--bg-modal)",
          border: `1px solid ${isDragging ? SEV_COLORS[issue.sev] + "60" : "var(--border)"}`,
          borderLeft: `3px solid ${SEV_COLORS[issue.sev]}`,
          borderRadius: 6,
          padding: "10px 12px",
          cursor: "grab",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
      >
        {/* Drag handle + ID */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <span
            {...attributes}
            {...listeners}
            style={{ cursor: "grab", color: "var(--text-disabled)", display: "flex" }}
          >
            <GripVertical size={12} />
          </span>
          <Badge label={issue.id} color="#3B82F6" />
          <Badge label={issue.sev} color={SEV_COLORS[issue.sev]} />
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 6,
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {lang === "vi" ? issue.titleVi || issue.title : issue.title}
        </div>

        {/* Meta */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--text-faint)" }}>
          {issue.owner && (
            <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <User size={9} /> {issue.owner}
            </span>
          )}
          {issue.due && (
            <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Calendar size={9} /> {issue.due}
            </span>
          )}
          {issue.sev === "CRITICAL" && <Flame size={10} color="#EF4444" />}
        </div>

        {/* Phase badge */}
        {issue.phase && (
          <div style={{ marginTop: 6 }}>
            <Badge label={issue.phase} color={issue.phase === "DVT" ? "#3B82F6" : "#6B7280"} />
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({ status, issues, lang, onCardClick, activeId }) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id });
  const count = issues.length;
  const critCount = issues.filter((i) => i.sev === "CRITICAL").length;

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: 1,
        minWidth: 220,
        maxWidth: 300,
        display: "flex",
        flexDirection: "column",
        borderRadius: 8,
        background: isOver ? `${status.color}08` : "var(--bg-card)",
        border: `1px solid ${isOver ? status.color + "40" : "var(--border)"}`,
        transition: "background 0.2s, border-color 0.2s",
        overflow: "hidden",
      }}
    >
      {/* Column Header */}
      <div
        style={{
          padding: "10px 12px",
          borderBottom: `2px solid ${status.color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <status.Icon size={14} color={status.color} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: sans }}>
            {lang === "vi" ? status.labelVi : status.label}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {critCount > 0 && <Badge label={`${critCount}`} color="#EF4444" icon={Flame} />}
          <span
            style={{
              background: `${status.color}20`,
              color: status.color,
              borderRadius: 10,
              padding: "1px 7px",
              fontSize: 12,
              fontWeight: 800,
              fontFamily: mono,
            }}
          >
            {count}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div
        style={{
          padding: 8,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          overflowY: "auto",
          flex: 1,
          minHeight: 100,
          maxHeight: "calc(100vh - 320px)",
        }}
      >
        {issues.length === 0 && (
          <div style={{ padding: "20px 8px", textAlign: "center", fontSize: 12, color: "var(--text-disabled)" }}>
            {lang === "vi" ? "Kéo thẻ vào đây" : "Drop cards here"}
          </div>
        )}
        {issues.map((issue) => (
          <KanbanCard
            key={issue.id}
            issue={issue}
            lang={lang}
            onClick={onCardClick}
            isDragging={activeId === issue.id}
          />
        ))}
      </div>
    </div>
  );
}

export default function KanbanBoard({ issues, lang, onStatusChange, onCardClick }) {
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const activeIssue = activeId ? issues.find((i) => i.id === activeId) : null;

  const issuesByStatus = {};
  for (const s of STATUS_CONFIG) {
    issuesByStatus[s.id] = issues.filter((i) => i.status === s.id);
  }

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const issueId = active.id;
    const issue = issues.find((i) => i.id === issueId);
    if (!issue) return;

    // Determine target column
    let targetStatus = over.id;
    // If dropped on a card, find the column
    if (!STATUS_CONFIG.find((s) => s.id === targetStatus)) {
      const targetIssue = issues.find((i) => i.id === targetStatus);
      if (targetIssue) targetStatus = targetIssue.status;
    }

    if (issue.status !== targetStatus && STATUS_CONFIG.find((s) => s.id === targetStatus)) {
      onStatusChange?.(issueId, targetStatus);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          paddingBottom: 8,
          minHeight: 400,
        }}
      >
        {STATUS_CONFIG.map((status) => (
          <KanbanColumn
            key={status.id}
            status={status}
            issues={issuesByStatus[status.id] || []}
            lang={lang}
            onCardClick={onCardClick}
            activeId={activeId}
          />
        ))}
      </div>

      {/* Drag overlay — floating card */}
      <DragOverlay>
        {activeIssue ? (
          <div
            style={{
              background: "var(--bg-modal)",
              border: `2px solid ${SEV_COLORS[activeIssue.sev]}`,
              borderRadius: 6,
              padding: "10px 12px",
              boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
              width: 260,
              transform: "rotate(3deg)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <Badge label={activeIssue.id} color="#3B82F6" />
              <Badge label={activeIssue.sev} color={SEV_COLORS[activeIssue.sev]} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              {lang === "vi" ? activeIssue.titleVi || activeIssue.title : activeIssue.title}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
