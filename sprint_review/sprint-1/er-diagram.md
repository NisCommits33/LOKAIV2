# Sprint 1 — ER Diagram (Database Schema)

> **Type**: Entity-Relationship Diagram  
> **Sprint**: 1 — Project Foundation & Database Design  
> **Purpose**: Shows the complete database schema designed in Sprint 1, with all tables, columns, types, and relationships.

## Diagram

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

## Relationships

| Parent | Child | Cardinality | Constraint |
|--------|-------|-------------|------------|
| `auth.users` | `public.users` | 1:1 | `handle_new_user()` trigger auto-creates |
| `organizations` | `departments` | 1:many | FK with CASCADE delete |
| `organizations` | `job_levels` | 1:many | FK with CASCADE delete |
| `organizations` | `users` | 1:many | FK (nullable — user may not have org yet) |
| `departments` | `users` | 1:many | FK (nullable) |
| `job_levels` | `users` | 1:many | FK (nullable) |

## Enums

| Enum | Values | Used In |
|------|--------|---------|
| `user_role` | `public`, `employee`, `org_admin`, `super_admin` | `users.role` |
| `verification_status` | `none`, `pending`, `verified`, `rejected` | `users.verification_status` |

## RLS Policies

| Table | Policy | Rule |
|-------|--------|------|
| `organizations` | Anyone can view active | `SELECT WHERE is_active = true` |
| `organizations` | Super admin full access | `ALL` for `super_admin` role |
| `departments` | Anyone can view active | `SELECT WHERE is_active = true` |
| `job_levels` | Anyone can view active | `SELECT WHERE is_active = true` |
| `users` | Users read own data | `SELECT WHERE id = auth.uid()` |
| `users` | Users update own data | `UPDATE WHERE id = auth.uid()` |
| `users` | Org admin reads org users | `SELECT WHERE organization_id matches` |
| `users` | Super admin reads all | `SELECT` for `super_admin` role |
