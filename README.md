# Adani QueryAI 🚀

Adani QueryAI is a production-grade, multimodal Retrieval-Augmented Generation (RAG) platform designed to transform complex documents (PDFs, reports, financial statements) into interactive, searchable, and insightful knowledge bases. 

Built with a high-performance **FastAPI** backend and a sleek **Next.js 14** frontend, Adani QueryAI leverages **Google Gemini** for state-of-the-art reasoning and **ChromaDB** for efficient hybrid retrieval.

---

## ✨ Key Features

- 🧠 **Multimodal RAG Pipeline**: Chat with your documents using a combination of text and visual context.
- 🔍 **Hybrid Search & RRF**: Combines semantic vector search (ChromaDB) with keyword search (BM25) using **Reciprocal Rank Fusion (RRF)** for superior accuracy.
- 📊 **Smart Table Parsing**: Specialized hierarchical extraction of complex tabular data into entity-centric chunks.
- 📝 **Automated Summarization**: Instant, AI-generated summaries for long-form documents.
- 📍 **Precise Citations**: Every answer is grounded with document-specific citations (page numbers and chunk IDs).
- 🎨 **Premium UI/UX**: Responsive dashboard built with Next.js, Tailwind CSS, and Framer Motion animations.
- ☁️ **Cloud Integration**: Seamless file handling with Cloudinary and Firebase support.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS, Lucide Icons, Framer Motion
- **State Management**: Zustand
- **Database/ORM**: Prisma + PostgreSQL
- **PDF Viewing**: Adobe PDF Embed SDK / PDF.js

### Backend
- **Framework**: FastAPI
- **LLM**: Google Gemini 1.5 Pro/Flash, Groq (optional)
- **Vector Store**: ChromaDB
- **Retrieval**: BM25 + Vector Search (Hybrid)
- **PDF Engine**: PyMuPDF (fitz)
- **Orchestration**: LangChain

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL
- API Keys: Google Gemini, Cloudinary, Firebase (optional)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables in `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_key
   GROQ_API_KEY=your_groq_key
   # Other keys as needed by your specific modules
   ```
5. Run the server:
   ```bash
   python main.py
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env.local`:
   ```env
   # Backend API
   NEXT_PUBLIC_API_URL=http://localhost:8000

   # Database (Supabase/PostgreSQL)
   DATABASE_URL=your_database_url
   DIRECT_URL=your_direct_url

   # Cloudinary
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Firebase
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   # ... (other firebase vars)

   # Adobe PDF Embed SDK
   NEXT_PUBLIC_ADOBE_CLIENT_ID=your_adobe_client_id
   ```
4. Setup the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
5. Run the development server:
   ```bash
   npm run dev
   ```

---

## 🏗️ Architecture Overview

1. **Ingestion**: Documents are uploaded via the dashboard, processed by the backend using a hierarchical parsing pipeline (especially for tables), and indexed into ChromaDB.
2. **Retrieval**: When a user asks a question, the system performs a dual search (Semantic + Keyword). The results are fused using RRF to prioritize the most relevant context.
3. **Generation**: The fused context is passed to Google Gemini, which generates a grounded response with embedded citations.
4. **Interface**: The Next.js frontend provides a real-time chat interface with PDF side-by-side viewing and citation highlighting.

---

## 📄 License
This project is developed for the **Powermind Hackathon**. All rights reserved.
