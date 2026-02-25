-- ═══════════════════════════════════════════════════════════
-- MIGRATION 001: Core Tables
-- RtR Control Tower Database Schema
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────
-- 1. USERS / PROFILES
-- ──────────────────────────────────────────────
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  full_name_vi TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'pm', 'engineer', 'viewer')),
  avatar_initials TEXT,
  phone TEXT,
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'viewer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ──────────────────────────────────────────────
-- 2. PROJECTS
-- ──────────────────────────────────────────────
CREATE TABLE public.projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_vi TEXT,
  description TEXT,
  description_vi TEXT,
  phase TEXT NOT NULL CHECK (phase IN ('CONCEPT', 'EVT', 'DVT', 'PVT', 'MP')),
  phase_index INTEGER NOT NULL DEFAULT 0,
  phase_owner_id UUID REFERENCES public.profiles(id),
  phase_owner_name TEXT,
  start_date DATE,
  target_mp DATE,
  health TEXT CHECK (health IN ('ON_TRACK', 'AT_RISK', 'DELAYED', 'BLOCKED')) DEFAULT 'ON_TRACK',
  cascade_alerts INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- 3. PROJECT MILESTONES
-- ──────────────────────────────────────────────
CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('CONCEPT', 'EVT', 'DVT', 'PVT', 'MP')),
  target_date DATE,
  actual_date DATE,
  status TEXT CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'DONE', 'DELAYED')) DEFAULT 'PLANNED',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, phase)
);

-- ──────────────────────────────────────────────
-- 4. PROJECT TEAM ASSIGNMENTS
-- ──────────────────────────────────────────────
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_in_project TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);
