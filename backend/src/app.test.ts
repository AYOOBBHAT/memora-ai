import { describe, expect, it } from 'vitest';

import { createApp } from '@/app';

describe('createApp', () => {
  it('trusts the first reverse proxy hop for client IP and secure cookies', () => {
    const app = createApp();

    expect(app.get('trust proxy')).toBe(1);
  });
});
