import { describe, expect, it } from 'vitest';

import { googleAuthSchema } from '@/validators/auth.validator';

describe('googleAuthSchema', () => {
  it('accepts a non-empty idToken', () => {
    const result = googleAuthSchema.safeParse({ idToken: 'google-id-token' });
    expect(result.success).toBe(true);
  });

  it('rejects missing idToken', () => {
    const result = googleAuthSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects empty idToken', () => {
    const result = googleAuthSchema.safeParse({ idToken: '' });
    expect(result.success).toBe(false);
  });
});
