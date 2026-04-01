-- ═══════════════════════════════════════════════════════════
-- Migration 016: File Attachments
-- ═══════════════════════════════════════════════════════════

-- Storage bucket (run via Supabase Dashboard or CLI)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', true);

CREATE TABLE IF NOT EXISTS file_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL,        -- 'issue', 'flight_test', 'decision', 'comment'
  entity_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,       -- bytes
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,        -- path in Supabase Storage
  thumbnail_path TEXT,               -- optional thumbnail for images
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attachments_entity ON file_attachments(entity_type, entity_id);

ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read attachments" ON file_attachments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upload" ON file_attachments
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Owners and admins can delete" ON file_attachments
  FOR DELETE USING (
    auth.uid() = uploaded_by
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
