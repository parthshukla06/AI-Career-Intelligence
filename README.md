# AI Career Intelligence Platform

A modular Express and TypeScript backend that analyzes resumes, matches candidates to jobs, explains recommendations, retrieves curated career guidance, and tracks user progress.

## Architecture

- **API:** Express routes and controllers under `backend/src`.
- **Persistence:** MongoDB and Mongoose for users, resumes, jobs, saved jobs, applications, feedback, learning progress, and knowledge chunks.
- **Deterministic intelligence:** Skill, experience, role, semantic, readiness, gap, evaluation, and personalization calculations are implemented in services. LLM output never changes numerical scores.
- **Embeddings:** Local `onnx-community/all-MiniLM-L6-v2-ONNX` via Transformers.js, 384 dimensions.
- **Assistant:** Groq generates natural-language guidance from candidate/job/career context and the local Markdown RAG knowledge base.

## Local Setup

```text
cd backend
npm install
copy .env.example .env
npm run dev
```

Set the required values in `backend/.env`. Keep `.env` private; it is ignored by Git and Docker.

## Environment Variables

- `PORT`: HTTP port, normally `5000`.
- `NODE_ENV`: `development` or `production`.
- `MONGODB_URI`: MongoDB Atlas or another MongoDB connection string.
- `JWT_SECRET`: strong secret; production rejects missing, short, or placeholder values.
- `GROQ_API_KEY`: Groq API key for resume analysis and assistant responses.
- `GROQ_MODEL`: supported Groq chat model, normally `openai/gpt-oss-120b`.
- `CORS_ORIGIN`: comma-separated allowed origins; localhost is allowed by default in development.

## Scripts

Run from `backend`:

- `npm run dev`: development server.
- `npm run build`: compile TypeScript to `dist`.
- `npm start`: run the compiled production server.
- `npm test`: run all service tests.
- `npm run evaluate:recommendations`: evaluate curated recommendation scenarios.
- `npm run seed:jobs`: seed jobs and missing job embeddings.
- `npm run embeddings:jobs`: generate missing job embeddings.
- `npm run embeddings:knowledge`: persist knowledge chunk embeddings.

## APIs

Existing APIs include job search, resume upload, deterministic recommendations, Career Intelligence, and the Career Assistant. Phase 8 adds JWT auth, saved jobs, applications, feedback, learning progress, personalized recommendations, and the user dashboard. `GET /api/health` and `GET /api/health/ready` expose non-sensitive service status.

## Recommendation Methodology

The base recommendation score is deterministic:

```text
45% required skill coverage
25% semantic similarity
20% experience compatibility
10% role compatibility
```

Phase 8 personalization is an additional bounded overlay. It never replaces the base score and is clamped to `-10` through `+10`.

## Career Intelligence and RAG

Career Intelligence produces explanations, why-not reasons, skill gaps, demand, readiness, roadmaps, and what-if comparisons from stored candidate/job data. RAG retrieves from the small internal Markdown knowledge base in `backend/data/knowledge`; it does not scrape the internet. Groq is used only for natural-language assistant and resume-improvement responses.

## Evaluation

Recommendation evaluation uses manually curated candidate scenarios in `backend/data/evaluation/recommendation-scenarios.json`. It reports Precision@K, Recall@K, Hit Rate@K, and MRR for K values 3, 5, and 10. These measurements are reproducible checks of the current deterministic behavior, not claims of production recommendation accuracy.

## Docker

Build and run the backend with Atlas supplied at runtime:

```text
docker compose up --build
```

Set `MONGODB_URI`, `JWT_SECRET`, `GROQ_API_KEY`, and optional configuration in the shell or Compose environment. The image is multi-stage, contains production dependencies only, runs as the non-root `node` user, excludes `.env`, and has a `/api/health` health check. No local MongoDB service is forced.

## Security Notes

Helmet, configurable CORS, request body limits, authentication/AI rate limits, JWT validation, compound uniqueness indexes, generic production errors, and safe logging are enabled. Do not commit secrets. Rotate any credentials that have ever been exposed in local files or terminal history.

## Known Limitations

- Auth currently provides basic register/login/JWT sessions; email verification, password reset, refresh-token rotation, and account recovery are not implemented.
- Recommendation evaluation is small and manually labeled.
- Local embedding models download on first use and require disk/network access at that time.
- MongoDB Atlas Vector Search is not required by the current in-memory recommendation path.
- Docker was configured but depends on a runtime MongoDB and Groq configuration supplied by the operator.
