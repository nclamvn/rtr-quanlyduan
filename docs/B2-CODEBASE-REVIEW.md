# RtR Control Tower — Codebase Review for Sprint B2
## LocalStorage → Supabase Migration Analysis

**Date**: 2026-02-25 | **Reviewer**: Claude Code | **Status**: Ready for B2 Planning

---

## 1. ALL localStorage KEYS (4 keys, 4 files)

| Key | File | Read | Write | Delete | Migration Target |
|-----|------|------|-------|--------|------------------|
| `rtr_auth_user` | `src/contexts/AuthContext.jsx` | mount (L54) | login/switch (L77,87,102) | logout (L62,66,95) | Supabase Auth session |
| `rtr_audit_log` | `src/contexts/AuditContext.jsx` | init (L11) | every log (L20,24) | clearLogs (L96) | `audit_log` table |
| `rtr-theme` | `src/App.jsx` (L513) + `LoginScreen.jsx` (L50) | init | toggle (L520, L60) | — | Keep client-side (UI pref) |
| `rtr_email_prefs` | `src/components/EmailNotifications.jsx` (L80) | init | save (L89) | — | `email_preferences` table |

---

## 2. ALL MOCK DATA SOURCES

### 2a. PROJECTS — 5 projects (inline in App.jsx L156–177)
```
Structure: { id, name, desc, descVi, phase, phaseOwner, startDate, targetMP, milestones{}, gateChecks{} }
PRJ-001 (DVT), PRJ-002 (EVT), PRJ-003 (CONCEPT), PRJ-004 (PVT), PRJ-005 (EVT)
```
- `milestones` = nested object `{ CONCEPT: { target, actual, adjusted, status }, ... }`
- `gateChecks` = nested object `{ CONCEPT: { c1: true, c2: true }, ... }`
- **Target**: `projects` + `milestones` + `gate_conditions` tables

### 2b. ISSUES — 21 issues (inline in App.jsx L179–267)
```
Structure: { id, pid, title, titleVi, desc, rootCause, status, sev, src, owner, phase, created, due, impacts[], updates[] }
Distribution: PRJ-001 (6), PRJ-002 (5), PRJ-003 (3), PRJ-004 (4), PRJ-005 (3)
```
- `impacts[]` = embedded `{ phase, desc, descVi, days }`
- `updates[]` = embedded `{ date, author, text }`
- **Target**: `issues` + `issue_impacts` + `issue_updates` tables

### 2c. TEAM — 15 members (inline in App.jsx L269–285)
```
Structure: { name, role, projects[] }
```
- Linked by **name string** (not ID) — data integrity risk
- **Target**: Unified with `profiles` table

### 2d. NOTIFICATIONS — 15 notifications (inline in App.jsx L287–303)
```
Structure: { id, type, title, titleVi, ref, time, timeVi, read }
```
- `time` = human-readable string ("2h ago") — not real timestamp
- **Target**: `notifications` table with real `created_at`

### 2e. GATE_CONFIG — Static config (App.jsx L108–146)
```
Structure: { CONCEPT: { conditions: [{ id, label, label_vi, required, cat }] }, ... }
Total: 27 conditions (CONCEPT: 3, EVT: 5, DVT: 11, PVT: 5, MP: 3)
```
- **Target**: `gate_conditions` table (seed data)

### 2f. BOM — 48 parts (v2Data.js L128–209)
```
Structure: { id, projectId, parentId, level, partNumber, description, descriptionVi, category, quantity, unit, unitCost, currency, supplierId, leadTimeDays, lifecycleStatus, alternatePartIds[], designator }
Distribution: PRJ-001 (27), PRJ-002 (21)
```
- Self-referential tree via `parentId`
- **Target**: `bom_parts` table

### 2g. SUPPLIERS — 8 suppliers (v2Data.js L7–88)
```
Structure: { id, code, name, nameVi, country, contactName, contactEmail, contactPhone, website, partCategories[], qualityRating, deliveryOnTimeRate, totalOrders, lateDeliveries, defectRate, qualificationStatus, certifications[], lastAuditDate, nextAuditDate, paymentTerms, currency }
```
- **Target**: `suppliers` table

