<p align="center">
  <img src="/api/placeholder/400/200" alt="LokAI Logo" width="300" />
  <h1 align="center">LokAI</h1>
  <p align="center">
    <strong>Advanced AI-Powered Exam Preparation Ecosystem for Nepal's Civil Service Aspirants</strong>
  </p>
</p>

<p align="center">
  <a href="#overview">Overview</a> •
  <a href="#key-features">Key Features</a> •
  <a href="#hybrid-ai-architecture">Hybrid AI Architecture</a> •
  <a href="#technical-tech-stack">Technical Stack</a> •
  <a href="#system-installation">Installation</a> •
  <a href="#database-schema">Database Design</a> •
  <a href="#authors">Authors</a>
</p>

---

## Overview

**LokAI** is a comprehensive, multi-tenant digital learning platform designed to solve the structural challenges faced by Nepal's government employees during career advancement exams (Lok Sewa). By integrating cutting-edge **Document Intelligence**, **Natural Language Processing (NLP)**, and **Structured Assessments**, LokAI transforms static policy documents into interactive, personalized study companion.

The platform provides a secure environment for organizations to manage employee training, schedule official mock tests, and track performance analytics using a unified, high-performance interface.

---

## Key Features

### 1. 📂 AI Document Workspace
Our flagship feature allows users to bridge the gap between reading and testing.
*   **Intelligent OCR**: Using Tesseract with specialized Nepali language training data, the system extracts high-fidelity text from low-quality scanned PDFs.
*   **Automatic Summarization**: Condenses extensive government policies (Ains, Niyams) into scannable summaries.
*   **MCQ Generation**: Automatically generates context-aware multiple-choice questions from uploaded text to facilitate active recall.

### 2. 📝 Official Mock Test System
Designed for institutional training and performance benchmarking.
*   **Admin Controls**: Organization admins can schedule tests with specific start/end times and question limits.
*   **Strict Proctored Logic**: Automated submission guards prevent attempts after the deadline.
*   **Instant Grading**: Real-time evaluation and score calculation with immediate categorical feedback.

### 3. 📊 Performance Analytics
*   **XP & Skill Tracking**: Gamified experience points based on quiz performance and study streaks.
*   **Categorical Breakdown**: Visualizes strengths and weaknesses across constitutional, geographic, and historical topics.
*   **Admin Dashboard**: Comprehensive visibility for organizations to monitor employee advancement.

---

## Hybrid AI Architecture

LokAI implements a sophisticated **Hybrid AI Strategy** to balance data privacy with high-performance inference.

### Local Processing Mode (Privacy-Focused)
For environments where data privacy is paramount, LokAI runs lightweight Large Language Models (LLMs) and transformer models locally on the server:
*   **Summarization**: `facebook/bart-large-cnn` fine-tuned for document abstraction.
*   **QG (Question Generation)**: `valhalla/t5-small-qg-hl` for structured MCQ creation.

### Cloud Processing Mode (Groq-Accelerated)
For high-speed, high-accuracy generation, LokAI integrates with the **Groq LPU (Language Processing Unit)**:
*   **Model**: `llama-3.3-70b-versatile`.
*   **Instant Responses**: Near-zero latency generation using Groq's high-throughput API.
*   **Advanced Prompts**: Custom system prompts ensure that generated questions are strictly formatted in JSON for direct database ingestion.

---

## Technical Tech Stack

### Frontend Architecture
*   **Framework**: Next.js 16 (App Router)
*   **Logic**: React 19 / TypeScript 5
*   **Styling**: Tailwind CSS 4 with custom Design Tokens
*   **Components**: Radix UI + shadcn/ui for accessibility
*   **State Management**: TanStack Query 5 (Server State)

### Backend Architecture
*   **Framework**: FastAPI (Async Python 3.10+)
*   **AI Engine**: PyTorch / Transformers / Groq SDK
*   **Image Processing**: Poppler (PDF-to-Image) / OpenCV
*   **OCR**: Tesseract 5.x (EN/NE support)

### Database & Security
*   **Storage**: PostgreSQL (hosted on Supabase)
*   **Security**: Row Level Security (RLS) ensures that data is isolated between different government organizations.
*   **Auth**: Supabase Auth (Google OAuth + Email/Password)

---

## Database Design

The database enforces a strict **Multi-Tenant Model** using Supabase RLS policies:

| Table | Access Control (RLS) Logic |
|---|---|
| `users` | Users can only see their own profile; Org Admins can view members. |
| `mock_tests` | Visible only to employees within the assigned organization. |
| `quiz_attempts` | Employees see their history; Org Admins see results for their organization. |
| `personal_documents` | Private to the owner; never shared between users. |

---

## System Installation

### Prerequisites
*   Node.js ≥ 18.0
*   Python ≥ 3.10
*   Tesseract OCR (Windows Path: `C:\Program Files\Tesseract-OCR\tesseract.exe`)
*   Poppler (Windows Path: `C:\poppler-24.08.0\Library\bin`)

### Local Setup Steps

1.  **Clone & Install**:
    ```bash
    git clone https://github.com/nischal-shrestha/lokai.git
    cd lokai/Development
    ```

2.  **Frontend Setup**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

3.  **Backend Setup**:
    ```bash
    cd backend
    python -m venv venv
    venv\Scripts\activate
    pip install -r requirements.txt
    ```

4.  **Environment Configuration**:
    Configure your `.env` with:
    - `SUPABASE_URL` & `SUPABASE_ANON_KEY`
    - `GROQ_API_KEY` (for Cloud AI mode)
    - `TESSERACT_CMD` path.

---

## Future Roadmap
*   **Mobile App Implementation**: React Native application for offline studying.
*   **Advanced OCR**: Deep-learning based Nepali handwriting recognition.
*   **Mock Test Procting**: Real-time browser monitoring and tab-switch detection.

---

## Authors
**Student Name**: Nischal Shrestha  
**Program / Department**: Computing with AI  
**University / College Name**: Islington College  

---

## License
This project is developed as a **Final Year Project** for academic evaluation at Islington College. All rights reserved.
