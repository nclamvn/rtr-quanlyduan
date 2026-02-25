# TIP Sprint B3 — Email + Deploy + Pilot

> **RtR Control Tower** | V1.1 Backend — Final Sprint
> Created: 2026-02-25 | Status: PLANNING

---

## Tổng quan

Sprint B3 là sprint cuối cùng của V1.1 Backend, hoàn thiện 3 trụ cột:

| Trụ cột | Mục tiêu | Tasks |
|---------|----------|-------|
| **EMAIL** | Gửi email thật qua Resend API | B3.1 — B3.5 |
| **DEPLOY** | Deploy lên Vercel production | B3.6 |
| **PILOT** | Tạo users + smoke test toàn bộ | B3.7 — B3.8 |

**Prerequisite**: Sprint B1 (schema) + B2 (CRUD + Realtime) đã hoàn thành.

---

## Tình trạng hiện tại

### Đã có (từ B1 + B2):
- 18 Supabase tables + RLS policies + migrations 001-007
- 7 service files (CRUD), hooks với Realtime subscriptions
- App.jsx hybrid online/offline, seed SQL 893 dòng (13 tables)
- `email_preferences` table + UI preferences panel
- `notifications` table + in-app notification bell
- 7 email events defined (`EMAIL_EVENTS` in `EmailNotifications.jsx`)
- `NotificationEngine` class (mock — chỉ console.log + toast)

### Chưa có:
- Supabase Edge Functions (chưa có thư mục `supabase/functions/`)
- Resend API integration (chưa có API key)
- DB triggers tạo notification rows tự động
- `vercel.json` / `.env.example` / deployment config
- 15 Auth users trong Supabase (B1.4 deferred)
- `project_members` + `notifications` seed (cần user UUIDs)

---

## B3.1 — Environment & Resend Setup

**Mục tiêu**: Cấu hình env vars cho email + deploy.

### Deliverables:

1. **Tạo `.env.example`**:
```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Resend (chỉ dùng trong Edge Function, KHÔNG expose ra client)
RESEND_API_KEY=re_...

# App
VITE_APP_URL=https://rtr-control.vercel.app
```

