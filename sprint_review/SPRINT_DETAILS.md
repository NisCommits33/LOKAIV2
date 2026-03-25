# LokAI — Sprint Details

**Project**: LokAI — AI-Powered Exam Preparation Platform for Nepal Government Employees  
**Tech Stack**: Next.js 16 (App Router) · React 19 · Supabase (PostgreSQL + Auth) · Tailwind CSS 4 · shadcn/ui · TanStack Query · Framer Motion · TypeScript

---

## Sprint 1 — Project Foundation & Database Design

**Goal**: Set up the project skeleton, database schema, and development environment.

### Deliverables

| # | Task | Status |
|---|------|--------|
| 1.1 | Initialize Next.js 16 project with TypeScript, Tailwind CSS 4, ESLint | ✅ Done |
| 1.2 | Install core dependencies (Supabase SSR, TanStack Query, Framer Motion, Radix UI, Zod, React Hook Form, Recharts, Sonner, Lucide icons) | ✅ Done |
| 1.3 | Configure Supabase browser client (`lib/supabase/client.ts`) and server client (`lib/supabase/server.ts`) | ✅ Done |
| 1.4 | Create combined migration script (`migrations/000_run_all.sql`) | ✅ Done |
| 1.5 | Design `organizations` table with RLS policies (public view active, super_admin full access) | ✅ Done |
| 1.6 | Design `departments` table with cascading org FK, composite unique (org_id, code), RLS | ✅ Done |
| 1.7 | Design `job_levels` table with org FK, level ordering, composite unique (org_id, name), RLS | ✅ Done |
| 1.8 | Design `users` table with role enum (public/employee/org_admin/super_admin), verification status enum (none/pending/verified/rejected), profile_completed flag, and full RLS policy set | ✅ Done |
| 1.9 | Create `update_updated_at()` trigger function shared across all tables | ✅ Done |
| 1.10 | Create `handle_new_user()` trigger to auto-populate users table on Supabase Auth signup | ✅ Done |
| 1.11 | Seed 3 organizations (MOFA, NEA, NRB) with departments and job levels | ✅ Done |
| 1.12 | Define TypeScript types matching DB schema (`types/database.ts`): Organization, Department, JobLevel, User, UserWithDetails, UserRole, VerificationStatus | ✅ Done |
| 1.13 | Create utility function `cn()` for Tailwind class merging (`lib/utils.ts`) | ✅ Done |

### Database Schema Summary

```
organizations ──< departments
organizations ──< job_levels
organizations ──< users
departments   ──< users
job_levels    ──< users
auth.users    ──  users (1:1 via trigger)
```

**Row-Level Security**: Enabled on all 4 tables with role-based policies for public, org_admin, and super_admin.

---

## Sprint 2 — Authentication & User Onboarding

**Goal**: Implement complete auth flow with Google OAuth, org admin login, profile setup wizard, and employee verification pipeline.

### Deliverables

| # | Task | Status |
|---|------|--------|
| 2.1 | Build `AuthProvider` context with session management, auto-refresh, and profile sync (`components/providers/auth-provider.tsx`) | ✅ Done |
| 2.2 | Build `QueryProvider` with TanStack Query defaults — 60s stale time, 1 retry, devtools (`components/providers/query-provider.tsx`) | ✅ Done |
| 2.3 | Build `ErrorBoundary` class component with fallback UI (`components/error-boundary.tsx`) | ✅ Done |
| 2.4 | Build login page with tabbed UI — "Personal" (Google OAuth) and "Organization" (email/password) (`app/login/page.tsx`) | ✅ Done |
| 2.5 | Build OAuth callback handler with role-based routing (`app/auth/callback/route.ts`) | ✅ Done |
| 2.6 | Build route protection middleware — public routes, auth redirects, profile completion checks, role-based access (`proxy.ts`) | ✅ Done |
| 2.7 | Build 2-step profile setup wizard with Zod validation and React Hook Form (`app/profile-setup/page.tsx`) | ✅ Done |
| 2.8 | Build organization/department/job-level selector components with TanStack Query data fetching (`components/selectors/`) | ✅ Done |
| 2.9 | Build pending approval page with status check, rejection display, and reapply flow (`app/pending-approval/page.tsx`) | ✅ Done |
| 2.10 | Build verification status API endpoint (`api/users/verification-status/route.ts`) | ✅ Done |
| 2.11 | Build user profile GET/PUT API with field whitelist security (`api/users/profile/route.ts`) | ✅ Done |
| 2.12 | Build organizations API endpoint (`api/organizations/route.ts`) | ✅ Done |
| 2.13 | Build departments API endpoint with org_id filter (`api/departments/route.ts`) | ✅ Done |
| 2.14 | Build job levels API endpoint with org_id filter (`api/job-levels/route.ts`) | ✅ Done |

