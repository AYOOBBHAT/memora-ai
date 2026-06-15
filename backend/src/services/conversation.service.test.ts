import { describe, expect, it } from 'vitest';

import { deriveConversationTitle, resolveChatCollectionIds } from '@/services/conversation.service';

describe('deriveConversationTitle', () => {
  it('returns the full message when under the max length', () => {
    expect(deriveConversationTitle('Short question')).toBe('Short question');
  });

  it('truncates long messages with an ellipsis', () => {
    const longMessage = 'a'.repeat(100);
    expect(deriveConversationTitle(longMessage)).toHaveLength(80);
    expect(deriveConversationTitle(longMessage).endsWith('…')).toBe(true);
  });
});

describe('resolveChatCollectionIds', () => {
  it('returns collectionId when provided', () => {
    expect(
      resolveChatCollectionIds({
        message: 'Hello',
        collectionId: '507f1f77bcf86cd799439011',
      }),
    ).toEqual(['507f1f77bcf86cd799439011']);
  });

  it('returns collectionIds when collectionId is omitted', () => {
    expect(
      resolveChatCollectionIds({
        message: 'Hello',
        collectionIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
      }),
    ).toEqual(['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']);
  });

  it('returns undefined when no scope is provided', () => {
    expect(resolveChatCollectionIds({ message: 'Hello' })).toBeUndefined();
  });
});