### 2h. DELIVERY RECORDS — 23 records (v2Data.js L91–124)
```
Structure: { id, supplierId, bomPartId, projectId, orderDate, promisedDate, actualDate, quantity, unitPrice, status, delayDays }
```
- **Target**: `delivery_records` table

### 2i. FLIGHT TESTS — 12 tests (v2Data.js L244–516)
```
Structure: { id, projectId, testNumber, date, location, locationVi, pilot, droneUnit, testType, testPhase, relatedGateCondition, result, duration, maxAltitude, maxSpeed, distanceCovered, sensorData{}, anomalies[], attachments[], notes, notesVi, autoIssueId, createdBy }
Distribution: PRJ-001 (7), PRJ-002 (5)
```
- `sensorData` = embedded `{ batteryStart, batteryEnd, batteryMinCell, maxCurrent, avgCurrent, maxVibration, gpsAccuracy, maxWind, ambientTemp }`
- `anomalies[]` = embedded `{ timestamp, description, descriptionVi, severity }`
- `attachments[]` = embedded `{ type, name }`
- **Target**: `flight_tests` + `flight_anomalies` + `flight_attachments` tables

### 2j. DECISIONS — 10 decisions (v2Data.js L522–end)
```
Structure: { id, projectId, title, titleVi, date, decisionMaker, phase, options[], chosenOption, rationale, rationaleVi, impactDescription, impactDescriptionVi, costImpact, linkedIssueIds[], linkedFlightTestIds[], linkedGateConditions[], status, createdBy }
```
- `options[]` = embedded `{ label, pros, prosVi, cons, consVi }`
- **Target**: `decisions` table (options as JSONB)

### 2k. DEMO_USERS — 4 users (AuthContext.jsx L4–41)
```
Structure: { id, email, password, name, role, avatar, projects[] }
Users: usr-001 (admin), usr-002 (pm), usr-003 (engineer), usr-004 (viewer)
Passwords: plaintext "demo123"
```
- **Target**: Supabase Auth + `profiles` table

---

## 3. STATE MANAGEMENT — useState in App.jsx

| Variable | Initial | Source | Migrate to Supabase? |
|----------|---------|--------|---------------------|
| `projects` | `PROJECTS` (5 items) | App.jsx inline | **YES** → `projects` table |
| `issues` | `ISSUES_DATA` (21 items) | App.jsx inline | **YES** → `issues` table |
| `notifications` | `NOTIFICATIONS_DATA` (15 items) | App.jsx inline | **YES** → `notifications` table |
| `theme` | localStorage `rtr-theme` | Client | No (keep client-side) |
| `lang` | `"vi"` | — | No (UI pref) |
| `tab`, `selProject`, `selIssue`, `filters`, `showNotif`, `showCreate`, `showUserMenu`, `auditFilter`, `bomSubTab`, `testSubTab`, `showImport`, `showExport`, `toast`, `selMetric`, `selProjMetric`, `issueSubTab` | various | — | No (UI state) |

### Critical Gap: v2Data.js exports are NOT in React state
`BOM_DATA`, `SUPPLIERS_DATA`, `FLIGHT_TESTS_DATA`, `DECISIONS_DATA`, `DELIVERY_RECORDS_DATA` are **static module-level constants** imported directly by child components. They have **no setter functions** — meaning:
- They are currently **read-only** in the UI
- To make them writable after migration, must lift into React state or context

---

## 4. AUTH SYSTEM

### Current Flow
```
LoginScreen → useAuth().login(email, password) → AuthContext
  → match against DEMO_USERS array (plaintext password)
  → setUser(userObj) + localStorage.setItem("rtr_auth_user")

On mount:
  → localStorage.getItem("rtr_auth_user") → validate vs DEMO_USERS → restore session

Logout:
  → setUser(null) + localStorage.removeItem("rtr_auth_user")

Quick Login:
  → quickLogin(userId) → find by ID only (no password)

Switch User (admin):
  → switchUser(userId) → same as quickLogin
```

