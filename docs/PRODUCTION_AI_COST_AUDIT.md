# Production AI cost, size, and abuse audit

**Date:** 2026-08-31  
**P0 launch controls:** implemented in code (not deployed). Chunking is **not** implemented; embeddings remain one vector per document (first 8,000 characters).

Re-run local PDF/context measurements from `backend/`:

```bash
npx tsx scripts/pdf-cost-audit.ts
```

---

## Implemented launch limits

Configurable via environment. Ranges are enforced in `backend/src/config/env.ts` so a typo cannot restore unbounded behavior.

| Limit | Default | Configurable | Hard cap | Where |
| --- | --- | --- | --- | --- |
| PDF file size | **10 MB** | no | 10 MB | `upload.middleware.ts` |
| PDF pages | **50** | `PDF_MAX_PAGES` (1–50) | 50 | `pdfLimits.ts` after extraction |
| PDF extracted text | **50,000 characters** | `PDF_MAX_EXTRACTED_CHARS` (5k–50k) | 50,000 | `pdfLimits.ts` after extraction |
| RAG input context | **24,000 estimated tokens** (chars/4) | `RAG_MAX_CONTEXT_TOKENS` (4k–32k) | 32,000 | `ragContextBudget.ts`, `chat.service.ts` |
| Groq completion | **1024 tokens** | `GROQ_MAX_COMPLETION_TOKENS` (256–2048) | 2048 | `groq.service.ts` |
| AI requests | **50 / user / UTC day** | `AI_DAILY_REQUEST_LIMIT` (1–200) | 200 | `quota.service.ts` |
| PDF uploads | **20 / user / UTC day** | `UPLOAD_DAILY_LIMIT` (1–50) | 50 | `quota.service.ts` |

**Token estimate:** characters ÷ 4. This is not a GPT-OSS tokenizer count.

**Quota timezone:** UTC calendar day (`YYYY-MM-DD` from `Date#toISOString`). Resets at 00:00 UTC, not local midnight.

**Quota identity:** authenticated `userId`, not IP. MongoDB `findOneAndUpdate` `$inc` plus unique `{ userId, kind, dateKey }`. No Redis in this stack.

**Not a billing plan.** `User.subscription` is unused for these caps.

**Chunking:** not implemented. A 50-page PDF still has one embedding over the first 8k characters. Tail-of-document retrieval remains a future RAG improvement.

### API errors

| Case | Status | Message |
| --- | --- | --- |
| PDF > 50 pages | 422 | `PDF exceeds the maximum supported page limit of 50 pages.` |
| PDF text > 50k chars | 422 | `PDF contains more text than Memora currently supports. Please use a smaller document.` |
| PDF > 10 MB | 400 | `PDF file exceeds 10MB limit` |
| AI quota exhausted | 429 | `You have reached your daily AI usage limit. Please try again tomorrow.` |
| Upload quota exhausted | 429 | `You have reached your daily upload limit. Please try again tomorrow.` |

Invalid PDFs and over-limit PDFs **do not** consume upload quota. Canned no-document chat answers **do not** consume AI quota. Groq failures **release** a reserved AI slot.

Notes, URL imports, and YouTube imports are **not** subject to the PDF page/text caps or the PDF upload quota.

---

## Document limits (full ingest picture)

The evaluation fixture “maximum PDF size is 50 MB” is fictional eval data and is **not** what the API enforces.

