# Production Checklist

Use this checklist before launching Memora AI to production. Details for each item are linked in the docs folder.

## Infrastructure

- [ ] MongoDB Atlas cluster created and active ([MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md))
- [ ] Database user created with strong password (stored in secret manager)
- [ ] Production backend IP(s) added to Atlas network allowlist
- [ ] `MONGODB_URI` set in production secrets (database name included, e.g. `/memora`)
- [ ] Atlas Vector Search index `document_embedding_index` created and **Active** ([ATLAS_VECTOR_SEARCH_SETUP.md](./ATLAS_VECTOR_SEARCH_SETUP.md))

## Backend secrets & config

- [ ] `NODE_ENV=production`
- [ ] `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` — unique, 32+ characters, cryptographically random
- [ ] `CORS_ORIGINS` set to HTTPS web origins (comma-separated; no `*` in production)
- [ ] `GOOGLE_AI_API_KEY` set (embeddings + semantic search)
- [ ] `GROQ_API_KEY` set ([GROQ_SETUP.md](./GROQ_SETUP.md))
- [ ] `GOOGLE_CLIENT_ID` set (Google sign-in — Web client, always required)
- [ ] `GOOGLE_ANDROID_CLIENT_ID` set for Play Store Android ([google-auth-setup.md](./google-auth-setup.md))
- [ ] `HEALTH_ENDPOINTS_ENABLED=false` in production (use `/api/v1/health/live` for probes)
- [ ] No `.env` files committed to git
- [ ] `npm run startup-check` passes against production env

## Backend deployment

- [ ] Docker image builds successfully (`docker build -t memora-backend ./backend`)
- [ ] Container runs as non-root user
- [ ] Port `4000` (or configured `PORT`) exposed
- [ ] Liveness probe: `GET /api/v1/health/live` returns `200`
- [ ] HTTPS terminated at load balancer / reverse proxy
- [ ] Rate limiting acceptable for expected traffic (default: 100 req/15 min global, 20/15 min on auth)

## Admin & monitoring

- [ ] At least one admin user promoted in MongoDB for break-glass diagnostics
- [ ] Log aggregation configured (container stdout / pino JSON logs)
- [ ] Alerts on container restarts and failed health checks

## Functional verification

- [ ] `GET /api/v1/health/live` → `{ "status": "ok" }`
- [ ] Register + login (email/password) works
- [ ] Google sign-in works (Web client in dev; Android client on EAS/Play builds)
- [ ] Android OAuth SHA-1 fingerprints registered (debug, EAS, Play App Signing)
- [ ] Create document → `embeddingStatus` becomes `completed`
- [ ] Semantic search returns results for embedded documents
- [ ] RAG chat returns answer with `sources` array
- [ ] Token refresh and logout work on mobile (`X-Client-Platform: mobile`)

## Mobile (EAS)

- [ ] Expo account and EAS project linked (`eas init`)
- [ ] `EXPO_PUBLIC_API_URL` points to **production** HTTPS API
- [ ] `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` matches backend `GOOGLE_CLIENT_ID`
- [ ] `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` matches backend `GOOGLE_ANDROID_CLIENT_ID`
- [ ] iOS bundle ID `com.memora.mobile` registered in Apple Developer
- [ ] Android package `com.memora.mobile` registered in Google Play Console
- [ ] `eas build --profile production` succeeds for target platform(s)
- [ ] Production build tested against live API before store submission

## CI/CD

- [ ] GitHub Actions CI passes (backend typecheck + test, mobile typecheck)
- [ ] Startup check run in deploy pipeline before traffic switch
- [ ] Rollback plan documented (previous image / env snapshot)

## Security review

- [ ] JWT secrets rotated from any dev/staging values
- [ ] Atlas IP allowlist minimized (no open `0.0.0.0/0` unless required)
- [ ] Admin health endpoints disabled or strictly admin-gated
- [ ] API keys (Google, Groq) scoped and rotatable

## Go-live

- [ ] DNS / API URL live and reachable from mobile networks
- [ ] Store listings prepared (if submitting to App Store / Play Store)
- [ ] Support contact and privacy policy URLs ready (store requirements)

---

**Quick commands**

```bash
# Backend validation
cd backend && npm run startup-check

# Local Docker smoke test
docker compose up --build

# Liveness
curl https://api.yourdomain.com/api/v1/health/live

# Mobile production build
cd mobile && eas build --platform android --profile production
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full deployment guide.
