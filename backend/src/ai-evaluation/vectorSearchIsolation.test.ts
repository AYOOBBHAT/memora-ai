import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const USER_A_ID = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const USER_B_ID = 'bbbbbbbbbbbbbbbbbbbbbbbb';

vi.mock('@/config/env', () => ({
  env: {
    GOOGLE_AI_API_KEY: 'test-google-key',
    VECTOR_SEARCH_INDEX_NAME: 'document_embedding_index',
  },
}));

vi.mock('@/services/embedding.service', () => ({
  generateEmbedding: vi.fn(),
}));

vi.mock('@/models/Document.model', () => ({
  DocumentModel: {
    aggregate: vi.fn(),
  },
}));

vi.mock('@/services/document.service', () => ({
  toSafeDocument: vi.fn((doc: { _id: { toString(): string } }) => ({
    id: doc._id.toString(),
  })),
}));

vi.mock('@/services/collection.service', () => ({
  verifyUserCollections: vi.fn(),
}));

import { DocumentModel } from '@/models/Document.model';
import { generateEmbedding } from '@/services/embedding.service';
import { searchDocumentsBySemanticQuery } from '@/services/vectorSearch.service';

describe('production vector search user isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(generateEmbedding).mockResolvedValue(Array.from({ length: 768 }, () => 0.01));
    vi.mocked(DocumentModel.aggregate).mockResolvedValue([]);
  });

  it('passes the authenticated userId in the $vectorSearch pre-filter', async () => {
    await searchDocumentsBySemanticQuery(USER_A_ID, 'What is the vault PIN?', 5);

    expect(DocumentModel.aggregate).toHaveBeenCalledTimes(1);
    const pipeline = vi.mocked(DocumentModel.aggregate).mock.calls[0]?.[0] as Array<{
      $vectorSearch?: {
        limit?: number;
        numCandidates?: number;
        filter?: {
          userId?: { $eq: Types.ObjectId };
          embeddingStatus?: { $eq: string };
        };
      };
    }>;

    const vectorSearch = pipeline[0]?.$vectorSearch;
    expect(vectorSearch?.limit).toBe(5);
    expect(vectorSearch?.numCandidates).toBe(100);
    expect(vectorSearch?.filter?.embeddingStatus).toEqual({ $eq: 'completed' });
    expect(vectorSearch?.filter?.userId?.$eq.equals(new Types.ObjectId(USER_A_ID))).toBe(true);
    expect(vectorSearch?.filter?.userId?.$eq.equals(new Types.ObjectId(USER_B_ID))).toBe(false);
  });

  it('does not query without a user-scoped filter', async () => {
    await searchDocumentsBySemanticQuery(USER_A_ID, 'Nightingale', 5);

    const pipeline = vi.mocked(DocumentModel.aggregate).mock.calls[0]?.[0] as Array<{
      $vectorSearch?: { filter?: Record<string, unknown> };
    }>;
    const filter = pipeline[0]?.$vectorSearch?.filter ?? {};

    expect(Object.keys(filter)).toContain('userId');
    expect(filter).not.toHaveProperty('userId', USER_B_ID);
  });
});
