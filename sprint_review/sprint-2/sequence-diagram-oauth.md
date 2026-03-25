# Sprint 2 — Sequence Diagram: Google OAuth Authentication Flow

> **Type**: Sequence Diagram  
> **Sprint**: 2 — Authentication & User Onboarding  
> **Purpose**: Shows the complete Google OAuth sign-in flow from user click through session creation and role-based routing.

## Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant NextJS as Next.js Server
    participant Supabase as Supabase Auth
    participant DB as Supabase DB

    User->>Browser: Click "Sign in with Google"
    Browser->>Supabase: signInWithOAuth(google)
    Supabase->>Browser: Redirect to Google Consent
    Browser->>User: Google login screen
    User->>Browser: Approve consent
    Browser->>Supabase: Google authorization code
    Supabase->>Supabase: Create/update auth.users
    Note over Supabase,DB: handle_new_user() trigger fires
    Supabase->>DB: INSERT INTO public.users
    Supabase->>Browser: Redirect to /auth/callback?code=xxx
    Browser->>NextJS: GET /auth/callback?code=xxx
    NextJS->>Supabase: exchangeCodeForSession(code)
    Supabase-->>NextJS: Session tokens
    NextJS->>DB: SELECT profile_completed, verification_status, role
    DB-->>NextJS: User record
    alt Profile not completed
        NextJS-->>Browser: Redirect → /profile-setup
    else Verification pending
        NextJS-->>Browser: Redirect → /pending-approval
    else Role = super_admin
        NextJS-->>Browser: Redirect → /super-admin
    else Role = org_admin
        NextJS-->>Browser: Redirect → /admin
    else Default
        NextJS-->>Browser: Redirect → /dashboard
    end
```

## Flow Steps

| Step | From | To | Action |
|------|------|----|--------|
| 1 | User | Browser | Clicks Google sign-in button on `/login` page |
| 2 | Browser | Supabase Auth | Initiates OAuth with `signInWithOAuth({ provider: 'google' })` |
| 3 | Supabase | Browser | Returns Google consent screen URL |
| 4-5 | User | Google | Approves OAuth permissions |
| 6 | Google | Supabase | Sends authorization code |
| 7 | Supabase | auth.users | Creates or updates user record |
| 8 | Trigger | public.users | `handle_new_user()` inserts row (Sprint 1 trigger) |
| 9 | Supabase | Browser | Redirects to `/auth/callback?code=xxx` |
| 10-11 | Next.js | Supabase | Exchanges code for session tokens server-side |
| 12-13 | Next.js | DB | Fetches user profile for routing decision |
| 14 | Next.js | Browser | Redirects based on profile/role state |

## Routing Decision Logic

| Condition | Redirect Target |
|-----------|----------------|
| `profile_completed = false` | `/profile-setup` |
| `verification_status = 'pending'` | `/pending-approval` |
| `role = 'super_admin'` | `/super-admin` |
| `role = 'org_admin'` | `/admin` |
| Default (employee) | `/dashboard` |