2. **Đăng ký Resend** (https://resend.com):
   - Free tier: 100 emails/day, 3000/month — đủ cho pilot
   - Tạo API key → lưu vào Supabase Dashboard → Project Settings → Edge Functions → Secrets
   - Domain verification: `rtr.vn` (hoặc dùng default `onboarding@resend.dev` cho pilot)

3. **Thêm Supabase secrets**:
```bash
# Trong Supabase Dashboard → Project Settings → Edge Functions → Secrets
RESEND_API_KEY=re_xxxxx
APP_URL=https://rtr-control.vercel.app
```

### Files:
| File | Action |
|------|--------|
| `.env.example` | CREATE |
| `.gitignore` | VERIFY `.env.local` đã ignored |

---

## B3.2 — Migration 008: Auto-Notification Triggers

**Mục tiêu**: Tạo DB triggers tự động INSERT vào `notifications` khi có events quan trọng.

### 7 Triggers (mapping 1:1 với `EMAIL_EVENTS`):

| Trigger | Table | Event | Notification Type |
|---------|-------|-------|-------------------|
| `trg_critical_issue` | `issues` | INSERT WHERE severity='CRITICAL' | `CRITICAL_ISSUE_CREATED` |
| `trg_flight_fail` | `flight_tests` | INSERT WHERE result='FAIL' | `FLIGHT_TEST_FAIL` |
| `trg_cascade_delay` | `issue_impacts` | INSERT WHERE delay_weeks >= 2 | `CASCADE_DELAY_DETECTED` |
| `trg_issue_assigned` | `issues` | UPDATE WHERE owner_id changed | `ISSUE_ASSIGNED` |
| `trg_phase_transition` | `projects` | UPDATE WHERE phase changed | `PHASE_TRANSITION` |
| `trg_issue_overdue` | — | pg_cron daily scan | `ISSUE_OVERDUE` |
| `trg_draft_review` | `issues` | INSERT WHERE status='DRAFT' | `DRAFT_PENDING_REVIEW` |

### Trigger logic mẫu (CRITICAL_ISSUE_CREATED):

```sql
CREATE OR REPLACE FUNCTION notify_critical_issue()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.severity = 'CRITICAL' THEN
    -- Notify all PM + Admin on this project
    INSERT INTO notifications (user_id, type, title, title_vi, project_id, entity_type, entity_id)
    SELECT
      pm.user_id,
      'CRITICAL_ISSUE_CREATED',
      'New CRITICAL: ' || NEW.title,
      'CRITICAL mới: ' || COALESCE(NEW.title_vi, NEW.title),
      NEW.project_id,
      'issue',
      NEW.id
    FROM project_members pm
    JOIN profiles p ON p.id = pm.user_id
    WHERE pm.project_id = NEW.project_id
      AND p.role IN ('admin', 'pm');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_critical_issue
  AFTER INSERT ON issues
  FOR EACH ROW EXECUTE FUNCTION notify_critical_issue();
```

### PHASE_TRANSITION trigger:
```sql
CREATE OR REPLACE FUNCTION notify_phase_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.phase IS DISTINCT FROM NEW.phase THEN
    INSERT INTO notifications (user_id, type, title, title_vi, project_id, entity_type, entity_id)
    SELECT
      pm.user_id,
      'PHASE_TRANSITION',
      NEW.name || ': ' || OLD.phase || ' → ' || NEW.phase,
      NEW.name || ': ' || OLD.phase || ' → ' || NEW.phase,
      NEW.id,
      'project',
      NEW.id
    FROM project_members pm
    WHERE pm.project_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### ISSUE_OVERDUE (pg_cron — chạy mỗi ngày 8:00 HCM):
```sql
-- Cần enable pg_cron extension trong Supabase Dashboard
SELECT cron.schedule(
  'check-overdue-issues',
  '0 1 * * *',  -- 01:00 UTC = 08:00 ICT
  $$
    INSERT INTO notifications (user_id, type, title, title_vi, project_id, entity_type, entity_id)
    SELECT
      i.owner_id,
      'ISSUE_OVERDUE',
      i.id || ' overdue by ' || (CURRENT_DATE - i.due_date) || ' days',
      i.id || ' quá hạn ' || (CURRENT_DATE - i.due_date) || ' ngày',
      i.project_id,
      'issue',
      i.id
    FROM issues i
    WHERE i.status NOT IN ('CLOSED', 'DRAFT')
      AND i.due_date < CURRENT_DATE
      AND i.owner_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.entity_id = i.id
          AND n.type = 'ISSUE_OVERDUE'
          AND n.created_at > CURRENT_DATE - INTERVAL '1 day'
      );
  $$
);
```

### File:
| File | Action |
|------|--------|
| `supabase/migrations/008_notification_triggers.sql` | CREATE |

---

## B3.3 — Edge Function: `send-email`

**Mục tiêu**: Khi notification row được INSERT, gọi Resend API gửi email realtime.

### Architecture:
```
[DB Trigger] → INSERT notifications row
  → [Supabase Webhook / DB Trigger] → invoke Edge Function
    → [send-email Edge Function] → check email_preferences
      → [Resend API] → send email
      → UPDATE notifications SET is_emailed = true
