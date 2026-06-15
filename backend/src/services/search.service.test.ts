import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/models/Document.model', () => ({
  DocumentModel: {
    find: vi.fn(),
  },
}));

vi.mock('@/models/Collection.model', () => ({
  CollectionModel: {
    find: vi.fn(),
  },
}));

import { CollectionModel } from '@/models/Collection.model';
import { DocumentModel } from '@/models/Document.model';
import { escapeRegex, generateSnippet, globalSearch } from '@/services/search.service';

function mockFindChain<T>(results: T[]) {
  return {
    sort: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(results),
  };
}

describe('escapeRegex', () => {
  it('escapes regex special characters', () => {
    expect(escapeRegex('hello.world')).toBe('hello\\.world');
    expect(escapeRegex('test(a+b)?')).toBe('test\\(a\\+b\\)\\?');
    expect(escapeRegex('[meta]*')).toBe('\\[meta\\]\\*');
  });
});

describe('generateSnippet', () => {
  it('returns surrounding context around the match', () => {
    const text = 'The quick brown fox jumps over the lazy dog';
    const snippet = generateSnippet(text, 'lazy dog', 8);
    expect(snippet).toContain('lazy dog');
    expect(snippet.startsWith('…')).toBe(true);
  });
});

describe('globalSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('scopes queries to the authenticated user', async () => {
    vi.mocked(DocumentModel.find).mockReturnValue(mockFindChain([]) as never);
    vi.mocked(CollectionModel.find).mockReturnValue(mockFindChain([]) as never);

    await globalSearch('user-abc', 'notes');

    expect(DocumentModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-abc',
        $or: expect.arrayContaining([
          { title: { $regex: 'notes', $options: 'i' } },
          { content: { $regex: 'notes', $options: 'i' } },
        ]),
      }),
    );

    expect(CollectionModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-abc',
        $or: expect.arrayContaining([
          { name: { $regex: 'notes', $options: 'i' } },
          { description: { $regex: 'notes', $options: 'i' } },
        ]),
      }),
    );
  });

  it('escapes user input in regex patterns', async () => {
    vi.mocked(DocumentModel.find).mockReturnValue(mockFindChain([]) as never);
    vi.mocked(CollectionModel.find).mockReturnValue(mockFindChain([]) as never);

    await globalSearch('user-abc', 'C++ (draft)');

    expect(DocumentModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        $or: expect.arrayContaining([
          { title: { $regex: 'C\\+\\+ \\(draft\\)', $options: 'i' } },
        ]),
      }),
    );
  });

  it('returns unified document and collection results', async () => {
    const doc = {
      _id: { toString: () => 'doc-1' },
      title: 'Meeting notes',
      content: 'Discuss project roadmap',
      sourceType: 'text',
      collectionId: undefined,
    };

    const collection = {
      _id: { toString: () => 'col-1' },
      name: 'Work notes',
      description: 'Important work items',
    };

    vi.mocked(DocumentModel.find).mockReturnValue(mockFindChain([doc]) as never);
    vi.mocked(CollectionModel.find).mockReturnValue(mockFindChain([collection]) as never);

    const result = await globalSearch('user-abc', 'notes');

    expect(result.query).toBe('notes');
    expect(result.results).toHaveLength(2);
    expect(result.results[0]).toMatchObject({
      type: 'document',
      id: 'doc-1',
      matchField: 'title',
    });
    expect(result.results[1]).toMatchObject({
      type: 'collection',
      id: 'col-1',
      matchField: 'name',
    });
  });
});
