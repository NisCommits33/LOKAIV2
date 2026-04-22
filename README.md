# LokAI - AI-Powered Government Employee Exam Preparation Platform

## Project Title
**LokAI** - Advanced AI-Powered Exam Preparation Ecosystem for Nepal's Civil Service Aspirants

## Project Description
LokAI is a comprehensive, multi-tenant digital learning platform designed to transform government employees' exam preparation. The system provides features such as AI-powered document processing, automated quiz generation, mock test scheduling, performance analytics, and organization-wide employee management. The platform supports multiple user roles with secure authentication, real-time collaboration, and tiered subscription management.

**Key Objective**: Empower government employees to prepare for career advancement exams (Lok Sewa) through intelligent document processing, AI-powered learning tools, and comprehensive performance tracking.

---

## Project Objective

The main objectives of this project are to:

1. **Democratize Exam Preparation**: Provide affordable, accessible AI-powered exam preparation tools to government employees across Nepal.
2. **Optimize Study Materials**: Transform static government documents into interactive, searchable study materials with AI-generated summaries and quizzes.
3. **Track Performance**: Offer comprehensive analytics to help users identify weak areas and improve exam readiness.
4. **Streamline Administration**: Provide organization administrators with tools to manage users, documents, mock tests, and performance metrics at scale.
5. **Enable Scalability**: Design a multi-tenant architecture that supports government organizations of any size.

---

## Features

The system provides the following features:

### Core User Features
- **Secure Authentication**: Google OAuth and email/password login with full password recovery support
- **Employee Verification**: Secure verification workflow for government organization employees
- **Personal Document AI Workspace**: Upload PDF documents for automated OCR, AI summarization, and MCQ generation
- **AI-Powered Summarization**: BART transformer model generates concise, exam-relevant summaries
- **AI-Powered Quiz Generation**: T5 transformer model automatically creates multiple-choice questions (MCQs)
- **Organization Document Repository**: Access official organization documents with hierarchical tagging
- **General Knowledge (GK) Quizzes**: Pre-seeded quizzes covering constitution, geography, and current affairs
- **Institutional Mock Tests**: Timed mock tests with configurable time limits and attempt caps
- **Performance Analytics**: Real-time analytics showing accuracy, readiness scores, and weak areas
- **Progress Tracking**: Personalized dashboard with performance trends and study recommendations
- **Dark/Light Theme Support**: Theme toggle with user preference persistence
- **Mobile-Responsive Design**: Fully responsive interface optimized for smartphones

### Admin Features
- **User Management**: Verify employee registrations and manage organizational users
- **Document Management**: Upload and publish organization documents with hierarchical tagging
- **Mock Test Scheduling**: Create and schedule timed mock tests for employees
- **Analytics Dashboard**: View aggregated analytics and employee performance metrics
- **Billing Management**: Manage tiered subscription plans and payment integration
- **Department Management**: Create and manage departments and job levels

### Super Admin Features
- **Organization Management**: Approve, reject, and manage organization registrations
- **Platform Analytics**: View platform-wide metrics and statistics
- **GK Quiz Management**: Manage general knowledge quiz content
- **User Management**: Manage all users across all organizations
- **Audit Logs**: Track system activities and user actions
- **Billing Oversight**: Manage invoices and subscription plans
- **System Settings**: Configure platform-wide settings and maintenance tools

---

## Technologies Used

### Frontend
- **Framework**: Next.js 16 (App Router) with React 19 & TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui component library
- **State Management**: TanStack Query 5 (Server State Management)
- **UI Components**: Radix UI + shadcn/ui (20+ components)
- **Animations**: Framer Motion
- **Charts**: Recharts (analytics and data visualization)
- **Form Validation**: React Hook Form + Zod
- **Notifications**: Sonner (toast notifications)

### Backend / BaaS
- **Framework**: Next.js 16 API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Google OAuth, Email/Password)
- **Storage**: Supabase Storage (PDF and document storage)
- **Security**: Row-Level Security (RLS) policies for multi-tenant data isolation
- **Database Triggers**: Automated user creation and data management

### AI/ML Services
- **Framework**: FastAPI (Python 3.10+)
- **OCR**: Tesseract 5.x (English and Nepali language support)
- **Summarization Model**: BART (facebook/bart-large-cnn)
- **Quiz Generation Model**: T5 (valhalla/t5-small-qg-hl)
- **AI Inference**: Groq API (llama-3.3-70b-versatile) for high-speed generation
- **PDF Processing**: Poppler (PDF-to-Image conversion)
- **Image Processing**: OpenCV

