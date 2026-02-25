# RtR Control Tower — Handover Document

**Version**: 1.1.0
**Date**: 2026-02-25
**Status**: Frontend complete, Supabase backend integrated (mock auth)

---

## 1. Project Overview

**RtR Control Tower** is a drone program management dashboard for Real-time Robotics, built to track 5 drone projects across the CONCEPT > EVT > DVT > PVT > MP lifecycle.

| Metric | Value |
|--------|-------|
| Stack | Vite 7 + React 19 (SPA, no Next.js) |
| Bundle | 2.2MB dist, 456KB gzipped main chunk |
| Tabs | 10 (+6 sub-tabs) |
| Components | 11 files, ~3,500 lines |
| App.jsx | 1,871 lines |
| Hooks | 5 custom hooks |
| Services | 7 Supabase service files |
| RBAC | 4 roles, 16 permission methods |
| i18n | Vietnamese / English (LANG object) |
| Theme | Dark (default) / Light, persisted in localStorage |

---

## 2. Tech Stack

### Frontend
- **React 19** with Vite 7
- **Lucide React** — icons (no emoji)
- **Recharts 3** — dashboard charts
- **SheetJS (xlsx)** — import/export Excel
- **jsPDF + html2canvas** — PDF/slide export
- **Supabase JS v2** — client SDK

### Backend (Supabase)
- **PostgreSQL** — 18 tables with RLS policies
- **Edge Functions** — send-email, send-digest (Deno/TypeScript)
- **Row Level Security** — 30 policies across all tables

### Deployment
- **Vercel** — configured (vercel.json) but account suspended
- **Render** — alternative deployment target
- **GitHub** — https://github.com/nclamvn/rtr-quanlyduan

---

## 3. Architecture

```
src/
├── App.jsx                    # Main app, routing, all 10 tabs
├── index.css                  # CSS custom properties (dark/light)
├── main.jsx                   # Entry point
├── components/
│   ├── AIRiskPanel.jsx        # AI risk scoring engine
│   ├── BomModule.jsx          # BOM tree + cost summary
│   ├── DecisionsModule.jsx    # ADR cards, options/rationale
│   ├── EmailNotifications.jsx # 7 events, preferences, toast
│   ├── ExportEngine.jsx       # Excel/PDF/Executive Slides
│   ├── FlightTestModule.jsx   # Flight log, sensor bars, auto-issue
│   ├── GateRadar.jsx          # Phase gate radar chart
│   ├── ImportWizard.jsx       # 5-step import wizard
│   ├── IssueCharts.jsx        # Issue analytics charts
│   ├── LoginScreen.jsx        # Login with quick-demo buttons
│   └── SupplierModule.jsx     # Supplier cards + scorecard
├── contexts/
│   ├── AuditContext.jsx       # Audit logging (FIFO 500)
│   └── AuthContext.jsx        # Mock auth + Supabase auth ready
├── data/
│   └── v2Data.js              # Mock data (BOM, suppliers, flights, decisions)
├── hooks/
│   ├── useAppData.js          # App-level data management
│   ├── useFocusTrap.js        # A11y focus trap for modals
│   ├── usePermission.js       # RBAC permission checks (16 methods)
│   ├── useProjectData.js      # Project-scoped data
│   └── useRealtime.js         # Supabase realtime subscriptions
├── lib/
│   ├── supabase.js            # Supabase client init
│   └── useSupabase.js         # Supabase React hook
├── services/
│   ├── auditService.js        # Audit CRUD
│   ├── bomService.js          # BOM CRUD
│   ├── flightService.js       # Flight test CRUD
│   ├── issueService.js        # Issue CRUD
│   ├── notificationService.js # Notification CRUD
│   ├── projectService.js      # Project CRUD
│   └── supabaseService.js     # Base service utilities
└── utils/
    └── importExport.js        # SheetJS/jsPDF utilities

supabase/
├── migrations/                # 8 SQL migrations (001-008)
├── seed/                      # seed-all-data.sql, seed-after-auth.sql
└── functions/                 # send-email, send-digest edge functions
```

---

## 4. Authentication & RBAC

### Demo Users (Mock Auth)
| Name | Role | Email | Password |
|------|------|-------|----------|
| Quynh Anh | admin | quynh@rtr.vn | demo123 |
| Minh Tuan | pm | tuan@rtr.vn | demo123 |
| Duc Anh | engineer | duc@rtr.vn | demo123 |
| Le Huong | viewer | huong@rtr.vn | demo123 |

