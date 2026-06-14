import { describe, expect, it } from 'vitest';

import { logoutBodySchema, refreshTokenBodySchema } from '@/validators/auth.validator';

describe('refreshTokenBodySchema', () => {
  it('accepts a non-empty refresh token', () => {
    const result = refreshTokenBodySchema.safeParse({ refreshToken: 'abc123' });
    expect(result.success).toBe(true);
  });

  it('rejects missing refreshToken', () => {
    const result = refreshTokenBodySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects empty refreshToken', () => {
    const result = refreshTokenBodySchema.safeParse({ refreshToken: '' });
    expect(result.success).toBe(false);
  });
});

describe('logoutBodySchema', () => {
  it('accepts an empty body', () => {
    const result = logoutBodySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts an optional refresh token', () => {
    const result = logoutBodySchema.safeParse({ refreshToken: 'abc123' });
    expect(result.success).toBe(true);
  });

  it('rejects empty refreshToken when provided', () => {
    const result = logoutBodySchema.safeParse({ refreshToken: '' });
    expect(result.success).toBe(false);
  });
});
