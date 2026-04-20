================================================================================
LOKAI - ADVANCED PROJECT DOCUMENTATION (TEXT VERSION)
================================================================================

PROJECT TITLE: LokAI
STUDENT: Nischal Shrestha
COLLEGE: Islington College
PROGRAM: Computing with AI

--------------------------------------------------------------------------------
1. MISSION STATEMENT
--------------------------------------------------------------------------------
LokAI provides an AI-powered ecosystem for Nepal's civil service aspirants. 
It automates the transformation of complex policy documents into study-ready 
summaries and quizzes, while offering a standardized mock test management
system for government organizations.

--------------------------------------------------------------------------------
2. HYBRID AI ARCHITECTURE (EXTREME DETAIL)
--------------------------------------------------------------------------------
LokAI uses a dual-engine architecture for maximum flexibility:

A. LOCAL ENGINE (PRIVACY-FIRST)
   - Summarization: facebook/bart-large-cnn
   - QG: valhalla/t5-small-qg-hl
   - OCR: Tesseract 5.x with Nepali/English dictionary support

B. CLOUD ENGINE (PERFORMANCE-FIRST)
   - API: Groq Cloud (Ultra Low Latency)
   - Model: Llama-3.3-70b-versatile
   - Implementation: Uses custom JSON system prompts to generate 100% 
     structured MCQ data that is instantly injectable into the database.

--------------------------------------------------------------------------------
3. CORE SYSTEM FEATURES
--------------------------------------------------------------------------------
1. AI DOCUMENT INTELLIGENCE:
   - PDF upload handling via Poppler.
   - OCR text extraction for bilingual documents.
   - Contextual chunking for long-form summarization.

2. MOCK TEST SYSTEM:
   - Institutional scheduling (Start/End times).
   - Automated proctored logic (Rejects late submissions).
   - Instant categorical feedback and XP rewards.

3. MULTI-TENANT RBAC:
   - Super Admin: Full platform oversight.
   - Org Admin: Manage organization-specific users, tests, and analytics.
   - Employee: Secure studying, personal documents, and assigned tests.

--------------------------------------------------------------------------------
4. DATABASE & SECURITY DESIGN
--------------------------------------------------------------------------------
- Platform: PostgreSQL hosted on Supabase.
- Security: Extensive Row Level Security (RLS) policies.
- Isolation: Ensures that sensitive ministry data never leaks to unauthorized
           personnel or other organizations.

--------------------------------------------------------------------------------
5. TECHNICAL STACK
--------------------------------------------------------------------------------
- FRONTEND: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion.
- BACKEND: FastAPI (Python 3.10+), Groq SDK, PyTorch, OpenCV.
- TOOLS: Tesseract, Poppler, Vitest, MSW, Sonner.

--------------------------------------------------------------------------------
6. LOCAL INSTALLATION GUIDE
--------------------------------------------------------------------------------
1. PREREQUISITES:
   - Install Tesseract (C:\Program Files\Tesseract-OCR\tesseract.exe)
   - Install Poppler (C:\poppler-24.08.0\Library\bin)
   - Node.js 18+ and Python 3.10+

2. BACKEND SETUP:
   cd backend
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000

3. FRONTEND SETUP:
   cd frontend
   npm install
   npm run dev

--------------------------------------------------------------------------------
7. FUTURE roadmap
--------------------------------------------------------------------------------
- Development of a native mobile application.
- Advanced predictive analytics for student performance.
- Implementation of handwriting-compatible Nepali OCR.

--------------------------------------------------------------------------------
LICENSE: Developed for Final Year Project (FYP) at Islington College.
--------------------------------------------------------------------------------
================================================================================
