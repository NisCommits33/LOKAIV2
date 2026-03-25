# Sprint 1 Review — Project Foundation & Database Design

**Project**: LokAI — AI-Powered Exam Preparation Platform for Nepal Government Employees  
**Sprint**: 1 of 13 planned sprints  
**Tech Stack**: Next.js 16 (App Router) · React 19 · Supabase (PostgreSQL + Auth) · Tailwind CSS 4 · shadcn/ui · TanStack Query · Framer Motion · TypeScript

---

## Sprint Goal

Set up the project skeleton, database schema with Row-Level Security, and development environment.

---

## Deliverables Completed (13/13 — 100%)

| # | Task | Status |
|---|------|--------|
| 1.1 | Initialize Next.js 16 project with TypeScript, Tailwind CSS 4, ESLint | ✅ |
| 1.2 | Install core dependencies (Supabase SSR, TanStack Query, Framer Motion, Radix UI, Zod, React Hook Form, Recharts, Sonner, Lucide icons) | ✅ |
| 1.3 | Configure Supabase browser client (`client.ts`) and server client (`server.ts`) | ✅ |
| 1.4 | Create combined migration script (`migrations/000_run_all.sql`) | ✅ |
| 1.5 | Design `organizations` table with RLS policies | ✅ |
| 1.6 | Design `departments` table with cascading FK, composite unique constraint | ✅ |
| 1.7 | Design `job_levels` table with org FK, level ordering | ✅ |
| 1.8 | Design `users` table with role/verification enums, full RLS policy set | ✅ |
| 1.9 | Create shared `update_updated_at()` trigger function | ✅ |
| 1.10 | Create `handle_new_user()` trigger for auto-populating users on auth signup | ✅ |
| 1.11 | Seed 3 organizations (MOFA, NEA, NRB) with departments and job levels | ✅ |
| 1.12 | Define TypeScript types matching DB schema (`types/database.ts`) | ✅ |
| 1.13 | Create utility function `cn()` for Tailwind class merging | ✅ |

---

## Key Files Produced

| File | Purpose |
|------|---------|
| `migrations/000_run_all.sql` | Full database schema (7 sections), RLS policies, triggers, seed data |
| `lib/supabase/client.ts` | Browser-side Supabase client (cookie-based auth) |
| `lib/supabase/server.ts` | Server-side Supabase client (async cookie access) |
| `types/database.ts` | TypeScript interfaces: Organization, Department, JobLevel, User, UserWithDetails |
| `lib/utils.ts` | Tailwind `cn()` merge utility |

---

## Diagrams

### 1. ER Diagram — Database Schema

> See: [er-diagram.md](./er-diagram.md)

```mermaid
erDiagram
    ORGANIZATIONS {
        uuid id PK
        text name
        text code UK
        text description
        text logo_url
        boolean is_active
        uuid approved_by
        timestamptz approved_at
        timestamptz created_at
        timestamptz updated_at
    }
    DEPARTMENTS {
        uuid id PK
        uuid organization_id FK
        text name
        text code
        boolean is_active
        integer display_order
    }
    JOB_LEVELS {
        uuid id PK
        uuid organization_id FK
        text name
        integer level_order
        boolean is_active
    }
    USERS {
        uuid id PK
        text email
        text full_name
        text avatar_url
        uuid organization_id FK
        uuid department_id FK
        uuid job_level_id FK
        text employee_id
        user_role role
        verification_status verification_status
        boolean profile_completed
        timestamptz created_at
    }
    AUTH_USERS {
        uuid id PK
        text email
    }

    AUTH_USERS ||--|| USERS : "trigger creates"
    ORGANIZATIONS ||--o{ DEPARTMENTS : "has many"
    ORGANIZATIONS ||--o{ JOB_LEVELS : "has many"
    ORGANIZATIONS ||--o{ USERS : "belongs to"
    DEPARTMENTS ||--o{ USERS : "assigned to"
    JOB_LEVELS ||--o{ USERS : "classified as"
```

### 2. Use Case Diagram — Sprint 1

> See: [use-case-diagram.md](./use-case-diagram.md)

