# Memora AI

Production-ready Express + TypeScript API backend with MongoDB Atlas and JWT authentication, plus an Expo React Native mobile app foundation.

## Mobile App

The Expo + TypeScript client lives in [`mobile/`](mobile/). It includes auth screens (login, register, Google sign-in, splash), navigation shells, TanStack Query, Zustand auth state, Axios API client (with mobile token refresh), secure token storage, and light/dark theming. Feature tabs (Collections, Documents, Chat) remain placeholders.

```bash
cd mobile
cp .env.example .env   # set EXPO_PUBLIC_API_URL and optional EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
npm install
npx expo start
```

See [`mobile/README.md`](mobile/README.md) for Google Sign-In setup and auth testing steps.

**Android emulator:** the host machine is not `localhost` from the emulator. Use `EXPO_PUBLIC_API_URL=http://10.0.2.2:4000` in `mobile/.env` so the app can reach the backend on your PC.

## Deployment

Production deployment guides (Docker backend, Expo EAS mobile, MongoDB Atlas, and pre-launch checklist) live in [`docs/`](docs/). Start with [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Prerequisites

- Node.js 20+
- MongoDB Atlas cluster (free tier works)

## Quick Start

1. Clone the repository and install dependencies:

```bash
cd backend
npm install
```

2. Copy the environment template and fill in your values:

```bash
cp .env.example .env
```

3. Create a MongoDB Atlas cluster, whitelist your IP, create a database user, and paste the connection string into `MONGODB_URI`.

4. Generate strong secrets for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (minimum 32 characters each).

5. Start the development server:

```bash
npm run dev
```

The API will be available at `http://localhost:4000` (or your configured `PORT`).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled production build |
| `npm run lint` | Lint source files |
| `npm run typecheck` | Type-check without emitting |
| `npm test` | Run unit tests (Vitest) |

## API Documentation

Interactive OpenAPI docs for auth endpoints: **`GET /api/v1/docs`** (Swagger UI).

## API Endpoints

Base URL: `/api/v1`

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health/live` | Public | Liveness probe for load balancers and containers |
| GET | `/health` | Admin (when enabled) | Health check with database status |

The public liveness endpoint (`/health/live`) always returns `200` with `{ "status": "ok" }` and requires no authentication. Use it for Docker and orchestrator health checks.

Admin health endpoints are **disabled in production by default** (`HEALTH_ENDPOINTS_ENABLED` defaults to `false` when `NODE_ENV=production`). When disabled, or when the caller is unauthenticated or not an admin, the API returns **404 Not Found** (not 401/403) to avoid revealing that the endpoint exists.

In development, set `HEALTH_ENDPOINTS_ENABLED=true` in `.env` (this is the default when `NODE_ENV` is not `production`).

#### Example: health check (admin)

```bash
curl http://localhost:4000/api/v1/health \
  -H "Authorization: Bearer <admin_access_token>"
```

### System

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/system/chat-health` | Admin (when enabled) | Verify Groq chat model connectivity |

Sends a minimal `"Say hello"` prompt to the configured `GROQ_MODEL` via the Groq Chat Completions API. Useful for diagnosing chat/RAG answer generation. Same access rules as `/health` — admin Bearer token required when enabled; otherwise 404.

#### Example: chat health check (admin)

```bash
curl http://localhost:4000/api/v1/system/chat-health \
  -H "Authorization: Bearer <admin_access_token>"
```

Success (Groq responded):

```json
{
  "success": true,
  "message": "Groq chat is healthy",
  "data": {
    "model": "qwen/qwen3-32b",
    "status": "ok",
    "response": "Hello! How can I help you today?"
  }
}
```

Failure (missing API key or Groq error):

```json
{
  "success": false,
  "message": "Groq chat health check failed",
  "data": {
    "model": "qwen/qwen3-32b",
    "status": "failed",
    "error": "GROQ_API_KEY is not configured"
  }
}
```

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | Public | Register a new user |
| POST | `/auth/login` | Public | Login with email/password |
| POST | `/auth/google` | Public | Sign in with Google ID token |
| POST | `/auth/refresh` | Refresh cookie (web) or body token (mobile) | Rotate tokens |
| POST | `/auth/logout` | Optional | Revoke refresh token |
| GET | `/auth/me` | Bearer access token | Get current user profile |

#### Web vs mobile (React Native) authentication

The API supports two auth modes. **Web clients** (browsers) use the default cookie flow. **Mobile clients** send a platform header and receive refresh tokens in the JSON body instead of cookies.

| Aspect | Web (default) | Mobile (`X-Client-Platform: mobile`) |
|--------|---------------|--------------------------------------|
| Platform header | Omit | `X-Client-Platform: mobile` (alias: `X-Client-Type: mobile`) |
| Login / register response | `accessToken` + `user` in body; refresh in **httpOnly cookie** | `accessToken` + `refreshToken` + `user` in body; **no cookie** |
| Google sign-in (`POST /auth/google`) | `accessToken` + `refreshToken` + `user` in body; refresh also in **httpOnly cookie** | Same as mobile — `accessToken` + `refreshToken` + `user` in body |
| Refresh | POST `/auth/refresh` with cookie (no body) | POST `/auth/refresh` with `{ "refreshToken": "..." }` in body (header optional if body token present) |
| Logout | POST `/auth/logout` — revokes refresh cookie | POST `/auth/logout` with optional `{ "refreshToken": "..." }` and/or `Authorization: Bearer <accessToken>` |
| Access token usage | `Authorization: Bearer <accessToken>` | Same |

Refresh tokens are stored hashed in MongoDB. On every refresh, the old token is revoked and a new pair is issued (rotation).

#### Example: mobile register

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "X-Client-Platform: mobile" \
  -d '{"email":"user@example.com","password":"securepass123","name":"Jane Doe"}'
```

Response:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "user": {
      "id": "...",
      "email": "user@example.com",
      "name": "Jane Doe",
      "provider": "local",
      "subscription": "free",
      "role": "user",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

#### Example: mobile login

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Client-Platform: mobile" \
  -d '{"email":"user@example.com","password":"securepass123"}'
```

#### Example: mobile refresh

```bash
curl -X POST http://localhost:4000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -H "X-Client-Platform: mobile" \
  -d '{"refreshToken":"<refresh_jwt>"}'
```

#### Example: mobile logout

```bash
curl -X POST http://localhost:4000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -H "X-Client-Platform: mobile" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"refreshToken":"<refresh_jwt>"}'
```

#### Example: web login (unchanged)

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"user@example.com","password":"securepass123"}'
```

Web login returns `accessToken` and `user` in the body; the refresh token is set as an httpOnly cookie on `/api/v1/auth`.

#### Example: Google sign-in (mobile)

```bash
curl -X POST http://localhost:4000/api/v1/auth/google \
  -H "Content-Type: application/json" \
  -H "X-Client-Platform: mobile" \
  -d '{"idToken":"<google_id_token_from_client_sdk>"}'