| Control | Actual implementation | Where |
| --- | --- | --- |
| PDF file size | **10 MB** (`PDF_MAX_FILE_SIZE_BYTES`). Multer `LIMIT_FILE_SIZE` → HTTP 400. | `backend/src/middleware/upload.middleware.ts` |
| PDF MIME | `application/pdf` only | same |
| PDF page count | **50** after extraction | `pdfLimits.ts` |
| PDF extraction timeout | **None** (`pdf-parse` `getText()` with no abort) | `pdf.service.ts` |
| Extracted text length | **50,000 characters** for PDFs (reject, no silent truncate) | `pdfLimits.ts` |
| Text-note body (JSON API) | **1,000,000 characters** (zod). Also bounded by `express.json({ limit: '1mb' })`. | `document.validator.ts`, `app.ts` |
| Original PDF storage | **Not stored.** `multer.memoryStorage()` holds the buffer in RAM; only extracted text + metadata go to MongoDB. | upload middleware, `document.service.ts` |
| Embedding input | Truncate to **8,000 characters**, then one Gemini `gemini-embedding-001` vector (768-d). Unchanged. | `embedding.service.ts` |
| Groq `max_completion_tokens` | **1024** (default) | `groq.service.ts` |
| Retrieved docs to Groq | Up to 5 hits, packed in relevance order until the estimated input budget is full. Whole documents preferred; oversized bodies may be prefix-bounded or skipped. | `ragContextBudget.ts`, `chat.service.ts` |
| HTTP / chat logs | Request **bodies omitted**. No `userQuestion`, chat `message`, or document `content`. Metadata only (length, counts, model, token estimate). | `safeLog.ts`, `app.ts`, `chat.service.ts`, `groq.service.ts` |

---

## Large PDF results


Synthetic text PDFs (ASCII Helvetica, ~480 unique body characters/page plus markers). Measured locally with production `extractTextFromPdf` (`pdf-parse`). **No MongoDB writes. No user uploads.**

Gemini embedding was **not** called in this environment (`GOOGLE_AI_API_KEY` unset). Embedding time is therefore not a live measurement. Because production always truncates to 8,000 characters, embedding latency/cost is **bounded** and essentially **constant** for every PDF larger than ~15 pages of this density.

| Pages | Size | Extraction | Embedding | Total | Result |
| --- | --- | --- | --- | --- | --- |
| 1 (small) | 1.4 KB | 1315 ms (cold `pdf-parse`) | not run (no Gemini key); would embed 772 chars | 1315 ms extract | success; all markers inside 8k window |
| 15 | 13.3 KB | 84 ms | not run; would truncate 8,700 → 8,000 chars | 84 ms extract | success; **last-page token outside** embedding window |
| 50 | 43.1 KB | 187 ms | not run; 28,615 → 8,000 chars | 187 ms extract | success; first page only in embedding; middle/last/uncommon **miss** |
| 100 | 85.9 KB | 266 ms | not run; 57,265 → 8,000 chars | 266 ms extract | same truncation pattern |
| 300 | 257.2 KB | 588 ms | not run; 171,465 → 8,000 chars | 588 ms extract | same |
| 500 | 428.5 KB | 933 ms | not run; 285,665 → 8,000 chars | 933 ms extract | same; one MongoDB document would be stored |
| >10 MB | 10,241 KB | never (multer) | never | n/a | **rejected** at 10 MB; extraction not attempted |

Process RSS during the local run: ~339–412 MB (includes Node, `pdf-parse`, and a ~10 MB oversize buffer). CPU was not sampled; extraction stayed under 1 s after the first cold parse.

**Stored records:** production would create **one** `Document` per successful upload (`sourceType: 'pdf'`), then one background embedding. Oversize files never create a row.

**Tables:** a simple `Metric \| Q1 \| Q2` line was present in the extract for the 15-page fixture. There is no dedicated table parser; layout-heavy PDFs will degrade to linear text or empty extract (no OCR).

### Retrieval quality on large PDFs (whole-document embeddings)

Current architecture: **one embedding per document**, first **8,000 characters** only. Groq still receives the **full** stored body of each hit.

On these synthetics:

| Question target | In the 8k embedding? | Implication |
| --- | --- | --- |
| First pages (`ALPHA-FRONTIER-771`) | Yes (from 1 page through 500) | Retrievable |
| Middle pages (`BRAVO-MIDPOINT-442`) | Yes at 15 pages; **No** at 50+ | 50+ page PDFs: middle content will not influence the vector |
| Final pages (`CHARLIE-TAIL-993`) | **No** from 15 pages upward | Tail-of-document questions will miss unless another doc matches |
| Uncommon term (`xenon-photocathode-calibration`, ~2/3 through) | Yes at 15; **No** at 50+ | Rare late terminology is invisible to search |
| Repeated term (`quarterly revenue forecast` on every page) | First 8k still contains it | Repeated terms can match, but the vector cannot distinguish *where* |
| Table on page 2 | Usually inside 8k | Early tables may retrieve; late tables will not |

