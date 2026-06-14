# Groq Setup

Memora AI uses [Groq](https://console.groq.com/) for RAG chat answer generation. Embeddings and vector search use Google Gemini separately.

## 1. Create an API key

1. Sign up / log in at [Groq Console](https://console.groq.com/).
2. Go to **API Keys** → **Create API Key**.
3. Copy the key (starts with `gsk_`).
4. Set `GROQ_API_KEY` in backend environment — never commit to git.

## 2. Configure model

Default model: `qwen/qwen3-32b`

Override with:

```env
GROQ_MODEL=qwen/qwen3-32b
```

See [Groq model documentation](https://console.groq.com/docs/models) for available models.

## 3. Required for features

| Feature | Requires `GROQ_API_KEY` |
|---------|-------------------------|
| `POST /api/v1/chat` (RAG) | Yes |
| `GET /api/v1/system/chat-health` | Yes (when health endpoints enabled) |
| Document embeddings | No (uses `GOOGLE_AI_API_KEY`) |
| Semantic search | No (uses Gemini embeddings + Atlas Vector Search) |

RAG chat also requires:

- `GOOGLE_AI_API_KEY` (embeddings for retrieval)
- Atlas Vector Search index ([ATLAS_VECTOR_SEARCH_SETUP.md](./ATLAS_VECTOR_SEARCH_SETUP.md))
- At least one document with `embeddingStatus: "completed"`

## 4. Verify connectivity

### Startup checklist

```bash
cd backend
npm run startup-check
```

When `GROQ_API_KEY` is set, the script runs a minimal chat completion (`"Say hello"`) and reports pass/fail.

### Admin chat-health endpoint

Enable admin health endpoints:

```env
HEALTH_ENDPOINTS_ENABLED=true
```

Promote a user to admin in MongoDB (see [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)), log in, then:

```bash
curl https://your-api.example.com/api/v1/system/chat-health \
  -H "Authorization: Bearer <admin_access_token>"
```

**Success:**

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

**Failure (missing key):**

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

In production, leave `HEALTH_ENDPOINTS_ENABLED=false` and rely on `npm run startup-check` during deploy pipelines instead of exposing chat-health publicly.

## 5. Production notes

- Store `GROQ_API_KEY` in your host secret manager.
- Monitor Groq rate limits and quotas for your plan.
- Rotate keys periodically; update deployment secrets and restart the backend.

## Related

- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