```mermaid
flowchart LR
    subgraph Actors
        PU([Public User])
        SA([Super Admin])
    end

    subgraph Sprint_1_Use_Cases["Sprint 1 — Use Cases"]
        UC1[View Active Organizations]
        UC2[View Departments by Org]
        UC3[View Job Levels by Org]
        UC4[Manage Organizations CRUD]
        UC5[Manage Departments CRUD]
        UC6[Manage Job Levels CRUD]
        UC7[View Seed Data]
    end

    PU --> UC1
    PU --> UC2
    PU --> UC3

    SA --> UC4
    SA --> UC5
    SA --> UC6
    SA --> UC7
```

### 3. Activity Diagram — Database Migration Execution

> See: [activity-diagram-migration.md](./activity-diagram-migration.md)

```mermaid
flowchart TD
    A([Run 000_run_all.sql]) --> B[001: Create organizations table]
    B --> C[Enable RLS + policies on organizations]
    C --> D[Create update_updated_at trigger function]
    D --> E[002: Create departments table]
    E --> F[Add cascading FK to organizations]
    F --> G[Enable RLS + policies on departments]
    G --> H[003: Create job_levels table]
    H --> I[Add cascading FK to organizations]
    I --> J[Enable RLS + policies on job_levels]
    J --> K[004: Create users table]
    K --> L[Add FKs to org, dept, job_level]
    L --> M[Enable RLS + full policy set]
    M --> N[004b: Add admin-specific RLS policies]
    N --> O[005: Create handle_new_user trigger]
    O --> P[006: Insert seed data]
    P --> Q[3 orgs × 5 depts × 4 job levels]
    Q --> R([Migration Complete ✅])

    style A fill:#e0e7ff,stroke:#4338ca
    style R fill:#d1fae5,stroke:#059669
```

### 4. Sequence Diagram — Auto User Creation Trigger

> See: [sequence-diagram-trigger.md](./sequence-diagram-trigger.md)

```mermaid
sequenceDiagram
    autonumber
    actor NewUser as New User
    participant Google as Google OAuth
    participant Auth as Supabase Auth
    participant Trigger as handle_new_user()
    participant DB as public.users

    NewUser->>Google: Sign in with Google
    Google->>Auth: Authorization code
    Auth->>Auth: Create auth.users record
    Note over Auth,Trigger: AFTER INSERT trigger fires
    Auth->>Trigger: NEW row (id, email, raw_user_meta_data)
    Trigger->>Trigger: Extract full_name from metadata
    Trigger->>Trigger: Extract avatar_url from metadata
    Trigger->>DB: INSERT INTO public.users (id, email, full_name, avatar_url, role='public')
    DB-->>Trigger: Row inserted
    Trigger-->>Auth: Trigger complete
    Auth-->>NewUser: Session established
```

---

## Database Design Decisions

| Decision | Rationale |
|----------|-----------|
| UUID primary keys | Supabase standard, prevents enumeration attacks |
| Composite unique `(org_id, code)` on departments | Allows same dept code across different orgs |
| `level_order` on job_levels | Enables ascending seniority sorting |
| Role enum (`public/employee/org_admin/super_admin`) | Fixed role hierarchy, no dynamic RBAC overhead |
| Verification status enum (`none/pending/verified/rejected`) | Clear state machine for employee onboarding |
| RLS on all 4 tables | Defense-in-depth — database enforces access even if API has bugs |
| `handle_new_user()` trigger | Auto-creates public.users row from auth.users signup — zero manual sync |
| Idempotent migration (`IF NOT EXISTS`) | Safe to re-run without errors |

---

## Seed Data

| Organization | Code | Departments | Job Levels |
|-------------|------|-------------|------------|
| Ministry of Federal Affairs and General Administration | MOFA | 5 | 4 |
| Nepal Electricity Authority | NEA | 5 | 4 |
| Nepal Rastra Bank | NRB | 5 | 4 |

---

## Sprint 1 Retrospective

| Category | Notes |
|----------|-------|
| **What went well** | Clean separation of DB concerns with 7-section migration. TypeScript types perfectly mirror DB schema. RLS policies cover all role combinations. |
| **What could improve** | No automated migration runner yet — SQL must be pasted into Supabase SQL Editor manually. |
| **Risks mitigated** | Type safety between frontend and DB ensured via `database.ts`. Auth trigger eliminates manual user creation bugs. |
| **Carry-forward** | Supabase client configs are reused in every subsequent sprint. Seed data enables immediate testing. |
