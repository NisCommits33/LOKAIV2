-- ============================================================
-- 003: Admin RPC Functions
--
-- SECURITY DEFINER functions for super admin operations.
-- These bypass RLS while enforcing role checks internally.
--
-- Run this AFTER 000_run_all.sql and 001_org_applications.sql
-- in the Supabase SQL Editor.
-- ============================================================

-- Fetch all organization applications (super_admin only)
CREATE OR REPLACE FUNCTION get_organization_applications_admin()
RETURNS SETOF organization_applications
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT role FROM users WHERE id = auth.uid()) != 'super_admin' THEN
    RAISE EXCEPTION 'Forbidden: super_admin role required';
  END IF;
  RETURN QUERY SELECT * FROM organization_applications ORDER BY created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_organization_applications_admin() TO authenticated;

-- Count stats for the super admin dashboard
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  IF (SELECT role FROM users WHERE id = auth.uid()) != 'super_admin' THEN
    RAISE EXCEPTION 'Forbidden: super_admin role required';
  END IF;

  SELECT json_build_object(
    'totalOrganizations', (SELECT count(*) FROM organizations),
    'totalUsers', (SELECT count(*) FROM users),
    'pendingApplications', (SELECT count(*) FROM organization_applications WHERE status = 'pending'),
    'approvedApplications', (SELECT count(*) FROM organization_applications WHERE status = 'approved'),
    'rejectedApplications', (SELECT count(*) FROM organization_applications WHERE status = 'rejected')
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO authenticated;
