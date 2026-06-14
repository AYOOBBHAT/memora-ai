# Atlas Vector Search Setup

Semantic document search and RAG chat require a **Vector Search** index on the `documents` collection.

## Index specification

| Setting | Value |
|---------|-------|
| Database | `memora` (or your `MONGODB_URI` database name) |
| Collection | `documents` |
| Index name | `document_embedding_index` (must match `VECTOR_SEARCH_INDEX_NAME`) |
| Vector field | `embedding` |
| Dimensions | `768` |
| Similarity | `cosine` |
| Filter fields | `userId`, `embeddingStatus`, `collectionId` |

Embeddings are produced by `gemini-embedding-001` with `outputDimensionality: 768` (see `backend/src/services/embedding.service.ts`).

## Index JSON definition

**Atlas UI:** Cluster → **Search** → **Create Search Index** → **JSON Editor** → paste:

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

Set the index **name** to `document_embedding_index` when prompted.

## Atlas CLI

Save the JSON above as `vector-index.json`, then:

```bash
atlas clusters search indexes create \
  --clusterName <your-cluster> \
  --file vector-index.json \
  --db memora \
  --collection documents
```

## Why filter fields?

| Field | Purpose |
|-------|---------|
| `userId` | User isolation — searches only return the authenticated user’s documents |
| `embeddingStatus` | Restrict to `completed` embeddings |
| `collectionId` | Optional scoping when searching within specific collections |

## Prerequisites

- `GOOGLE_AI_API_KEY` set on the backend (embeddings)
- Documents uploaded via `POST /api/v1/documents`
- Embedding pipeline completes (`embeddingStatus: "completed"`)

## Verify the index

**Startup script:**

```bash
cd backend
npm run startup-check
```

Look for: `✓ Vector search index "document_embedding_index" found`.

**Functional test:**

1. Create a document with text content.
2. Wait for embedding to complete (or call `POST /documents/:id/retry-embedding`).
3. Search:

```bash
curl -X POST https://your-api.example.com/api/v1/documents/search \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"query": "your search phrase", "limit": 5}'
```

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Index not found in startup check | Index still building, wrong name, or wrong collection |
| Vector search errors in API logs | Index missing, wrong dimensions, or Atlas tier without Vector Search |
| Empty search results | Documents not embedded, wrong `userId`, or `embeddingStatus` not `completed` |

Index creation can take several minutes on Atlas. Status appears under **Search** → your index.

## Related

- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) — `VECTOR_SEARCH_INDEX_NAME`, `GOOGLE_AI_API_KEY`
- [GROQ_SETUP.md](./GROQ_SETUP.md) — RAG answer generation (separate from vector index)