```

Response (201 for new users, 200 for existing accounts):

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "user": {
      "id": "...",
      "email": "user@gmail.com",
      "name": "Jane Doe",
      "avatar": "https://...",
      "provider": "google",
      "subscription": "free",
      "role": "user",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

#### Example: Google sign-in (web)

```bash
curl -X POST http://localhost:4000/api/v1/auth/google \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"idToken":"<google_id_token_from_client_sdk>"}'
```

Web Google sign-in always returns `accessToken`, `refreshToken`, and `user` in the body, and also sets the refresh token as an httpOnly cookie (dual mode for web clients).

Existing local accounts with the same email are logged in without a password on first Google sign-in; the Google subject ID (`sub` from the ID token) is stored as `googleSub` to bind that Google account to the user. Subsequent Google sign-ins must use the same Google account — a different `sub` is rejected. New users are created with `provider: "google"` and `googleSub` set. The `googleSub` field is internal and not exposed in API responses.

### Documents

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/documents` | Bearer access token | List user's documents |
| POST | `/documents` | Bearer access token | Create a document |
| POST | `/documents/search` | Bearer access token | Semantic vector search over user's documents |
| GET | `/documents/:id` | Bearer access token | Get a document by ID |
| PUT | `/documents/:id` | Bearer access token | Update a document |
| POST | `/documents/:id/retry-embedding` | Bearer access token | Retry embedding for a failed or pending document |
| DELETE | `/documents/:id` | Bearer access token | Delete a document |

### Chat (RAG)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/chat` | Bearer access token | RAG chat — answer questions from your embedded documents |

Requires `GOOGLE_AI_API_KEY` (embeddings/search), `GROQ_API_KEY` (answer generation), and a configured Atlas Vector Search index. Only documents with `embeddingStatus: "completed"` are used as context.

Optionally pass `collectionIds` to limit retrieval to documents in specific owned collections. Omit `collectionIds` (or pass an empty array) to search all embedded documents.

#### Example: RAG chat

```bash
curl -X POST http://localhost:4000/api/v1/chat \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "What are the main topics in my notes?"}'
```

#### Example: RAG chat scoped to collections

```bash
curl -X POST http://localhost:4000/api/v1/chat \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Summarize my study notes", "collectionIds": ["507f1f77bcf86cd799439011"]}'
```

Response:

```json
{
  "success": true,
  "message": "Chat response generated",
  "data": {
    "answer": "Based on your documents, the main topics include ...",
    "sources": [
      {
        "documentId": "674a1b2c3d4e5f6789012345",
        "title": "Study Notes",
        "sourceType": "text",
        "score": 0.92
      }
    ]
  }
}
```

Each entry in `sources` is a document that was retrieved and passed into the Gemini context for that answer. The `score` field is the MongoDB Atlas Vector Search similarity score (`vectorSearchScore`) for the user's query — higher values indicate stronger semantic relevance. When no matching documents are found, `sources` is an empty array and `answer` explains that no relevant documents were available.

## MongoDB Atlas Vector Search Setup

Semantic search requires a **Vector Search index** on the `documents` collection. Create it once per cluster (Atlas UI or CLI).

