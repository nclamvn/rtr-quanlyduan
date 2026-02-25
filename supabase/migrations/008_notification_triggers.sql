-- ═══════════════════════════════════════════════════════════
-- MIGRATION 008: Notification Triggers
-- Auto-create notification rows on key events
-- ═══════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────
-- 1. CRITICAL_ISSUE_CREATED
-- Fires when a CRITICAL issue is inserted
-- Notifies all PM + Admin on the project
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_critical_issue()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.severity = 'CRITICAL' THEN
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

-- ──────────────────────────────────────────────
-- 2. FLIGHT_TEST_FAIL
-- Fires when a flight test with result = FAIL is inserted
-- Notifies all members on the project
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_flight_fail()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.result = 'FAIL' THEN
    INSERT INTO notifications (user_id, type, title, title_vi, project_id, entity_type, entity_id)
    SELECT
      pm.user_id,
      'FLIGHT_TEST_FAIL',
      'Flight test FAIL: ' || NEW.id,
      'Bay thử FAIL: ' || NEW.id,
      NEW.project_id,
      'flight_test',
      NEW.id
    FROM project_members pm
    WHERE pm.project_id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_flight_fail
  AFTER INSERT ON flight_tests
  FOR EACH ROW EXECUTE FUNCTION notify_flight_fail();

-- ──────────────────────────────────────────────
-- 3. CASCADE_DELAY_DETECTED
-- Fires when an issue impact with delay >= 2 weeks is inserted
-- Notifies PM + Admin on the project
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_cascade_delay()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id TEXT;
  v_issue_title TEXT;
BEGIN
  IF NEW.delay_weeks >= 2 THEN
    SELECT project_id, title INTO v_project_id, v_issue_title
    FROM issues WHERE id = NEW.issue_id;

    INSERT INTO notifications (user_id, type, title, title_vi, project_id, entity_type, entity_id)
    SELECT
      pm.user_id,
      'CASCADE_DELAY_DETECTED',
      'Cascade delay: ' || NEW.affected_phase || ' +' || NEW.delay_weeks || ' weeks (' || NEW.issue_id || ')',
      'Cascade delay: ' || NEW.affected_phase || ' +' || NEW.delay_weeks || ' tuần (' || NEW.issue_id || ')',
      v_project_id,
      'issue',
      NEW.issue_id
    FROM project_members pm
    JOIN profiles p ON p.id = pm.user_id
    WHERE pm.project_id = v_project_id
      AND p.role IN ('admin', 'pm');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_cascade_delay
  AFTER INSERT ON issue_impacts
  FOR EACH ROW EXECUTE FUNCTION notify_cascade_delay();

-- ──────────────────────────────────────────────
-- 4. ISSUE_ASSIGNED
-- Fires when an issue's owner_id changes to a non-null user
-- Notifies the newly assigned owner
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_issue_assigned()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.owner_id IS NOT NULL
     AND (OLD.owner_id IS NULL OR OLD.owner_id IS DISTINCT FROM NEW.owner_id) THEN
    INSERT INTO notifications (user_id, type, title, title_vi, project_id, entity_type, entity_id)
    VALUES (
      NEW.owner_id,
      'ISSUE_ASSIGNED',
      NEW.id || ' assigned to you: ' || NEW.title,
      NEW.id || ' giao cho bạn: ' || COALESCE(NEW.title_vi, NEW.title),
      NEW.project_id,
      'issue',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_issue_assigned
  AFTER UPDATE ON issues
  FOR EACH ROW EXECUTE FUNCTION notify_issue_assigned();

-- ──────────────────────────────────────────────
-- 5. PHASE_TRANSITION
-- Fires when a project's phase changes
-- Notifies all members on the project
-- ──────────────────────────────────────────────
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

CREATE TRIGGER trg_phase_transition
  AFTER UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION notify_phase_transition();

-- ──────────────────────────────────────────────
-- 6. DRAFT_PENDING_REVIEW
-- Fires when an issue with status = DRAFT is inserted
-- Notifies PM + Admin on the project
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_draft_review()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'DRAFT' THEN
    INSERT INTO notifications (user_id, type, title, title_vi, project_id, entity_type, entity_id)
    SELECT
      pm.user_id,
      'DRAFT_PENDING_REVIEW',
      'DRAFT pending review: ' || NEW.title,
      'DRAFT chờ duyệt: ' || COALESCE(NEW.title_vi, NEW.title),
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

CREATE TRIGGER trg_draft_review
  AFTER INSERT ON issues
  FOR EACH ROW EXECUTE FUNCTION notify_draft_review();

-- ──────────────────────────────────────────────
-- 7. ISSUE_OVERDUE — daily scan via pg_cron
-- Creates notifications for issues past due_date
-- Note: requires pg_cron extension enabled in Supabase Dashboard
-- If pg_cron is not available, run manually or via external cron
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_overdue_issues()
RETURNS void AS $$
BEGIN
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule daily at 01:00 UTC (08:00 ICT)
-- Uncomment after enabling pg_cron in Supabase Dashboard → Extensions
-- SELECT cron.schedule('check-overdue-issues', '0 1 * * *', 'SELECT check_overdue_issues()');

-- ──────────────────────────────────────────────
-- 8. Email dispatch trigger
-- Calls send-email Edge Function on every new notification
-- Uses pg_net extension for HTTP calls from triggers
-- Note: requires pg_net enabled in Supabase Dashboard → Extensions
-- ──────────────────────────────────────────────

-- Uncomment after setting up Edge Function + pg_net extension:
--
-- CREATE OR REPLACE FUNCTION trigger_send_email()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   PERFORM net.http_post(
--     url := 'https://ugcjikdlyktrkqgblsrw.supabase.co/functions/v1/send-email',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || current_setting('supabase.service_role_key')
--     ),
--     body := jsonb_build_object('record', row_to_json(NEW))
--   );
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
--
-- CREATE TRIGGER trg_send_email
--   AFTER INSERT ON notifications
--   FOR EACH ROW EXECUTE FUNCTION trigger_send_email();
