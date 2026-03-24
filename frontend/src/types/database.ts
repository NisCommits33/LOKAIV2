/**
 * database.ts
 *
 * TypeScript type definitions mirroring the Supabase PostgreSQL schema.
 * These types ensure end-to-end type safety between the database and the frontend.
 *
 * NOTE: These will be replaced by auto-generated types via `supabase gen types`
 * once the project is connected to a live Supabase instance.
 *
 * @module types/database
 */

/** Available user roles — determines access level throughout the platform */
export type UserRole = "public" | "employee" | "org_admin" | "super_admin";

/** Tracks the employee verification lifecycle */
export type VerificationStatus = "none" | "pending" | "verified" | "rejected";

/** Tracks the organization application review lifecycle */
export type ApplicationStatus = "pending" | "approved" | "rejected";

/**
 * Root Database interface for Supabase client.
 * Defines Row, Insert, and Update shapes for each table,
 * enabling typed queries via `supabase.from('table').*`.
 */
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: Omit<Organization, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Organization, "id" | "created_at">>;
      };
      departments: {
        Row: Department;
        Insert: Omit<Department, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Department, "id" | "created_at">>;
      };
      job_levels: {
        Row: JobLevel;
        Insert: Omit<JobLevel, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<JobLevel, "id" | "created_at">>;
      };
      users: {
        Row: User;
        Insert: Omit<User, "created_at" | "updated_at">;
        Update: Partial<Omit<User, "id" | "created_at">>;
      };
      organization_applications: {
        Row: OrganizationApplication;
        Insert: Omit<OrganizationApplication, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<OrganizationApplication, "id" | "created_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

/** Government organization registered on the platform (e.g., MOFA, NEA, NRB) */
export interface Organization {
  id: string;
  name: string;
  code: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Department within an organization — filtered by organization_id */
export interface Department {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/** Job classification level within an organization, ordered by seniority */
export interface JobLevel {
  id: string;
  organization_id: string;
  name: string;
  level_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Platform user — linked 1:1 with auth.users via the handle_new_user trigger */
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  organization_id: string | null;
  department_id: string | null;
  job_level_id: string | null;
  employee_id: string | null;
  role: UserRole;
  verification_status: VerificationStatus;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  is_active: boolean;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

/** User with eagerly-loaded organization, department, and job level relations */
export interface UserWithDetails extends User {
  organization?: Organization | null;
  department?: Department | null;
  job_level?: JobLevel | null;
}

/** Document metadata stored in the application's JSONB documents field */
export interface ApplicationDocument {
  name: string;
  url: string;
  type: string;
}

/** Self-service organization registration application */
export interface OrganizationApplication {
  id: string;
  name: string;
  code: string;
  description: string | null;
  address: string | null;
  contact_email: string;
  contact_phone: string | null;
  website: string | null;
  applicant_name: string;
  applicant_email: string;
  applicant_position: string | null;
  applicant_phone: string | null;
  documents: ApplicationDocument[];
  status: ApplicationStatus;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}
