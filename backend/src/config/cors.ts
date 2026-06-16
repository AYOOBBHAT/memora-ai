import type { CorsOptions } from 'cors';

/** Browser origins allowed during local / Expo web development. */
export const DEFAULT_DEV_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:19006',
  'http://localhost:8081',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:19006',
  'http://127.0.0.1:8081',
] as const;

type NodeEnv = 'development' | 'production' | 'test';

function normalizeOrigin(value: string, nodeEnv: NodeEnv): string {
  if (value === '*') {
    if (nodeEnv === 'production') {
      throw new Error("CORS wildcard '*' is not allowed in production");
    }
    return '*';
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid CORS origin URL: ${value}`);
  }

  if (nodeEnv === 'production' && url.protocol !== 'https:') {
    throw new Error(`Production CORS origin must use HTTPS: ${value}`);
  }

  return url.origin;
}

/**
 * Parse comma-separated CORS origins from CORS_ORIGINS or legacy CORS_ORIGIN.
 * Native mobile clients (Expo dev, APK) do not send Origin and are allowed separately.
 */
export function parseCorsOriginsInput(
  raw: string | undefined,
  nodeEnv: NodeEnv,
): string[] {
  if (!raw?.trim()) {
    if (nodeEnv === 'development' || nodeEnv === 'test') {
      return [...DEFAULT_DEV_CORS_ORIGINS];
    }
    throw new Error('CORS_ORIGINS is required when NODE_ENV=production');
  }

  const origins = raw
    .split(',')
    .map((origin) => normalizeOrigin(origin.trim(), nodeEnv))
    .filter(Boolean);

  return [...new Set(origins)];
}

export function createCorsOriginValidator(
  allowedOrigins: readonly string[],
): NonNullable<CorsOptions['origin']> {
  const allowAll = allowedOrigins.includes('*');

  return (origin, callback) => {
    // React Native / Android APK / curl — no Origin header; not subject to browser CORS.
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowAll || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  };
}

export function createCorsMiddlewareOptions(allowedOrigins: readonly string[]): CorsOptions {
  return {
    origin: createCorsOriginValidator(allowedOrigins),
    credentials: true,
  };
}
