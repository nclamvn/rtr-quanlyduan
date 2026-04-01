// ═══════════════════════════════════════════════════════════
// RtR Control Tower — Shared Type Definitions
// ═══════════════════════════════════════════════════════════

export type Phase = "CONCEPT" | "EVT" | "DVT" | "PVT" | "MP";
export type Status = "DRAFT" | "OPEN" | "IN_PROGRESS" | "BLOCKED" | "CLOSED";
export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type Source = "INTERNAL" | "EXTERNAL" | "CROSS_TEAM";
export type UserRole = "admin" | "pm" | "engineer" | "viewer" | "guest";
export type Lang = "vi" | "en";
export type Theme = "dark" | "light";

export interface Impact {
  phase: Phase;
  days: number;
  desc: string;
  descVi: string;
}

export interface IssueUpdate {
  date: string;
  author: string;
  text: string;
}

export interface Issue {
  id: string;
  pid: string;
  title: string;
  titleVi: string;
  desc: string;
  rootCause: string;
  status: Status;
  sev: Severity;
  src: Source;
  owner: string;
  owner_id?: string;
  created_by?: string;
  phase: Phase;
  created: string;
  due: string;
  impacts: Impact[];
  updates: IssueUpdate[];
}

export interface GateCondition {
  id: string;
  label: string;
  label_vi: string;
  required: boolean;
  cat: string;
}

export interface GateConfig {
  conditions: GateCondition[];
}

export interface Milestone {
  target: string;
  actual?: string;
  adjusted?: string;
  status: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  descriptionVi?: string;
  phase: Phase;
  status: string;
  milestones: Record<Phase, Milestone>;
  gateChecks: Record<Phase, Record<string, boolean>>;
  _gateConfig?: Record<Phase, GateConfig>;
}

export interface GateProgress {
  total: number;
  passed: number;
  reqTotal: number;
  reqPassed: number;
  pct: number;
  canPass: boolean;
}

export interface TeamMember {
  name: string;
  role: UserRole;
  email?: string;
  avatar?: string;
  department?: string;
  projects: string[];
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  entityTitle: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  titleVi?: string;
  message?: string;
  read: boolean;
  createdAt: string;
  entityType?: string;
  entityId?: string;
}

export interface BomPart {
  id: string;
  projectId: string;
  parentId?: string;
  level: number;
  partNumber: string;
  description: string;
  descriptionVi?: string;
  category: string;
  quantity: number;
  unit: string;
  unitCost: number;
  currency: string;
  supplierId?: string;
  leadTimeDays?: number;
  lifecycleStatus?: string;
  sortOrder: number;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  nameVi?: string;
  country: string;
  contactName?: string;
  contactEmail?: string;
  qualityRating: number;
  deliveryOnTimeRate: number;
  qualificationStatus: "QUALIFIED" | "PROBATION";
}

export interface FlightTest {
  id: string;
  projectId: string;
  testNumber: number;
  date: string;
  location: string;
  locationVi?: string;
  pilot: string;
  droneUnit: string;
  testType: string;
  testPhase: Phase;
  result: "PASS" | "FAIL" | "PARTIAL";
  duration: number;
  anomalies: { timestamp: string; description: string; descriptionVi?: string; severity: string }[];
  attachments: { type: string; name: string }[];
  notes?: string;
  notesVi?: string;
  autoIssueId?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  projectId: string;
  status: string;
  priority: string;
  orderDate: string;
  totalAmount: number;
  paymentStatus: string;
  items: OrderItem[];
}

export interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ProductionOrder {
  id: string;
  woNumber: string;
  productName: string;
  quantity: number;
  status: string;
  priority: string;
  currentStation?: string;
  assignedTo?: string;
}

export interface InventoryItem {
  id: string;
  partNumber: string;
  partName: string;
  category: string;
  warehouse: string;
  quantityOnHand: number;
  quantityAvailable: number;
  minStock: number;
  stockStatus: "OK" | "LOW" | "CRITICAL";
  unitCost: number;
  totalValue: number;
}

export interface Permission {
  canCreateIssue: () => boolean;
  canReportProgress: () => boolean;
  canReviewIssue: () => boolean;
  canEditIssue: (issue: Issue) => boolean;
  canDeleteIssue: (issue: Issue) => boolean;
  canCloseIssue: (issue: Issue) => boolean;
  canEditBom: () => boolean;
  canEditSupplier: () => boolean;
  canEditDecisions: () => boolean;
  canEditFlightTest: () => boolean;
  canImport: () => boolean;
  canViewCost: () => boolean;
  canTransitionPhase: () => boolean;
  canToggleGate: () => boolean;
  canViewReviewQueue: () => boolean;
  isAdmin: () => boolean;
  isReadOnly: () => boolean;
  isGuest: () => boolean;
  getNewIssueStatus: () => Status;
}
