# Sprint 3 — UI Component Architecture Diagram

> **Type**: Architecture Diagram  
> **Sprint**: 3 — UI Component Library & Layout System  
> **Purpose**: Shows the provider hierarchy, dashboard layout system, and the reusable UI component library built in Sprint 3.

## Diagram

```mermaid
graph TB
    subgraph Provider_Hierarchy["Provider Hierarchy (Root Layout)"]
        direction TB
        RootLayout[Root Layout<br/>layout.tsx]
        RootLayout --> ErrorBoundary[ErrorBoundary]
        ErrorBoundary --> QueryProvider[QueryProvider<br/>TanStack Query]
        QueryProvider --> AuthProvider[AuthProvider<br/>Session + User State]
        AuthProvider --> TooltipProvider[TooltipProvider]
        TooltipProvider --> Header[Header<br/>Auth-aware Nav]
        TooltipProvider --> PageContent[Page Content]
        TooltipProvider --> Footer[Footer<br/>Conditional]
    end

    subgraph Dashboard_Layout["Dashboard Layout System"]
        direction TB
        DashboardLayout[Dashboard Layout<br/>Sidebar + Sheet]
        DashboardLayout --> MainNav[Main Nav<br/>Dashboard, Quizzes, Docs]
        DashboardLayout --> AdminNav[Admin Section<br/>org_admin only]
        DashboardLayout --> SuperNav[Super Admin Section<br/>super_admin only]
        DashboardLayout --> UserMenu[User Profile<br/>Sign Out]
    end

    subgraph Component_Library["Reusable UI Components (20+)"]
        direction LR
        UI_A[AlertDialog · Avatar<br/>Badge · Button · Card]
        UI_B[Dialog · DropdownMenu<br/>Input · Label · Progress]
        UI_C[Select · Separator<br/>Sheet · Skeleton · Switch]
        UI_D[Tabs · Textarea<br/>Tooltip · BackButton · Spinner]
    end
```

## Provider Hierarchy Details

| Level | Component | Purpose |
|-------|-----------|---------|
| 1 | Root Layout | HTML/body wrapper, font loading, metadata |
| 2 | ErrorBoundary | Catches unhandled errors, shows fallback UI |
| 3 | QueryProvider | TanStack Query client (60s stale, 1 retry, devtools in dev) |
| 4 | AuthProvider | Supabase session management, user state, signIn/signOut |
| 5 | TooltipProvider | Enables tooltips across all child components |
| 6 | Header / Page / Footer | Actual page content with auth-aware navigation |

## Dashboard Layout Reuse

| Layout File | Role Constraint | Reuses Dashboard Layout |
|-------------|----------------|------------------------|
| `app/dashboard/layout.tsx` | All authenticated | Base sidebar layout |
| `app/admin/layout.tsx` | `org_admin`, `super_admin` | ✅ Same component |
| `app/super-admin/layout.tsx` | `super_admin` | ✅ Same component |

## Loading Component Catalog

| Component | Usage | Skeleton Type |
|-----------|-------|---------------|
| `PageSkeleton` | Full page loading | Header + content area |
| `CardSkeleton` | Card grid loading | Card-shaped pulses |
| `TableSkeleton` | Table data loading | Row-shaped pulses |
| `FormSkeleton` | Form loading | Input-shaped pulses |
| `Spinner` | Inline loading indicator | Circular animation |
| `FullPageSpinner` | Route transitions | Centered full-page spinner |
