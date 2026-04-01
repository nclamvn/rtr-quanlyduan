import { Badge, Btn, Section, NotifIcon, RoleIcon, Metric } from "./ui";
import { Flame, Zap } from "lucide-react";

export default {
  title: "UI/Core Components",
};

// ── Badge ──────────────────────────────────────────────────

export const Badges = () => (
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: 20 }}>
    <Badge label="CRITICAL" color="#EF4444" />
    <Badge label="HIGH" color="#F59E0B" />
    <Badge label="MEDIUM" color="#3B82F6" />
    <Badge label="LOW" color="#64748B" />
    <Badge label="OPEN" color="#EF4444" glow />
    <Badge label="CLOSED" color="#10B981" />
    <Badge label="With Icon" color="#8B5CF6" icon={Flame} />
    <Badge label="Large" color="#3B82F6" size="lg" />
  </div>
);

// ── Btn ────────────────────────────────────────────────────

export const Buttons = () => (
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: 20, alignItems: "center" }}>
    <Btn>Default</Btn>
    <Btn variant="primary">Primary</Btn>
    <Btn variant="danger">Danger</Btn>
    <Btn variant="success">Success</Btn>
    <Btn variant="ghost">Ghost</Btn>
    <Btn variant="primary" small>
      Small Primary
    </Btn>
    <Btn disabled>Disabled</Btn>
    <Btn variant="primary">
      <Zap size={12} /> With Icon
    </Btn>
  </div>
);

// ── Section ────────────────────────────────────────────────

export const Sections = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 20, maxWidth: 600 }}>
    <Section title="Basic Section">
      <p>This is the content inside a section.</p>
    </Section>
    <Section
      title="Section with Actions"
      actions={
        <>
          <Btn small>Edit</Btn>
          <Btn variant="danger" small>
            Delete
          </Btn>
        </>
      }
    >
      <p>Section content with action buttons in the header.</p>
    </Section>
    <Section>
      <p>Section without title.</p>
    </Section>
  </div>
);

// ── NotifIcon ──────────────────────────────────────────────

export const NotificationIcons = () => (
  <div style={{ display: "flex", gap: 16, padding: 20, alignItems: "center" }}>
    <div style={{ textAlign: "center" }}>
      <NotifIcon type="CRITICAL_ISSUE" />
      <div style={{ fontSize: 10, marginTop: 4 }}>Critical</div>
    </div>
    <div style={{ textAlign: "center" }}>
      <NotifIcon type="MILESTONE_IMPACT" />
      <div style={{ fontSize: 10, marginTop: 4 }}>Milestone</div>
    </div>
    <div style={{ textAlign: "center" }}>
      <NotifIcon type="OVERDUE_ISSUE" />
      <div style={{ fontSize: 10, marginTop: 4 }}>Overdue</div>
    </div>
    <div style={{ textAlign: "center" }}>
      <NotifIcon type="GATE_CHANGE" />
      <div style={{ fontSize: 10, marginTop: 4 }}>Default</div>
    </div>
  </div>
);

// ── RoleIcon ───────────────────────────────────────────────

export const RoleIcons = () => (
  <div style={{ display: "flex", gap: 16, padding: 20, alignItems: "center" }}>
    {["admin", "pm", "engineer", "viewer"].map((role) => (
      <div key={role} style={{ textAlign: "center" }}>
        <RoleIcon role={role} />
        <div style={{ fontSize: 10, marginTop: 4 }}>{role}</div>
      </div>
    ))}
  </div>
);
