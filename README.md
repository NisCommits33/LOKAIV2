<p align="center">
  <h1 align="center">LokAI</h1>
  <p align="center">
    AI-Powered Exam Preparation Platform for Nepal Government Employees
  </p>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#database">Database</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#testing">Testing</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

---

## Overview

**LokAI** is a full-stack platform designed to help Nepal's civil service (Lok Sewa) aspirants prepare for government exams. It combines AI-powered document intelligence with a structured quiz system, institutional access controls, and analytics — all tailored to the Nepali public service context.

The platform supports multiple organizations (ministries, commissions), role-based access (employees, org admins, super admins), and integrates AI services for OCR, summarization, and automatic question generation from study materials.

## Features

- **Google OAuth Authentication** — Secure sign-in via Supabase Auth with automatic user provisioning
- **Institutional RBAC** — Multi-tenant architecture with organization, department, and job-level hierarchies
- **Organization Self-Registration** — Multi-step application flow with document upload and super admin approval
- **Employee Verification** — Org admins verify employees before granting platform access
- **GK Quiz Engine** — Categorized general knowledge quizzes (Nepal Constitution, History, Geography, Current Affairs) with difficulty levels, timers, and XP rewards
- **Personal Document Intelligence** — Upload PDFs → OCR text extraction → AI summarization → automatic MCQ generation
- **Organization Documents** — Shared study materials at the institutional level
- **Analytics Dashboard** — Quiz performance tracking, study streaks, category breakdowns, and exportable PDF reports
- **Subscription & Billing** — Tiered plans with Khalti payment gateway integration
- **Dark Mode** — Full theme support via `next-themes`
- **Nepali Language Support** — OCR with Tesseract supporting both English and Nepali scripts

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| [Next.js 16](https://nextjs.org/) | React framework (App Router, Server Components) |
| [React 19](https://react.dev/) | UI library |
| [TypeScript 5](https://www.typescriptlang.org/) | Type safety |
| [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) | Accessible component primitives |
| [Framer Motion](https://www.framer.com/motion/) | Animations & transitions |
| [TanStack Query 5](https://tanstack.com/query) | Server state management & caching |
| [React Hook Form](https://react-hook-form.com/) + [Zod 4](https://zod.dev/) | Form handling & validation |
| [Recharts](https://recharts.org/) | Data visualisation |
| [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/nextjs) | Auth & database client |
| [Sonner](https://sonner.emilkowal.dev/) | Toast notifications |
| [Lucide React](https://lucide.dev/) | Icon library |

### Backend

| Technology | Purpose |
|---|---|
| [FastAPI](https://fastapi.tiangolo.com/) | Python async web framework |
| [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) | Text extraction (English + Nepali) |
| [facebook/bart-large-cnn](https://huggingface.co/facebook/bart-large-cnn) | Text summarisation |
| [valhalla/t5-small-qg-hl](https://huggingface.co/valhalla/t5-small-qg-hl) | MCQ generation |
| [Groq](https://groq.com/) | Cloud AI inference (optional) |
| [Poppler](https://poppler.freedesktop.org/) | PDF rendering & conversion |

### Infrastructure

| Technology | Purpose |
|---|---|
| [Supabase](https://supabase.com/) | PostgreSQL database, Auth, Storage, RLS |
| [Docker](https://www.docker.com/) | Backend containerisation |
| [Vitest](https://vitest.dev/) + [MSW](https://mswjs.io/) | Unit & integration testing |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Client                           │
│                  Next.js 16 (App Router)                │
│          SSR / RSC / Client Components                  │
└──────────────┬──────────────────────┬───────────────────┘
               │                      │
               ▼                      ▼
┌──────────────────────┐  ┌───────────────────────────────┐
│   Supabase Platform  │  │    FastAPI AI Backend         │
│  ┌────────────────┐  │  │  ┌─────────────────────────┐  │
│  │  PostgreSQL DB  │  │  │  │  OCR Service            │  │
│  │  (+ RLS)       │  │  │  │  (Tesseract EN/NE)      │  │
│  ├────────────────┤  │  │  ├─────────────────────────┤  │
│  │  Auth (OAuth)  │  │  │  │  Summarisation Service   │  │
│  ├────────────────┤  │  │  │  (BART-large-CNN)       │  │
│  │  Storage       │  │  │  ├─────────────────────────┤  │
│  │  (Documents)   │  │  │  │  Question Generation     │  │
│  └────────────────┘  │  │  │  (T5-small-qg-hl)       │  │
└──────────────────────┘  │  └─────────────────────────┘  │
                          └───────────────────────────────┘
```

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **Python** ≥ 3.10
- **Supabase** account ([supabase.com](https://supabase.com))
- **Tesseract OCR** installed ([installation guide](https://github.com/tesseract-ocr/tesseract#installing-tesseract))
- **Poppler** installed (for PDF processing)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/lokai.git
cd lokai/Development
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

Add your Supabase credentials to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

```bash
# Start development server
npm run dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000).

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
```

Configure `.env` with your credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
FRONTEND_URL=http://localhost:3000
RATE_LIMIT=100/minute
SUMMARIZATION_MODEL=facebook/bart-large-cnn
QG_MODEL=valhalla/t5-small-qg-hl
MAX_INPUT_LENGTH=1024
```

```bash
# Start the API server
uvicorn app.main:app --reload --port 8000
```

The API will be available at [http://localhost:8000](http://localhost:8000).  
Interactive docs at [http://localhost:8000/docs](http://localhost:8000/docs).

### 4. Database Setup

Run the migration scripts in the Supabase SQL Editor in order:

```bash
migrations/
├── 000_run_all.sql          # Or run this single file to execute all base migrations
├── 001_org_applications.sql
├── 002_seed_super_admin.sql
├── ...
└── 019_fix_dept_joblevel_rls.sql
```

Alternatively, paste the contents of `000_run_all.sql` into the **Supabase SQL Editor** to run all base migrations at once.

### 5. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID
3. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
4. In your Supabase Dashboard → Authentication → Providers → Google, enter the Client ID and Secret

## Project Structure

```
Development/
├── frontend/                       # Next.js full-stack application
│   ├── src/
│   │   ├── app/                    # App Router pages & API routes
│   │   │   ├── layout.tsx          # Root layout (providers, fonts)
│   │   │   ├── page.tsx            # Landing page with interactive quiz
│   │   │   ├── login/              # Auth pages (Google OAuth + org login)
│   │   │   ├── dashboard/          # User dashboard & quiz interface
│   │   │   ├── admin/              # Organization admin panel
│   │   │   ├── super-admin/        # Platform-wide management
│   │   │   ├── profile-setup/      # Post-signup profile completion
│   │   │   ├── pending-approval/   # Verification waiting page
│   │   │   ├── auth/callback/      # OAuth callback handler
│   │   │   └── api/                # Next.js API routes
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn/ui primitives (button, input, etc.)
│   │   │   ├── layout/             # Header, Footer, Sidebar, Container
│   │   │   ├── providers/          # Auth, Query, Theme context providers
│   │   │   ├── shared/             # Reusable selectors (org, dept, job level)
│   │   │   ├── quiz/               # Quiz components
│   │   │   └── analytics/          # Chart & analytics components
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/
│   │   │   ├── supabase/           # Client, server, admin Supabase instances
│   │   │   ├── payments/           # Khalti integration
│   │   │   └── utils.ts            # Shared utilities
│   │   ├── types/
│   │   │   └── database.ts         # Database type definitions
│   │   └── __tests__/              # Test suites
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── next.config.ts
│
├── backend/                        # FastAPI AI microservice
│   ├── app/
│   │   ├── main.py                 # Entry point, CORS, rate limiting
│   │   ├── config.py               # Pydantic settings
│   │   ├── schemas.py              # Request/response models
│   │   ├── routes/                 # API endpoints (OCR, summarize, questions)
│   │   ├── services/               # AI service modules
│   │   └── utils/                  # Shared utilities
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
└── migrations/                     # Supabase SQL migration scripts
    ├── 000_run_all.sql
    ├── 001_org_applications.sql
    └── ...019_fix_dept_joblevel_rls.sql
```

## Database

### Schema Overview

| Table | Description |
|---|---|
| `organizations` | Registered government bodies with approval workflow |
| `departments` | Departments within organizations |
| `job_levels` | Hierarchical job positions per organization |
| `users` | User profiles linked to `auth.users` (roles: public, employee, org_admin, super_admin) |
| `organization_applications` | Self-service org registration applications |
| `personal_documents` | User-uploaded study materials with AI processing status |
| `gk_quizzes` | General knowledge quizzes with categories & difficulty |
| `quiz_attempts` | User quiz scores and answer history |
| `subscription_plans` | Available billing tiers |
| `organization_subscriptions` | Active org subscriptions |
| `payment_transactions` | Khalti payment records |

### Row-Level Security

All tables enforce **RLS policies**:

- Users can only read/update their own profile
- Org admins manage users within their organization
- Super admins have platform-wide access
- Public tables (organizations, departments, job levels) are read-accessible for dropdown selectors

## API Reference

### Frontend API Routes (Next.js)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/organizations` | List active organizations |
| `GET` | `/api/departments?org_id=` | Departments by organization |
| `GET` | `/api/job-levels?org_id=` | Job levels by organization |
| `GET` | `/api/users/profile` | Current user profile with joins |
| `PUT` | `/api/users/profile` | Update user profile |
| `GET` | `/api/users/verification-status` | Verification status |
| `GET` | `/auth/callback` | OAuth code exchange |

### Backend API Routes (FastAPI)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health check |
| `POST` | `/api/ai/ocr` | Extract text from uploaded PDF |
| `POST` | `/api/ai/summarize` | Summarise extracted text |
| `POST` | `/api/ai/questions` | Generate MCQs from text |
| `POST` | `/api/ai/process` | Full pipeline: OCR → Summarize → Questions |

## Testing

### Frontend

```bash
cd frontend

# Run unit tests
npm test

# Run tests in watch mode
npx vitest --watch

# Run with coverage
npx vitest --coverage
```

Tests use **Vitest** with **jsdom** environment and **MSW** for API mocking.

### Backend

```bash
cd backend
python -m pytest
```

## Deployment

### Frontend (Vercel)

1. Connect the `frontend/` directory to [Vercel](https://vercel.com)
2. Set environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Deploy — Vercel auto-detects Next.js

### Backend (Docker)

```bash
cd backend
docker build -t lokai-backend .
docker run -p 8000:8000 --env-file .env lokai-backend
```

## Design System

| Token | Value | Usage |
|---|---|---|
| Primary | `#0F172A` (slate-900) | Headings, buttons, sidebar |
| Accent | `#6366F1` (indigo-500) | Interactive highlights, CTAs |
| Surface | `#FFFFFF` | Backgrounds |
| Border | `#F1F5F9` (slate-100) | Dividers, card borders |
| Muted | `#64748B` (slate-500) | Secondary text |
| Destructive | `#EF4444` (red-500) | Error states |
| Radius | `0.75rem` (12px) | Default border radius |
| Font (Body) | Inter | All text |
| Font (Code) | JetBrains Mono | Code blocks, monospace |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `refactor:` — Code refactoring
- `test:` — Adding or updating tests
- `chore:` — Maintenance tasks

## License

This project is developed as a **Final Year Project** (FYP) for academic purposes.

---

<p align="center">
  Built with care for Nepal's civil service community.
</p>