### RBAC — usePermission.js
| Function | Roles Allowed |
|----------|--------------|
| `canCreateIssue()` | admin, pm, engineer |
| `canReviewIssue()` | admin, pm |
| `canEditIssue(issue)` | admin, pm; engineer if `issue.owner === user.name` |
| `canCloseIssue(issue)` | admin, pm; engineer if `issue.owner === user.name` |
| `canTransitionPhase()` | admin, pm |
| `canToggleGate()` | admin, pm, engineer |
| `canViewReviewQueue()` | admin, pm |
| `isReadOnly()` | viewer only |
| `getNewIssueStatus()` | admin/pm → `"OPEN"`, engineer → `"DRAFT"` |

**Migration note**: `canEditIssue` / `canCloseIssue` compare `issue.owner === user.name` (name-string, not ID)

---

## 5. ALL CRUD OPERATIONS

### Issues CRUD
| Op | Location | Method | Audit? |
|----|----------|--------|--------|
| **CREATE** | CreateIssueForm → `onCreate` callback (App.jsx L799, L1196) | `setIssues(prev => [newIssue, ...prev])` | Yes |
| **CREATE (auto)** | FlightTestModule → `onCreateAutoIssue` (App.jsx L1588–1604) | `setIssues(prev => [newIssue, ...prev])` | Yes |
| **CREATE (import)** | ImportWizard → `onImport` (App.jsx L1722–1729) | `setIssues(prev => [...imported, ...prev])` | Yes |
| **UPDATE STATUS** | `updateIssueStatus(id, newStatus)` (App.jsx L597–606) | `setIssues(prev => prev.map(...))` | Yes |
| **READ** | `filteredIssues` useMemo (App.jsx L541–547) | Filter by selProject + filters | — |
| **DELETE** | Not implemented | — | — |

### Gate CRUD
| Op | Location | Method | Audit? |
|----|----------|--------|--------|
| **TOGGLE** | `toggleGate(phase, condId)` (App.jsx L582–594) | `setProjects(prev => prev.map(...))` | Yes |

### Notifications CRUD
| Op | Location | Method |
|----|----------|--------|
| **MARK READ** | Notification dropdown (App.jsx L691) | `setNotifications(prev => prev.map(...))` |

### Audit Log CRUD
| Op | Location | Method |
|----|----------|--------|
| **CREATE** | `audit.log(...)` called in 8 places | AuditContext `setLogs([entry, ...prev].slice(0, 500))` |
| **CLEAR** | `audit.clearLogs()` (admin only) | `setLogs([])` + `localStorage.removeItem` |
| **EXPORT** | `audit.exportCSV()` | Generate CSV string |

### BOM / Flight Tests / Suppliers / Decisions
**Currently READ-ONLY** — no mutation paths exist. Data imported as static constants from `v2Data.js`.

---

## 6. DATA FLOW DIAGRAMS

### Issues Flow
```
ISSUES_DATA (inline) → useState → issues[]
                                    ↓
                          useMemo(filteredIssues) — filter by selProject + filters
                                    ↓
                          Issues tab: table render
                                    ↓
                     User action (create/update status)
                                    ↓
                     setIssues(prev => ...) + audit.log() + setToast()
                                    ↓
                          Re-render: filteredIssues recomputed
```

### v2Data.js Static Flow (no state mutation)
```
v2Data.js exports ──→ BomModule.jsx (useMemo filter by projectId)
                  ──→ FlightTestModule.jsx (useMemo filter)
                  ──→ SupplierModule.jsx (useMemo filter)
                  ──→ DecisionsModule.jsx (useMemo filter)
```

### Audit Log Flow
```
User action → audit.log(action, type, id, title, old, new)
                    ↓
            AuditContext: setLogs([entry, ...prev].slice(0, 500))
                    ↓
            useEffect: localStorage.setItem("rtr_audit_log", ...)
                    ↓
            Audit tab (admin): getLogs(filters) → render table
```

---

## 7. KEY FINDINGS & RISKS FOR B2

### 1. Name-based relationships (MUST FIX)
Several relationships use **name strings** instead of user IDs:
- `issues.owner` = `"Đức Anh"` (should be `owner_id` UUID)
- `TEAM[].name` not linked to `DEMO_USERS[].id`
- `flight_tests.pilot` = string name
- `decisions.decisionMaker` = string name
- `usePermission.canEditIssue` uses `issue.owner === user.name`