### Role Permissions
| Action | Admin | PM | Engineer | Viewer |
|--------|-------|----|----------|--------|
| Create Issue | Yes | Yes | Yes | No |
| Delete Issue | Yes | No | No | No |
| Edit BOM | Yes | Yes | No | No |
| Import Data | Yes | Yes | No | No |
| Export Data | Yes | Yes | Yes | Yes |
| View Audit Log | Yes | Yes | No | No |
| Manage Settings | Yes | No | No | No |
| Switch Roles | Yes | No | No | No |

---

## 5. Database Schema (Supabase)

### Tables (18)
| Table | Records | Description |
|-------|---------|-------------|
| projects | 5 | Drone projects (PRJ-001 to PRJ-005) |
| profiles | 0* | User profiles (linked to auth.users) |
| issues | 21 | Engineering issues |
| bom_parts | 53 | Bill of Materials |
| suppliers | 8 | Supplier companies |
| flight_tests | 18 | Flight test records |
| decisions | 10 | Architecture Decision Records |
| milestones | 25 | Phase milestones (5 per project) |
| gate_conditions | 135 | Phase gate conditions |
| delivery_records | 28 | Supplier deliveries |
| issue_updates | 46 | Issue history |
| issue_impacts | 19 | Issue cascade impacts |
| flight_anomalies | 12 | Flight anomalies |
| flight_attachments | 32 | Flight attachments |
| project_members | 0* | Team assignments |
| email_preferences | 0* | Notification settings |
| notifications | 0 | User notifications |
| audit_log | 0 | Audit trail |

*profiles, project_members, email_preferences require Auth users (run seed-after-auth.sql)

### Migrations
Run in order: `001_core_tables.sql` through `008_notification_triggers.sql`

All 8 migrations have been applied. Schema includes:
- 30 RLS policies
- 7 update triggers
- 3 functions (get_user_role, handle_new_user, update_updated_at)

---

## 6. Environment Variables

Copy `.env.example` to `.env.local`:

```env
VITE_SUPABASE_URL=https://ugcjikdlyktrkqgblsrw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key
```

For Edge Functions (set in Supabase Dashboard > Settings > Edge Functions > Secrets):
- `RESEND_API_KEY` — Resend email API key
- `APP_URL` — Production URL
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key

---

## 7. Development

```bash
# Install
npm install

# Dev server (port 5175)
npm run dev

# Build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

---

## 8. Sprint History

| Sprint | What | When |
|--------|------|------|
| Sprint 1 | 6 core tabs (Dashboard, Issues, Phase Gates, Impact Map, Team, Review) | Done |
| Sprint 2 | Auth (localStorage), RBAC (4 roles), Audit Log (FIFO 500) | Done |
| V2 Blueprint | BOM, Flight Test, Supplier, Decisions, Cross-Links (8 TIPs) | Done |
| V3 Blueprint | Import Wizard, Export Engine, Email Notifications, Settings (8 TIPs) | Done |
| RRI-UX Audit | 11 UX fixes (sticky headers, toast, escape key, tooltips) | Done |
| Mock Data | PRJ-002 enrichment (21 BOM, 5 flights, 5 issues, 8 deliveries) | Done |
| B1-B3 | Supabase backend + migrations + services + edge functions | Done |
| B4 | 26 TIPs: Permissions + Search + Persistence + A11y + UI Polish | Done |

---

## 9. Remaining Work

### Immediate (to complete Supabase integration)
1. **Create Auth users** — 15 users in Supabase Auth Dashboard
2. **Run seed-after-auth.sql** — Maps users to projects + email preferences
3. **Switch from mock auth to Supabase auth** — Toggle in AuthContext.jsx
4. **Set Edge Function secrets** — RESEND_API_KEY, APP_URL in Supabase Dashboard
5. **Deploy Edge Functions** — `supabase functions deploy send-email && supabase functions deploy send-digest`

### Deployment
- Fix Vercel billing OR deploy to Render/Netlify
- Set env vars on hosting platform
- Enable Supabase Realtime for live updates

### Future (V2)
- BOM versioning & change history
- Mobile responsive improvements
- Supplier portal (external access)
- AI risk predictions (ML model)
- E2E tests (Playwright)
- Code splitting for smaller bundles

---

## 10. Known Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| Recharts width/height warnings | Low | Initial render before container sized, harmless |
| Supabase 400 errors with mock auth | Expected | Will resolve when switching to real Supabase auth |
| Bundle 456KB gzipped | Medium | Consider code splitting for BOM/Flight/Export modules |
| No tests | Medium | Add Vitest unit tests + Playwright E2E |

---

## 11. Contacts

| Role | Name | Details |
|------|------|---------|
| GitHub | nclamvn | https://github.com/nclamvn/rtr-quanlyduan |
| Supabase Project | rtr-control-tower | Ref: ugcjikdlyktrkqgblsrw |

---

*Generated 2026-02-25. Co-authored by Claude Opus 4.6.*
