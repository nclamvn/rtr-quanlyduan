-- ═══════════════════════════════════════════════════════════
-- Migration 019: Multi-tenant Architecture
-- Adds organization layer for tenant isolation
-- ═══════════════════════════════════════════════════════════

-- Organizations (tenants)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,            -- URL-friendly identifier
  logo_url TEXT,
  plan TEXT DEFAULT 'free',              -- 'free', 'pro', 'enterprise'
  max_projects INTEGER DEFAULT 3,
  max_members INTEGER DEFAULT 10,
  settings JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Org membership (many-to-many: users ↔ orgs)
CREATE TABLE IF NOT EXISTS org_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',   -- 'owner', 'admin', 'member', 'viewer'
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- Org invitations
CREATE TABLE IF NOT EXISTS org_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  token TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add org_id to existing tables (nullable for backward compat)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE issues ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_members_user ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_invitations_email ON org_invitations(email);
CREATE INDEX IF NOT EXISTS idx_org_invitations_token ON org_invitations(token);
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(org_id);
CREATE INDEX IF NOT EXISTS idx_issues_org ON issues(org_id);

-- RLS policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_invitations ENABLE ROW LEVEL SECURITY;

-- Users can see orgs they belong to
CREATE POLICY "Members can view their orgs" ON organizations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM org_members WHERE org_id = organizations.id AND user_id = auth.uid())
  );

-- Only owners/admins can update org
CREATE POLICY "Admins can update org" ON organizations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM org_members WHERE org_id = organizations.id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- Anyone can create an org (becomes owner)
CREATE POLICY "Anyone can create org" ON organizations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Members can see their memberships
CREATE POLICY "Members can view memberships" ON org_members
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

-- Org admins can manage members
CREATE POLICY "Admins can manage members" ON org_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM org_members om WHERE om.org_id = org_members.org_id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin'))
  );

-- Invitation policies
CREATE POLICY "Org admins can create invitations" ON org_invitations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM org_members WHERE org_id = org_invitations.org_id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "Anyone can read invitations by token" ON org_invitations
  FOR SELECT USING (true);

-- Seed a default org for existing data
INSERT INTO organizations (id, name, slug, plan, max_projects, max_members)
VALUES ('00000000-0000-0000-0000-000000000001', 'RtR Robotics', 'rtr-robotics', 'enterprise', 50, 100)
ON CONFLICT DO NOTHING;

-- Function: auto-add creator as owner
CREATE OR REPLACE FUNCTION auto_add_org_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO org_members (org_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_add_org_owner
  AFTER INSERT ON organizations
  FOR EACH ROW EXECUTE FUNCTION auto_add_org_owner();
