# LokAI Bug Tracker

This file tracks ongoing issues and bugs discovered during development.

---

## 🛑 High Priority

### 1. Khalti Payment Callback (404 / Redirect to Home)
- **Status**: Investigating
- **Description**: After a successful payment on Khalti, the redirect to `/api/admin/billing/khalti-verify` results in a "Page Not Found" or a silent redirect to the home page.
- **Trace**: [Proxy Log] output is needed to confirm if the route is hit.

### 2. Global Quiz Manager (Publishing failure)
- **Status**: New
- **Description**: Organization admins cannot publish quizzes in the Global Quiz Manager.

### 3. Personalized Practice Result Page
- **Status**: New
- **Description**: After generating questions for personalized practice, the result/summary page fails to load or function correctly.

---

## 🟡 Medium Priority

### 4. Environment Configuration Sync
- **Status**: Partially Fixed
- **Description**: Project was using legacy eSewa variables. Khalti variables were missing.
- **Action**: Updated `.env.local` with Khalti sandbox keys. Need to verify they are correctly picked up.

### 5. Deactivated Employee Feedback
- **Status**: New
- **Description**: Employees who are deactivated do not receive an appropriate message or notification informing them of their status when they try to access the platform.

### 6. Organization Registration Rejection Feedback
- **Status**: New
- **Description**: When a Super Admin rejects an organization registration application, no error or feedback message is shown to the applicant.

### 7. Middleware Naming Conflict
- **Status**: Resolved
- **Description**: Next.js 16 uses `proxy.ts` but earlier attempts to use `middleware.ts` caused a build error.
- **Fix**: Deleted `middleware.ts` and consolidated logic into `proxy.ts`.

---

## 🟢 Low Priority

### 8. Footer Visibility Logic
- **Status**: Stable
- **Description**: Footer should not appear on admin/dashboard pages.
- **Notes**: Working as intended, but ensure it doesn't block critical feedback on those pages.