**Chunking is necessary** before launch if users will ask about anything past the first ~8–15 pages of a typical text PDF. Do not implement chunking in this audit; this is a recommendation only.

A live Atlas retrieval pass was **not** run (no Gemini key, and the task forbids writing test PDFs to production accounts). The truncation math is sufficient to predict misses.

---

## Context/token results

Documents are packed in relevance order before Groq. Token estimate remains **characters / 4**. GPT-OSS 120B context is 131,072; Memora now sends at most **24,000 estimated input tokens**. Completion is capped at **1024**.

**Before packing (historical):** 5 × 500-page PDFs ≈ 1.43M characters ≈ **357k** estimated input tokens.

**After packing (re-run 2026-08-31):**

| Scenario | Retrieved | Included | Characters | Est. input tokens | Result |
| --- | --- | --- | --- | --- | --- |
| 3 short notes | 3 | 3 | 1,807 | 452 | within 24k |
| 5 medium (~8k each) | 5 | 5 | 46,009 | 11,503 | within 24k |
| 1 large 100-page PDF | 1 | 1 | 58,726 | 14,682 | within 24k |
| 5 large 100-page PDFs | 5 | 2 | 95,999 | **24,000** | packed to budget |
| 5 × 500-page PDFs | 5 | 1 | 95,999 | **24,000** | packed to budget (was 357k) |

Ingest would already **reject** 51+ page PDFs and extracts over 50k characters, so the 100/500-page Groq cases are packing fallbacks, not a supported upload path.

Launch ingest check on the same synthetics: 1 and 50 pages **accepted**; 51, 100, 300, 500 pages **rejected**; >10 MB **rejected**.

---

## Cost model

**Do not treat these as invoices.** They use published list prices as of 2026-08-31. Model remains `openai/gpt-oss-120b`. `max_completion_tokens` is now **1024**.

### Groq chat (`openai/gpt-oss-120b`)

