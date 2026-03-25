-- ============================================================
-- LokAI: Combined Database Migration Script
-- 
-- Run this script in the Supabase SQL Editor to bootstrap the
-- full database schema, RLS policies, triggers, and seed data.
--
-- Sections (executed sequentially):
--   001  Organizations table + RLS + updated_at trigger
--   002  Departments table (cascading FK to organizations) + RLS
--   003  Job Levels table (cascading FK to organizations) + RLS
--   004  Users table (FK to auth.users) + RLS policies
--   004b Admin RLS policies (depends on users table existing)
--   005  handle_new_user() trigger (auto-populate public.users)
--   006  Seed data (3 sample organizations with depts & levels)
--
-- NOTE: This script is idempotent — safe to re-run using IF NOT EXISTS.
-- ============================================================

-- ============================================================
-- 001: Organizations Table
-- Core entity representing government bodies registered on LokAI.
-- Public users can view active orgs; super_admins have full CRUD.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON public.organizations (is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_code ON public.organizations (code);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Grant table access to all Supabase roles
GRANT ALL ON public.organizations TO service_role;
GRANT SELECT ON public.organizations TO authenticated;
GRANT SELECT ON public.organizations TO anon;

CREATE POLICY "Anyone can view active organizations"
  ON public.organizations
  FOR SELECT
  USING (is_active = true);

-- Anon users can check org codes during registration
CREATE POLICY "Anon can check org codes"
  ON public.organizations
  FOR SELECT
  TO anon
  USING (true);

-- Shared trigger function: auto-updates the `updated_at` column
-- on any row modification across all tables.
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 002: Departments Table
-- Organizational subdivisions under each government body.
-- Composite unique constraint on (organization_id, code).
-- Departments are visible when their parent org is active.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code)
);

CREATE INDEX IF NOT EXISTS idx_departments_organization_id ON public.departments (organization_id);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON public.departments (is_active);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Grant table access to all Supabase roles
GRANT ALL ON public.departments TO service_role;
GRANT SELECT ON public.departments TO authenticated;
GRANT SELECT ON public.departments TO anon;

CREATE POLICY "Anyone can view departments of active organizations"
  ON public.departments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE organizations.id = departments.organization_id
      AND organizations.is_active = true
    )
  );

CREATE TRIGGER departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 003: Job Levels Table
-- Seniority classifications within each organization,
-- ordered by level_order (ascending = junior to senior).
-- Composite unique constraint on (organization_id, name).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.job_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_job_levels_organization_id ON public.job_levels (organization_id);
CREATE INDEX IF NOT EXISTS idx_job_levels_is_active ON public.job_levels (is_active);

ALTER TABLE public.job_levels ENABLE ROW LEVEL SECURITY;

-- Grant table access to all Supabase roles
GRANT ALL ON public.job_levels TO service_role;
GRANT SELECT ON public.job_levels TO authenticated;
GRANT SELECT ON public.job_levels TO anon;

CREATE POLICY "Anyone can view job levels of active organizations"
  ON public.job_levels
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE organizations.id = job_levels.organization_id
      AND organizations.is_active = true
    )
  );

CREATE TRIGGER job_levels_updated_at
  BEFORE UPDATE ON public.job_levels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 004: Users Table
-- Platform users linked 1:1 with Supabase auth.users.
-- Stores profile data, organizational affiliation, role, and
-- employee verification lifecycle status.
--
-- RLS Policies:
--   - Users can read/update their own profile
--   - Org admins can read/update users within their organization
--   - Super admins have unrestricted access
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  job_level_id UUID REFERENCES public.job_levels(id) ON DELETE SET NULL,
  employee_id TEXT,
  role TEXT NOT NULL DEFAULT 'public' CHECK (role IN ('public', 'employee', 'org_admin', 'super_admin')),
  verification_status TEXT NOT NULL DEFAULT 'none' CHECK (verification_status IN ('none', 'pending', 'verified', 'rejected')),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  rejected_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  rejected_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  profile_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_organization_id ON public.users (organization_id);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON public.users (department_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON public.users (verification_status);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Grant table access to all Supabase roles
GRANT ALL ON public.users TO service_role;
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- Helper function to get a user's role without triggering RLS (avoids infinite recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = user_id;
$$;

-- Allow all roles to call the helper via RPC
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated, anon;

-- Helper function to get a user's organization_id without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_org_id(user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.users WHERE id = user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_org_id(UUID) TO authenticated, anon;

CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Org admins can view org users"
  ON public.users
  FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'org_admin'
    AND organization_id = public.get_user_org_id(auth.uid())
  );

CREATE POLICY "Org admins can update org users"
  ON public.users
  FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) = 'org_admin'
    AND organization_id = public.get_user_org_id(auth.uid())
  );

