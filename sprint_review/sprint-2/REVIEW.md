# Sprint 2 Review — Authentication & User Onboarding

### Sprint Goal
Implement the complete auth flow with Google OAuth, route protection middleware, profile setup wizard, employee verification pipeline, and all public/protected API endpoints.

### Sprint Duration
Sprint 2 of 13 planned sprints

### Deliverables Completed (14/14 — 100%)

| # | Task | Status |
|---|------|--------|
| 2.1 | AuthProvider context with session management, auto-refresh, profile sync | ✅ |
| 2.2 | QueryProvider with TanStack Query defaults (60s stale, 1 retry, devtools) | ✅ |
| 2.3 | ErrorBoundary class component with fallback UI | ✅ |
| 2.4 | Login page with tabbed UI — Personal (Google) + Organization (email/password) | ✅ |
| 2.5 | OAuth callback handler with role-based routing | ✅ |
| 2.6 | Route protection middleware (5-step auth pipeline) | ✅ |
| 2.7 | 2-step profile setup wizard with Zod + React Hook Form | ✅ |
| 2.8 | Organization/Department/Job-Level selector components with TanStack Query | ✅ |
| 2.9 | Pending approval page with status check, rejection display, reapply flow | ✅ |
| 2.10 | Verification status API endpoint | ✅ |
| 2.11 | User profile GET/PUT API with field whitelist security | ✅ |
| 2.12 | Organizations API endpoint | ✅ |
| 2.13 | Departments API endpoint with org_id filter | ✅ |
| 2.14 | Job Levels API endpoint with org_id filter | ✅ |

### Key Files Produced

| File | Purpose |
|------|---------|
| `proxy.ts` | Route protection middleware (5-step pipeline) |
| `app/auth/callback/route.ts` | OAuth callback with role-based routing |
| `app/login/page.tsx` | Tabbed login (Google + Org Admin) |
| `app/profile-setup/page.tsx` | 2-step onboarding wizard |
| `app/pending-approval/page.tsx` | Verification pending status page |
| `components/providers/auth-provider.tsx` | AuthContext: session, user, signIn/Out |
| `components/providers/query-provider.tsx` | TanStack Query configuration |
| `components/selectors/` | Organization, Department, Job Level cascading selectors |
| `api/organizations/route.ts` | GET all active organizations |
| `api/departments/route.ts` | GET departments by org_id |
| `api/job-levels/route.ts` | GET job levels by org_id |
| `api/users/profile/route.ts` | GET/PUT user profile (whitelist-protected) |
| `api/users/verification-status/route.ts` | GET verification status |

### Diagrams

| Diagram | File | Type |
|---------|------|------|
| Google OAuth Authentication Flow | [sequence-diagram-oauth.md](./sequence-diagram-oauth.md) | Sequence |
| Route Protection Middleware | [activity-diagram-middleware.md](./activity-diagram-middleware.md) | Activity |
| Profile Setup Flow | [activity-diagram-profile-setup.md](./activity-diagram-profile-setup.md) | Activity |
| Profile Setup API Calls | [sequence-diagram-profile-api.md](./sequence-diagram-profile-api.md) | Sequence |
| Sprint 1 & 2 Use Cases | [use-case-diagram.md](./use-case-diagram.md) | Use Case |

### API Endpoints Delivered

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/organizations` | Public | List active organizations |
| GET | `/api/departments?organization_id=` | Public | Departments filtered by org |
| GET | `/api/job-levels?organization_id=` | Public | Job levels filtered by org |
| GET | `/api/users/profile` | Auth | Fetch user profile with joins |
| PUT | `/api/users/profile` | Auth | Update profile (whitelist-protected) |
| GET | `/api/users/verification-status` | Auth | Check verification status |

### Security Measures Implemented

| Measure | Implementation |
|---------|---------------|
| Field whitelist on PUT | Only `full_name`, `organization_id`, `department_id`, `job_level_id`, `profile_completed` are accepted — `role`, `employee_id`, `verification_status` are blocked |
| Route protection | 5-step middleware pipeline enforces auth, profile, verification, and role checks |
| Session refresh | Middleware refreshes Supabase tokens on every request to prevent expired sessions |
| OAuth state validation | `exchangeCodeForSession()` validates the OAuth authorization code server-side |
| RLS enforcement | Even if API bypassed, database policies enforce row-level access |

### Sprint 2 Retrospective

| Category | Notes |
|----------|-------|
| **What went well** | Complete auth pipeline from OAuth → routing → profile → verification in one sprint. Middleware handles 5 distinct security gates cleanly. Reusable cascading selectors built for future sprints. |
| **What could improve** | Organization admin login (email/password) UI is built but backend flow not yet connected. E2E tests for auth flow planned but not yet implemented. |
| **Risks mitigated** | Privilege escalation blocked by PUT field whitelist. Redirect loops prevented by public route checks. Session expiry handled by auto-refresh. |
| **Carry-forward** | AuthProvider, selectors, and middleware are reused in every subsequent sprint. API endpoints serve both profile setup and future admin features. |
