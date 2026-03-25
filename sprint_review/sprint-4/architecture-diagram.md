# Sprint 4 — Overall Architecture Diagram (After Sprint 1–4)

> **Type**: Architecture Diagram  
> **Sprint**: 4 — Dashboard & Landing Page  
> **Purpose**: Shows the complete system architecture after all 4 completed sprints, including client pages, middleware, API routes, and Supabase backend.

## Diagram

```mermaid
graph TB
    subgraph Client["Client (Browser)"]
        LP[Landing Page]
        Login[Login Page]
        PS[Profile Setup]
        PA[Pending Approval]
        Dash[Dashboard]
        Admin[Admin Panel]
        SA[Super Admin]
    end

    subgraph Middleware["Next.js Middleware"]
        Proxy[proxy.ts<br/>5-step auth pipeline]
    end

    subgraph API["Next.js API Routes"]
        OrgAPI[GET /api/organizations]
        DeptAPI[GET /api/departments]
        JLAPI[GET /api/job-levels]
        ProfileAPI[GET/PUT /api/users/profile]
        VerifyAPI[GET /api/users/verification-status]
    end

    subgraph Supabase["Supabase"]
        Auth[Supabase Auth<br/>Google OAuth]
        DB[(PostgreSQL<br/>+ RLS Policies)]
    end

    Client --> Proxy
    Proxy --> Client
    Client --> API
    API --> DB
    Login --> Auth
    Auth --> DB

    style Client fill:#e0e7ff,stroke:#4338ca
    style Middleware fill:#fef3c7,stroke:#d97706
    style API fill:#dbeafe,stroke:#2563eb
    style Supabase fill:#d1fae5,stroke:#059669
```

## Architecture Layers

| Layer | Technology | Components |
|-------|-----------|------------|
| **Client** | Next.js 16 + React 19 | 7 client pages: Landing, Login, Profile Setup, Pending Approval, Dashboard, Admin, Super Admin |
| **Middleware** | `proxy.ts` | 5-step auth pipeline: public route check → auth check → profile check → verification check → role check |
| **API** | Next.js Route Handlers | 5 endpoints: organizations, departments, job-levels, user profile, verification status |
| **Auth** | Supabase Auth | Google OAuth provider, session management, token refresh |
| **Database** | PostgreSQL + RLS | 4 tables (organizations, departments, job_levels, users), 8 RLS policies, 1 trigger |

## Data Flow

| Flow | Path |
|------|------|
| Page request | Browser → Middleware (proxy.ts) → Page Component |
| API request | Browser → API Route → Supabase DB (via RLS) |
| Authentication | Browser → Supabase Auth → Google OAuth → auth.users → trigger → public.users |
| Session refresh | Middleware → Supabase Auth → Refresh tokens on every request |

## Sprint Contribution Map

| Sprint | Layer | What Was Added |
|--------|-------|---------------|
| **Sprint 1** | Database | 4 tables, RLS policies, trigger, seed data |
| **Sprint 2** | Auth + API + Middleware | OAuth flow, 5 API routes, route protection, profile setup, selectors |
| **Sprint 3** | Client | 20+ UI components, layout system, provider hierarchy, loading states |
| **Sprint 4** | Client | Landing page, dashboard, admin/super-admin stubs |
