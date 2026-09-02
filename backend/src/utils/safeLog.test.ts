import { describe, expect, it } from 'vitest';

import {
  isSensitiveLogKey,
  isUserContentLogKey,
  serializeRequestForLog,
} from '@/utils/safeLog';

describe('safe HTTP request logging', () => {
  it('omits chat message, note content, and secrets from the request log', () => {
    const logged = serializeRequestForLog({
      id: 'req-1',
      method: 'POST',
      url: '/api/v1/chat',
      raw: {
        user: { id: 'aaaaaaaaaaaaaaaaaaaaaaaa' },
        body: {
          message: 'What is in my tax PDF?',
          content: 'Secret note body',
          password: 'super-secret',
          otp: '123456',
          refreshToken: 'tok',
          idToken: 'google',
        },
      },
    });

    const serialized = JSON.stringify(logged);
    expect(logged.method).toBe('POST');
    expect(logged.url).toBe('/api/v1/chat');
    expect(logged.userId).toBe('aaaaaaaaaaaaaaaaaaaaaaaa');
    expect(logged).not.toHaveProperty('body');
    expect(serialized).not.toContain('tax PDF');
    expect(serialized).not.toContain('Secret note body');
    expect(serialized).not.toContain('super-secret');
    expect(serialized).not.toContain('123456');
    expect(serialized).not.toContain('tok');
    expect(serialized).not.toContain('google');
  });

  it('keeps operational metadata', () => {
    const logged = serializeRequestForLog({
      id: 'req-2',
      method: 'POST',
      url: '/api/v1/documents',
      raw: {
        headers: { 'content-length': '128' },
        body: { title: 'My notes', content: 'do not log me' },
      },
    });

    expect(logged.id).toBe('req-2');
    expect(logged.bodyBytes).toBe(128);
    expect(JSON.stringify(logged)).not.toContain('do not log me');
  });

  it('treats passwords, OTPs, tokens, and API keys as sensitive', () => {
    expect(isSensitiveLogKey('password')).toBe(true);
    expect(isSensitiveLogKey('otp')).toBe(true);
    expect(isSensitiveLogKey('refreshToken')).toBe(true);
    expect(isSensitiveLogKey('GROQ_API_KEY')).toBe(true);
    expect(isUserContentLogKey('message')).toBe(true);
    expect(isUserContentLogKey('content')).toBe(true);
    expect(isUserContentLogKey('userQuestion')).toBe(true);
  });
});
