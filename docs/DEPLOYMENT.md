# Deployment Guide

This guide covers deploying the Memora AI backend (Docker) and mobile app (Expo EAS). It does not include vendor-specific hosting steps — adapt the Docker image and environment variables to your platform (Railway, Fly.io, AWS ECS, etc.).

## Overview

| Component | Artifact | Typical host |
|-----------|----------|--------------|
| Backend API | `backend/Dockerfile` | Container platform / VPS |
| Mobile app | `mobile/eas.json` | Expo EAS Build → App Store / Play Store |

Recommended order:

1. MongoDB Atlas cluster, user, and IP allowlist
2. Atlas Vector Search index
3. Google Cloud OAuth + API keys, Groq API key
4. Backend deployment (Docker)
5. Run startup checklist against production env
6. Point mobile `EXPO_PUBLIC_API_URL` at production API
7. EAS production build and store submission

## Prerequisites

- Node.js 20+
- Docker and Docker Compose (local prod testing)
- MongoDB Atlas cluster ([MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md))
- Atlas Vector Search index ([ATLAS_VECTOR_SEARCH_SETUP.md](./ATLAS_VECTOR_SEARCH_SETUP.md))
- Groq API key ([GROQ_SETUP.md](./GROQ_SETUP.md))
- Google AI Studio key (embeddings) and Google OAuth client ID
- Expo account and EAS CLI (`npm i -g eas-cli`)

See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for the full variable list.

---

## Backend (Docker)

### 1. Configure environment

Copy the template and set production values:

```bash
cd backend
cp .env.example .env
```

Required for a minimal API: `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGINS` (production).

For full features also set: `GOOGLE_AI_API_KEY`, `GROQ_API_KEY`, `GOOGLE_CLIENT_ID`.

Generate JWT secrets (32+ characters):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set `NODE_ENV=production` and `CORS_ORIGINS` to your HTTPS web origins (comma-separated). Mobile-only APIs still require explicit origins for any browser clients; native APK/Expo requests omit `Origin` and are not blocked.

### 2. Build the image

From the repository root:

```bash
docker build -t memora-backend ./backend
```

Multi-stage build compiles TypeScript to `dist/` and runs as non-root user `memora` on Node 20 Alpine.

### 3. Run locally with Docker Compose

```bash
# Ensure backend/.env exists with real secrets
docker compose up --build
```

API listens on port `4000` (override with `PORT` in `.env` and `docker-compose.yml`).

### 4. Health checks

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /api/v1/health/live` | **None** | Liveness — process is up (Docker, load balancers) |
| `GET /api/v1/health` | Admin Bearer | Readiness — uptime + MongoDB status |
| `GET /api/v1/system/chat-health` | Admin Bearer | Groq connectivity |

**Docker / orchestrators:** use `/api/v1/health/live`. It returns `200` with `{ "status": "ok" }` and does not expose database details.

**Detailed health:** set `HEALTH_ENDPOINTS_ENABLED=true` and call with an admin access token. By default this is `false` in production.

The `backend/Dockerfile` and root `docker-compose.yml` healthchecks target `/api/v1/health/live`.

### 5. Pre-deploy validation

Run the startup checklist against your target environment (from a machine that can reach MongoDB Atlas):

```bash
cd backend
npm run startup-check
```

This validates env vars, MongoDB connectivity, optional API keys, vector index presence, and Groq chat health when configured.

### 6. Deploy to your platform

Push the image to your registry and run with:

- `NODE_ENV=production`
- All required env vars from [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
- Port `4000` exposed (or set `PORT`)
- Liveness probe: `GET /api/v1/health/live`

Do **not** commit `.env` or mount secrets in source control.

---

## Mobile (Expo EAS)

### 1. Install EAS CLI and log in

```bash
npm install -g eas-cli
eas login
```

### 2. Link the project

From `mobile/` (always run EAS commands here — not from the Desktop or monorepo root):

```bash
cd mobile
eas init
```

See [EAS_SIZE_AUDIT.md](./EAS_SIZE_AUDIT.md) if builds fail with an archive over 2 GB.

This adds `extra.eas.projectId` to your app config if not already present.

### 3. Configure build profiles

`mobile/eas.json` defines:

| Profile | Use case |
|---------|----------|
| `development` | Dev client, internal distribution |
| `preview` | Internal APK / test builds |
| `production` | Store release (Android App Bundle, iOS) |

Update `EXPO_PUBLIC_API_URL` in each profile’s `env` block (or use EAS Secrets) to your **production** API URL before building.

Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` via EAS Secrets or profile `env` — must match backend `GOOGLE_CLIENT_ID`.

### 4. App identifiers

Configured in `mobile/app.config.ts`:

- iOS bundle ID: `com.memora.mobile`
- Android package: `com.memora.mobile`

Change these before first store submission if you use a different namespace.

### 5. Build commands

```bash
cd mobile

# Internal preview APK
eas build --platform android --profile preview

# Production (Play Store / App Store)
eas build --platform android --profile production
eas build --platform ios --profile production
```

### 6. Submit to stores (optional)

Configure `submit.production` in `eas.json` with your Apple and Google Play credentials, then:

```bash
eas submit --platform android --profile production
eas submit --platform ios --profile production
```

---

## Post-deployment

1. Promote an admin user in MongoDB for health diagnostics ([README](../README.md#admin-users)).
2. Verify liveness: `curl https://your-api.example.com/api/v1/health/live`
3. Verify auth: register/login from the mobile app against production API.
4. Upload a document and confirm embedding completes (`embeddingStatus: completed`).
5. Test RAG chat with a question about uploaded content.
6. Complete [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md).

## Related docs

- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
- [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)
- [ATLAS_VECTOR_SEARCH_SETUP.md](./ATLAS_VECTOR_SEARCH_SETUP.md)
- [GROQ_SETUP.md](./GROQ_SETUP.md)
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
