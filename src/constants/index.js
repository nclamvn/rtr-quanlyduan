// ═══ RtR Control Tower — Shared Constants ═══

export const PHASES = ["CONCEPT", "EVT", "DVT", "PVT", "MP"];
export const PHASE_COLORS = { CONCEPT: "#6B7280", EVT: "#F59E0B", DVT: "#3B82F6", PVT: "#8B5CF6", MP: "#10B981" };
export const STATUS_LIST = ["DRAFT", "OPEN", "IN_PROGRESS", "BLOCKED", "CLOSED"];
export const STATUS_COLORS = { DRAFT: "#94A3B8", OPEN: "#EF4444", IN_PROGRESS: "#F59E0B", BLOCKED: "#DC2626", CLOSED: "#10B981" };
export const SEV_LIST = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
export const SEV_COLORS = { CRITICAL: "#EF4444", HIGH: "#F59E0B", MEDIUM: "#3B82F6", LOW: "#64748B" };
export const SRC_LIST = ["INTERNAL", "EXTERNAL", "CROSS_TEAM"];
export const SRC_COLORS = { INTERNAL: "#8B5CF6", EXTERNAL: "#F97316", CROSS_TEAM: "#06B6D4" };

export const mono = "'JetBrains Mono', 'Fira Code', monospace";
export const sans = "'Outfit', 'Segoe UI', system-ui, sans-serif";

export { LANG } from './i18n';
