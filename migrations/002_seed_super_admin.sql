-- ============================================================
-- 002: Seed Super Admin Account
--
-- Creates a platform super admin with email/password login.
--   Email:    admin@lokai.gov.np
--   Password: admin
--
-- Run this in the Supabase SQL Editor AFTER 000_run_all.sql
-- and 001_org_applications.sql.
--
-- The handle_new_user() trigger auto-creates the public.users
-- row, then we promote it to super_admin.
-- ============================================================

-- Clean up any partial data from previous attempts
DELETE FROM auth.identities
WHERE provider = 'email'
  AND user_id IN (SELECT id FROM auth.users WHERE email = 'admin@lokai.gov.np');

DELETE FROM public.users WHERE email = 'admin@lokai.gov.np';
DELETE FROM auth.users WHERE email = 'admin@lokai.gov.np';

-- Create the super admin via a DO block so we can reference the generated id
DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  -- Step 1: Insert into auth.users with all fields GoTrue expects
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at,
    is_super_admin,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at
  )
  VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@lokai.gov.np',
    crypt('admin', gen_salt('bf')),
    now(),              -- email_confirmed_at
    NULL,               -- invited_at
    '',                 -- confirmation_token
    NULL,               -- confirmation_sent_at
    '',                 -- recovery_token
    NULL,               -- recovery_sent_at
    '',                 -- email_change_token_new
    '',                 -- email_change
    NULL,               -- email_change_sent_at
    '',                 -- email_change_token_current
    0,                  -- email_change_confirm_status
    NULL,               -- banned_until
    '',                 -- reauthentication_token
    NULL,               -- reauthentication_sent_at
    false,              -- is_sso_user
    NULL,               -- deleted_at
    false,              -- is_super_admin
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Super Admin", "name": "Super Admin"}'::jsonb,
    now(),
    now(),
    NULL,               -- phone
    NULL,               -- phone_confirmed_at
    '',                 -- phone_change
    '',                 -- phone_change_token
    NULL                -- phone_change_sent_at
  );

  -- Step 2: Create identity record (required for email/password login)
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    new_user_id,
    new_user_id,
    jsonb_build_object(
      'sub', new_user_id::text,
      'email', 'admin@lokai.gov.np',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    new_user_id::text,
    now(),
    now(),
    now()
  );

  -- Step 3: Promote the public.users record to super_admin
  -- (The handle_new_user trigger already created the row)
  UPDATE public.users
  SET
    role = 'super_admin',
    full_name = 'Super Admin',
    profile_completed = true,
    verification_status = 'verified',
    verified_at = now()
  WHERE id = new_user_id;
END
$$;
