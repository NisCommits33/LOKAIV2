# LokAI

## Short Description
LokAI is an AI-powered full-stack platform designed to modernize exam preparation for Nepal's civil service (Lok Sewa) aspirants. The system combines document intelligence, automated question generation, and a structured mock test ecosystem to provide a comprehensive study experience tailored to the Nepali public service context.

## Project Objective
The main objective of this project is to develop a centralized, AI-driven environment that solves the problem of fragmented study materials and manual question preparation. By automating text extraction and MCQ generation from government policy documents, the system improves the efficiency and user experience of government employees preparing for career advancement.

## Features
The system provides the following features:
*   **User Registration & Authentication**: Secure sign-in via Google OAuth and organization-specific credentials.
*   **Institutional Dashboard**: Role-based access for Employees, Organization Admins, and Super Admins.
*   **Personal Document Intelligence**: Upload PDFs to extract text (OCR), generate AI summaries, and create custom MCQ quizzes.
*   **GK Quiz Engine**: Categorized general knowledge quizzes covering the Nepal Constitution, History, and Geography.
*   **Official Mock Tests**: Scheduled assessments assigned by organizations with strict deadline enforcement.
*   **Analytics & Reporting**: Detailed performance tracking with exportable result summaries.
*   **Secure Multi-tenant System**: Department and job-level access control with robust RLS policies.
*   **Secure Logout**: Complete session management and secure logout system.

## Technologies Used

### Frontend
*   **Next.js 16**: React framework with App Router.
*   **React 19**: Modern UI library.
*   **TypeScript**: Static type checking.
*   **Tailwind CSS 4**: Utility-first styling.
*   **Framer Motion**: For smooth UI transitions and animations.

### Backend
*   **FastAPI**: High-performance Python async framework.
*   **Tesseract OCR**: For English and Nepali text extraction.
*   **HuggingFace Models**: BART for summarization and T5 for question generation.

### Database
*   **PostgreSQL (Supabase)**: Relational database with Row-Level Security.
*   **Supabase Auth**: Social and email-based authentication.

### Deployment
*   **Vercel**: For the frontend application.
*   **Docker**: For containerized backend deployment.

## System Requirements

### Hardware
*   Computer or smartphone with an active internet connection.
*   Minimum 4GB RAM (for optimal browser performance).

### Software
*   Modern Web browser (Google Chrome, Firefox, or Safari).
*   **Node.js ≥ 18.x** (if running locally).
*   **Python ≥ 3.10** (if running locally).

## Installation and Setup

### 1. Clone the repository
```bash
git clone https://github.com/username/lokai.git
cd lokai/Development
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Live Project
Live URL of the deployed system:
[https://your-lokai-link.com](https://your-lokai-link.com)

## Project Structure
```
lokai/
│ 
├── frontend/               # Next.js Application
├── backend/                # FastAPI AI Microservice
├── migrations/             # SQL Database Scripts
├── documentation/          # UML and Project Reports
└── README.md               # Main Documentation
```

## Screenshots
*   **Login Page**: [Link to Screenshot]
*   **Dashboard**: [Link to Screenshot]
*   **Mock Test Interface**: [Link to Screenshot]
*   **AI Document Workspace**: [Link to Screenshot]

## Future Improvements
*   **Mobile Application**: Developing native iOS and Android versions.
*   **Advanced Analytics**: AI-driven predictive performance scoring.
*   **Improved Nepali OCR**: Enhancing accuracy for hand-written documents.
*   **Interactive Study Groups**: Real-time collaborative learning environments.

## Authors
**Student Name**: Nischal Shrestha
**Program / Department**: Computing with AI
**University / College Name**: Islington college

## License
This project is created for educational purposes as part of a Final Year Project.