```

### Implementation:

```
supabase/functions/send-email/index.ts
```

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL") || "https://rtr-control.vercel.app";

serve(async (req) => {
  const { record } = await req.json(); // notification row from webhook

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 1. Check user email preferences
  const { data: prefs } = await supabase
    .from("email_preferences")
    .select("*")
    .eq("user_id", record.user_id)
    .eq("event_type", record.type)
    .single();

  // Skip if email disabled or frequency = DIGEST
  if (prefs && (!prefs.email_enabled || prefs.frequency === "DIGEST")) {
    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  }

  // 2. Get user email
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", record.user_id)
    .single();

  if (!profile?.email) {
    return new Response(JSON.stringify({ error: "No email" }), { status: 400 });
  }

  // 3. Send via Resend
  const emailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "RtR Control Tower <noreply@rtr.vn>",
      to: [profile.email],
      subject: `[RtR] ${record.title}`,
      html: buildEmailHtml(record, profile, APP_URL),
    }),
  });

  // 4. Mark as emailed
  if (emailRes.ok) {
    await supabase
      .from("notifications")
      .update({ is_emailed: true })
      .eq("id", record.id);
  }

  return new Response(JSON.stringify({ sent: emailRes.ok }), { status: 200 });
});

function buildEmailHtml(notif, profile, appUrl) {
  const typeColors = {
    CRITICAL_ISSUE_CREATED: "#EF4444",
    FLIGHT_TEST_FAIL: "#EF4444",
    CASCADE_DELAY_DETECTED: "#F59E0B",
    ISSUE_ASSIGNED: "#3B82F6",
    PHASE_TRANSITION: "#8B5CF6",
    ISSUE_OVERDUE: "#F97316",
    DRAFT_PENDING_REVIEW: "#6B7280",
  };
  const color = typeColors[notif.type] || "#3B82F6";
  const entityUrl = notif.entity_id
    ? `${appUrl}?ref=${notif.entity_id}`
    : appUrl;

  return `
    <div style="font-family:'Outfit',sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      <div style="background:${color};color:white;padding:12px 16px;border-radius:8px 8px 0 0;font-weight:600;">
        RtR Control Tower
      </div>
      <div style="border:1px solid #e5e7eb;border-top:none;padding:20px;border-radius:0 0 8px 8px;">
        <p style="margin:0 0 8px;">Xin chào <strong>${profile.full_name}</strong>,</p>
        <p style="margin:0 0 16px;font-size:15px;">${notif.title_vi || notif.title}</p>
        ${notif.body ? `<p style="color:#6b7280;font-size:13px;">${notif.body}</p>` : ""}
        <a href="${entityUrl}"
           style="display:inline-block;background:${color};color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:500;">
          Xem chi tiết
        </a>
      </div>
      <p style="color:#9ca3af;font-size:11px;text-align:center;margin-top:16px;">
        RtR Control Tower — Quản lý dự án Drone
      </p>
    </div>
  `;
}
```

### Webhook setup:
- Supabase Dashboard → Database → Webhooks
- Table: `notifications`, Event: `INSERT`
- URL: Edge Function URL for `send-email`
- Hoặc dùng `pg_net` extension (call HTTP from trigger):

```sql
-- Thay vì webhook, dùng pg_net gọi trực tiếp từ trigger
CREATE OR REPLACE FUNCTION trigger_send_email()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := current_setting('app.settings.edge_function_url') || '/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('record', row_to_json(NEW))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_send_email
  AFTER INSERT ON notifications
  FOR EACH ROW EXECUTE FUNCTION trigger_send_email();
```

### Files:
| File | Action |
|------|--------|
| `supabase/functions/send-email/index.ts` | CREATE |

---

## B3.4 — Edge Function: `send-digest`

**Mục tiêu**: Gom digest emails hàng ngày, gửi 1 email tổng hợp lúc 8:00 sáng ICT.

### Logic:
1. pg_cron trigger lúc 01:00 UTC (08:00 ICT)
2. Query notifications WHERE `is_emailed = false` AND user preference = `DIGEST`
3. Group by user_id
4. Render 1 digest email per user
5. Send via Resend, mark all as `is_emailed = true`

### Implementation:

```
supabase/functions/send-digest/index.ts
```

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
  const APP_URL = Deno.env.get("APP_URL") || "https://rtr-control.vercel.app";

  // 1. Get unsent DIGEST notifications
  const { data: unsent } = await supabase
    .from("notifications")
    .select("*, profiles!notifications_user_id_fkey(email, full_name)")
    .eq("is_emailed", false)
    .order("created_at", { ascending: false });

  if (!unsent?.length) {
    return new Response(JSON.stringify({ message: "No digest items" }));
  }

  // 2. Filter to DIGEST-preference users only
  const { data: digestPrefs } = await supabase
    .from("email_preferences")
    .select("user_id, event_type")
    .eq("frequency", "DIGEST")
    .eq("email_enabled", true);

  const digestSet = new Set(
    (digestPrefs || []).map((p) => `${p.user_id}:${p.event_type}`)
  );

  // 3. Group by user
  const byUser = {};
  const notifIds = [];
  for (const n of unsent) {
    if (!digestSet.has(`${n.user_id}:${n.type}`)) continue;
    if (!byUser[n.user_id]) {
      byUser[n.user_id] = {
        email: n.profiles?.email,
        name: n.profiles?.full_name,
        items: [],
      };
    }
    byUser[n.user_id].items.push(n);
    notifIds.push(n.id);
  }

  // 4. Send one digest email per user
  let sent = 0;
  for (const [userId, data] of Object.entries(byUser)) {
    if (!data.email || !data.items.length) continue;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "RtR Control Tower <noreply@rtr.vn>",
        to: [data.email],
        subject: `[RtR] Tổng hợp ${data.items.length} thông báo`,
        html: buildDigestHtml(data, APP_URL),
      }),
    });
    sent++;
  }

  // 5. Mark all as emailed
  if (notifIds.length) {
    await supabase
      .from("notifications")
      .update({ is_emailed: true })
      .in("id", notifIds);
  }

  return new Response(JSON.stringify({ sent, notifIds: notifIds.length }));
});

