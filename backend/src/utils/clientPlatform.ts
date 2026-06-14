import { Request } from 'express';

function readClientPlatformHeader(req: Request): string | undefined {
  const raw = req.headers['x-client-platform'] ?? req.headers['x-client-type'];
  if (Array.isArray(raw)) {
    return raw[0];
  }
  return raw;
}

/** True when the client identifies as mobile via `X-Client-Platform` or `X-Client-Type`. */
export function isMobileClient(req: Request): boolean {
  const platform = readClientPlatformHeader(req);
  return platform !== undefined && platform.toLowerCase() === 'mobile';
}

/** Mobile refresh: explicit mobile header or refresh token supplied in the JSON body. */
export function isMobileRefreshRequest(req: Request): boolean {
  return isMobileClient(req) || typeof req.body?.refreshToken === 'string';
}

/** Mobile logout: explicit mobile header or refresh token supplied in the JSON body. */
export function isMobileLogoutRequest(req: Request): boolean {
  return isMobileClient(req) || typeof req.body?.refreshToken === 'string';
}
