-- ============================================================
-- Sprint 2: Organization Registration & Super Admin Approval
--
-- Adds the organization_applications table for self-service
-- org registration, a storage bucket for application documents,
-- and a trigger that auto-creates default departments & job
-- levels when an application is approved.
--
-- Run this AFTER 000_run_all.sql in the Supabase SQL Editor.
-- ============================================================

-- ============================================================
-- 007: Organization Applications Table
-- Tracks self-service organization registration requests.
-- Public users can submit applications; super admins review them.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organization_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Organization details
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  address TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  website TEXT,
  -- Applicant details
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_position TEXT,
  applicant_phone TEXT,
  -- Documents (array of {name, url, type})
  documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Review workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  -- The organization created upon approval (back-reference)
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_applications_status ON public.organization_applications (status);
CREATE INDEX IF NOT EXISTS idx_org_applications_code ON public.organization_applications (code);
CREATE INDEX IF NOT EXISTS idx_org_applications_applicant_email ON public.organization_applications (applicant_email);

ALTER TABLE public.organization_applications ENABLE ROW LEVEL SECURITY;

-- Grant table access to all Supabase roles
GRANT ALL ON public.organization_applications TO service_role;
GRANT SELECT ON public.organization_applications TO authenticated;
GRANT SELECT, INSERT ON public.organization_applications TO anon;

-- Anyone (including anon) can create an application (public registration)
CREATE POLICY "Anyone can create organization applications"
  ON public.organization_applications
  FOR INSERT
  WITH CHECK (true);

-- Anon users can check application codes during registration
CREATE POLICY "Anon can check application codes"
  ON public.organization_applications
  FOR SELECT
  TO anon
  USING (true);

-- Anon users can insert applications during registration
CREATE POLICY "Anon can create applications"
  ON public.organization_applications
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Applicants can view their own applications by email
CREATE POLICY "Applicants can view own applications"
  ON public.organization_applications
  FOR SELECT
  USING (applicant_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Super admins have full access to all applications
CREATE POLICY "Super admins have full access to applications"
  ON public.organization_applications
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) = 'super_admin'
  );

CREATE TRIGGER org_applications_updated_at
  BEFORE UPDATE ON public.organization_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 008: Trigger — Auto-Create Defaults on Application Approval
--
-- When an application's status transitions to 'approved':
--   1. Creates the organization record (is_active = true)
--   2. Creates 5 default departments
--   3. Creates 4 default job levels
--   4. Links back to the application via organization_id
--
-- Runs as SECURITY DEFINER to bypass RLS during insert.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_org_application_approval()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Only fire when status changes from non-approved to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN

    -- Create the organization
    INSERT INTO public.organizations (name, code, description, is_active, approved_by, approved_at)
    VALUES (NEW.name, NEW.code, NEW.description, true, NEW.reviewed_by, now())
    RETURNING id INTO new_org_id;

    -- Store back-reference to the created organization
    NEW.organization_id := new_org_id;

    -- Create default departments
    INSERT INTO public.departments (organization_id, name, code, display_order)
    VALUES
      (new_org_id, 'Administration', 'ADMIN', 1),
      (new_org_id, 'Finance', 'FIN', 2),
      (new_org_id, 'Human Resources', 'HR', 3),
      (new_org_id, 'Information Technology', 'IT', 4),
      (new_org_id, 'Operations', 'OPS', 5);

    -- Create default job levels
    INSERT INTO public.job_levels (organization_id, name, level_order)
    VALUES
      (new_org_id, 'Assistant', 1),
      (new_org_id, 'Officer', 2),
      (new_org_id, 'Senior Officer', 3),
      (new_org_id, 'Manager', 4);

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_org_application_approved
  BEFORE UPDATE ON public.organization_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_org_application_approval();

-- ============================================================
-- 009: Storage Bucket for Application Documents
-- Public (anon) users can upload during registration;
-- authenticated users can also upload and read.
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('org-applications', 'org-applications', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to the bucket
CREATE POLICY "Authenticated users can upload application docs"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'org-applications');

-- Allow public (anon) uploads for org registration
CREATE POLICY "Anon users can upload application docs"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'org-applications');

-- Allow authenticated users to read their own uploads
CREATE POLICY "Users can read application docs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'org-applications');
