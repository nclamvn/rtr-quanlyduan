-- ═══════════════════════════════════════════════════════════
-- MIGRATION 011: Activate Email Dispatch
-- Enables pg_net trigger to call send-email Edge Function
-- on every new notification INSERT.
--
-- PREREQUISITES:
-- 1. Enable pg_net extension: Supabase Dashboard → Database → Extensions → pg_net
-- 2. Enable pg_cron extension: Supabase Dashboard → Database → Extensions → pg_cron
-- 3. Deploy Edge Functions: supabase functions deploy send-email
--                          supabase functions deploy send-digest
-- 4. Set secrets: supabase secrets set RESEND_API_KEY=re_xxxxxxxx
-- 5. Run this migration: supabase db push
-- ═══════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────
-- 1. Enable pg_net extension (HTTP calls from triggers)
-- ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ──────────────────────────────────────────────
-- 2. Email dispatch trigger
-- Calls send-email Edge Function on every new notification
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_send_email()
RETURNS TRIGGER AS $$
DECLARE
  edge_url TEXT;
  service_key TEXT;
BEGIN
  -- Get Supabase project URL from config
  edge_url := current_setting('app.settings.supabase_url', true);
  service_key := current_setting('app.settings.service_role_key', true);

  -- Fallback: use direct URL if settings not available
  IF edge_url IS NULL OR edge_url = '' THEN
    edge_url := 'https://' || current_setting('request.headers', true)::json->>'host';
  END IF;

  PERFORM net.http_post(
    url := COALESCE(edge_url, 'https://ugcjikdlyktrkqgblsrw.supabase.co') || '/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_key, current_setting('supabase.service_role_key', true))
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'notifications',
      'record', jsonb_build_object(
        'id', NEW.id,
        'user_id', NEW.user_id,
        'type', NEW.type,
        'title', NEW.title,
        'title_vi', NEW.title_vi,
        'body', NEW.body,
        'project_id', NEW.project_id,
        'entity_type', NEW.entity_type,
        'entity_id', NEW.entity_id
      )
    )
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Never block notification INSERT if email fails
    RAISE WARNING 'Email dispatch failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if exists, then create
DROP TRIGGER IF EXISTS trg_send_email ON public.notifications;
CREATE TRIGGER trg_send_email
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION trigger_send_email();

-- ──────────────────────────────────────────────
-- 3. Enable pg_cron for daily overdue check + digest
-- ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Daily overdue issue check at 01:00 UTC (08:00 ICT)
SELECT cron.schedule(
  'check-overdue-issues',
  '0 1 * * *',
  'SELECT check_overdue_issues()'
);

-- Daily digest email at 01:15 UTC (08:15 ICT) — gives 15 min for overdue notifs
SELECT cron.schedule(
  'send-digest-email',
  '15 1 * * *',
  $$SELECT net.http_post(
    url := 'https://ugcjikdlyktrkqgblsrw.supabase.co/functions/v1/send-digest',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('supabase.service_role_key') || '"}'::jsonb,
    body := '{}'::jsonb
  )$$
);

-- ──────────────────────────────────────────────
-- 4. Add notification cleanup (keep last 90 days)
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND is_read = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Weekly cleanup on Sunday 03:00 UTC
SELECT cron.schedule(
  'cleanup-notifications',
  '0 3 * * 0',
  'SELECT cleanup_old_notifications()'
);
