const SENSITIVE_KEYS = new Set([
  'password',
  'otp',
  'resetToken',
  'refreshToken',
  'idToken',
  'accessToken',
  'apiKey',
  'authorization',
  'GROQ_API_KEY',
  'GOOGLE_AI_API_KEY',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'RESEND_API_KEY',
]);

const USER_CONTENT_KEYS = new Set([
  'message',
  'content',
  'query',
  'text',
  'title',
  'userQuestion',
  'retrievalQuery',
  'prompt',
  'body',
  'documents',
]);

export function isSensitiveLogKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key);
}

export function isUserContentLogKey(key: string): boolean {
  return USER_CONTENT_KEYS.has(key) || SENSITIVE_KEYS.has(key);
}

export function requestBodyByteLength(body: unknown): number | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (typeof body === 'string') {
    return Buffer.byteLength(body, 'utf8');
  }

  try {
    return Buffer.byteLength(JSON.stringify(body), 'utf8');
  } catch {
    return undefined;
  }
}

export interface SafeHttpRequestLog {
  id: unknown;
  method?: string;
  url?: string;
  userId?: string;
  bodyBytes?: number;
}

/**
 * HTTP request log shape: operational metadata only. Never includes bodies,
 * chat messages, document text, passwords, OTPs, or tokens.
 */
export function serializeRequestForLog(req: {
  id?: unknown;
  method?: string;
  url?: string;
  raw?: {
    body?: unknown;
    user?: { id?: string };
    headers?: { 'content-length'?: string };
  };
}): SafeHttpRequestLog {
  const headerLength = req.raw?.headers?.['content-length'];
  const parsedHeaderLength = headerLength ? Number.parseInt(headerLength, 10) : NaN;
  const bodyBytes = Number.isFinite(parsedHeaderLength)
    ? parsedHeaderLength
    : requestBodyByteLength(req.raw?.body);

  return {
    id: req.id,
    method: req.method,
    url: req.url,
    ...(req.raw?.user?.id ? { userId: req.raw.user.id } : {}),
    ...(bodyBytes !== undefined ? { bodyBytes } : {}),
  };
}

export function safeErrorLogFields(error: unknown): {
  errName: string;
  errType: string;
  statusCode?: number;
} {
  const err = error instanceof Error ? error : new Error(String(error));
  const statusCode =
    error && typeof error === 'object' && 'statusCode' in error
      ? Number((error as { statusCode?: number }).statusCode)
      : undefined;

  return {
    errName: err.name,
    errType: err.constructor.name,
    ...(Number.isFinite(statusCode) ? { statusCode } : {}),
  };
}
