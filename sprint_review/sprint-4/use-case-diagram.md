# Sprint 4 — Use Case Diagram: Sprint 3 & 4

> **Type**: Use Case Diagram  
> **Sprint**: 4 — Dashboard & Landing Page  
> **Purpose**: Shows all actors and their interactions with the UI/layout system (Sprint 3) and dashboard/landing page features (Sprint 4).

## Diagram

```mermaid
flowchart LR
    subgraph Actors
        AU([Authenticated User])
        EMP([Employee])
        OA([Org Admin])
        SA([Super Admin])
    end

    subgraph Sprint_3["Sprint 3 — Use Cases"]
        UC1[View Landing Page]
        UC2[Navigate Sidebar Menu]
        UC3[View Role-Based Nav Items]
        UC4[Use Mobile Sheet Menu]
        UC5[See Loading Skeletons]
        UC6[See Error Boundary Fallback]
    end

    subgraph Sprint_4["Sprint 4 — Use Cases"]
        UC7[View Dashboard Welcome]
        UC8[See Role Badge]
        UC9[See Verification Badge]
        UC10[Navigate to GK Quizzes]
        UC11[Navigate to My Documents]
        UC12[Navigate to My Progress]
    end

    AU --> UC1
    AU --> UC2
    AU --> UC5
    AU --> UC6
    AU --> UC7
    AU --> UC8
    AU --> UC10
    AU --> UC11

    EMP --> UC3
    EMP --> UC9
    EMP --> UC12

    OA --> UC3
    OA --> UC4
    OA --> UC12

    SA --> UC3
    SA --> UC4
```

## Use Case Details

| # | Use Case | Actor(s) | Sprint | Description |
|---|----------|----------|--------|-------------|
| UC1 | View Landing Page | All | 3 | Hero, quiz demo, feature highlights |
| UC2 | Navigate Sidebar Menu | All authenticated | 3 | Dashboard sidebar navigation |
| UC3 | View Role-Based Nav Items | EMP, OA, SA | 3 | Admin/super-admin sections visible by role |
| UC4 | Use Mobile Sheet Menu | OA, SA | 3 | Slide-over sheet on mobile devices |
| UC5 | See Loading Skeletons | All authenticated | 3 | Skeleton UI during data fetching |
| UC6 | See Error Boundary Fallback | All authenticated | 3 | Fallback UI on unhandled errors |
| UC7 | View Dashboard Welcome | All authenticated | 4 | Personalized welcome with user name |
| UC8 | See Role Badge | All authenticated | 4 | Badge showing current role |
| UC9 | See Verification Badge | EMP | 4 | ✅ verified or ⏳ pending badge |
| UC10 | Navigate to GK Quizzes | All authenticated | 4 | Feature card → `/dashboard/quizzes` |
| UC11 | Navigate to My Documents | All authenticated | 4 | Feature card → `/dashboard/documents` |
| UC12 | Navigate to My Progress | EMP, OA | 4 | Feature card → `/dashboard/progress` |