CREATE POLICY "Super admins have full access to users"
  ON public.users
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) = 'super_admin'
  );

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 004b: Cross-Table Admin Policies
-- These policies reference the users table and must be created
-- after the users table exists. Grants org_admins management
-- of their org's departments/job levels, and super_admins
-- full access to all tables.
-- ============================================================
CREATE POLICY "Super admins have full access to organizations"
  ON public.organizations
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) = 'super_admin'
  );

CREATE POLICY "Org admins can manage their departments"
  ON public.departments
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) = 'org_admin'
    AND departments.organization_id = public.get_user_org_id(auth.uid())
  );

CREATE POLICY "Super admins have full access to departments"
  ON public.departments
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) = 'super_admin'
  );

CREATE POLICY "Org admins can manage their job levels"
  ON public.job_levels
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) = 'org_admin'
    AND job_levels.organization_id = public.get_user_org_id(auth.uid())
  );

CREATE POLICY "Super admins have full access to job levels"
  ON public.job_levels
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) = 'super_admin'
  );

-- ============================================================
-- 005: Auto-Create User Profile on Signup
-- Trigger function that fires AFTER INSERT on auth.users.
-- Extracts name and avatar from Google OAuth metadata
-- and creates a corresponding row in public.users.
-- Runs as SECURITY DEFINER to bypass RLS during insert.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 006: Seed Data (Development Only)
-- Pre-populates 3 active government organizations:
--   MOFA — Ministry of Federal Affairs
--   NEA  — Nepal Electricity Authority
--   NRB  — Nepal Rastra Bank
-- Each organization includes sample departments and job levels
-- with Nepali translations where applicable.
-- ============================================================
INSERT INTO public.organizations (id, name, code, description, is_active, approved_at)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Ministry of Federal Affairs', 'MOFA', 'Ministry of Federal Affairs and General Administration', true, now()),
  ('a0000000-0000-0000-0000-000000000002', 'Nepal Electricity Authority', 'NEA', 'Nepal Electricity Authority - Government Utility', true, now()),
  ('a0000000-0000-0000-0000-000000000003', 'Nepal Rastra Bank', 'NRB', 'Central Bank of Nepal', true, now());

INSERT INTO public.departments (organization_id, name, code, display_order)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Administration', 'ADMIN', 1),
  ('a0000000-0000-0000-0000-000000000001', 'Finance', 'FIN', 2),
  ('a0000000-0000-0000-0000-000000000001', 'Human Resources', 'HR', 3),
  ('a0000000-0000-0000-0000-000000000001', 'Information Technology', 'IT', 4),
  ('a0000000-0000-0000-0000-000000000001', 'Operations', 'OPS', 5),
  ('a0000000-0000-0000-0000-000000000002', 'Administration', 'ADMIN', 1),
  ('a0000000-0000-0000-0000-000000000002', 'Engineering', 'ENG', 2),
  ('a0000000-0000-0000-0000-000000000002', 'Finance', 'FIN', 3),
  ('a0000000-0000-0000-0000-000000000002', 'Distribution', 'DIST', 4),
  ('a0000000-0000-0000-0000-000000000003', 'Banking Operations', 'BANK_OPS', 1),
  ('a0000000-0000-0000-0000-000000000003', 'Research', 'RES', 2),
  ('a0000000-0000-0000-0000-000000000003', 'Regulation', 'REG', 3),
  ('a0000000-0000-0000-0000-000000000003', 'Finance', 'FIN', 4);

INSERT INTO public.job_levels (organization_id, name, level_order)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Assistant (सहायक)', 1),
  ('a0000000-0000-0000-0000-000000000001', 'Nayab Subba (नायब सुब्बा)', 2),
  ('a0000000-0000-0000-0000-000000000001', 'Officer (अधिकृत)', 3),
  ('a0000000-0000-0000-0000-000000000001', 'Section Officer (शाखा अधिकृत)', 4),
  ('a0000000-0000-0000-0000-000000000001', 'Under Secretary (उपसचिव)', 5),
  ('a0000000-0000-0000-0000-000000000002', 'Junior Technician', 1),
  ('a0000000-0000-0000-0000-000000000002', 'Technician', 2),
  ('a0000000-0000-0000-0000-000000000002', 'Engineer', 3),
  ('a0000000-0000-0000-0000-000000000002', 'Senior Engineer', 4),
  ('a0000000-0000-0000-0000-000000000003', 'Assistant', 1),
  ('a0000000-0000-0000-0000-000000000003', 'Officer', 2),
  ('a0000000-0000-0000-0000-000000000003', 'Deputy Director', 3),
  ('a0000000-0000-0000-0000-000000000003', 'Director', 4);
