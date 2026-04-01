-- ═══════════════════════════════════════════════════════════
-- Migration 015: Issue Comments & @Mentions
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS issue_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT NOT NULL,
  author_role TEXT DEFAULT 'engineer',
  content TEXT NOT NULL,
  mentions TEXT[] DEFAULT '{}',
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup by issue
CREATE INDEX IF NOT EXISTS idx_issue_comments_issue_id ON issue_comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_created ON issue_comments(created_at DESC);

-- RLS: authenticated users can read all, write own
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comments" ON issue_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON issue_comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own comments" ON issue_comments
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Admins can delete any comment" ON issue_comments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = author_id
  );

-- Trigger: create notification when someone is @mentioned
CREATE OR REPLACE FUNCTION notify_on_mention()
RETURNS TRIGGER AS $$
DECLARE
  mentioned_name TEXT;
  mentioned_user RECORD;
BEGIN
  IF NEW.mentions IS NOT NULL AND array_length(NEW.mentions, 1) > 0 THEN
    FOREACH mentioned_name IN ARRAY NEW.mentions
    LOOP
      SELECT id INTO mentioned_user FROM profiles WHERE full_name = mentioned_name LIMIT 1;
      IF mentioned_user.id IS NOT NULL AND mentioned_user.id != NEW.author_id THEN
        INSERT INTO notifications (user_id, type, title, title_vi, reference_type, reference_id)
        VALUES (
          mentioned_user.id,
          'MENTION',
          NEW.author_name || ' mentioned you in ' || NEW.issue_id,
          NEW.author_name || ' đã nhắc đến bạn trong ' || NEW.issue_id,
          'issue',
          NEW.issue_id
        );
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_mention
  AFTER INSERT ON issue_comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_mention();
