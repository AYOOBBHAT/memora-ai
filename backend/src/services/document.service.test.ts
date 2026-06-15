import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';

vi.mock('@/models/Document.model', () => ({
  DocumentModel: {
    find: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('@/models/Collection.model', () => ({
  CollectionModel: {
    find: vi.fn(),
  },
}));

vi.mock('@/services/embedding.service', () => ({
  scheduleDocumentEmbedding: vi.fn(),
}));

import { CollectionModel } from '@/models/Collection.model';
import { DocumentModel } from '@/models/Document.model';
import {
  getDocumentById,
  getRecentDocuments,
  toSafeDocument,
} from '@/services/document.service';

function createMockDocument(overrides: Record<string, unknown> = {}) {
  const id = new Types.ObjectId();
  const userId = new Types.ObjectId();
  const collectionId = new Types.ObjectId();
  const now = new Date('2026-06-15T12:00:00.000Z');

  return {
    _id: id,
    userId,
    title: 'Test Document',
    content: 'Hello world',
    sourceType: 'text' as const,
    collectionId,
    embeddingStatus: 'pending' as const,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function mockFindChain<T>(results: T[]) {
  return {
    sort: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(results),
  };
}

describe('toSafeDocument', () => {
  it('includes lastViewedAt and lastOpenedAt when present', () => {
    const viewedAt = new Date('2026-06-14T10:00:00.000Z');
    const openedAt = new Date('2026-06-14T11:00:00.000Z');
    const doc = createMockDocument({ lastViewedAt: viewedAt, lastOpenedAt: openedAt });

    const safe = toSafeDocument(doc as never);

    expect(safe.lastViewedAt).toEqual(viewedAt);
    expect(safe.lastOpenedAt).toEqual(openedAt);
  });
});

describe('getDocumentById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates lastViewedAt and lastOpenedAt when a document is opened', async () => {
    const doc = createMockDocument();
    vi.mocked(DocumentModel.findOneAndUpdate).mockResolvedValue(doc as never);

    const result = await getDocumentById(doc.userId.toString(), doc._id.toString());

    expect(DocumentModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: doc._id.toString(), userId: doc.userId.toString() },
      expect.objectContaining({
        $set: expect.objectContaining({
          lastViewedAt: expect.any(Date),
          lastOpenedAt: expect.any(Date),
        }),
      }),
      { new: true },
    );
    expect(result.id).toBe(doc._id.toString());
  });

  it('throws when document is not found', async () => {
    vi.mocked(DocumentModel.findOneAndUpdate).mockResolvedValue(null);

    await expect(getDocumentById('user-id', 'doc-id')).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe('getRecentDocuments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns recently viewed and recently added lists with collection names', async () => {
    const userId = new Types.ObjectId().toString();
    const collectionId = new Types.ObjectId();
    const viewedDoc = createMockDocument({
      lastViewedAt: new Date('2026-06-15T11:00:00.000Z'),
      collectionId,
    });
    const addedDoc = createMockDocument({ title: 'New Doc' });

    vi.mocked(DocumentModel.find)
      .mockReturnValueOnce(mockFindChain([viewedDoc]) as never)
      .mockReturnValueOnce(mockFindChain([addedDoc]) as never);

    vi.mocked(CollectionModel.find).mockReturnValue({
      select: vi.fn().mockResolvedValue([{ _id: collectionId, name: 'Research' }]),
    } as never);

    const result = await getRecentDocuments(userId);

    expect(DocumentModel.find).toHaveBeenNthCalledWith(1, {
      userId,
      lastViewedAt: { $exists: true, $ne: null },
    });
    expect(DocumentModel.find).toHaveBeenNthCalledWith(2, { userId });

    expect(result.recentlyViewed).toHaveLength(1);
    expect(result.recentlyViewed[0]).toMatchObject({
      id: viewedDoc._id.toString(),
      title: 'Test Document',
      collectionName: 'Research',
      lastViewedAt: viewedDoc.lastViewedAt,
    });

    expect(result.recentlyAdded).toHaveLength(1);
    expect(result.recentlyAdded[0]).toMatchObject({
      id: addedDoc._id.toString(),
      title: 'New Doc',
    });
  });

  it('limits each list to 10 documents', async () => {
    const userId = new Types.ObjectId().toString();
    const chain = mockFindChain([]);

    vi.mocked(DocumentModel.find)
      .mockReturnValueOnce(chain as never)
      .mockReturnValueOnce(chain as never);
    vi.mocked(CollectionModel.find).mockReturnValue({
      select: vi.fn().mockResolvedValue([]),
    } as never);

    await getRecentDocuments(userId);

    expect(chain.limit).toHaveBeenCalledWith(10);
  });
});
