# Environment Variables

All secrets must be supplied via environment variables or your host’s secret manager. Never commit `.env` files.

## Backend

File template: `backend/.env.example`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | `development`, `production`, or `test` |
| `PORT` | No | `4000` | HTTP port the API listens on |
| `MONGODB_URI` | **Yes** | — | MongoDB Atlas connection string (`mongodb+srv://...`) |
| `JWT_ACCESS_SECRET` | **Yes** | — | Secret for signing access tokens (min 32 characters) |
| `JWT_REFRESH_SECRET` | **Yes** | — | Secret for signing refresh tokens (min 32 characters) |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` | Access token lifetime (e.g. `15m`, `1h`) |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token lifetime |
| `CORS_ORIGINS` | Prod: **Yes** · Dev: optional | Dev defaults | Comma-separated **browser** origins (e.g. `http://localhost:3000,http://localhost:19006`). HTTPS only in production; `*` forbidden in production. Native mobile (Expo/APK) omits `Origin` and is allowed. |
| `CORS_ORIGIN` | Deprecated | — | Legacy single origin; use `CORS_ORIGINS` instead |
| `BCRYPT_SALT_ROUNDS` | No | `12` | Password hashing cost (10–15) |
| `GOOGLE_CLIENT_ID` | For Google sign-in | — | OAuth 2.0 **Web** client ID (always verified). See [google-auth-setup.md](./google-auth-setup.md) |
| `GOOGLE_ANDROID_CLIENT_ID` | For Play Store Android | — | OAuth 2.0 **Android** client ID; ID tokens from EAS/Play builds use this as `aud` |
| `GOOGLE_AI_API_KEY` | For embeddings / search | — | Google AI Studio key for Gemini embeddings |
| `GEMINI_EMBEDDING_MODEL` | No | `gemini-embedding-001` | Embedding model name |
| `GROQ_API_KEY` | For RAG chat | — | Groq API key for answer generation |
| `GROQ_MODEL` | No | `qwen/qwen3-32b` | Groq chat model for RAG |
| `VECTOR_SEARCH_INDEX_NAME` | No | `document_embedding_index` | Atlas Vector Search index name on `documents` |
| `HEALTH_ENDPOINTS_ENABLED` | No | `true` in dev/test; `false` in production | Enables admin-gated `/health` and `/system/chat-health` |

### Backend examples

**Local development:**

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/memora?retryWrites=true&w=majority
JWT_ACCESS_SECRET=local-dev-access-secret-min-32-chars!!
JWT_REFRESH_SECRET=local-dev-refresh-secret-min-32-chars!
CORS_ORIGINS=http://localhost:3000,http://localhost:19006,http://localhost:8081
HEALTH_ENDPOINTS_ENABLED=true
GOOGLE_CLIENT_ID=123456789-web.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=123456789-android.apps.googleusercontent.com
GOOGLE_AI_API_KEY=AIza...
GROQ_API_KEY=gsk_...
```

**Production (Docker):**

```env
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://prod-user:...@cluster.mongodb.net/memora?retryWrites=true&w=majority
JWT_ACCESS_SECRET=<64-char-random-hex>
JWT_REFRESH_SECRET=<64-char-random-hex>
CORS_ORIGINS=https://your-web-app.example.com,https://your-legal-site.vercel.app
HEALTH_ENDPOINTS_ENABLED=false
GOOGLE_CLIENT_ID=...
GOOGLE_ANDROID_CLIENT_ID=...
GOOGLE_AI_API_KEY=...
GROQ_API_KEY=...
```

### Notes

- **CORS** applies to **browser** clients only. React Native (Expo dev, Android APK, iOS) does not send a browser `Origin` header and is allowed through CORS without being listed.
- **Development:** If `CORS_ORIGINS` is unset, defaults include `localhost:3000`, `:19006` (Expo web), and `:8081`.
- **Production (Railway):** Set `CORS_ORIGINS` to comma-separated **HTTPS** origins (e.g. legal site + web app). Wildcard `*` is rejected.
- **Liveness** (`GET /api/v1/health/live`) is always public and does not depend on `HEALTH_ENDPOINTS_ENABLED`.
- **Admin health** endpoints require `HEALTH_ENDPOINTS_ENABLED=true` plus `Authorization: Bearer <admin_access_token>`.
- Omitting optional AI keys disables those features but the API still starts if core auth/DB vars are set.

---

## Mobile

File template: `mobile/.env.example`

Expo exposes only variables prefixed with `EXPO_PUBLIC_` to the client bundle.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EXPO_PUBLIC_API_URL` | **Yes** | — | Backend base URL, no trailing slash |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | For Google sign-in | — | Must match backend `GOOGLE_CLIENT_ID` |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | For Play Store Android | — | Must match backend `GOOGLE_ANDROID_CLIENT_ID`. Package `com.memora.mobile` + SHA-1 in Google Cloud |
| `EXPO_PUBLIC_PRIVACY_POLICY_URL` | For Profile legal links | — | Deployed Privacy Policy URL (e.g. `https://your-domain/privacy`) |
| `EXPO_PUBLIC_TERMS_OF_SERVICE_URL` | For Profile legal links | — | Deployed Terms of Service URL (e.g. `https://your-domain/terms`) |

### Mobile examples

**Local dev (simulator / same machine):**

```env
EXPO_PUBLIC_API_URL=http://localhost:4000
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-web.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=123456789-android.apps.googleusercontent.com
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://your-domain/privacy
EXPO_PUBLIC_TERMS_OF_SERVICE_URL=https://your-domain/terms
```

**Android emulator (host machine API):**

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000
```

**Physical device (LAN IP):**

```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:4000
```

**Production (EAS build):**

Set in `mobile/eas.json` profile `env` or EAS Secrets:

```env
EXPO_PUBLIC_API_URL=https://api.yourdomain.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-web.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=123456789-android.apps.googleusercontent.com
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://your-domain/privacy
EXPO_PUBLIC_TERMS_OF_SERVICE_URL=https://your-domain/terms
```

### EAS Secrets (recommended for production)

```bash
cd mobile
eas secret:create --name EXPO_PUBLIC_API_URL --value https://api.yourdomain.com --scope project
eas secret:create --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value <web-client-id> --scope project
eas secret:create --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value <android-client-id> --scope project
eas secret:create --name EXPO_PUBLIC_PRIVACY_POLICY_URL --value https://your-domain/privacy --scope project
eas secret:create --name EXPO_PUBLIC_TERMS_OF_SERVICE_URL --value https://your-domain/terms --scope project
```

Reference secrets in `eas.json` or rely on EAS injecting them at build time.

---

## Validation

Run backend checks before go-live:

```bash
cd backend
npm run startup-check
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) and [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md).
