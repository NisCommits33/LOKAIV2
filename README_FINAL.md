<p align="center">
  <h1 align="center">LokAI - Project Report Documentation</h1>
  <p align="center">
    <strong>Final Year Project: Computing with AI</strong>
  </p>
</p>

---

## 1. Project Overview
**LokAI** is a high-performance educational platform designed specifically for Nepal's government employees. It solves the challenge of modernizing civil service exam preparation by providing AI-driven tools for document analysis, automatic question generation, and structured mock test simulations.

---

## 2. Technical Architecture & Hybrid AI
LokAI features a unique **Hybrid AI Pipeline** that allows for both local and cloud-based processing:

### A. Local AI Processing (Privacy & Offline)
*   **OCR Engine**: Tesseract OCR for dual-language (Nepali/English) text extraction.
*   **Summarization**: BART-Large transformer model.
*   **Question Generation**: T5 Model for automatic MCQ creation.

### B. Cloud AI Processing (Groq Acceleration)
*   **API Platform**: Groq SDK for ultra-low latency inference.
*   **Primary Model**: Llama-3.3-70b-versatile.
*   **Functionality**: Instant generation of premium quality summaries and context-aware exam questions with structured JSON output.

---

## 3. Detailed Feature Breakdown

### 📂 AI Document Intelligence
The system processes government PDF documents through a multi-stage pipeline:
1.  **Extraction**: PDF images are converted to text using Tesseract.
2.  **Structuring**: Raw text is cleaned and segmented.
3.  **Synthesis**: AI models generate key-point summaries and related test questions.

### 📝 Mock Test ecosystem
*   **Admin Management**: Admins can assign specific quizzes to their organization as official Mock Tests.
*   **Test Scheduling**: Features strict `start_time` and `end_time` logic.
*   **Attempt Guarding**: The system automatically disables "Start" buttons and rejects submissions after the deadline.

### 📊 Real-time Analytics
*   Tracks user progress through Experience Points (XP).
*   Categorizes mastery levels across Constitution, History, Geography, and Law.

---

## 4. Technology Selection
*   **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4.
*   **Backend**: FastAPI (Python), PyTorch, OpenCV, Poppler.
*   **Database**: PostgreSQL / Supabase with Row Level Security (RLS).
*   **Authentication**: Google OAuth 2.0.

---

## 5. Implementation Details (Database RLS)
To ensure multi-tenant security, the system uses the following Postgres policies:
*   `allow_users_read_own`: Users can only access their specific documents.
*   `allow_admins_view_attempts`: Organization Admins can monitor the scores of users within their own organization only.
*   `restrict_cross_org_access`: Prevents data leaking between different government ministries.

---

## 6. System Requirements & Setup

### Requirements
*   **OS**: Windows 10/11
*   **Environment**: Node.js 18+, Python 3.10+
*   **Dependencies**: Tesseract OCR, Poppler-utils.

### Local Installation
1.  **Backend**: Install requirements.txt and configure `.env` with Supabase and Groq keys.
2.  **Frontend**: Run `npm install` and start the Next.js dev server.

---

## 7. Authorship & Declaration
**Student Name**: Nischal Shrestha  
**Student ID**: [Your ID if applicable]  
**Program**: B.Sc. (Hons) Computing with AI  
**College**: Islington College  
**University**: [Partner University Name]  

---

## 8. License & Usage
This project is submitted as part of the Final Year Project (FYP) requirement. It is intended for academic evaluation and community educational support.
