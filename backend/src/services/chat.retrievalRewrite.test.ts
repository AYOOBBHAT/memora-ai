import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/config/env', () => ({
  env: {
    GROQ_MODEL: 'openai/gpt-oss-120b',
    RAG_MAX_CONTEXT_TOKENS: 24_000,
    AI_DAILY_REQUEST_LIMIT: 50,
  },
}));

vi.mock('@/services/embedding.service', () => ({
  extractTextContent: vi.fn((content: string) => content),
}));

vi.mock('@/services/groq.service', () => ({
  generateAnswerFromContext: vi.fn(),
}));

vi.mock('@/services/vectorSearch.service', () => ({
  searchDocumentsForChat: vi.fn(),
}));

vi.mock('@/services/quota.service', () => ({
  consumeAiQuota: vi.fn(),
  releaseAiQuota: vi.fn(),
}));

import { generateAnswerFromContext } from '@/services/groq.service';
import { generateRagAnswer } from '@/services/chat.service';
import { searchDocumentsForChat } from '@/services/vectorSearch.service';
import { consumeAiQuota, releaseAiQuota } from '@/services/quota.service';
import { HTTP_STATUS } from '@/constants/httpStatus';

const USER_A = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const USER_B = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const COLLECTION_B = 'cccccccccccccccccccccccc';

describe('generateRagAnswer retrieval rewrite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchDocumentsForChat).mockResolvedValue([
      {
        document: {
          id: '222222222222222222222222',
          title: 'Memora Pricing',
          sourceType: 'text',
          content: 'The Free plan provides 50 AI questions/month.',
        },
        score: 0.9,
      },
    ] as never);
    vi.mocked(generateAnswerFromContext).mockResolvedValue(
      'Free has 50 and Pro has 500 according to Memora Pricing.',
    );
    vi.mocked(consumeAiQuota).mockResolvedValue(undefined);
    vi.mocked(releaseAiQuota).mockResolvedValue(undefined);
  });

  it('H: keeps the request collectionIds on rewritten follow-up retrieval', async () => {
    await generateRagAnswer(
      USER_A,
      "What's the difference between them?",
      [COLLECTION_B],
      [{ role: 'user', content: 'How many AI questions does the Free plan provide?' }],
    );

    expect(searchDocumentsForChat).toHaveBeenCalledTimes(1);
    const [, query, limit, collectionIds] = vi.mocked(searchDocumentsForChat).mock.calls[0] ?? [];
    expect(limit).toBe(5);
    expect(collectionIds).toEqual([COLLECTION_B]);
    expect(String(query).toLowerCase()).toContain('free');
  });

  it('sends the original user question to Groq, not the rewritten retrieval query', async () => {
    const current = "What's the difference between them?";
    await generateRagAnswer(USER_A, current, undefined, [
      { role: 'user', content: 'How many AI questions does the Free plan provide?' },
    ]);

    expect(vi.mocked(searchDocumentsForChat).mock.calls[0]?.[1]).not.toBe(current);
    expect(String(vi.mocked(searchDocumentsForChat).mock.calls[0]?.[1]).toLowerCase()).toContain(
      'free',
    );
    expect(generateAnswerFromContext).toHaveBeenCalledWith(expect.any(String), current);
  });

  it('G: retrieval stays scoped to the authenticated userId even if prior text mentions another user', async () => {
    await generateRagAnswer(USER_B, 'What about Pro?', undefined, [
      { role: 'user', content: 'User A asked about the vault PIN 1234' },
    ]);

    expect(vi.mocked(searchDocumentsForChat).mock.calls[0]?.[0]).toBe(USER_B);
    expect(vi.mocked(searchDocumentsForChat).mock.calls[0]?.[0]).not.toBe(USER_A);
  });
});

describe('generateRagAnswer AI quota', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchDocumentsForChat).mockResolvedValue([
      {
        document: {
          id: '222222222222222222222222',
          title: 'Memora Pricing',
          sourceType: 'text',
          content: 'The Free plan provides 50 AI questions/month.',
        },
        score: 0.9,
      },
    ] as never);
    vi.mocked(generateAnswerFromContext).mockResolvedValue('ok');
    vi.mocked(consumeAiQuota).mockResolvedValue(undefined);
    vi.mocked(releaseAiQuota).mockResolvedValue(undefined);
  });

  it('consumes quota for the authenticated user when Groq is called', async () => {
    await generateRagAnswer(USER_A, 'How many AI questions does the Free plan provide?');

    expect(consumeAiQuota).toHaveBeenCalledWith(USER_A);
    expect(generateAnswerFromContext).toHaveBeenCalled();
    expect(releaseAiQuota).not.toHaveBeenCalled();
  });

  it('rejects at quota without calling Groq', async () => {
    vi.mocked(consumeAiQuota).mockRejectedValue({
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
      message: 'You have reached your daily AI usage limit. Please try again tomorrow.',
    });

    await expect(generateRagAnswer(USER_A, 'How many AI questions?')).rejects.toMatchObject({
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
      message: 'You have reached your daily AI usage limit. Please try again tomorrow.',
    });
    expect(generateAnswerFromContext).not.toHaveBeenCalled();
  });

  it('does not consume quota when no documents are retrieved', async () => {
    vi.mocked(searchDocumentsForChat).mockResolvedValue([]);

    const result = await generateRagAnswer(USER_A, 'Unrelated question');

    expect(result.sources).toEqual([]);
    expect(consumeAiQuota).not.toHaveBeenCalled();
    expect(generateAnswerFromContext).not.toHaveBeenCalled();
  });

  it('releases quota when Groq fails after consume', async () => {
    vi.mocked(generateAnswerFromContext).mockRejectedValue(new Error('groq down'));

    await expect(generateRagAnswer(USER_A, 'How many AI questions?')).rejects.toThrow('groq down');
    expect(consumeAiQuota).toHaveBeenCalledWith(USER_A);
    expect(releaseAiQuota).toHaveBeenCalledWith(USER_A);
  });

  it('scopes quota consume to the authenticated user', async () => {
    await generateRagAnswer(USER_B, 'What about Pro?');

    expect(consumeAiQuota).toHaveBeenCalledWith(USER_B);
    expect(consumeAiQuota).not.toHaveBeenCalledWith(USER_A);
  });
});
