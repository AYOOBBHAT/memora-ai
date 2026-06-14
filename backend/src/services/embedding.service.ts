import { GoogleGenerativeAI, TaskType, type EmbedContentRequest } from '@google/generative-ai';
import pino from 'pino';
import { env } from '@/config/env';
import { DocumentModel } from '@/models/Document.model';
import type { DocumentEmbeddingStatus } from '@/types';

const logger = pino({ name: 'embedding' });

/** Recommended Gemini embedding model (replaces retired `text-embedding-004`). */
export const DEFAULT_GEMINI_EMBEDDING_MODEL = 'gemini-embedding-001';

/**
 * Vector dimension count for {@link env.GEMINI_EMBEDDING_MODEL} (`gemini-embedding-001`).
 * Passed as `outputDimensionality` — the API default is 3072 without it.
 * @see https://ai.google.dev/gemini-api/docs/embeddings
 */
export const EMBEDDING_DIMENSIONS = 768;

/** Embed request fields supported by the API but not yet in @google/generative-ai typings. */
type GeminiEmbedContentRequest = EmbedContentRequest & {
  outputDimensionality?: number;
};

/** Approximate character limit to stay within Gemini embedding token bounds. */
const MAX_EMBED_TEXT_LENGTH = 8_000;

/** Statuses that allow a new embedding job to be claimed atomically. */
const CLAIMABLE_STATUSES: DocumentEmbeddingStatus[] = ['pending', 'failed'];

/** In-process guard against duplicate concurrent jobs for the same document. */
const inFlightEmbeddings = new Set<string>();

let genAI: GoogleGenerativeAI | null = null;

function embeddingJobKey(documentId: string, userId: string): string {
  return `${userId}:${documentId}`;
}

function getGenAI(): GoogleGenerativeAI | null {
  if (!env.GOOGLE_AI_API_KEY) {
    return null;
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(env.GOOGLE_AI_API_KEY);
  }

  return genAI;
}

function truncateText(text: string): string {
  if (text.length <= MAX_EMBED_TEXT_LENGTH) {
    return text;
  }

  logger.warn(
    { originalLength: text.length, maxLength: MAX_EMBED_TEXT_LENGTH },
    'Truncating text for embedding',
  );

  return text.slice(0, MAX_EMBED_TEXT_LENGTH);
}

/**
 * Validates that an embedding vector matches the expected dimension count.
 * Logs a warning on mismatch but still returns the vector so callers can decide policy.
 */
function validateEmbeddingDimensions(values: number[], model: string): number[] {
  if (values.length !== EMBEDDING_DIMENSIONS) {
    logger.warn(
      {
        model,
        expected: EMBEDDING_DIMENSIONS,
        actual: values.length,
      },
      'Unexpected embedding dimension count from Gemini API',
    );
  }

  return values;
}

/** L2-normalizes a vector (required for truncated `gemini-embedding-001` vectors). */
function normalizeEmbedding(values: number[]): number[] {
  let sumSquares = 0;

  for (const value of values) {
    sumSquares += value * value;
  }

  const magnitude = Math.sqrt(sumSquares);

  if (magnitude === 0) {
    return values;
  }

  return values.map((value) => value / magnitude);
}

function shouldNormalizeEmbedding(modelName: string, dimensions: number): boolean {
  return modelName.startsWith('gemini-embedding') && dimensions < 3072;
}

function enhanceEmbeddingError(error: unknown, modelName: string): Error {
  const message = error instanceof Error ? error.message : 'Unknown embedding error';

  if (/404|not found|text-embedding-004/i.test(message)) {
    return new Error(
      `Gemini embedding model "${modelName}" is unavailable (404). ` +
        'The retired `text-embedding-004` model is no longer supported. ' +
        `Set GEMINI_EMBEDDING_MODEL=${DEFAULT_GEMINI_EMBEDDING_MODEL} in your .env and restart the server. ` +
        `Original error: ${message}`,
    );
  }

  return error instanceof Error ? error : new Error(message);
}

/**
 * Extracts plain text from document content for embedding.
 * Supports string bodies and common object keys (`text`, `content`, `body`, `markdown`).
 */