### Payments & Billing
- **Payment Gateway**: Khalti (Nepal payment integration)
- **Subscription Management**: Tiered plans (Free, Basic, Premium)
- **Invoice Generation**: Automated invoice creation and history

### Deployment & DevOps
- **Frontend Hosting**: Vercel / Netlify
- **Backend Hosting**: Render / Railway
- **Database Hosting**: Supabase Cloud
- **CDN**: Vercel Edge Network
- **CI/CD**: GitHub Actions

---

## System Requirements

### Hardware
- **Client**: Computer or smartphone with modern processor
- **Server**: Minimum 2GB RAM, 10GB storage for database and uploads
- **Internet**: Stable internet connection required

### Software

#### For Users
- **Web Browser**: Google Chrome, Firefox, Safari, or Edge (latest versions)
- **OS**: Windows, macOS, Linux, or mobile OS (iOS/Android)

#### For Developers
- **Node.js**: Version 18.0 or higher
- **Python**: Version 3.10 or higher
- **npm**: Version 9.0 or higher
- **Git**: For version control
- **Tesseract OCR**: Windows: `C:\Program Files\Tesseract-OCR\tesseract.exe`
- **Poppler**: Windows: `C:\poppler-24.08.0\Library\bin`
- **PostgreSQL**: For local database testing (optional, Supabase handles cloud DB)

---

## Installation and Setup

### Prerequisites Installation

1. **Install Node.js & npm**:
   - Download from https://nodejs.org/
   - Verify installation: `node --version` and `npm --version`

2. **Install Python**:
   - Download from https://www.python.org/
   - Verify installation: `python --version`

3. **Install Git**:
   - Download from https://git-scm.com/
   - Verify installation: `git --version`

4. **Install Tesseract OCR** (Windows):
   ```bash
   # Download installer from: https://github.com/UB-Mannheim/tesseract/wiki
   # Run the installer and note the installation path
   ```

5. **Install Poppler** (Windows):
   ```bash
   # Download from: https://github.com/oschwartz10612/poppler-windows/releases/
   # Extract to C:\poppler-24.08.0\
   ```

### Steps to Run the Project Locally

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/username/lokai.git
   cd lokai/Development
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   ```
   
   Create `.env.local` file:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```
   
   Run the frontend:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:3000`

3. **Backend Setup**:
   ```bash
   cd ../backend
   python -m venv venv
   
   # Activate virtual environment
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   
   pip install -r requirements.txt
   ```
   
   Create `.env` file:
   ```bash
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_service_role_key
   GROQ_API_KEY=your_groq_api_key
   TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
   POPPLER_PATH=C:\poppler-24.08.0\Library\bin
   ```
   
   Run the backend:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The backend will be available at `http://localhost:8000`

4. **Verify Installation**:
   - Frontend: Navigate to `http://localhost:3000`
   - Backend API: Navigate to `http://localhost:8000/docs` for Swagger documentation

---

## Live Project

**Live URL**: https://yourliveurl.com  
**Backend API**: https://yourapi.com/api  
**Documentation**: https://yourdocs.com

(Update these URLs with your actual deployment links)

---

## Project Structure

