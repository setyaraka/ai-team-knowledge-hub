# AI Team Knowledge Hub

Internal AI knowledge management SaaS built with Next.js App Router, TypeScript, PostgreSQL, pgvector, and Gemini. Users upload company documents, the app extracts text, chunks it, stores embeddings, and answers questions with grounded citations.

## Architecture

This is a TypeScript-first fullstack app using Next.js API route handlers as the REST backend. The application keeps business logic outside route files in `lib/*` modules so API routes stay thin and testable.

- `app/(auth)` and `app/(dashboard)` contain UI routes.
- `app/api/*` exposes REST endpoints.
- `lib/db` owns PostgreSQL access and schema initialization SQL.
- `lib/auth` owns password hashing, session cookies, and route protection.
- `lib/documents` owns validation, text extraction, chunking, and async processing.
- `lib/ai` wraps Gemini behind provider-shaped functions.
- `lib/rag` owns retrieval, prompt construction, answer generation, and citations.

## Quick Start

1. Copy `.env.example` to `.env.local`.
2. Start Postgres with pgvector:

```bash
docker compose up -d db
```

The compose database is exposed on host port `15432` to avoid clashing with an existing local Postgres on `5432`.

3. Install dependencies and initialize the database:

```bash
npm install
npm run db:init
npm run dev
```

4. Open `http://localhost:3000`.

The seed user is `demo@company.com` with password `password123`.

## Production Notes

- Frontend and API can deploy together to Vercel, or split later if a dedicated FastAPI service is desired.
- PostgreSQL with pgvector works on Railway, Render, Supabase, Neon, or any managed Postgres that supports extensions.
- API keys stay server-side only.
- RAG responses require retrieved evidence and include chunk citations.