### Index definition

| Setting | Value |
|---------|-------|
| Collection | `documents` |
| Index name | `document_embedding_index` (or match `VECTOR_SEARCH_INDEX_NAME` in `.env`) |
| Field | `embedding` |
| Dimensions | `768` (matches `gemini-embedding-001` with `outputDimensionality: 768` / `EMBEDDING_DIMENSIONS`) |
| Similarity | `cosine` |

**Atlas UI:** Cluster → Search → Create Search Index → JSON Editor → paste:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "userId"
    },
    {
      "type": "filter",
      "path": "embeddingStatus"
    },
    {
      "type": "filter",
      "path": "collectionId"
    }
  ]
}
```

**Atlas CLI:**

```bash
atlas clusters search indexes create \
  --clusterName <your-cluster> \
  --file vector-index.json \
  --db memora \
  --collection documents
```

Use the same JSON as above for `vector-index.json`. Filter fields (`userId`, `embeddingStatus`, `collectionId`) enable pre-filtering in `$vectorSearch` for user isolation, completed embeddings only, and optional collection scoping.

Documents must have `embeddingStatus: "completed"` and a populated `embedding` array before they appear in search results. New documents are embedded automatically when `GOOGLE_AI_API_KEY` is set.

If embedding fails (e.g. after a model upgrade), retry without changing content:

```bash
curl -X POST http://localhost:4000/api/v1/documents/<document_id>/retry-embedding \
  -H "Authorization: Bearer <access_token>"
```

`PUT /api/v1/documents/:id` also re-schedules embedding when `content` changes, when `embeddingStatus` is `"failed"` (any field update), or when the body includes `"retryEmbedding": true`.

### Example: semantic search

```bash
curl -X POST http://localhost:4000/api/v1/documents/search \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"query": "machine learning fundamentals", "limit": 5}'
```

#### Example: semantic search scoped to collections

```bash
curl -X POST http://localhost:4000/api/v1/documents/search \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"query": "machine learning fundamentals", "collectionIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]}'
```

When `collectionIds` is provided, only documents assigned to those collections are searched. Documents without a `collectionId` are excluded from scoped searches. Each collection ID must exist and belong to the authenticated user (otherwise the API returns 404).

Response:

```json
{
  "success": true,
  "message": "Documents retrieved successfully",
  "data": {
    "documents": []
  }
}
```

### Response Format

**Success:**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

**Error:**

```json
{
  "success": false,
  "message": "Error description",
  "errors": []
}
```

### Authentication

#### Web (browser)

- **Access token**: Returned in the response body. Send as `Authorization: Bearer <token>`.
- **Refresh token**: Stored in an httpOnly cookie on `/api/v1/auth`. Sent automatically by the browser on refresh requests.

#### Mobile (React Native)

- Send **`X-Client-Platform: mobile`** (or **`X-Client-Type: mobile`**) on login, register, refresh, and logout.
- Store both **access** and **refresh** tokens securely on device (e.g. secure storage).
- Include the access token as `Authorization: Bearer <token>` on protected routes.
- Refresh by POSTing `{ "refreshToken": "..." }` to `/auth/refresh` (mobile header optional when the body includes `refreshToken`).

### Admin users

New accounts register with `role: "user"`. To grant health-endpoint access, promote a user to admin in MongoDB after registration:

```javascript
// MongoDB shell or Compass
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```

Log in again to receive a new access token that includes `role: "admin"`.

## Project Structure

```
backend/
├── src/
│   ├── server.ts          # Bootstrap, DB connect, graceful shutdown
│   ├── app.ts             # Express app factory
│   ├── config/            # Env validation, database connection
│   ├── constants/         # HTTP status codes
│   ├── types/             # TypeScript declarations
│   ├── models/            # Mongoose schemas
│   ├── routes/            # HTTP route definitions
│   ├── controllers/       # Request handlers
│   ├── services/          # Business logic
│   ├── middleware/        # Cross-cutting concerns
│   ├── validators/        # Zod request schemas
│   └── utils/             # ApiError, ApiResponse, asyncHandler
├── .env.example
├── package.json
└── tsconfig.json
```

## Environment Variables

See `backend/.env.example` for all required variables.

| Variable | Description |
|----------|-------------|
| `HEALTH_ENDPOINTS_ENABLED` | Enable `/health` and `/system/chat-health` (default: `true` in development/test, `false` in production). Admin Bearer token required; unauthorized callers receive 404 |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID — required for `POST /auth/google` (Sign in with Google). Create credentials at [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `VECTOR_SEARCH_INDEX_NAME` | Atlas Vector Search index name (default: `document_embedding_index`) |
| `GOOGLE_AI_API_KEY` | Required for document embeddings and semantic vector search (Gemini) |
| `GEMINI_EMBEDDING_MODEL` | Gemini embedding model (default: `gemini-embedding-001`, 768 dimensions via `outputDimensionality`) |
| `GROQ_API_KEY` | Required for RAG chat answer generation |
| `GROQ_MODEL` | Groq chat model for RAG answers (default: `qwen/qwen3-32b`) |