### Auth Flow Summary

```
Google OAuth ──→ /auth/callback ──→ profile_completed?
                                      ├─ No  → /profile-setup (2-step wizard)
                                      └─ Yes → verification_status?
                                                 ├─ pending  → /pending-approval
                                                 └─ verified → role-based dashboard

Org Admin Login ──→ signInWithPassword ──→ role check → /admin or /pending-approval
```

### Profile Setup Flow

- **Step 1**: Full name + "I am a government employee" toggle
- **Step 2** (if employee): Organization → Department → Job Level → Employee ID
- **Submit**: Sets `verification_status = "pending"` or `profile_completed = true`

---

## Sprint 3 — UI Component Library & Layout System

**Goal**: Build reusable UI components, layout system with responsive sidebar navigation, and page shells.

### Deliverables

| # | Task | Status |
|---|------|--------|
| 3.1 | Install and configure shadcn/ui component library | ✅ Done |
| 3.2 | Build 20 UI components: AlertDialog, Avatar, BackButton, Badge, Button, Card, Dialog, DropdownMenu, Input, Label, Progress, Select, Separator, Sheet, Skeleton, Switch, Tabs, Textarea, Tooltip | ✅ Done |
| 3.3 | Build loading state components: PageSkeleton, CardSkeleton, TableSkeleton, FormSkeleton, Spinner, FullPageSpinner (`components/loading.tsx`) | ✅ Done |
| 3.4 | Build `Container` layout component — max-w-7xl responsive wrapper (`components/layout/Container.tsx`) | ✅ Done |
| 3.5 | Build `Header` with conditional nav (auth-aware), user dropdown, mobile responsive (`components/layout/Header.tsx`) | ✅ Done |
| 3.6 | Build `Footer` with conditional visibility (`components/layout/Footer.tsx`) | ✅ Done |
| 3.7 | Build root layout with provider hierarchy: ErrorBoundary → QueryProvider → AuthProvider → TooltipProvider → Header/Footer (`app/layout.tsx`) | ✅ Done |
| 3.8 | Build dashboard sidebar layout with role-based navigation sections, mobile sheet menu, active route highlighting (`app/dashboard/layout.tsx`) | ✅ Done |
| 3.9 | Build admin layout reusing dashboard layout (`app/admin/layout.tsx`) | ✅ Done |
| 3.10 | Build super-admin layout reusing dashboard layout (`app/super-admin/layout.tsx`) | ✅ Done |
| 3.11 | Build 404 not-found page with motion animations (`app/not-found.tsx`) | ✅ Done |

### Navigation Structure

```
Dashboard Sidebar:
├── Main Nav (all users)
│   ├── Dashboard
│   ├── GK Quizzes
│   ├── My Documents
│   ├── Org Documents (employee/org_admin)
│   └── My Progress (employee/org_admin)
├── Admin Section (org_admin)
│   ├── Admin Dashboard
│   ├── Manage Users
│   ├── Departments
│   ├── Upload Documents
│   └── Analytics
├── Super Admin Section (super_admin)
│   ├── Platform Overview
│   ├── Organizations
│   ├── All Users
│   ├── Audit Logs
│   └── Settings
└── User Profile + Sign Out
```

---

## Sprint 4 — Dashboard & Landing Page

**Goal**: Build the landing page and main dashboard with role-aware feature cards.

### Deliverables

| # | Task | Status |
|---|------|--------|
| 4.1 | Build landing page hero section with CTA, animated entrance (`app/page.tsx`) | ✅ Done |
| 4.2 | Build GK Quiz CTA section with marketing copy and question preview card | ✅ Done |
| 4.3 | Build tech stack showcase section | ✅ Done |
| 4.4 | Build main dashboard page with welcome message, role badge, verification badge, and feature card grid (`app/dashboard/page.tsx`) | ✅ Done |
| 4.5 | Build admin dashboard stub page (`app/admin/page.tsx`) | ✅ Done |
| 4.6 | Build super-admin platform overview stub page (`app/super-admin/page.tsx`) | ✅ Done |