function buildDigestHtml(data, appUrl) {
  const rows = data.items
    .map((n) => `<tr>
      <td style="padding:8px;border-bottom:1px solid #f3f4f6;">
        <strong>${n.title_vi || n.title}</strong>
        <br/><span style="color:#9ca3af;font-size:12px;">
          ${new Date(n.created_at).toLocaleString("vi-VN")}
        </span>
      </td>
    </tr>`)
    .join("");

  return `
    <div style="font-family:'Outfit',sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      <div style="background:#1E293B;color:white;padding:12px 16px;border-radius:8px 8px 0 0;">
        RtR Daily Digest — ${data.items.length} thông báo
      </div>
      <div style="border:1px solid #e5e7eb;border-top:none;padding:20px;border-radius:0 0 8px 8px;">
        <p>Xin chào <strong>${data.name}</strong>,</p>
        <table style="width:100%;border-collapse:collapse;">${rows}</table>
        <div style="margin-top:16px;">
          <a href="${appUrl}" style="display:inline-block;background:#3B82F6;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">
            Mở Control Tower
          </a>
        </div>
      </div>
    </div>
  `;
}
```

### pg_cron schedule:
```sql
-- Thêm vào migration 008
SELECT cron.schedule(
  'daily-digest',
  '0 1 * * *',  -- 01:00 UTC = 08:00 ICT
  $$
    SELECT net.http_post(
      url := 'https://ugcjikdlyktrkqgblsrw.supabase.co/functions/v1/send-digest',
      headers := '{"Authorization": "Bearer <service-role-key>"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);
```

### Files:
| File | Action |
|------|--------|
| `supabase/functions/send-digest/index.ts` | CREATE |

---

## B3.5 — Wire NotificationEngine to Real Backend

**Mục tiêu**: Thay mock `console.log` bằng real notification creation → triggers → email.

### Changes:

**`src/components/EmailNotifications.jsx`** — Update `NotificationEngine.notify()`:
```javascript
// BEFORE (mock):
notify(eventType, data) {
  console.log(`[EMAIL MOCK] ${eventType}`, data);
  this._showToast(eventType, data);
}

// AFTER (real):
async notify(eventType, data, { userId, projectId } = {}) {
  // 1. In-app toast (always)
  this._showToast(eventType, data);

  // 2. Create notification row → triggers handle email sending
  if (isSupabaseConnected() && userId) {
    const event = EMAIL_EVENTS.find(e => e.id === eventType);
    await supabase.from('notifications').insert({
      user_id: userId,
      type: eventType,
      title: data.title || event?.label,
      title_vi: data.titleVi || event?.labelVi,
      body: data.body || null,
      project_id: projectId || data.projectId || null,
      entity_type: data.entityType || null,
      entity_id: data.entityId || null,
    });
  }
}
```

**`src/App.jsx`** — Update all `notificationEngine.notify()` calls to pass `userId` + `projectId`:
- Issue creation: `notificationEngine.notify('CRITICAL_ISSUE_CREATED', {...}, { userId: currentUser.id, projectId })`
- Flight test fail: `notificationEngine.notify('FLIGHT_TEST_FAIL', {...}, { userId: currentUser.id, projectId })`
- Cascade delay: `notificationEngine.notify('CASCADE_DELAY_DETECTED', {...}, { userId: currentUser.id, projectId })`

### Files:
| File | Action |
|------|--------|
| `src/components/EmailNotifications.jsx` | MODIFY — `notify()` method |
| `src/App.jsx` | MODIFY — all `notificationEngine.notify()` call sites |

---

## B3.6 — Vercel Deployment

**Mục tiêu**: Deploy frontend lên Vercel với SPA routing + env vars.

### Deliverables:

1. **`vercel.json`**:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

2. **Environment Variables** (Vercel Dashboard → Settings → Env Vars):
```
VITE_SUPABASE_URL       = https://ugcjikdlyktrkqgblsrw.supabase.co
VITE_SUPABASE_ANON_KEY  = eyJ...
VITE_APP_URL            = https://rtr-control.vercel.app
```

3. **Deploy steps**:
```bash
# Install Vercel CLI
npm i -g vercel

# Link project
cd /Users/mac/rtr-quanlyduan/rtr-app
vercel link

# Deploy preview
vercel

# Deploy production
vercel --prod
```

4. **Custom domain** (optional):
   - `rtr-control.vercel.app` (default)
   - Hoặc `control.rtr.vn` nếu có DNS access

5. **`package.json`** — thêm script tiện ích:
```json
{
  "scripts": {
    "deploy": "vercel --prod",
    "deploy:preview": "vercel"
  }
}
```

### Files:
| File | Action |
|------|--------|
| `vercel.json` | CREATE |
| `package.json` | MODIFY — thêm deploy scripts |

---

## B3.7 — Create Auth Users + Seed Remaining Data

**Mục tiêu**: Tạo 15 Supabase Auth users + seed `project_members` + `notifications`.

### 15 Users (đã define trong migration 007):

| # | Email | Role | Name |
|---|-------|------|------|
| 1 | quynhanh@rtr.vn | admin | Quỳnh Anh |
| 2 | minhtuan@rtr.vn | pm | Minh Tuấn |
| 3 | thutrang@rtr.vn | pm | Thu Trang |
| 4 | hongphuc@rtr.vn | pm | Hồng Phúc |
| 5 | ducanh@rtr.vn | engineer | Đức Anh |
| 6 | thanhha@rtr.vn | engineer | Thanh Hà |
| 7 | minhkhoa@rtr.vn | engineer | Minh Khoa |
| 8 | thiphuong@rtr.vn | engineer | Thị Phương |
| 9 | hainam@rtr.vn | engineer | Hải Nam |
| 10 | dinhtoan@rtr.vn | engineer | Đình Toàn |
| 11 | hoangson@rtr.vn | engineer | Hoàng Sơn |
| 12 | quocviet@rtr.vn | engineer | Quốc Việt |
| 13 | vanhung@rtr.vn | engineer | Văn Hùng |
| 14 | lehuong@rtr.vn | viewer | Lệ Hương |
| 15 | thanhmai@rtr.vn | viewer | Thanh Mai |

**Password cho tất cả**: `RtR2026!pilot` (thay đổi sau pilot)

### Cách tạo:

**Option A** — Supabase Dashboard (thủ công):
- Dashboard → Authentication → Users → Create User × 15
- Sau đó chạy migration 007 để set roles/departments

**Option B** — Script dùng Admin API (tự động):
```bash
# supabase/scripts/create-users.sh
SUPABASE_URL="https://ugcjikdlyktrkqgblsrw.supabase.co"
SERVICE_KEY="eyJ..." # service_role key

USERS=(
  "quynhanh@rtr.vn:Quỳnh Anh"
  "minhtuan@rtr.vn:Minh Tuấn"
  "thutrang@rtr.vn:Phạm Thu Trang"
  # ... 12 more
)

for entry in "${USERS[@]}"; do
  EMAIL="${entry%%:*}"
  NAME="${entry##*:}"
  curl -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"${EMAIL}\",
      \"password\": \"RtR2026!pilot\",
      \"email_confirm\": true,
      \"user_metadata\": { \"full_name\": \"${NAME}\" }
    }"
done
```

### Seed remaining data:

**`supabase/seed/seed-after-auth.sql`** — chạy SAU KHI tạo users:

```sql
-- ═══════════════════════════════════════════════════════════
-- Seed data that requires auth.users UUIDs
-- Run AFTER creating 15 users + running migration 007
-- ═══════════════════════════════════════════════════════════

-- 1. PROJECT_MEMBERS
-- Map email → profiles.id dynamically
INSERT INTO project_members (project_id, user_id, role_in_project)
SELECT 'PRJ-001', id, 'lead' FROM profiles WHERE email = 'minhtuan@rtr.vn'
UNION ALL
SELECT 'PRJ-001', id, 'member' FROM profiles WHERE email = 'ducanh@rtr.vn'
UNION ALL
SELECT 'PRJ-001', id, 'member' FROM profiles WHERE email = 'thanhha@rtr.vn'
UNION ALL
SELECT 'PRJ-001', id, 'member' FROM profiles WHERE email = 'vanhung@rtr.vn'
UNION ALL
SELECT 'PRJ-001', id, 'member' FROM profiles WHERE email = 'dinhtoan@rtr.vn'
UNION ALL
SELECT 'PRJ-001', id, 'admin' FROM profiles WHERE email = 'quynhanh@rtr.vn'
UNION ALL
-- PRJ-002
SELECT 'PRJ-002', id, 'lead' FROM profiles WHERE email = 'hongphuc@rtr.vn'
UNION ALL
SELECT 'PRJ-002', id, 'member' FROM profiles WHERE email = 'vanhung@rtr.vn'
UNION ALL
SELECT 'PRJ-002', id, 'member' FROM profiles WHERE email = 'hoangson@rtr.vn'
UNION ALL
SELECT 'PRJ-002', id, 'admin' FROM profiles WHERE email = 'quynhanh@rtr.vn'
UNION ALL
-- PRJ-003
SELECT 'PRJ-003', id, 'lead' FROM profiles WHERE email = 'quynhanh@rtr.vn'
UNION ALL
SELECT 'PRJ-003', id, 'member' FROM profiles WHERE email = 'minhkhoa@rtr.vn'
UNION ALL
SELECT 'PRJ-003', id, 'member' FROM profiles WHERE email = 'hainam@rtr.vn'
UNION ALL
SELECT 'PRJ-003', id, 'member' FROM profiles WHERE email = 'quocviet@rtr.vn'
UNION ALL
-- PRJ-004
SELECT 'PRJ-004', id, 'lead' FROM profiles WHERE email = 'thutrang@rtr.vn'
UNION ALL
SELECT 'PRJ-004', id, 'member' FROM profiles WHERE email = 'thiphuong@rtr.vn'
UNION ALL
SELECT 'PRJ-004', id, 'member' FROM profiles WHERE email = 'dinhtoan@rtr.vn'
UNION ALL
-- PRJ-005
SELECT 'PRJ-005', id, 'lead' FROM profiles WHERE email = 'thutrang@rtr.vn'
UNION ALL
SELECT 'PRJ-005', id, 'member' FROM profiles WHERE email = 'minhkhoa@rtr.vn'
UNION ALL
SELECT 'PRJ-005', id, 'member' FROM profiles WHERE email = 'hoangson@rtr.vn'
-- Viewers: all projects
UNION ALL
SELECT p.id, pr.id, 'viewer'
FROM profiles pr, projects p
WHERE pr.email IN ('lehuong@rtr.vn', 'thanhmai@rtr.vn')
ON CONFLICT (project_id, user_id) DO NOTHING;

-- 2. SAMPLE NOTIFICATIONS (15 records for pilot testing)
INSERT INTO notifications (user_id, type, title, title_vi, project_id, entity_type, entity_id, is_read, created_at)
-- Quỳnh Anh (admin) gets critical alerts
SELECT id, 'CRITICAL_ISSUE_CREATED', 'New CRITICAL: ESC CAN bus timeout', 'CRITICAL mới: ESC CAN bus timeout', 'PRJ-001', 'issue', 'ISS-004', false, '2026-02-25 08:00:00+07'
FROM profiles WHERE email = 'quynhanh@rtr.vn'
UNION ALL
SELECT id, 'CRITICAL_ISSUE_CREATED', 'ISS-017: IP67 seal failure (PRJ-004)', 'ISS-017: Lỗi seal IP67 (PRJ-004)', 'PRJ-004', 'issue', 'ISS-017', false, '2026-02-21 10:00:00+07'
FROM profiles WHERE email = 'quynhanh@rtr.vn'
UNION ALL
-- Minh Tuấn (pm PRJ-001) gets project updates
SELECT id, 'CASCADE_DELAY_DETECTED', 'DVT milestone shifted +2 weeks (PRJ-001)', 'DVT milestone dịch +2 tuần (PRJ-001)', 'PRJ-001', 'project', 'PRJ-001', false, '2026-02-25 05:00:00+07'
FROM profiles WHERE email = 'minhtuan@rtr.vn'
UNION ALL
SELECT id, 'PHASE_TRANSITION', 'PRJ-004: DVT → PVT completed', 'PRJ-004: DVT → PVT hoàn thành', 'PRJ-004', 'project', 'PRJ-004', true, '2026-01-11 10:00:00+07'
FROM profiles WHERE email = 'minhtuan@rtr.vn'
UNION ALL
-- Đức Anh (engineer) gets issue assignments
SELECT id, 'ISSUE_ASSIGNED', 'ISS-004 assigned to you', 'ISS-004 giao cho bạn', 'PRJ-001', 'issue', 'ISS-004', false, '2026-02-18 09:00:00+07'
FROM profiles WHERE email = 'ducanh@rtr.vn'
UNION ALL
SELECT id, 'ISSUE_OVERDUE', 'ISS-001 overdue by 3 days', 'ISS-001 quá hạn 3 ngày', 'PRJ-001', 'issue', 'ISS-001', true, '2026-02-24 10:00:00+07'
FROM profiles WHERE email = 'ducanh@rtr.vn'
ON CONFLICT DO NOTHING;

-- 3. Update issue owner_id (link issues to real users)
UPDATE issues SET owner_id = (SELECT id FROM profiles WHERE email = 'ducanh@rtr.vn') WHERE owner_name IN ('Đức Anh');
UPDATE issues SET owner_id = (SELECT id FROM profiles WHERE email = 'thanhha@rtr.vn') WHERE owner_name IN ('Thanh Hà');
UPDATE issues SET owner_id = (SELECT id FROM profiles WHERE email = 'vanhung@rtr.vn') WHERE owner_name IN ('Văn Hùng');
UPDATE issues SET owner_id = (SELECT id FROM profiles WHERE email = 'hongphuc@rtr.vn') WHERE owner_name IN ('Hồng Phúc');
UPDATE issues SET owner_id = (SELECT id FROM profiles WHERE email = 'thiphuong@rtr.vn') WHERE owner_name IN ('Lê Thị Phương');
UPDATE issues SET owner_id = (SELECT id FROM profiles WHERE email = 'dinhtoan@rtr.vn') WHERE owner_name IN ('Vũ Đình Toàn');
UPDATE issues SET owner_id = (SELECT id FROM profiles WHERE email = 'hoangson@rtr.vn') WHERE owner_name IN ('Đỗ Hoàng Sơn');
UPDATE issues SET owner_id = (SELECT id FROM profiles WHERE email = 'minhkhoa@rtr.vn') WHERE owner_name IN ('Trần Minh Khoa');
UPDATE issues SET owner_id = (SELECT id FROM profiles WHERE email = 'quocviet@rtr.vn') WHERE owner_name IN ('Bùi Quốc Việt');
UPDATE issues SET owner_id = (SELECT id FROM profiles WHERE email = 'hainam@rtr.vn') WHERE owner_name IN ('Nguyễn Hải Nam');

-- Verify
SELECT 'project_members' AS "table", COUNT(*) FROM project_members
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'issues_with_owner', COUNT(*) FROM issues WHERE owner_id IS NOT NULL;
```

### Files:
| File | Action |
|------|--------|
| `supabase/seed/seed-after-auth.sql` | CREATE |
| `supabase/scripts/create-users.sh` | CREATE (optional) |

---

## B3.8 — Pilot Smoke Test

**Mục tiêu**: Chạy qua toàn bộ 10 tabs, verify mọi chức năng hoạt động end-to-end.

### Smoke Test Checklist:

#### Phase 1: Auth
- [ ] Login bằng `quynhanh@rtr.vn` (admin) — Supabase Auth
- [ ] Login bằng `ducanh@rtr.vn` (engineer) — verify RBAC
- [ ] Login bằng `lehuong@rtr.vn` (viewer) — verify read-only
- [ ] Logout + re-login — session persistence
- [ ] Switch user (admin feature)

#### Phase 2: Dashboard (Tab 1)
- [ ] 5 projects load từ Supabase
- [ ] Phase badges + health status hiển thị đúng
- [ ] Click project → detail panel
- [ ] Milestone dates match seed data

#### Phase 3: Issues (Tab 2)
- [ ] 21 issues load với đúng status/severity
- [ ] Filter by status, severity, project
- [ ] Create new issue → verify xuất hiện trong DB
- [ ] Update issue status → verify realtime (mở 2 tabs)
- [ ] Issue impacts + updates hiển thị đúng

#### Phase 4: Phase Gates (Tab 3)
- [ ] Gate conditions load per project per phase
- [ ] Toggle gate checkbox → verify DB update + realtime sync
- [ ] Gate progress bar tính đúng %
- [ ] RBAC: viewer không toggle được

#### Phase 5: V2 Modules (Tabs 4-7)
- [ ] BOM tab: 53 parts tree, cost summary, lifecycle badges
- [ ] Flight Test tab: 18 tests, sensor bars, anomaly list
- [ ] Supplier tab: 8 suppliers, scorecard, delivery records
- [ ] Decisions tab: 10 ADR cards, options/rationale

#### Phase 6: Impact Map (Tab 8)
- [ ] Cascade delays visualize correctly
- [ ] Cross-project links if any

#### Phase 7: Team (Tab 9)
- [ ] Team members display (from project_members)
- [ ] Role badges, department info

#### Phase 8: Settings (Tab 10)
- [ ] Email preferences panel
- [ ] Toggle email/in-app per event type
- [ ] Save preferences → verify `email_preferences` table
- [ ] Audit log displays recent actions
- [ ] Theme toggle (dark/light)
- [ ] Language toggle (Vi/En)

#### Phase 9: Email
- [ ] Create CRITICAL issue → email arrives (Resend)
- [ ] Assign issue → verify DIGEST queue
- [ ] Wait for digest cron → verify digest email
- [ ] Check `notifications.is_emailed = true` after send

#### Phase 10: Cross-cutting
- [ ] Realtime: open 2 browser tabs, change in one → reflects in other
- [ ] Audit log: verify all CRUD actions logged
- [ ] Export: Excel/PDF export still works
- [ ] Notification bell: badge count, click to mark read
- [ ] Mobile responsive: check on phone viewport
- [ ] Error handling: disconnect Supabase → app falls back to offline

### Bug Fix Protocol:
1. Mỗi bug → tạo issue ngay (ISS-BUG-xxx)
2. Fix → verify → close
3. Target: 0 critical, 0 high bugs tồn đọng

---

## Timeline ước tính

| Task | Phụ thuộc | Độ phức tạp |
|------|-----------|-------------|
| B3.1 Env setup | — | Low |
| B3.2 DB triggers | B3.1 | Medium |
| B3.3 send-email Edge Function | B3.1, B3.2 | Medium |
| B3.4 send-digest Edge Function | B3.3 | Medium |
| B3.5 Wire NotificationEngine | B3.3 | Low |
| B3.6 Vercel deploy | B3.1 | Low |
| B3.7 Auth users + seed | B3.6 | Medium |
| B3.8 Smoke test | ALL | Variable |

### Dependency graph:
```
B3.1 ──┬── B3.2 ──── B3.3 ──── B3.4
       │                │
       │                └── B3.5
       │
       └── B3.6 ──── B3.7 ──── B3.8
```

---

## Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Resend free tier limit (100/day) | Pilot chỉ 15 users, max ~50 emails/day | OK cho pilot. Upgrade nếu cần. |
| pg_cron not available | Digest emails won't auto-send | Dùng external cron (Vercel cron / GitHub Actions) |
| `pg_net` extension disabled | Trigger → Edge Function fails | Dùng Database Webhook thay thế |
| Edge Function cold start | First email delayed 2-5s | Acceptable cho async notification |
| Domain verification (Resend) | Emails go to spam | Dùng `onboarding@resend.dev` cho pilot |
| RLS blocks trigger INSERTs | Notifications not created | Triggers dùng `SECURITY DEFINER` |

---

## Kết quả sau B3

- Production URL: `https://rtr-control.vercel.app`
- 15 real users with Supabase Auth
- 7 email event types gửi thật qua Resend
- Daily digest email lúc 8:00 ICT
- 10 tabs hoạt động end-to-end với Supabase backend
- Offline fallback vẫn hoạt động khi mất kết nối
- V1.1 Backend: **COMPLETE**
