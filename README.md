# Helix

An AI-driven scientific planning assistant designed to streamline experimental workflows and research processes.

## Project Overview

Helix is a platform that leverages large language models and vector retrieval to help scientists and researchers generate comprehensive experiment plans. By analyzing existing scientific literature, protocol templates, and historical experiment data, the system provides actionable insights and detailed planning documents.


### Key Features

- **Automated Experiment Planning**: Generate detailed protocols, material lists, and timelines based on a research hypothesis.
- **Context-Aware Retrieval**: Integrated search across scientific papers (OpenAlex) and protocol repositories (Pinecone) using vector embeddings.
- **Explainability (Retrieval Trace)**: Every plan includes a trace of why specific literature was selected and how it influenced the final protocol.
- **Literature Quality Control**: Automated assessment of retrieved papers for methodology relevance and evidence quality.
- **Novelty Assessment**: Categorizes plans as *Exact*, *Similar*, or *New* based on existing literature to ensure research impact.
- **Reproducibility**: Stores full context snapshots (prompt, model, retrieved data) for every plan version.

## Technical Architecture

The system is built on a robust RAG (Retrieval-Augmented Generation) pipeline that prioritizes scientific accuracy and reproducibility.

### The RAG Pipeline
1. **Input**: User submits a scientific hypothesis or question.
2. **Embedding**: The query is converted into a vector using the `multilingual-e5-large` model.
3. **Retrieval**: Top-k relevant papers, protocols, and past experiments are fetched from vector and relational databases.
4. **Literature QC**: An automated agent reviews retrieved items for relevance and domain alignment.
5. **Generation**: A structured prompt containing the hypothesis and the retrieved context is sent to an LLM (e.g., Llama-3 70B via Groq).
6. **Persistence**: The plan, novelty assessment, and a "Context Snapshot" are saved for full traceability.

### Tech Stack
- **Frontend**: React (TypeScript), Vite, Tailwind CSS, shadcn/ui, TanStack Query.
- **Backend**: FastAPI (Python), PostgreSQL (Supabase), Pinecone (Vector Search).
- **LLM/AI**: Groq (Llama-3), OpenAI/Gemini (via unified service layer), Pinecone Inference.

## Project Structure

```text
├── backend/
│   ├── models/         # SQLAlchemy and Pydantic schemas
│   ├── routers/        # API endpoints (Generate, History, Lab State)
│   ├── services/       # Core logic (Retrieval, QC, Generation, DB)
│   └── scripts/        # Data seeding and maintenance scripts
└── frontend-new/       # Main React web application
```

## Setup & Installation

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL (or Supabase)

### Environment Configuration
Create a `.env` file in the `backend/` directory with the following variables:

```env
# AI Services
GROQ_API_KEY=your_groq_key
PINECONE_API_KEY=your_pinecone_key
GEMINI_API_KEY=your_gemini_key

# Database
DATABASE_URL=your_postgresql_url

# Retrieval Settings
PINECONE_INDEX_NAME=experiment-protocols
OPENALEX_EMAIL=your_email@example.com

# Demo Mode
DEMO_MODE=true  # Set to false for live API integration
```

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AlexKurian77/helix.git
   cd Hack-Nation
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend-new
   npm install
   npm run dev
   ```

3. **Backend Setup**:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

## Development & Testing

- **Demo Mode**: The project includes a `DEMO_MODE` that allows you to run the full UI and API without external keys by using deterministic mock data.
- **History & Trace**: Explore the history of experiments and view the retrieval traces to understand the AI's "thought process."

## License

This project is licensed under the terms specified in the repository.