### 2. v2Data.js not in React state
BOM, Suppliers, Flight Tests, Decisions, Deliveries are static imports — no setter functions exist. Migration requires:
- Option A: Lift into App.jsx useState (adds ~5 new state vars)
- Option B: Create new Context providers (cleaner but more files)
- Option C: Use useSupabaseQuery hook directly in each module component

### 3. Embedded arrays need normalization
- `issues.impacts[]` → `issue_impacts` table
- `issues.updates[]` → `issue_updates` table
- `flight_tests.anomalies[]` → `flight_anomalies` table
- `flight_tests.attachments[]` → `flight_attachments` table
- `decisions.options[]` → JSONB column (OK) or `decision_options` table

### 4. Milestones & Gate Checks embedded in projects
- `projects.milestones{}` → `milestones` table (5 rows/project)
- `projects.gateChecks{}` → Use `gate_conditions.is_checked` field

### 5. Notifications use fake timestamps
- `time: "2h ago"` must become real `created_at TIMESTAMPTZ`

### 6. Supabase client scaffolding exists but unused
- `src/lib/supabase.js` and `src/lib/useSupabase.js` created but not imported anywhere

---

## 8. ESSENTIAL FILES FOR B2

| File | Lines | Role |
|------|-------|------|
| `src/App.jsx` | ~1300+ | ALL business logic, state, CRUD, component wiring |
| `src/data/v2Data.js` | ~600+ | BOM (48), Suppliers (8), Deliveries (23), Flights (12), Decisions (10) |
| `src/contexts/AuthContext.jsx` | ~110 | Mock auth, DEMO_USERS, localStorage session |
| `src/contexts/AuditContext.jsx` | ~100 | Audit log, localStorage persistence |
| `src/hooks/usePermission.js` | ~50 | RBAC rules (name-string matching) |
| `src/components/EmailNotifications.jsx` | ~300 | Email prefs, NotificationEngine class |
| `src/components/ImportWizard.jsx` | ~400 | Import flow that mutates issues state |
| `src/components/FlightTestModule.jsx` | ~300 | Auto-issue creation from flights |
| `src/components/BomModule.jsx` | ~250 | Static BOM_DATA import |
| `src/components/SupplierModule.jsx` | ~250 | Static SUPPLIERS_DATA import |
| `src/components/DecisionsModule.jsx` | ~200 | Static DECISIONS_DATA import |
| `src/lib/supabase.js` | 15 | Supabase client (scaffolded, unused) |
| `src/lib/useSupabase.js` | 55 | Query hook + auth hook (scaffolded, unused) |
| `src/components/LoginScreen.jsx` | ~150 | Login UI, theme toggle |

---

## 9. MIGRATION SUMMARY TABLE

| Data Source | Records | Current Storage | React State? | CRUD? | Supabase Table(s) |
|-------------|---------|----------------|-------------|-------|-------------------|
| Projects | 5 | App.jsx inline | `projects` state | Toggle gates | `projects` + `milestones` + `gate_conditions` |
| Issues | 21 | App.jsx inline | `issues` state | Create/Update | `issues` + `issue_impacts` + `issue_updates` |
| Team | 15 | App.jsx inline | No state | Read-only | `profiles` (unified with auth) |
| Notifications | 15 | App.jsx inline | `notifications` state | Mark read | `notifications` |
| Gate Config | 27 | App.jsx inline (static) | No state (in projects) | Toggle | `gate_conditions` |
| BOM Parts | 48 | v2Data.js | No state | Read-only | `bom_parts` |
| Suppliers | 8 | v2Data.js | No state | Read-only | `suppliers` |
| Deliveries | 23 | v2Data.js | No state | Read-only | `delivery_records` |
| Flight Tests | 12 | v2Data.js | No state | Read-only | `flight_tests` + `flight_anomalies` + `flight_attachments` |
| Decisions | 10 | v2Data.js | No state | Read-only | `decisions` |
| Audit Log | FIFO 500 | localStorage | AuditContext | Create/Clear | `audit_log` |
| Email Prefs | per user | localStorage | EmailNotifications | Save | `email_preferences` |
| Auth Users | 4 | AuthContext.jsx | AuthContext | Login/Logout | Supabase Auth + `profiles` |
| Theme | 1 | localStorage | useState | Toggle | Keep client-side |

**Total**: ~190 records across 13 data sources → 18 Supabase tables (already created in B1)
