import { describe, expect, it } from 'vitest';

import { chatMessageSchema, conversationSearchQuerySchema } from '@/validators/chat.validator';

describe('chatMessageSchema', () => {
  it('accepts optional conversationId', () => {
    const result = chatMessageSchema.safeParse({
      message: 'Hello',
      conversationId: '507f1f77bcf86cd799439011',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid conversationId values', () => {
    const result = chatMessageSchema.safeParse({
      message: 'Hello',
      conversationId: 'invalid',
    });

    expect(result.success).toBe(false);
  });
});

describe('conversationSearchQuerySchema', () => {
  it('requires at least two characters', () => {
    const result = conversationSearchQuerySchema.safeParse({ q: 'a' });
    expect(result.success).toBe(false);
  });

  it('accepts valid search queries', () => {
    const result = conversationSearchQuerySchema.safeParse({ q: 'notes' });
    expect(result.success).toBe(true);
  });
});