Source: [Groq supported models](https://console.groq.com/docs/models)

| | Per 1M tokens |
| --- | --- |
| Input | **$0.15** |
| Output | **$0.60** |
| Cached input (automatic prefix cache, if any) | **$0.075** (listed on Groq pricing trackers; Memora does not configure caching) |
| Developer-plan throughput (provider) | 250K TPM / 1K RPM |

Assumed **output** for cost rows (not measured): **250 tokens** normal (prompt says “keep answers concise”), **400 tokens** heavy-context.

| Volume | Normal (452 in + 250 out) | Heavy 5×100-page (72,073 in + 400 out) |
| --- | --- | --- |
| 1 request | in **$0.000068** + out **$0.000150** = **$0.00022** | in **$0.01081** + out **$0.00024** = **$0.01105** |
| 10 | **$0.0022** | **$0.110** |
| 100 | **$0.022** | **$1.11** |
| 1,000 | **$0.22** | **$11.05** |

**Worst-case still-fitting Groq call** (example: ~100k input tokens, completion allowed to run long because `max_completion_tokens` is unset):

| | Input | Output | Total |
| --- | --- | --- | --- |
| 100k in + 2k out (sane) | $0.015 | $0.0012 | **~$0.016 / request** |
| 60k in + 65,536 out (model max) | $0.009 | $0.039 | **~$0.048 / request** |
| 1,000 of the second row | | | **~$48** |

Failed oversize prompts (357k estimated tokens) should be rejected by Groq; they are a reliability/DoS issue more than a clean billable success path.

### Gemini embeddings (`gemini-embedding-001`)

Source: [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing) — paid tier **$0.15 / 1M input tokens**. Free tier exists; production should assume paid.

Memora sends at most **8,000 characters** (~**2,000 tokens**) per document embed, plus one query embed per search/chat.

| Usage | Est. tokens | Cost |
| --- | --- | --- |
| 1 PDF embed (capped) | ≤ 2,000 | **≤ $0.00030** |
| 1,000 PDF embeds | ≤ 2M | **≤ $0.30** |
| 1 chat query embed | ~10–30 | **~ $0.000002–$0.000005** |
| 1,000 query embeds | ~20k | **~ $0.003** |

Embeddings are **not** the Groq cost driver. Unbounded **chat context** is.

---

## Abuse gaps

Safely inferred from code plus local file-size/context tests. No production traffic was generated.

| Scenario | What exists today | Remaining gap |
| --- | --- | --- |
| A. Many PDF uploads | **20 PDF uploads / user / UTC day** plus IP 100/15 min. Page/text caps. | URL/YouTube ingest is not in the upload quota. No total storage byte cap. |
| B. Same PDF repeatedly | No hash. Each accepted upload is a new document + embed job. | Duplicate cost until the daily upload cap. |
| C. Repeated chat | **50 Groq calls / user / UTC day** plus IP 100/15 min. | NAT still shares the IP bucket; new accounts bypass user quota. |
| D. Questions that retrieve large docs | Packed to **24k estimated input tokens**; completion **1024**. | Still one embedding per doc (first 8k chars). |
| E. Concurrent uploads | No process-wide ingest concurrency cap. | RAM spike still possible within the daily quota. |
| F. Concurrent chat | Mongo `$inc` prevents extra quota slots. No Groq concurrency cap. | Parallel calls up to the remaining daily quota. |

---

## Reliability gaps

| Failure | Observed behavior | Problem |
| --- | --- | --- |
| Upload interrupted before multer finishes | No document created | OK |
| Extraction fails (empty/encrypted/invalid) | 422, no Mongo row | OK; message is useful |
| Embedding fails / `GOOGLE_AI_API_KEY` missing | Document kept, `embeddingStatus: failed`, excluded from `$vectorSearch` | OK for retrieval safety. User must retry. If key is missing, every new doc is failed. |
| Server crash while `processing` | Status can **stick on `processing`**. Dedicated retry endpoint returns **409**. `PUT` with `retryEmbedding: true` can reset. | Stuck docs until a manual update |
| Groq request fails | User message **already persisted**; client gets 500; no assistant row | Orphan user turns; retry duplicates the user message |
| Groq returns a very long answer | `max_completion_tokens` **1024**; chat message maxlength **20,000** | Persist should succeed for normal answers |
| MongoDB unavailable at create | Create throws; no row (or driver timeout) | OK if the client sees 5xx |
| MongoDB unavailable after create, before embed | Row exists `pending`/`processing` | Recoverable via retry **unless** stuck `processing` |
| No extraction timeout | A pathological PDF can hold the request and RAM | Event-loop / memory risk |
| PDF JSON 1 MB cap bypass | PDF extract is capped at **50,000 characters** | Notes/URL/YouTube still have separate (or no) text caps |

Users get useful errors for missing PDF, oversize PDF, empty extract, too many pages, too much text, AI/upload quota, and generic Groq failure. Context packing prevents oversized Groq prompts; a last-line guard in `generateAnswerFromContext` refuses to send a prompt over the estimated budget.

---

## Security findings

- **User isolation:** `$vectorSearch` always pre-filters `userId` + `embeddingStatus: completed`. Unchanged.
- **Secrets in logs:** passwords, OTPs, tokens, and API keys are treated as sensitive. HTTP logs **omit request bodies**.
- **Document / chat content in logs:** not logged. Diagnostics keep model, context length, document counts, and estimated tokens.
- **Original PDFs** are not written to disk. Extracted text lives in MongoDB and is returned on `GET /documents/:id` to the owner.

---

## Remaining recommendations (not in this P0)

| Item | Status |
| --- | --- |
| PDF 10 MB / 50 pages / 50k chars | **Done** |
| Groq 24k input pack + 1024 completion | **Done** |
| Per-user AI 50/day and PDF upload 20/day (UTC) | **Done** |
| Stop logging chat/document bodies | **Done** |
| Concurrent PDF ingest cap / extract timeout | Not done |
| Stuck `processing` auto-fail | Not done |
| Persist chat only after Groq succeeds | Not done |
| **Chunking** | Not done — still required for tail-of-document questions |

---

## What this pass did not do

- Did not deploy, restart production, or modify production data.
- Did not implement chunking, billing, or a new embedding architecture.
- Did not call Groq or Gemini in the measurement environment (keys unset).
- Did not upload PDFs to any user account.