export function extractTextContent(content: string | Record<string, unknown>): string {
  if (typeof content === 'string') {
    return content.trim();
  }

  for (const key of ['text', 'content', 'body', 'markdown']) {
    const value = content[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  try {
    return JSON.stringify(content);
  } catch {
    return String(content);
  }
}

/**
 * Calls Gemini {@link env.GEMINI_EMBEDDING_MODEL} (default `gemini-embedding-001`) via
 * `@google/generative-ai` and returns a **768-dimensional** float vector (`EMBEDDING_DIMENSIONS`).
 *
 * Uses `outputDimensionality: 768` to match the Atlas vector index. Use
 * `TaskType.RETRIEVAL_DOCUMENT` when indexing documents and `TaskType.RETRIEVAL_QUERY` for search queries.
 */
export async function generateEmbedding(
  text: string,
  taskType: TaskType = TaskType.RETRIEVAL_DOCUMENT,
): Promise<number[]> {
  const client = getGenAI();

  if (!client) {
    throw new Error('GOOGLE_AI_API_KEY is not configured');
  }

  const truncated = truncateText(text.trim());

  if (!truncated) {
    throw new Error('Cannot generate embedding for empty text');
  }

  const modelName = env.GEMINI_EMBEDDING_MODEL;
  const model = client.getGenerativeModel({ model: modelName });

  let result;

  try {
    result = await model.embedContent({
      content: {
        role: 'user',
        parts: [{ text: truncated }],
      },
      taskType,
      outputDimensionality: EMBEDDING_DIMENSIONS,
    } as GeminiEmbedContentRequest);
  } catch (error) {
    throw enhanceEmbeddingError(error, modelName);
  }

  const rawValues = result.embedding?.values;

  if (!rawValues || rawValues.length === 0) {
    throw new Error('Empty embedding returned from Gemini API');
  }

  const values = shouldNormalizeEmbedding(modelName, rawValues.length)
    ? normalizeEmbedding(rawValues)
    : rawValues;

  return validateEmbeddingDimensions(values, modelName);
}

async function markEmbeddingFailed(
  documentId: string,
  userId: string,
  message: string,
): Promise<void> {
  await DocumentModel.updateOne(
    { _id: documentId, userId },
    {
      $set: {
        embeddingStatus: 'failed',
        embeddingError: message,
        embeddingUpdatedAt: new Date(),
      },
    },
  );
}

/**
 * Generates and persists an embedding for a single user-owned document.
 *
 * **Lifecycle:** `pending` → `processing` → `completed` | `failed`
 * - Claimed in {@link scheduleDocumentEmbedding} (sets `processing` atomically).
 * - On success: stores the 768-d vector and sets `completed`.
 * - On failure: sets `failed` and persists `embeddingError`.
 *
 * Always scopes reads/writes by both `documentId` and `userId` for tenant isolation.
 */
export async function generateDocumentEmbedding(documentId: string, userId: string): Promise<void> {
  logger.info({ documentId, userId }, 'Starting document embedding generation');

  try {
    const document = await DocumentModel.findOne({ _id: documentId, userId });

    if (!document) {
      logger.warn({ documentId, userId }, 'Document not found for embedding');
      return;
    }

    if (document.userId.toString() !== userId) {
      logger.warn({ documentId, userId }, 'Document userId mismatch — aborting embedding');
      return;
    }

    const text = extractTextContent(document.content);

    if (!text) {
      await markEmbeddingFailed(documentId, userId, 'No extractable text content');
      logger.warn({ documentId, userId }, 'No extractable text content for embedding');
      return;
    }

    const embedding = await generateEmbedding(text);

    await DocumentModel.updateOne(
      { _id: documentId, userId },
      {
        $set: {
          embedding,
          embeddingStatus: 'completed',
          embeddingUpdatedAt: new Date(),
        },
        $unset: { embeddingError: 1 },
      },
    );

    logger.info(
      { documentId, userId, dimensions: embedding.length },
      'Document embedding generated successfully',
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown embedding error';
    logger.error({ err: error, documentId, userId }, 'Failed to generate document embedding');

    try {
      await markEmbeddingFailed(documentId, userId, message);
    } catch (updateError) {
      logger.error(
        { err: updateError, documentId, userId },
        'Failed to persist embedding failure status',
      );
    }
  }
}

/**
 * Atomically claims a document for embedding and runs generation in the background.
 * Never awaited by HTTP handlers — fire-and-forget only.
 *
 * Duplicate jobs are prevented by:
 * 1. An in-process `inFlightEmbeddings` set (same Node worker).
 * 2. A MongoDB findOneAndUpdate that only transitions `pending`/`failed` → `processing`.
 */
async function claimAndRunEmbedding(documentId: string, userId: string, jobKey: string): Promise<void> {
  try {
    const claimed = await DocumentModel.findOneAndUpdate(
      {
        _id: documentId,
        userId,
        embeddingStatus: { $in: CLAIMABLE_STATUSES },
      },
      {
        $set: {
          embeddingStatus: 'processing',
          embeddingUpdatedAt: new Date(),
        },
        $unset: { embeddingError: 1 },
      },
    );

    if (!claimed) {
      logger.debug(
        { documentId, userId },
        'Embedding job not claimed — already processing or completed',
      );
      return;
    }

    inFlightEmbeddings.add(jobKey);

    await generateDocumentEmbedding(documentId, userId);
  } catch (error) {
    logger.error({ err: error, documentId, userId }, 'Unhandled error in claimAndRunEmbedding');
  } finally {
    inFlightEmbeddings.delete(jobKey);
  }
}

/**
 * Schedules background embedding for a document. Returns immediately (never awaited).
 *
 * **Lifecycle:** `pending` → `processing` → `completed` | `failed`
 */
export function scheduleDocumentEmbedding(documentId: string, userId: string): void {
  const jobKey = embeddingJobKey(documentId, userId);

  if (inFlightEmbeddings.has(jobKey)) {
    logger.debug({ documentId, userId }, 'Duplicate embedding schedule skipped (in-flight)');
    return;
  }

  if (!env.GOOGLE_AI_API_KEY) {
    logger.warn({ documentId, userId }, 'Skipping embedding: GOOGLE_AI_API_KEY not configured');

    void markEmbeddingFailed(documentId, userId, 'GOOGLE_AI_API_KEY is not configured').catch(
      (err) => {
        logger.error({ err, documentId, userId }, 'Failed to persist embedding skip status');
      },
    );

    return;
  }

  void claimAndRunEmbedding(documentId, userId, jobKey);
}
