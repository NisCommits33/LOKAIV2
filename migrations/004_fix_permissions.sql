-- ============================================================
-- 004: Fix Table Permissions
--
-- Grants proper PostgreSQL table-level permissions to the
-- service_role, authenticated, and anon roles. Required because
-- Supabase's ALTER DEFAULT PRIVILEGES may not cover tables
-- created before the defaults were applied.
--
-- Run this in the Supabase SQL Editor AFTER all previous migrations.
-- ============================================================

-- ============================================================
-- Grant service_role full access to all tables (used by admin API)
-- ============================================================
GRANT ALL ON public.organizations TO service_role;
GRANT ALL ON public.departments TO service_role;
GRANT ALL ON public.job_levels TO service_role;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.organization_applications TO service_role;

-- ============================================================
-- Grant authenticated users appropriate table access (RLS still enforced)
-- ============================================================
GRANT SELECT ON public.organizations TO authenticated;
GRANT SELECT ON public.departments TO authenticated;
GRANT SELECT ON public.job_levels TO authenticated;
GRANT SELECT, UPDATE ON public.users TO authenticated;
GRANT SELECT ON public.organization_applications TO authenticated;

-- ============================================================
-- Ensure anon has access for public registration flows
-- ============================================================
GRANT SELECT ON public.organizations TO anon;
GRANT SELECT ON public.departments TO anon;
GRANT SELECT ON public.job_levels TO anon;
GRANT SELECT, INSERT ON public.organization_applications TO anon;

-- ============================================================
-- Ensure all sequences are accessible (for INSERT with DEFAULT ids)
-- ============================================================
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ============================================================
-- Set default privileges for future tables (prevents this issue recurring)
-- ============================================================
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;