```
Development/
│
├── frontend/
│   ├── src/
│   │   ├── app/               # Next.js App Router pages & layouts
│   │   │   ├── (auth)/        # Authentication pages (login, register)
│   │   │   ├── dashboard/     # User dashboard pages
│   │   │   ├── admin/         # Organization admin pages
│   │   │   ├── super-admin/   # Super admin pages
│   │   │   └── layout.tsx     # Root layout wrapper
│   │   ├── components/        # Reusable React components
│   │   │   ├── auth/          # Authentication components
│   │   │   ├── dashboard/     # Dashboard components
│   │   │   ├── forms/         # Form components
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   └── analytics/     # Chart and analytics components
│   │   ├── lib/               # Utilities, hooks, API clients
│   │   │   ├── supabase/      # Supabase clients (client, server, admin)
│   │   │   ├── payments/      # Khalti payment integration
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   └── utils.ts       # Shared utility functions
│   │   ├── styles/            # Global Tailwind CSS styles
│   │   └── types/             # TypeScript type definitions
│   ├── public/                # Static assets (images, fonts, icons)
│   ├── package.json           # Frontend dependencies
│   ├── tsconfig.json          # TypeScript configuration
│   ├── next.config.ts         # Next.js configuration
│   ├── tailwind.config.ts     # Tailwind CSS configuration
│   ├── vitest.config.ts       # Testing configuration
│   ├── components.json        # shadcn/ui components registry
│   └── README.md              # Frontend-specific documentation
│
├── backend/
│   ├── app/
│   │   ├── api/               # FastAPI route handlers
│   │   │   ├── documents.py   # Document processing routes
│   │   │   ├── quizzes.py     # Quiz generation routes
│   │   │   ├── tests.py       # Mock test routes
│   │   │   └── health.py      # Health check routes
│   │   ├── models/            # Database models & schemas
│   │   ├── services/          # Business logic services
│   │   └── utils/             # Utility functions
│   ├── ai_engine/             # AI/ML processing modules
│   │   ├── ocr.py             # Tesseract OCR processing
│   │   ├── summarization.py   # BART summarization model
│   │   ├── qg.py              # T5 question generation
│   │   └── groq_client.py     # Groq API integration
│   ├── poppler-24.08.0/       # Poppler PDF processing library
│   ├── requirements.txt       # Python dependencies
│   ├── main.py                # FastAPI application entry point
│   ├── .env                   # Environment variables
│   └── README.md              # Backend-specific documentation
│
└── README.md                  # This file (project root documentation)
```

---

## Screenshots

### Login Page
- Clean, intuitive login interface with Google OAuth integration
- Email/password login option
- Password recovery flow

### User Dashboard
- Personalized dashboard with GK quizzes
- Upload personal documents
- View verification status
- Access to AI document workspace

### AI Document Workspace
- Split-view interface showing:
  - Original document viewer
  - AI-generated summaries
  - Chapter segmentation
  - Generated quiz questions
- Real-time processing feedback

### Organization Admin Dashboard
- User management and verification panel
- Document upload and publishing interface
- Mock test scheduling interface
- Analytics and performance charts
- Subscription and billing management

### Performance Analytics
- Accuracy breakdown by topic
- Readiness score visualization
- Weak area identification
- Performance trends over time
- Comparative analytics

### Mobile-Responsive Design
- Full functionality on smartphones
- Optimized touch interfaces
- Responsive layout across all screen sizes

---

## Future Improvements

Planned enhancements for the LokAI platform:

- **Mobile Application**: React Native app for offline studying and mobile-first experience
- **Advanced OCR**: Deep learning-based Nepali handwriting recognition
- **Mock Test Proctoring**: Real-time browser monitoring and tab-switch detection
- **Collaborative Study Groups**: Peer-to-peer study features and group discussions
- **Personalized Learning Path**: AI-generated custom study plans based on performance
- **Video Tutorials**: Integrated video content for complex topics
- **Offline Mode**: Download documents and quizzes for offline access
- **Multi-language Support**: Expanded language support beyond English and Nepali
- **Advanced Analytics**: Comparative benchmarking and predictive success rates
- **Integration with LMS**: Seamless integration with Learning Management Systems

---

## Authors

**Student Name**: Nischal Shrestha  
**Program / Department**: Bachelor of Computing with AI  
**University / Institution**: Nepal-based Institution

**Advisor / Supervisor**: [Advisor Name]  
**Institution**: [Institution Name]

---

## License

This project is created for educational purposes as part of a Final Year Project in the Bachelor of Computing with AI program. All rights are reserved. Usage of this software for commercial purposes requires explicit permission from the creators.

---

## Contact & Support

For questions, issues, or contributions, please contact:
- **Email**: nischal.shrestha@example.com
- **GitHub**: https://github.com/username/lokai
- **Documentation**: Check the `FIle/` directory for detailed documentation

---

## Acknowledgments

- **Supabase** for database and authentication services
- **FastAPI** for the AI microservice framework
- **Tesseract & Poppler** for OCR and PDF processing
- **Groq** for high-speed LLM inference
- **shadcn/ui** for accessible UI components
- **Nepal-based Government Organizations** for use case validation

---

**Last Updated**: April 2026  
**Version**: 1.0.0
**University / College Name**: Islington College  

---

## License
This project is developed as a **Final Year Project** for academic evaluation at Islington College. All rights reserved.
