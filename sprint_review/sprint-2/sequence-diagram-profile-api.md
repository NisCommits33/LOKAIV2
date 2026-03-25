# Sprint 2 — Sequence Diagram: Profile Setup API Calls

> **Type**: Sequence Diagram  
> **Sprint**: 2 — Authentication & User Onboarding  
> **Purpose**: Shows the API call sequence during profile setup, including form submission with field whitelist and cascading dropdown data fetching.

## Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant API as Next.js API
    participant DB as Supabase DB

    User->>Browser: Fill profile form (Step 1 + Step 2)
    Browser->>API: PUT /api/users/profile
    Note right of Browser: { full_name, organization_id,<br/>department_id, job_level_id,<br/>employee_id, verification_status }
    API->>API: Whitelist filter (block role, employee_id overwrite)
    API->>DB: UPDATE users SET ...
    DB-->>API: Updated user record
    API-->>Browser: 200 OK + user data
    Browser->>Browser: Refresh auth context
    alt Employee path
        Browser->>Browser: Redirect → /pending-approval
    else Non-employee path
        Browser->>Browser: Redirect → /dashboard
    end

    Note over User,DB: Fetching dropdown data
    Browser->>API: GET /api/organizations
    API->>DB: SELECT * FROM organizations WHERE is_active
    DB-->>API: Organization[]
    API-->>Browser: JSON array

    Browser->>API: GET /api/departments?organization_id=xxx
    API->>DB: SELECT * FROM departments WHERE org_id AND is_active
    DB-->>API: Department[]
    API-->>Browser: JSON array

    Browser->>API: GET /api/job-levels?organization_id=xxx
    API->>DB: SELECT * FROM job_levels WHERE org_id AND is_active
    DB-->>API: JobLevel[]
    API-->>Browser: JSON array
```

## API Call Details

| # | Method | Endpoint | Trigger | Response |
|---|--------|----------|---------|----------|
| 1 | PUT | `/api/users/profile` | Form submission | Updated user record |
| 2 | GET | `/api/organizations` | Page load | Array of active organizations |
| 3 | GET | `/api/departments?organization_id=xxx` | Organization selected | Filtered departments |
| 4 | GET | `/api/job-levels?organization_id=xxx` | Organization selected | Filtered job levels |

## Field Whitelist Security

| Field | Allowed in PUT | Reason |
|-------|---------------|--------|
| `full_name` | ✅ | User-editable |
| `organization_id` | ✅ | Selected in profile setup |
| `department_id` | ✅ | Selected in profile setup |
| `job_level_id` | ✅ | Selected in profile setup |
| `profile_completed` | ✅ | Set to `true` on submission |
| `role` | ❌ BLOCKED | Prevents privilege escalation |
| `employee_id` | ❌ BLOCKED | Admin-assigned only |
| `verification_status` | ❌ BLOCKED (direct overwrite) | Controlled by application logic |

## TanStack Query Caching

- **Stale time**: 60 seconds — dropdown data cached to avoid refetching on step navigation
- **Retry**: 1 attempt on failure
- **Query keys**: `['organizations']`, `['departments', orgId]`, `['jobLevels', orgId]`
