import { describe, expect, it } from 'vitest';

import {
  DEFAULT_DEV_CORS_ORIGINS,
  createCorsOriginValidator,
  parseCorsOriginsInput,
} from '@/config/cors';

describe('parseCorsOriginsInput', () => {
  it('uses dev defaults when unset in development', () => {
    expect(parseCorsOriginsInput(undefined, 'development')).toEqual([
      ...DEFAULT_DEV_CORS_ORIGINS,
    ]);
  });

  it('parses comma-separated origins', () => {
    expect(
      parseCorsOriginsInput(
        'http://localhost:3000, https://app.example.com',
        'development',
      ),
    ).toEqual(['http://localhost:3000', 'https://app.example.com']);
  });

  it('normalizes trailing slashes to origin', () => {
    expect(parseCorsOriginsInput('http://localhost:3000/', 'development')).toEqual([
      'http://localhost:3000',
    ]);
  });

  it('rejects wildcard in production', () => {
    expect(() => parseCorsOriginsInput('*', 'production')).toThrow(
      "CORS wildcard '*' is not allowed in production",
    );
  });

  it('rejects http origins in production', () => {
    expect(() => parseCorsOriginsInput('http://localhost:3000', 'production')).toThrow(
      'Production CORS origin must use HTTPS',
    );
  });

  it('requires explicit origins in production', () => {
    expect(() => parseCorsOriginsInput(undefined, 'production')).toThrow(
      'CORS_ORIGINS is required when NODE_ENV=production',
    );
  });
});

describe('createCorsOriginValidator', () => {
  it('allows requests without an Origin header', () => {
    const validate = createCorsOriginValidator(['http://localhost:3000']);

    validate(undefined, (_err, allowed) => {
      expect(allowed).toBe(true);
    });
  });

  it('allows listed browser origins', () => {
    const validate = createCorsOriginValidator(['http://localhost:3000']);

    validate('http://localhost:3000', (_err, allowed) => {
      expect(allowed).toBe(true);
    });
  });

  it('rejects unlisted browser origins', () => {
    const validate = createCorsOriginValidator(['http://localhost:3000']);

    validate('http://evil.example.com', (_err, allowed) => {
      expect(allowed).toBe(false);
    });
  });
});
