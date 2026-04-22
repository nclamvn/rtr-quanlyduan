# Email Pipeline Setup

## Architecture

```
Dispatch Agent → INSERT into notifications table
                        ↓
                 pg_net trigger (migration 011)
                        ↓
                 send-email Edge Function
                        ↓
                 Resend API → recipient inbox
```

The dispatch agent does NOT call the Edge Function directly. It inserts a row into `notifications`, and the database trigger fires the function via `pg_net`.

## Prerequisites

1. **Resend account** — resend.com, free tier: 3,000 emails/month
2. **Verified sender domain** — rtrobotics.com (or rtr.vn)
3. **Supabase Edge Function runtime** — enabled on project
4. **pg_net extension** — enabled (migration 011 creates it)

## Setup Steps

### Step 1: Resend account + domain

1. Sign up at [resend.com](https://resend.com)
2. Go to Domains → Add Domain → `rtrobotics.com`
3. Add DNS records (DKIM, SPF, DMARC) as shown by Resend
4. Wait for verification (usually < 1 hour)
5. Create API key → copy it

### Step 2: Supabase secrets

Dashboard → Project Settings → Edge Functions → Secrets:

| Secret | Value |
|--------|-------|
| `RESEND_API_KEY` | `re_...` from Step 1 |
| `APP_URL` | `https://pm.rtrobotics.com` (or your deployed app URL) |

Note: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by Supabase runtime.

### Step 3: Deploy Edge Function

```bash
# Install Supabase CLI
npm install -g supabase

# Login + link project
supabase login
supabase link --project-ref <your-project-ref>

# Deploy send-email function
supabase functions deploy send-email --no-verify-jwt
```

The `--no-verify-jwt` flag is needed because the function is called by pg_net (server-side), not by a browser client.

### Step 4: Verify trigger exists

The trigger is created by migration 011. Verify it's active:

```sql
SELECT tgname, tgrelid::regclass, tgenabled
FROM pg_trigger
WHERE tgname = 'trg_send_email';
```

Expected: `tgname = trg_send_email`, `tgrelid = notifications`, `tgenabled = O` (enabled).

If missing, re-run migration 011 in SQL Editor.

### Step 5: Smoke test

```bash
export SUPABASE_URL=https://<project-ref>.supabase.co
export SUPABASE_SERVICE_KEY=<service-role-key>
./supabase/functions/send-email/smoke-test.sh your@email.com
```

Expected:
- HTTP 200 response (or 404 if user_id=null, which the smoke test uses — check logs)
- Email arrives within 30 seconds
- Log visible in Dashboard → Edge Functions → send-email → Logs

### Step 6: End-to-end test via notifications table

Insert a test notification directly:

```sql
INSERT INTO notifications (user_id, type, title, title_vi, body, entity_type, entity_id)
VALUES (
  '<your-user-uuid>',
  'alert_dispatch',
  '[Test] Control Tower Alert Pipeline',
  '[Test] Kiểm tra pipeline cảnh báo',
  'If you receive this email, the full pipeline works: notifications INSERT → pg_net trigger → send-email → Resend → inbox.',
  'alert',
  'test-001'
);
```

This tests the full pipeline including the pg_net trigger.

## How dispatch agent sends email

The dispatch agent's `emailAdapter.js` inserts into `notifications` with:
- `type: 'alert_dispatch'`
- `is_emailed: true` (tracking flag)
- `title`: formatted subject from `emailTemplate.js`
- `body`: Vietnamese alert summary with cascade, rationale, deadline

The pg_net trigger fires regardless of `is_emailed` flag — the Edge Function handles dedup via `email_preferences` table.

## Email preferences

Users can opt out of email per notification type via `email_preferences` table:

```sql
INSERT INTO email_preferences (user_id, event_type, email_enabled, frequency)
VALUES ('<user-uuid>', 'alert_dispatch', false, 'REALTIME');
```

- `email_enabled = false` → Edge Function skips sending
- `frequency = 'DIGEST'` → handled by `send-digest` function instead (daily)

## Cost

| Item | Free tier | Paid |
|------|-----------|------|
| Resend | 3,000 emails/month | $20/mo for 50K |
| Edge Function | 500K invocations/month | usage-based |

With 4 agents generating ~50 alerts/day, ~20% dispatched via email:
- **~300 emails/month** — well within free tier

## Troubleshooting

| Problem | Check |
|---------|-------|
| 401 on smoke test | Verify `SUPABASE_SERVICE_KEY` is service_role, not anon |
| 404 on function call | Run `supabase functions deploy send-email` |
| Email not arriving | Check Resend dashboard → Activity for failed sends |
| Trigger not firing | Run verify SQL from Step 4, check pg_net extension enabled |
| Double emails | Check `email_preferences` — default sends on all types |
| Edge Function timeout | Check Resend API status, increase function timeout if needed |