### Dashboard Feature Cards

| Card | Route | Visible To |
|------|-------|------------|
| GK Quizzes | `/dashboard/quizzes` | All roles |
| My Documents | `/dashboard/documents` | All roles |
| My Progress | `/dashboard/progress` | employee, org_admin |

---

## Sprint 5 — Organization Registration & Super Admin Approval

**Goal**: Enable self-service organization registration with a multi-step form, document upload, and super admin review/approve/reject workflow with automatic org setup on approval.

### Deliverables

| # | Task | Status |
|---|------|--------|
| 5.1 | Database migration: `organization_applications` table with status lifecycle (`migrations/001_org_applications.sql`) | ✅ Done |
| 5.2 | DB trigger: `handle_org_application_approval()` — auto-creates org, 5 default departments, 4 default job levels on approval | ✅ Done |
| 5.3 | Supabase Storage: `org-applications` bucket with authenticated upload/read policies | ✅ Done |
| 5.4 | TypeScript types: `ApplicationStatus`, `ApplicationDocument`, `OrganizationApplication` (`types/database.ts`) | ✅ Done |
| 5.5 | API: `POST /api/organizations/apply` — public org registration endpoint with duplicate code check | ✅ Done |
| 5.6 | API: `GET /api/organizations/applications/[id]` — fetch single application (RLS-protected) | ✅ Done |
| 5.7 | API: `GET /api/super/organizations/pending` — list all applications for super admin | ✅ Done |
| 5.8 | API: `POST /api/super/organizations/[id]/approve` — approve with optional admin email assignment | ✅ Done |
| 5.9 | API: `POST /api/super/organizations/[id]/reject` — reject with required reason | ✅ Done |
| 5.10 | API: `POST /api/super/organizations/[id]/assign-admin` — assign org_admin role to user | ✅ Done |
| 5.11 | UI: 3-step organization registration form with React Hook Form + Zod validation (`register-organization/page.tsx`) | ✅ Done |
| 5.12 | UI: Document upload to Supabase Storage with drag-and-drop zone, file list, remove | ✅ Done |
| 5.13 | UI: Application status page with pending/approved/rejected states (`register-organization/status/page.tsx`) | ✅ Done |
| 5.14 | UI: Super admin organizations management page with search, filter, stats cards (`super-admin/organizations/page.tsx`) | ✅ Done |
| 5.15 | UI: Approve dialog with admin email assignment | ✅ Done |
| 5.16 | UI: Reject dialog with required rejection reason | ✅ Done |
| 5.17 | UI: Application detail dialog with full info, documents, and applicant details | ✅ Done |
| 5.18 | Middleware: Added `/register-organization` as public route prefix in `proxy.ts` | ✅ Done |

### Registration Form Steps

| Step | Content |
|------|---------|
| 1 — Organization Details | Name, code, description, address, email, phone, website |
| 2 — Applicant Details | Full name, email, position, phone |
| 3 — Documents & Submit | File upload (PDF/JPG/PNG, 10MB max), application summary, submit |

### Approval Trigger Defaults

On approval, the trigger auto-creates:
- **5 Departments**: प्रशासन (Administration), वित्त (Finance), मानव संसाधन (HR), सूचना प्रविधि (IT), सञ्चालन (Operations)
- **4 Job Levels**: सहायक (Assistant, L1), अधिकृत (Officer, L2), वरिष्ठ अधिकृत (Senior Officer, L3), निर्देशक (Director, L4)

---

## Sprint 6 — Core Features (Planned)

**Goal**: Build the AI-powered quiz system, document management, and progress tracking.

| # | Task | Status |
|---|------|--------|
| 6.1 | GK Quiz engine with timed questions, scoring, category selection | 🔲 Planned |
| 6.2 | Document upload & management (personal) | 🔲 Planned |
| 6.3 | Organization document library (shared docs) | 🔲 Planned |
| 6.4 | AI-powered document intelligence (Gemini AI integration) | 🔲 Planned |
| 6.5 | Progress tracking dashboard with Recharts visualizations | 🔲 Planned |
| 6.6 | Quiz history & performance analytics | 🔲 Planned |

