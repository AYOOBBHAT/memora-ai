import { Types } from 'mongoose';
import pino from 'pino';
import { env } from '@/config/env';
import { HTTP_STATUS } from '@/constants/httpStatus';
import { DocumentModel, IDocumentDocument } from '@/models/Document.model';
import { verifyUserCollections } from '@/services/collection.service';
import { toSafeDocument } from '@/services/document.service';
import { TaskType } from '@google/generative-ai';
import { generateEmbedding } from '@/services/embedding.service';
import { ScoredSearchResult } from '@/types';
import { ApiError } from '@/utils/ApiError';

const logger = pino({ name: 'vector-search' });

/** Default number of semantic search results returned. */
export const DEFAULT_SEARCH_LIMIT = 5;

/** Number of nearest-neighbor candidates Atlas evaluates before applying the limit. */
const NUM_CANDIDATES = 100;

/**
 * Performs semantic vector search over a user's embedded documents.
 *
 * Requires a MongoDB Atlas Vector Search index on the `embedding` field
 * (see README for setup). Only documents with `embeddingStatus: 'completed'`
 * and a non-empty embedding are considered.
 *
 * @param userId - Authenticated user ID; results are scoped to this user only.
 * @param query - Natural-language search query.
 * @param limit - Maximum results to return (capped at {@link DEFAULT_SEARCH_LIMIT}).
 * @param collectionIds - Optional collection IDs; when provided, only documents in those
 *   owned collections are searched. Omitted or empty searches all user documents.
 * @returns Top matching documents with vector similarity scores (no raw embedding vectors).
 */
export async function searchDocumentsBySemanticQuery(
  userId: string,
  query: string,
  limit: number = DEFAULT_SEARCH_LIMIT,
  collectionIds?: string[],
): Promise<ScoredSearchResult[]> {
  if (!env.GOOGLE_AI_API_KEY) {
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Semantic search is unavailable: GOOGLE_AI_API_KEY is not configured',
    );
  }

  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Search query cannot be empty');
  }

  const cappedLimit = Math.min(Math.max(1, limit), DEFAULT_SEARCH_LIMIT);
  const scopedCollectionIds = collectionIds?.length ? collectionIds : undefined;

  if (scopedCollectionIds) {
    await verifyUserCollections(userId, scopedCollectionIds);
  }

  const vectorFilter: Record<string, unknown> = {
    userId: { $eq: new Types.ObjectId(userId) },
    embeddingStatus: { $eq: 'completed' },
  };

  if (scopedCollectionIds) {
    vectorFilter.collectionId = {
      $in: scopedCollectionIds.map((id) => new Types.ObjectId(id)),
    };
  }

  let queryEmbedding: number[];

  try {
    queryEmbedding = await generateEmbedding(trimmedQuery, TaskType.RETRIEVAL_QUERY);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate query embedding';
    logger.error({ err: error, userId }, 'Query embedding generation failed');
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, message);
  }

  try {
    const results = await DocumentModel.aggregate<IDocumentDocument & { score: number }>([
      {
        $vectorSearch: {
          index: env.VECTOR_SEARCH_INDEX_NAME,
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: NUM_CANDIDATES,
          limit: cappedLimit,
          filter: vectorFilter,
        },
      },
      {
        $addFields: {
          score: { $meta: 'vectorSearchScore' },
        },
      },
      {
        $match: {
          embedding: { $exists: true, $type: 'array', $ne: [] },
        },
      },
    ]);

    return results.map((doc) => ({
      document: toSafeDocument(doc),
      score: doc.score,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown vector search error';
    logger.error(
      { err: error, userId, index: env.VECTOR_SEARCH_INDEX_NAME },
      'Vector search aggregation failed',
    );

    if (/index|Index|vectorSearch/i.test(message)) {
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        `Vector search index "${env.VECTOR_SEARCH_INDEX_NAME}" is not available. ` +
          'Create the Atlas Vector Search index on the embedding field (see README).',
      );
    }

    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Semantic document search failed');
  }
}
