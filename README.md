# RtR Control Tower

Real-time project intelligence dashboard for Real-Time Robotics drone manufacturing operations. Provides phase-gate management, issue tracking, supply chain visibility, production monitoring, and an AI-powered SignalHub intelligence engine.

## Tech Stack

React 19 + Vite 7 SPA, backed by Supabase (auth, database, edge functions, realtime). Charts via Recharts, PDF/Excel export via jspdf + xlsx.

## Prerequisites

- Node.js 18+
- A Supabase project (free tier works for development)

## Quick Start

```bash
# Install dependencies
npm install

# Copy env template and fill in your Supabase credentials
cp .env.example .env.local

# Start dev server
npm run dev
```

The app runs at `http://localhost:5173` by default.

### Demo / Offline Mode

If Supabase credentials are missing or the connection fails, the app automatically falls back to offline mode with demo users and localStorage-backed data. No additional setup is required.

Demo accounts (available in offline mode):

| Role     | Access Level                          |
|----------|---------------------------------------|
| Admin    | Full access, all modules              |
| PM       | Project management, gates, decisions  |
| Engineer | Technical modules, flight testing     |
| Viewer   | Read-only across all modules          |

## Environment Variables

### Frontend (set in `.env.local`)

| Variable                 | Required | Description                           |
|--------------------------|----------|---------------------------------------|
| `VITE_SUPABASE_URL`     | Yes      | Supabase project URL                  |
| `VITE_SUPABASE_ANON_KEY`| Yes      | Supabase anonymous (public) key       |
| `VITE_APP_URL`           | No       | Frontend URL (for email templates)    |

### Backend Secrets (set in Supabase Dashboard → Edge Functions → Secrets)

| Variable                      | Description                        |
|-------------------------------|------------------------------------|
| `RESEND_API_KEY`              | Resend email service API key       |
| `SUPABASE_SERVICE_ROLE_KEY`   | Service role key for edge functions|
| `APP_URL`                     | Production frontend URL            |

## Key Modules

The app is organized into tabbed modules accessible from the main navigation:

- **Dashboard** — KPIs, project health metrics, real-time status
- **Phase Gates** — Gate readiness tracking, cascade alerts, phase transitions
- **Issues** — Issue tracking with impact mapping and trend charts
- **BOM & Suppliers** — Bill of Materials management, supplier performance
- **Flight Testing** — Test execution tracking with decision gates
- **Production** — Production orders, execution status, yield tracking
- **Inventory** — Stock levels, transactions, reorder alerts
- **Orders** — Customer orders, delivery tracking
- **Finance** — Invoices, cost summaries, financial overview
- **Decisions** — Decision log with discussion threads
- **Intelligence** — SignalHub engine: anomaly detection, convergence signals, project health index (PHI)

## Build & Deploy

```bash
# Production build
npm run build

# Output goes to dist/
```

### Vercel Deployment

A `vercel.json` is included with SPA routing and cache headers pre-configured. Connect the repo to Vercel and set the three `VITE_*` environment variables in the Vercel dashboard.

Build settings (auto-detected from vercel.json):

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

### Post-Deploy Checklist

1. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel env vars
2. Set `VITE_APP_URL` to the production domain
3. In Supabase Dashboard, add the production domain to Authentication → URL Configuration → Redirect URLs
4. Set edge function secrets (`RESEND_API_KEY`, `APP_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
5. Verify Supabase RLS policies are enabled on all tables
6. Test login flow and real-time subscriptions

## Internationalization

The app supports Vietnamese (vi) and English (en). Language is toggled from the settings panel and persisted per user.

## Project Structure

```
src/
├── App.jsx            # Main router & tab navigation
├── main.jsx           # Entry point with context providers
├── contexts/          # AuthContext, AuditContext
├── components/        # Module components (18 modules)
├── hooks/             # Data hooks (useAppData, useRealtime, etc.)
├── intelligence/      # SignalHub kernel & transformers
├── lib/               # Supabase client with offline fallback
├── utils/             # Import/export utilities
└── data/              # Static schemas & config
```