---

## Sprint 7 — Admin Panel (Planned)

**Goal**: Build organization admin and super-admin management interfaces.

| # | Task | Status |
|---|------|--------|
| 7.1 | Org admin: User verification workflow (approve/reject employees) | 🔲 Planned |
| 7.2 | Org admin: Department management CRUD | 🔲 Planned |
| 7.3 | Org admin: Document upload & distribution | 🔲 Planned |
| 7.4 | Org admin: Analytics dashboard | 🔲 Planned |
| 7.5 | Super admin: Platform-wide user management | 🔲 Planned |
| 7.6 | Super admin: Audit logs | 🔲 Planned |
| 7.7 | Super admin: Platform settings | 🔲 Planned |

---

## File Inventory

```
Development/
├── migrations/
│   ├── 000_run_all.sql              # Full DB schema + seed data
│   └── 001_org_applications.sql     # Org applications table + approval trigger
├── backend/                          # (empty — using Supabase)
└── frontend/
    └── src/
        ├── proxy.ts                  # Route protection middleware
        ├── app/
        │   ├── layout.tsx            # Root layout + providers
        │   ├── page.tsx              # Landing page
        │   ├── globals.css           # Global styles
        │   ├── not-found.tsx         # 404 page
        │   ├── login/page.tsx        # Login (Google + Org)
        │   ├── auth/callback/route.ts        # OAuth callback
        │   ├── profile-setup/page.tsx        # 2-step profile wizard
        │   ├── pending-approval/page.tsx     # Verification status
        │   ├── register-organization/
        │   │   ├── page.tsx          # 3-step org registration form
        │   │   └── status/page.tsx   # Application status page
        │   ├── dashboard/
        │   │   ├── layout.tsx        # Sidebar layout
        │   │   └── page.tsx          # Main dashboard
        │   ├── admin/
        │   │   ├── layout.tsx        # Reuses dashboard layout
        │   │   └── page.tsx          # Org admin stub
        │   ├── super-admin/
        │   │   ├── layout.tsx        # Reuses dashboard layout
        │   │   ├── page.tsx          # Super admin stub
        │   │   └── organizations/page.tsx  # Org applications management
        │   └── api/
        │       ├── organizations/
        │       │   ├── route.ts      # List organizations
        │       │   └── apply/route.ts        # Public registration
        │       │   └── applications/[id]/route.ts  # Get application
        │       ├── departments/route.ts
        │       ├── job-levels/route.ts
        │       ├── super/organizations/
        │       │   ├── pending/route.ts      # List all applications
        │       │   └── [id]/
        │       │       ├── approve/route.ts  # Approve application
        │       │       ├── reject/route.ts   # Reject application
        │       │       └── assign-admin/route.ts  # Assign org admin
        │       └── users/
        │           ├── profile/route.ts
        │           └── verification-status/route.ts
        ├── components/
        │   ├── error-boundary.tsx
        │   ├── loading.tsx
        │   ├── layout/
        │   │   ├── Container.tsx
        │   │   ├── Header.tsx
        │   │   └── Footer.tsx
        │   ├── providers/
        │   │   ├── auth-provider.tsx
        │   │   └── query-provider.tsx
        │   ├── selectors/
        │   │   ├── organization-selector.tsx
        │   │   ├── department-selector.tsx
        │   │   ├── job-level-selector.tsx
        │   │   └── index.ts
        │   └── ui/ (20 shadcn components)
        ├── lib/
        │   ├── utils.ts
        │   └── supabase/
        │       ├── client.ts
        │       └── server.ts
        └── types/
            └── database.ts
```

---

## Summary

| Sprint | Focus | Tasks | Completed |
|--------|-------|-------|-----------|
| 1 | Foundation & Database | 13 | 13 ✅ |
| 2 | Auth & Onboarding | 14 | 14 ✅ |
| 3 | UI Components & Layout | 11 | 11 ✅ |
| 4 | Dashboard & Landing | 6 | 6 ✅ |
| 5 | Org Registration & Approval | 18 | 18 ✅ |
| 6 | Core Features | 6 | 0 🔲 |
| 7 | Admin Panel | 7 | 0 🔲 |
| **Total** | | **75** | **62 done / 13 planned** |
